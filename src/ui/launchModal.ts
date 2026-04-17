import { Modal } from "obsidian";
import type { ActiveSessionAnswer, QuizItem, ReviewState } from "../data/types";
import type { SessionItem } from "../review/session";
import type { FlashQuizLanguage } from "../settings/types";

type SessionSnapshot = {
  currentIndex: number;
  answers: ActiveSessionAnswer[];
};

type DisplayQuizItem = {
  prompt: string;
  options: string[];
  explanation: string;
  translatedPrompt?: string;
  translatedOptions?: string[];
  translatedExplanation?: string;
};

export class FlashQuizLaunchModal extends Modal {
  private currentIndex: number;
  private answeredAt = 0;
  private renderVersion = 0;
  private isClosingAnimated = false;
  private closeTimer = 0;
  private readonly answers = new Map<string, ActiveSessionAnswer>();
  private readonly displayCache = new Map<string, DisplayQuizItem>();
  private readonly expandedTranslations = new Set<string>();
  private readonly pendingTranslations = new Set<string>();

  constructor(
    app: Modal["app"],
    private readonly strings: {
      modalTitle: string;
      modalLineOne: string;
      modalLineTwo: string;
      phasePill: string;
      quizCountLabel: string;
      sourceCountLabel: string;
      noQuestionsTitle: string;
      noQuestionsBody: string;
      sessionProgress: string;
      correctFeedback: string;
      wrongFeedback: string;
      correctAnswerLabel: string;
      nextQuestion: string;
      finishSession: string;
      sessionComplete: string;
      sessionAccuracySummary: string;
      sessionCorrectCount: string;
      restartSession: string;
      closeAction: string;
      sessionCompleteBadge: string;
      sessionCompleteBody: string;
    },
    private readonly language: FlashQuizLanguage,
    private readonly stats: {
      quizCount: number;
      sourceCount: number;
    },
    private sessionItems: SessionItem[],
    initialSnapshot: SessionSnapshot,
    private readonly onTranslateForDisplay: (
      quizItem: QuizItem
    ) => Promise<DisplayQuizItem | null>,
    private readonly onAnswered: (args: {
      quizItem: QuizItem;
      reviewState: ReviewState;
      selectedOption: number;
      responseTimeMs: number;
      answeredAt: string;
    }) => Promise<void>,
    private readonly onSnapshotChange: (snapshot: SessionSnapshot) => Promise<void>,
    private readonly onSessionComplete: () => Promise<void>,
    private readonly onSessionRestart: (snapshot: SessionSnapshot) => Promise<SessionItem[]>
  ) {
    super(app);
    this.currentIndex = initialSnapshot.currentIndex;
    initialSnapshot.answers.forEach((answer) => {
      this.answers.set(answer.quizItemId, answer);
    });
  }

  onOpen(): void {
    this.containerEl.addClass("flash-quiz-container");
    this.modalEl.addClass("flash-quiz-modal");
    this.modalEl.setAttr("data-language", this.language);
    window.setTimeout(() => {
      this.containerEl.addClass("is-ready");
      this.modalEl.addClass("is-ready");
    }, 0);
    this.render();
  }

  close(): void {
    if (this.isClosingAnimated) {
      return;
    }

    this.isClosingAnimated = true;
    this.containerEl.addClass("is-closing");
    this.modalEl.addClass("is-closing");
    this.closeTimer = window.setTimeout(() => {
      super.close();
    }, 180);
  }

  onClose(): void {
    if (this.closeTimer) {
      window.clearTimeout(this.closeTimer);
    }
    this.closeTimer = 0;
    this.isClosingAnimated = false;
    this.contentEl.empty();
    this.containerEl.removeClass("flash-quiz-container", "is-ready", "is-closing");
    this.modalEl.removeClass("flash-quiz-modal", "is-ready", "is-closing");
  }

  private render(): void {
    this.renderVersion += 1;
    this.contentEl.empty();
    this.modalEl.removeClass("flash-quiz-modal-complete");

    const shell = this.contentEl.createDiv({ cls: "flash-quiz-shell" });

    if (this.sessionItems.length === 0) {
      this.renderStateCard(shell, this.strings.noQuestionsTitle, this.strings.noQuestionsBody);
      return;
    }

    if (this.currentIndex >= this.sessionItems.length) {
      shell.addClass("flash-quiz-shell-complete");
      this.modalEl.addClass("flash-quiz-modal-complete");
      this.renderSessionCompleteCard(shell);
      return;
    }

    const item = this.sessionItems[this.currentIndex];
    if (!item) {
      shell.addClass("flash-quiz-shell-complete");
      this.modalEl.addClass("flash-quiz-modal-complete");
      this.renderSessionCompleteCard(shell);
      return;
    }

    this.renderQuestion(shell, item);
  }

