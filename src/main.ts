import { Notice, Plugin } from "obsidian";
import { DEFAULT_BANK, DEFAULT_PLUGIN_DATA } from "./data/defaults";
import type {
  ActiveSessionData,
  PluginData,
  QuestionBankData
} from "./data/types";
import {
  getPendingSourceCount,
  processQuestionBankBatch
} from "./generation/generator";
import { FlashQuizLlmClient } from "./generation/llmClient";
import { getStrings, resolveLanguage } from "./i18n";
import { createReviewLog, updateReviewState } from "./review/scheduler";
import { buildReviewSession } from "./review/session";
import { DEFAULT_SETTINGS } from "./settings/defaults";
import { FlashQuizSettingTab } from "./settings/tab";
import type {
  FlashQuizLanguage,
  FlashQuizSettingsData,
  SourceBinding
} from "./settings/types";
import { FlashQuizLaunchModal } from "./ui/launchModal";

export default class FlashQuizPlugin extends Plugin {
  settings: FlashQuizSettingsData = DEFAULT_SETTINGS;
  bank: QuestionBankData = DEFAULT_BANK;
  activeSession: ActiveSessionData | null = null;
  private apiKey = "";
  private backgroundSyncRunning = false;
  private readonly displayTranslationCache = new Map<
    string,
    { prompt: string; options: string[]; explanation: string }
  >();

  get strings() {
    return getStrings(this.settings.uiLanguage, navigator.language);
  }

  openQuizModal(): void {
    const resolvedLanguage = resolveLanguage(this.settings.uiLanguage, navigator.language);
    const activeSession = this.getResumableSession();
    const sessionItems = activeSession
      ? this.resolveSessionItems(activeSession.quizItemIds)
      : buildReviewSession(
          this.bank,
          this.settings.questionsPerSession,
          this.settings.newQuestionRatio
        );

    if (!activeSession && sessionItems.length > 0) {
      this.activeSession = {
        quizItemIds: sessionItems.map((item) => item.quizItem.id),
        currentIndex: 0,
        answers: [],
        startedAt: new Date().toISOString()
      };
      void this.saveSettings();
    }

    new FlashQuizLaunchModal(this.app, this.strings, resolvedLanguage, {
      quizCount: this.bank.quizItems.length,
      sourceCount: this.bank.sourceSnapshots.length
    }, sessionItems, {
      currentIndex: activeSession?.currentIndex ?? 0,
      answers: activeSession?.answers ?? []
    }, async (quizItem) => {
      return this.translateQuizItemForDisplay(quizItem);
    }, async ({ quizItem, reviewState, selectedOption, responseTimeMs, answeredAt }) => {
      await this.recordAnswer({
        quizItemId: quizItem.id,
        reviewState,
        selectedOption,
        isCorrect: selectedOption === quizItem.correctOption,
        responseTimeMs,
        quizItemVersion: quizItem.version,
        answeredAt
      });
    }, async (snapshot) => {
      if (!this.activeSession) {
        return;
      }

      this.activeSession = {
        ...this.activeSession,
        currentIndex: snapshot.currentIndex,
        answers: snapshot.answers
      };
      await this.saveSettings();
    }, async () => {
      this.activeSession = null;
      await this.saveSettings();
    }, async (snapshot) => {
      const newItems = buildReviewSession(
        this.bank,
        this.settings.questionsPerSession,
        this.settings.newQuestionRatio
      );
      this.activeSession = {
        quizItemIds: newItems.map((item) => item.quizItem.id),
        currentIndex: snapshot.currentIndex,
        answers: snapshot.answers,
        startedAt: new Date().toISOString()
      };
      await this.saveSettings();
      return newItems;
    }).open();
  }

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addRibbonIcon("graduation-cap", this.strings.openQuiz, () => {
      this.openQuizModal();
    });

    this.addCommand({
      id: "open-flash-quiz",
      name: this.strings.openQuiz,
      callback: () => {
        this.openQuizModal();
      }
    });