  private renderQuestion(containerEl: HTMLElement, item: SessionItem): void {
    const card = containerEl.createDiv({ cls: "flash-quiz-card flash-quiz-question-card" });
    const block = card.createDiv({ cls: "flash-quiz-question-block" });
    const existingAnswer = this.answers.get(item.quizItem.id);
    const displayItem = this.displayCache.get(item.quizItem.id) ?? this.toDisplayItem(item.quizItem);
    const shouldTranslate = this.shouldTranslateDisplayItem(item.quizItem);
    const showTranslation = this.expandedTranslations.has(item.quizItem.id);

    const header = block.createDiv({ cls: "flash-quiz-question-header" });
    const headerMeta = header.createDiv({ cls: "flash-quiz-question-header-meta" });

    headerMeta.createDiv({
      cls: "flash-quiz-eyebrow",
      text:
        this.language === "zh-CN"
          ? `\u9898\u76ee ${String(this.currentIndex + 1).padStart(2, "0")}`
          : `Question ${String(this.currentIndex + 1).padStart(2, "0")}`
    });

    const closeButton = header.createEl("button", {
      cls: "flash-quiz-card-close",
      text: "\u00d7"
    });
    closeButton.type = "button";
    closeButton.setAttr("aria-label", this.strings.closeAction);
    closeButton.onclick = () => this.close();

    const questionMeta = block.createDiv({ cls: "flash-quiz-question-meta" });
    if (shouldTranslate) {
      const toggle = questionMeta.createEl("button", {
        cls: "flash-quiz-translation-toggle",
        text: this.getTranslationToggleLabel(item.quizItem.id, showTranslation)
      });
      toggle.type = "button";
      if (this.pendingTranslations.has(item.quizItem.id)) {
        toggle.disabled = true;
      }
      toggle.onclick = () => {
        void this.toggleTranslation(item);
      };
    }

    const questionEl = block.createEl("p", {
      cls: "flash-quiz-question",
      text: displayItem.prompt
    });
    if (showTranslation && displayItem.translatedPrompt) {
      block.createEl("p", {
        cls: "flash-quiz-question-translation",
        text: displayItem.translatedPrompt
      });
    }

    const choiceList = block.createDiv({ cls: "flash-quiz-choice-list" });
    displayItem.options.forEach((option, index) => {
      const button = choiceList.createEl("button", { cls: "flash-quiz-choice" });
      button.type = "button";

      const badge = button.createDiv({ cls: "flash-quiz-choice-badge" });
      badge.createSpan({
        cls: "flash-quiz-choice-letter",
        text: String.fromCharCode(65 + index)
      });

      const content = button.createDiv({ cls: "flash-quiz-choice-content" });
      content.createSpan({
        cls: "flash-quiz-choice-text",
        text: option
      });
      if (showTranslation && displayItem.translatedOptions?.[index]) {
        content.createSpan({
          cls: "flash-quiz-choice-translation",
          text: displayItem.translatedOptions[index]
        });
      }

      if (existingAnswer) {
        button.disabled = true;
        if (index === existingAnswer.selectedOption) {
          button.addClass("is-selected");
        }
        if (index === item.quizItem.correctOption) {
          button.addClass("is-correct");
        }
        if (index === existingAnswer.selectedOption && !existingAnswer.isCorrect) {
          button.addClass("is-wrong");
        }
      } else {
        button.onclick = () => {
          if (this.answers.has(item.quizItem.id)) {
            return;
          }

          void this.commitAnswer(item, choiceList, index);
        };
      }
    });

    const feedbackHost = block.createDiv({ cls: "flash-quiz-feedback-host" });
    if (existingAnswer) {
      this.renderFeedback(feedbackHost, item, displayItem, existingAnswer);
    } else {
      this.answeredAt = Date.now();
    }

    this.renderInlineMeta(card, item);
  }

  private async commitAnswer(
    item: SessionItem,
    choiceList: HTMLDivElement,
    selectedOption: number
  ): Promise<void> {
    const answeredAt = new Date().toISOString();
    const responseTimeMs = Date.now() - this.answeredAt;
    const isCorrect = selectedOption === item.quizItem.correctOption;
    const answer: ActiveSessionAnswer = {
      quizItemId: item.quizItem.id,
      selectedOption,
      isCorrect,
      responseTimeMs,
      answeredAt
    };

    choiceList.findAll("button").forEach((buttonEl, index) => {
      const button = buttonEl as HTMLButtonElement;
      button.disabled = true;
      if (index === selectedOption) {
        button.addClass("is-selected");
      }
      if (index === item.quizItem.correctOption) {
        button.addClass("is-correct");
      }
      if (index === selectedOption && !isCorrect) {
        button.addClass("is-wrong");
      }
    });

    this.answers.set(item.quizItem.id, answer);
    await this.onAnswered({
      quizItem: item.quizItem,
      reviewState: item.reviewState,
      selectedOption,
      responseTimeMs,
      answeredAt
    });
    await this.persistSnapshot();

    this.render();
  }

  private renderFeedback(
    feedbackHost: HTMLElement,
    item: SessionItem,
    displayItem: DisplayQuizItem,
    answer: ActiveSessionAnswer
  ): void {
    const feedback = feedbackHost.createDiv({
      cls: `flash-quiz-feedback ${answer.isCorrect ? "is-correct" : "is-wrong"}`
    });

    feedback.createEl("strong", {
      text: answer.isCorrect ? this.strings.correctFeedback : this.strings.wrongFeedback
    });
    feedback.createEl("p", {
      text: `${this.strings.correctAnswerLabel}: ${String.fromCharCode(
        65 + item.quizItem.correctOption
      )}`
    });
    feedback.createEl("p", {
      text: displayItem.explanation
    });
    if (
      this.expandedTranslations.has(item.quizItem.id) &&
      displayItem.translatedExplanation &&
      displayItem.translatedExplanation !== displayItem.explanation
    ) {
      feedback.createEl("p", {
        cls: "flash-quiz-feedback-translation",
        text: displayItem.translatedExplanation
      });
    }
  }

  private renderInlineMeta(containerEl: HTMLElement, item: SessionItem): void {
    const footer = containerEl.createDiv({ cls: "flash-quiz-footer flash-quiz-footer-inline" });
    const footerMeta = footer.createDiv({ cls: "flash-quiz-footer-meta" });

    const progressBlock = footerMeta.createDiv({ cls: "flash-quiz-footer-block" });
    progressBlock.createEl("span", {
      cls: "flash-quiz-footer-label",
      text:
        this.language === "zh-CN"
          ? `\u672c\u6b21\u8fdb\u5ea6 ${this.currentIndex + 1} / ${this.sessionItems.length}`
          : `Progress ${this.currentIndex + 1} / ${this.sessionItems.length}`
    });

    const progressTrack = progressBlock.createDiv({ cls: "flash-quiz-progress-track" });
    progressTrack.createDiv({
      cls: "flash-quiz-progress-fill",
      attr: {
        style: `width: ${this.getProgressPercent()}%;`
      }
    });

    const sourceBlock = footerMeta.createDiv({
      cls: "flash-quiz-footer-block flash-quiz-footer-source"
    });
    sourceBlock.createEl("span", {
      cls: "flash-quiz-footer-label",
      text: this.language === "zh-CN" ? "\u5f53\u524d\u6765\u6e90" : "Current source"
    });
    sourceBlock.createEl("span", {
      cls: "flash-quiz-source-text",
      text: item.quizItem.sourcePath
    });

    if (this.answers.has(item.quizItem.id)) {
      const actionBlock = footer.createDiv({ cls: "flash-quiz-footer-actions" });
      const nextButton = actionBlock.createEl("button", {
        cls: "flash-quiz-next flash-quiz-next-footer",
        text:
          this.currentIndex + 1 >= this.sessionItems.length
            ? this.strings.finishSession
            : this.strings.nextQuestion
      });
      nextButton.type = "button";
      nextButton.onclick = () => {
        void this.advanceSession();
      };
    }
  }

  private renderStateCard(containerEl: HTMLElement, title: string, description?: string): void {
    const card = containerEl.createDiv({ cls: "flash-quiz-card flash-quiz-state-card" });
    card.createEl("h3", {
      cls: "flash-quiz-state-title",
      text: title
    });
    if (description) {
      card.createEl("p", {
        cls: "flash-quiz-state-body",
        text: description
      });
    }
  }