    this.addSettingTab(new FlashQuizSettingTab(this));
  }

  onunload(): void {
    // No teardown needed yet.
  }

  async loadSettings(): Promise<void> {
    const saved = (await this.loadData()) as Record<string, unknown> | null;
    const savedSettings = normalizeSavedSettings(saved);
    const savedBank = normalizeSavedBank(saved);
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
      sourceBindings: Array.isArray(savedSettings.sourceBindings)
        ? savedSettings.sourceBindings
        : DEFAULT_SETTINGS.sourceBindings
    };
    this.bank = {
      ...DEFAULT_BANK,
      ...savedBank,
      quizItems: Array.isArray(savedBank.quizItems) ? savedBank.quizItems : [],
      reviewStates: Array.isArray(savedBank.reviewStates)
        ? savedBank.reviewStates.map(normalizeReviewState)
        : [],
      reviewLogs: Array.isArray(savedBank.reviewLogs) ? savedBank.reviewLogs : [],
      sourceSnapshots: Array.isArray(savedBank.sourceSnapshots)
        ? savedBank.sourceSnapshots
        : []
    };
    this.activeSession = normalizeSavedActiveSession(saved);
    this.apiKey = this.app.secretStorage.getSecret("flash-quiz-api-key") ?? "";
  }

  async saveSettings(): Promise<void> {
    await this.saveData({
      settings: this.settings,
      bank: this.bank,
      activeSession: this.activeSession
    } satisfies PluginData);
  }

  hasApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  setApiKey(value: string): void {
    if (!value) {
      return;
    }

    this.apiKey = value;
    this.app.secretStorage.setSecret("flash-quiz-api-key", value);
  }

  async addSourceBinding(
    binding: Pick<SourceBinding, "path" | "type">
  ): Promise<boolean> {
    const existing = this.settings.sourceBindings.find(
      (item) => item.path === binding.path && item.type === binding.type
    );

    if (existing) {
      return false;
    }

    this.settings.sourceBindings = [
      ...this.settings.sourceBindings,
      {
        id: `${binding.type}:${binding.path}`,
        path: binding.path,
        type: binding.type,
        enabled: true
      }
    ];

    await this.saveSettings();
    return true;
  }

  async updateBinding(
    bindingId: string,
    patch: Partial<SourceBinding>
  ): Promise<void> {
    this.settings.sourceBindings = this.settings.sourceBindings.map((binding) =>
      binding.id === bindingId ? { ...binding, ...patch } : binding
    );
    await this.saveSettings();
  }

  async removeBinding(bindingId: string): Promise<void> {
    this.settings.sourceBindings = this.settings.sourceBindings.filter(
      (binding) => binding.id !== bindingId
    );
    await this.saveSettings();
  }

  async deleteQuestionsBySourcePath(sourcePath: string): Promise<number> {
    const quizItemIds = this.bank.quizItems
      .filter((item) => item.sourcePath === sourcePath)
      .map((item) => item.id);

    if (quizItemIds.length === 0) {
      return 0;
    }

    return this.deleteQuestionsByIds(quizItemIds);
  }

  async deleteQuestionsByIds(quizItemIds: string[]): Promise<number> {
    const uniqueIds = new Set(quizItemIds);
    if (uniqueIds.size === 0) {
      return 0;
    }

    const beforeCount = this.bank.quizItems.length;
    this.bank.quizItems = this.bank.quizItems.filter((item) => !uniqueIds.has(item.id));
    this.bank.reviewStates = this.bank.reviewStates.filter(
      (state) => !uniqueIds.has(state.quizItemId)
    );
    this.bank.reviewLogs = this.bank.reviewLogs.filter(
      (log) => !uniqueIds.has(log.quizItemId)
    );
    this.bank.sourceSnapshots = this.bank.sourceSnapshots
      .map((snapshot) => ({
        ...snapshot,
        quizItemIds: snapshot.quizItemIds.filter((id) => !uniqueIds.has(id))
      }))
      .filter((snapshot) => snapshot.quizItemIds.length > 0);

    const deletedCount = beforeCount - this.bank.quizItems.length;
    if (deletedCount > 0) {
      await this.saveSettings();
    }

    return deletedCount;
  }

  async testLlmConnection(): Promise<void> {
    const client = this.createLlmClient();
    await client.testConnection();
    this.settings.lastSyncStatus = "Connection OK";
    await this.saveSettings();
  }

  async syncQuestionBank(): Promise<{
    generatedCount: number;
    refreshedSources: number;
  }> {
    if (this.backgroundSyncRunning) {
      throw new Error("Background generation is already running");
    }

    const client = this.createLlmClient();
    try {
      const totalSources = await getPendingSourceCount({
        vault: this.app.vault,
        bindings: this.settings.sourceBindings,
        currentBank: this.bank
      });

      this.settings.generationStatus = "running";
      this.settings.generationTotalSources = totalSources;
      this.settings.generationCompletedSources = 0;
      this.settings.generationGeneratedQuestions = 0;
      this.settings.generationCurrentSource = "";
      this.settings.lastSyncStatus =
        totalSources > 0 ? `Running: ${totalSources} pending sources` : "No pending sources";
      await this.saveSettings();

      if (totalSources === 0) {
        return {
          generatedCount: 0,
          refreshedSources: 0
        };
      }

      this.backgroundSyncRunning = true;
      void this.runBackgroundSyncLoop(client);

      return {
        generatedCount: 0,
        refreshedSources: 0
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      this.settings.generationStatus = "error";
      this.settings.lastSyncStatus = `ERROR: ${message}`;
      await this.saveSettings();
      throw error;
    }
  }

  private async runBackgroundSyncLoop(client: FlashQuizLlmClient): Promise<void> {
    try {
      while (true) {
        const result = await processQuestionBankBatch({
          vault: this.app.vault,
          llmClient: client,
          bindings: this.settings.sourceBindings,
          questionCount: this.settings.defaultQuestionsPerDocument,
          currentBank: this.bank,
          batchSize: 6,
          concurrency: 2
        });

        this.bank = result.bank;
        this.settings.generationCompletedSources += result.refreshedSources;
        this.settings.generationGeneratedQuestions += result.generatedCount;
        this.settings.generationCurrentSource =
          result.processedSourcePaths.at(-1) ?? this.settings.generationCurrentSource;

        if (result.remainingSources === 0) {
          this.settings.generationStatus = "complete";
          this.settings.lastSyncStatus = `OK: sources=${this.settings.generationCompletedSources}, questions=${this.settings.generationGeneratedQuestions}`;
          await this.saveSettings();
          new Notice("Flash Quiz background generation complete");
          break;
        }

        this.settings.lastSyncStatus = `Running: completed=${this.settings.generationCompletedSources}/${this.settings.generationTotalSources}, questions=${this.settings.generationGeneratedQuestions}`;
        await this.saveSettings();
        await sleep(10);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      this.settings.generationStatus = "error";
      this.settings.lastSyncStatus = `ERROR: ${message}`;
      await this.saveSettings();
      new Notice(`Flash Quiz sync failed: ${message}`);
    } finally {
      this.backgroundSyncRunning = false;
    }
  }

  private createLlmClient(): FlashQuizLlmClient {
    if (!this.settings.baseUrl) {
      throw new Error("Base URL is required");
    }

    if (!this.settings.model) {
      throw new Error("Model is required");
    }

    if (!this.apiKey) {
      throw new Error("API key is required");
    }

    return new FlashQuizLlmClient({
      apiKey: this.apiKey,
      baseUrl: this.settings.baseUrl,
      model: this.settings.model
    });
  }

  private async recordAnswer(args: {
    quizItemId: string;
    reviewState: QuestionBankData["reviewStates"][number];
    selectedOption: number;
    isCorrect: boolean;
    responseTimeMs: number;
    quizItemVersion: number;
    answeredAt: string;
  }): Promise<void> {
    const nextState = updateReviewState({
      reviewState: args.reviewState,
      isCorrect: args.isCorrect,
      retryIntervalMinutes: this.settings.retryIntervalMinutes,
      answeredAt: args.answeredAt
    });

    this.bank.reviewStates = this.bank.reviewStates.map((state) =>
      state.quizItemId === args.quizItemId ? nextState : state
    );
    this.bank.reviewLogs = [
      ...this.bank.reviewLogs,
      createReviewLog({
        quizItemId: args.quizItemId,
        selectedOption: args.selectedOption,
        isCorrect: args.isCorrect,
        answeredAt: args.answeredAt,
        responseTimeMs: args.responseTimeMs,
        quizItemVersion: args.quizItemVersion
      })
    ];

    await this.saveSettings();
  }

  private async translateQuizItemForDisplay(quizItem: QuestionBankData["quizItems"][number]) {
    const targetLanguage = resolveLanguage(this.settings.uiLanguage, navigator.language);
    const cacheKey = `${targetLanguage}:${quizItem.id}`;
    const cached = this.displayTranslationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.apiKey || !this.settings.baseUrl || !this.settings.model) {
      return null;
    }

    const looksEnglish =
      /[A-Za-z]/.test(quizItem.prompt) &&
      !/[\u4e00-\u9fff]/.test(quizItem.prompt);
    const looksChinese = /[\u4e00-\u9fff]/.test(quizItem.prompt);
    if (
      (targetLanguage === "zh-CN" && !looksEnglish) ||
      (targetLanguage === "en" && !looksChinese)
    ) {
      return null;
    }

    try {
      const translated = await this.createLlmClient().translateQuizItem({
        prompt: quizItem.prompt,
        options: quizItem.options,
        explanation: quizItem.explanation,
        targetLanguage
      });
      const result = {
        prompt: translated.prompt,
        options: translated.options,
        explanation: translated.explanation
      };
      this.displayTranslationCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Flash Quiz translation failed", error);
      return null;
    }
  }

  private getResumableSession(): ActiveSessionData | null {
    if (!this.activeSession) {
      return null;
    }

    const resolvedItems = this.resolveSessionItems(this.activeSession.quizItemIds);
    if (resolvedItems.length !== this.activeSession.quizItemIds.length) {
      this.activeSession = null;
      void this.saveSettings();
      return null;
    }

    if (this.activeSession.currentIndex >= resolvedItems.length) {
      return null;
    }

    return this.activeSession;
  }

  private resolveSessionItems(quizItemIds: string[]) {
    const statesById = new Map(
      this.bank.reviewStates.map((state) => [state.quizItemId, state] as const)
    );
    const itemsById = new Map(
      this.bank.quizItems.map((item) => [item.id, item] as const)
    );

    return quizItemIds
      .map((id) => {
        const quizItem = itemsById.get(id);
        const reviewState = statesById.get(id);
        if (!quizItem || !reviewState) {
          return null;
        }

        return { quizItem, reviewState };
      })
      .filter((item): item is ReturnType<typeof buildReviewSession>[number] => Boolean(item));
  }
}