  private renderSessionCompleteCard(containerEl: HTMLElement): void {
    const { correctCount, totalCount, accuracyPercent } = this.getSessionSummary();
    const card = containerEl.createDiv({
      cls: "flash-quiz-card flash-quiz-state-card flash-quiz-complete-card"
    });
    const celebration = card.createDiv({ cls: "flash-quiz-celebration" });
    for (let index = 0; index < 7; index += 1) {
      celebration.createDiv({
        cls: `flash-quiz-firework flash-quiz-firework-${index + 1}`
      });
    }
    celebration.createDiv({ cls: "flash-quiz-complete-glow" });
    for (let index = 0; index < 28; index += 1) {
      celebration.createDiv({
        cls: `flash-quiz-confetti flash-quiz-confetti-${index + 1}`
      });
    }

    const layout = card.createDiv({ cls: "flash-quiz-complete-layout" });
    const main = layout.createDiv({ cls: "flash-quiz-complete-main" });

    const hero = main.createDiv({ cls: "flash-quiz-complete-hero" });
    hero.createEl("h3", {
      cls: "flash-quiz-state-title flash-quiz-complete-title",
      text: this.strings.sessionComplete
    });

    const recap = main.createDiv({ cls: "flash-quiz-complete-recap" });
    const summary = recap.createDiv({ cls: "flash-quiz-complete-summary" });
    const summaryLine = summary.createDiv({ cls: "flash-quiz-complete-summary-line" });
    summaryLine.createSpan({
      cls: "flash-quiz-complete-summary-metric",
      text: this.language === "zh-CN" ? `\u5df2\u5b8c\u6210 ${totalCount} \u9898` : `${totalCount} answered`
    });
    summaryLine.createSpan({
      cls: "flash-quiz-complete-summary-dot",
      text: "\u00b7"
    });
    summaryLine.createSpan({
      cls: "flash-quiz-complete-summary-metric",
      text:
        this.language === "zh-CN"
          ? `\u5e73\u5747\u7528\u65f6 ${this.getAverageResponseLabel()}`
          : `Avg time ${this.getAverageResponseLabel()}`
    });
    summaryLine.createSpan({
      cls: "flash-quiz-complete-summary-dot",
      text: "\u00b7"
    });
    summaryLine.createSpan({
      cls: "flash-quiz-complete-summary-badge",
      text: this.getSessionResultLabel(accuracyPercent)
    });

    summary.createEl("p", {
      cls: "flash-quiz-complete-summary-hint",
      text:
        this.language === "zh-CN"
          ? "\u5efa\u8bae\u7ee7\u7eed\u4e0b\u4e00\u8f6e\u590d\u4e60\uff0c\u628a\u5230\u671f\u9898\u5148\u505a\u5b8c\u3002"
          : "Continue with due reviews first to keep your memory curve active."
    });

    const actions = recap.createDiv({
      cls: "flash-quiz-state-actions flash-quiz-complete-actions"
    });

    const restartButton = actions.createEl("button", {
      cls: "flash-quiz-next flash-quiz-complete-restart",
      text: this.strings.restartSession
    });
    restartButton.type = "button";
    restartButton.onclick = () => {
      void this.restartSession();
    };

    const closeButton = actions.createEl("button", {
      cls: "flash-quiz-secondary-button flash-quiz-complete-close",
      text: this.strings.closeAction
    });
    closeButton.type = "button";
    closeButton.onclick = () => this.close();

    const summaryPanel = layout.createDiv({ cls: "flash-quiz-complete-panel" });
    summaryPanel.createEl("span", {
      cls: "flash-quiz-complete-panel-label",
      text: this.language === "zh-CN" ? "\u672c\u8f6e\u6210\u7ee9" : "Round score"
    });
    summaryPanel.createEl("strong", {
      cls: "flash-quiz-complete-panel-value",
      text: `${accuracyPercent}%`
    });
    summaryPanel.createEl("span", {
      cls: "flash-quiz-complete-panel-note",
      text:
        this.language === "zh-CN"
          ? `${correctCount}/${totalCount} \u9898\u7b54\u5bf9`
          : `${correctCount}/${totalCount} correct`
    });
  }

  private async advanceSession(): Promise<void> {
    this.currentIndex += 1;
    if (this.currentIndex >= this.sessionItems.length) {
      await this.onSessionComplete();
      this.render();
      return;
    }

    await this.persistSnapshot();
    this.render();
  }

  private async restartSession(): Promise<void> {
    this.answers.clear();
    this.displayCache.clear();
    this.currentIndex = 0;
    this.answeredAt = Date.now();
    this.renderVersion += 1;
    const snapshot: SessionSnapshot = {
      currentIndex: 0,
      answers: []
    };
    const newItems = await this.onSessionRestart(snapshot);
    this.sessionItems = newItems;
    await this.onSnapshotChange(snapshot);
    this.render();
  }