function normalizeSavedSettings(
  saved: Record<string, unknown> | null
): Partial<FlashQuizSettingsData> {
  if (!saved) {
    return DEFAULT_SETTINGS;
  }

  const nested = isRecord(saved.settings) ? saved.settings : saved;
  const uiLanguage: FlashQuizLanguage =
    nested.uiLanguage === "zh-CN" ||
    nested.uiLanguage === "en" ||
    nested.uiLanguage === "follow"
      ? nested.uiLanguage
      : DEFAULT_SETTINGS.uiLanguage;

  return {
    uiLanguage,
    baseUrl:
      typeof nested.baseUrl === "string" ? nested.baseUrl : DEFAULT_SETTINGS.baseUrl,
    model: typeof nested.model === "string" ? nested.model : DEFAULT_SETTINGS.model,
    defaultQuestionsPerDocument:
      typeof nested.defaultQuestionsPerDocument === "number"
        ? nested.defaultQuestionsPerDocument
        : DEFAULT_SETTINGS.defaultQuestionsPerDocument,
    questionsPerSession:
      typeof nested.questionsPerSession === "number"
        ? nested.questionsPerSession
        : DEFAULT_SETTINGS.questionsPerSession,
    newQuestionRatio:
      typeof nested.newQuestionRatio === "number"
        ? nested.newQuestionRatio
        : DEFAULT_SETTINGS.newQuestionRatio,
    retryIntervalMinutes:
      typeof nested.retryIntervalMinutes === "number"
        ? nested.retryIntervalMinutes
        : DEFAULT_SETTINGS.retryIntervalMinutes,
    sourceBindings: Array.isArray(nested.sourceBindings)
      ? (nested.sourceBindings as SourceBinding[])
      : DEFAULT_SETTINGS.sourceBindings,
    lastSyncStatus:
      typeof nested.lastSyncStatus === "string"
        ? nested.lastSyncStatus
        : DEFAULT_SETTINGS.lastSyncStatus,
    generationStatus:
      nested.generationStatus === "idle" ||
      nested.generationStatus === "running" ||
      nested.generationStatus === "complete" ||
      nested.generationStatus === "error"
        ? nested.generationStatus
        : DEFAULT_SETTINGS.generationStatus,
    generationTotalSources:
      typeof nested.generationTotalSources === "number"
        ? nested.generationTotalSources
        : DEFAULT_SETTINGS.generationTotalSources,
    generationCompletedSources:
      typeof nested.generationCompletedSources === "number"
        ? nested.generationCompletedSources
        : DEFAULT_SETTINGS.generationCompletedSources,
    generationGeneratedQuestions:
      typeof nested.generationGeneratedQuestions === "number"
        ? nested.generationGeneratedQuestions
        : DEFAULT_SETTINGS.generationGeneratedQuestions,
    generationCurrentSource:
      typeof nested.generationCurrentSource === "string"
        ? nested.generationCurrentSource
        : DEFAULT_SETTINGS.generationCurrentSource
  };
}