  private async persistSnapshot(): Promise<void> {
    await this.onSnapshotChange({
      currentIndex: this.currentIndex,
      answers: Array.from(this.answers.values())
    });
  }

  private toDisplayItem(quizItem: QuizItem): DisplayQuizItem {
    return {
      prompt: quizItem.prompt,
      options: quizItem.options,
      explanation: quizItem.explanation
    };
  }

  private currentItemId(): string | null {
    return this.sessionItems[this.currentIndex]?.quizItem.id ?? null;
  }

  private getProgressPercent(): number {
    if (this.sessionItems.length === 0) {
      return 0;
    }

    return Math.round(((this.currentIndex + 1) / this.sessionItems.length) * 100);
  }

  private getSessionSummary(): {
    correctCount: number;
    totalCount: number;
    accuracyPercent: number;
  } {
    const totalCount = this.sessionItems.length;
    const correctCount = Array.from(this.answers.values()).filter((answer) => answer.isCorrect)
      .length;
    const accuracyPercent =
      totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

    return {
      correctCount,
      totalCount,
      accuracyPercent
    };
  }

  private getAverageResponseLabel(): string {
    const answers = Array.from(this.answers.values());
    if (answers.length === 0) {
      return this.language === "zh-CN" ? "0 \u79d2" : "0s";
    }

    const totalMs = answers.reduce((sum, answer) => sum + answer.responseTimeMs, 0);
    const averageMs = Math.round(totalMs / answers.length);
    if (averageMs >= 60_000) {
      const minutes = Math.round((averageMs / 60_000) * 10) / 10;
      return this.language === "zh-CN" ? `${minutes} \u5206\u949f` : `${minutes}m`;
    }

    const seconds = Math.max(1, Math.round(averageMs / 1000));
    return this.language === "zh-CN" ? `${seconds} \u79d2` : `${seconds}s`;
  }

  private getSessionResultLabel(accuracyPercent: number): string {
    if (this.language === "zh-CN") {
      if (accuracyPercent >= 90) {
        return "\u638c\u63e1\u5f88\u597d";
      }
      if (accuracyPercent >= 60) {
        return "\u7ee7\u7eed\u5de9\u56fa";
      }
      return "\u5efa\u8bae\u590d\u4e60";
    }

    if (accuracyPercent >= 90) {
      return "Strong recall";
    }
    if (accuracyPercent >= 60) {
      return "Keep reinforcing";
    }
    return "Review again";
  }

  private shouldTranslateDisplayItem(quizItem: QuizItem): boolean {
    if (this.language === "zh-CN") {
      return /[A-Za-z]/.test(quizItem.prompt) && !/[\u4e00-\u9fff]/.test(quizItem.prompt);
    }

    if (this.language === "en") {
      return /[\u4e00-\u9fff]/.test(quizItem.prompt);
    }

    return false;
  }

  private getTranslationToggleLabel(quizItemId: string, showTranslation: boolean): string {
    if (this.pendingTranslations.has(quizItemId)) {
      return this.language === "zh-CN" ? "\u7ffb\u8bd1\u4e2d..." : "Translating...";
    }

    if (showTranslation) {
      return this.language === "zh-CN" ? "\u6536\u8d77\u7ffb\u8bd1" : "Hide translation";
    }

    return this.language === "zh-CN" ? "\u663e\u793a\u7ffb\u8bd1" : "Show translation";
  }

  private async toggleTranslation(item: SessionItem): Promise<void> {
    const itemId = item.quizItem.id;
    if (this.expandedTranslations.has(itemId)) {
      this.expandedTranslations.delete(itemId);
      this.render();
      return;
    }

    this.expandedTranslations.add(itemId);
    const cached = this.displayCache.get(itemId);
    if (cached?.translatedPrompt && cached.translatedOptions?.length === 4) {
      this.render();
      return;
    }

    this.pendingTranslations.add(itemId);
    this.render();

    try {
      const translated = await this.onTranslateForDisplay(item.quizItem);
      if (translated) {
        const base = this.toDisplayItem(item.quizItem);
        this.displayCache.set(itemId, {
          ...base,
          translatedPrompt: translated.prompt,
          translatedOptions: translated.options,
          translatedExplanation: translated.explanation
        });
      }
    } finally {
      this.pendingTranslations.delete(itemId);
      if (this.currentItemId() === itemId) {
        this.render();
      }
    }
  }
}