function normalizeSavedBank(
  saved: Record<string, unknown> | null
): Partial<QuestionBankData> {
  if (!saved || !isRecord(saved.bank)) {
    return DEFAULT_BANK;
  }

  return saved.bank as Partial<QuestionBankData>;
}

function normalizeReviewState(
  state: QuestionBankData["reviewStates"][number]
): QuestionBankData["reviewStates"][number] {
  return {
    ...state,
    stability: typeof state.stability === "number" ? state.stability : 1,
    difficulty: typeof state.difficulty === "number" ? state.difficulty : 0.35,
    lastIntervalDays:
      typeof state.lastIntervalDays === "number" ? state.lastIntervalDays : 0
  };
}

function normalizeSavedActiveSession(
  saved: Record<string, unknown> | null
): ActiveSessionData | null {
  if (!saved || !isRecord(saved.activeSession)) {
    return null;
  }

  const activeSession = saved.activeSession;
  if (
    !Array.isArray(activeSession.quizItemIds) ||
    typeof activeSession.currentIndex !== "number" ||
    !Array.isArray(activeSession.answers) ||
    typeof activeSession.startedAt !== "string"
  ) {
    return null;
  }

  return {
    quizItemIds: activeSession.quizItemIds.filter(
      (id): id is string => typeof id === "string"
    ),
    currentIndex: activeSession.currentIndex,
    answers: activeSession.answers.filter((answer): answer is ActiveSessionData["answers"][number] =>
      isRecord(answer) &&
      typeof answer.quizItemId === "string" &&
      typeof answer.selectedOption === "number" &&
      typeof answer.isCorrect === "boolean" &&
      typeof answer.responseTimeMs === "number" &&
      typeof answer.answeredAt === "string"
    ),
    startedAt: activeSession.startedAt
  };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
