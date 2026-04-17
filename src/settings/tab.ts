import { Calendar } from "@fullcalendar/core";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  AbstractInputSuggest,
  App,
  Notice,
  PluginSettingTab,
  Setting,
  TFolder,
  normalizePath,
  prepareSimpleSearch
} from "obsidian";
import { formatString, getStrings, resolveLanguage } from "../i18n";
import type FlashQuizPlugin from "../main";
import type { SourceBinding } from "./types";

export class FlashQuizSettingTab extends PluginSettingTab {
  plugin: FlashQuizPlugin;
  private folderPathDraft = "";
  private sourceFilter = "__all__";
  private currentPage = 1;
  private readonly pageSize = 10;
  private readonly selectedQuestionIds = new Set<string>();
  private studyCalendar: Calendar | null = null;
  private selectedCalendarDate = "";

  constructor(plugin: FlashQuizPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const strings = this.plugin.strings;
    const activeLanguage = resolveLanguage(
      this.plugin.settings.uiLanguage,
      navigator.language
    );
    const apiKeyStatus = this.plugin.hasApiKey()
      ? strings.apiKeySaved
      : strings.apiKeyMissing;

    this.studyCalendar?.destroy();
    this.studyCalendar = null;
    containerEl.empty();

    new Setting(containerEl).setName(strings.languageHeading).setHeading();

    new Setting(containerEl)
      .setName(strings.languageName)
      .setDesc(strings.languageDesc)
      .addDropdown((dropdown) => {
        dropdown
          .addOption("zh-CN", strings.languageChinese)
          .addOption("en", strings.languageEnglish)
          .addOption("follow", strings.languageFollow)
          .setValue(this.plugin.settings.uiLanguage)
          .onChange(async (value) => {
            this.plugin.settings.uiLanguage = value as "zh-CN" | "en" | "follow";
            await this.plugin.saveSettings();
            this.display();
          });
      });

    new Setting(containerEl)
      .setName(strings.activeLanguageName)
      .setDesc(
        activeLanguage === "zh-CN"
          ? strings.activeLanguageValueZh
          : strings.activeLanguageValueEn
      );

    new Setting(containerEl)
      .setName(strings.lastSyncStatusName)
      .setDesc(this.plugin.settings.lastSyncStatus);

    new Setting(containerEl)
      .setName(strings.generationStatusName)
      .setDesc(resolveGenerationStatusLabel(this.plugin, strings));

    containerEl.createEl("p", {
      text: formatString(strings.generationProgress, {
        completed: this.plugin.settings.generationCompletedSources,
        total: this.plugin.settings.generationTotalSources,
        questions: this.plugin.settings.generationGeneratedQuestions
      }),
      cls: "flash-quiz-settings-copy"
    });

    if (this.plugin.settings.generationCurrentSource) {
      containerEl.createEl("p", {
        text: `${strings.generationCurrentSourceName}: ${this.plugin.settings.generationCurrentSource}`,
        cls: "flash-quiz-settings-copy"
      });
    }

    new Setting(containerEl).setName(strings.llmHeading).setHeading();

    new Setting(containerEl)
      .setName(strings.baseUrlName)
      .setDesc(strings.baseUrlDesc)
      .addText((text) => {
        text
          .setPlaceholder("https://api.openai.com/v1")
          .setValue(this.plugin.settings.baseUrl)
          .onChange(async (value) => {
            this.plugin.settings.baseUrl = value.trim();
            await this.plugin.saveSettings();
          });
        text.inputEl.style.width = "100%";
      });

    new Setting(containerEl)
      .setName(strings.modelName)
      .setDesc(strings.modelDesc)
      .addText((text) => {
        text
          .setPlaceholder("gpt-4.1-mini")
          .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            this.plugin.settings.model = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(strings.apiKeyName)
      .setDesc(`${strings.apiKeyDesc} (${apiKeyStatus})`)
      .addText((text) => {
        text.setPlaceholder(strings.apiKeyPlaceholder).onChange((value) => {
          this.plugin.setApiKey(value.trim());
        });
        text.inputEl.type = "password";
      });

    new Setting(containerEl).setName(strings.reviewHeading).setHeading();

    new Setting(containerEl)
      .setName(strings.defaultQuestionsName)
      .setDesc(strings.defaultQuestionsDesc)
      .addText((text) => {
        text
          .setValue(String(this.plugin.settings.defaultQuestionsPerDocument))
          .onChange(async (value) => {
            this.plugin.settings.defaultQuestionsPerDocument = normalizePositiveInt(
              value,
              10
            );
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(strings.sessionQuestionsName)
      .setDesc(strings.sessionQuestionsDesc)
      .addText((text) => {
        text
          .setValue(String(this.plugin.settings.questionsPerSession))
          .onChange(async (value) => {
            this.plugin.settings.questionsPerSession = normalizePositiveInt(value, 12);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(strings.newQuestionRatioName)
      .setDesc(strings.newQuestionRatioDesc)
      .addSlider((slider) => {
        slider
          .setLimits(0, 100, 5)
          .setValue(this.plugin.settings.newQuestionRatio)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.newQuestionRatio = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(strings.retryIntervalName)
      .setDesc(strings.retryIntervalDesc)
      .addText((text) => {
        text
          .setValue(String(this.plugin.settings.retryIntervalMinutes))
          .onChange(async (value) => {
            this.plugin.settings.retryIntervalMinutes = normalizePositiveInt(value, 15);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl).setName(strings.sourceHeading).setHeading();
    containerEl.createEl("p", {
      text: strings.sourceDesc,
      cls: "flash-quiz-settings-copy"
    });

    new Setting(containerEl)
      .setName(strings.folderPathName)
      .setDesc(strings.folderPathDesc)
      .addText((text) => {
        new FolderPathSuggest(
          this.app,
          text.inputEl,
          () => this.getVaultFolderPaths()
        ).onSelect((value) => {
          this.folderPathDraft = value;
          text.setValue(value);
        });
        text
          .setPlaceholder(strings.folderPathPlaceholder)
          .setValue(this.folderPathDraft)
          .onChange((value) => {
            this.folderPathDraft = value.trim();
          });
        text.inputEl.style.width = "100%";
        text.inputEl.addEventListener("keydown", (event) => {
          if (event.key !== "Enter") {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          const addButton = text.inputEl
            .closest(".setting-item-control")
            ?.querySelector("button");
          if (addButton instanceof HTMLButtonElement) {
            addButton.click();
          }
        });
      })
      .addButton((button) => {
        button.setButtonText(strings.addFolderPath).onClick(async () => {
          const folderPath = normalizePath(this.folderPathDraft.trim());
          const abstractFile = folderPath
            ? this.app.vault.getAbstractFileByPath(folderPath)
            : null;
          if (!(abstractFile instanceof TFolder)) {
            new Notice(strings.invalidFolderPath);
            return;
          }

          const added = await this.plugin.addSourceBinding({
            path: abstractFile.path,
            type: "folder"
          });
          if (added) {
            this.folderPathDraft = "";
          }
          new Notice(added ? strings.addedBinding : strings.duplicateBinding);
          this.display();
        });
      });

    new Setting(containerEl)
      .addButton((button) => {
        button.setButtonText(strings.addActiveFile).onClick(async () => {
          const file = this.app.workspace.getActiveFile();
          if (!file) {
            new Notice(strings.noActiveFile);
            return;
          }

          const added = await this.plugin.addSourceBinding({
            path: file.path,
            type: "file"
          });
          new Notice(added ? strings.addedBinding : strings.duplicateBinding);
          this.display();
        });
      })
      .addButton((button) => {
        button.setButtonText(strings.addActiveFolder).onClick(async () => {
          const file = this.app.workspace.getActiveFile();
          const folderPath = file?.parent?.path;
          if (!file || !folderPath) {
            new Notice(strings.noActiveFile);
            return;
          }

          const added = await this.plugin.addSourceBinding({
            path: folderPath,
            type: "folder"
          });
          new Notice(added ? strings.addedBinding : strings.duplicateBinding);
          this.display();
        });
      })
      .addButton((button) => {
        button.setButtonText(strings.testConnection).onClick(async () => {
          try {
            await this.plugin.testLlmConnection();
            new Notice(strings.connectionSuccess);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : strings.connectionFailure;
            new Notice(`${strings.connectionFailure}: ${message}`);
          }
          this.display();
        });
      })
      .addButton((button) => {
        button.setButtonText(strings.syncNow).setCta().onClick(async () => {
          try {
            const result = await this.plugin.syncQuestionBank();
            if (this.plugin.settings.generationStatus === "running") {
              new Notice(strings.generationRunning);
            } else if (result.refreshedSources === 0) {
              new Notice(strings.generatedEmpty);
            } else {
              new Notice(
                formatString(strings.generatedSummary, {
                  sources: result.refreshedSources,
                  questions: result.generatedCount
                })
              );
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : strings.syncFailure;
            new Notice(`${strings.syncFailure}: ${message}`);
          }
          this.display();
        });
      });

    const summary = containerEl.createDiv({ cls: "flash-quiz-settings-copy" });
    summary.setText(
      `${strings.quizCountLabel}: ${this.plugin.bank.quizItems.length} · ${strings.sourceCountLabel}: ${this.plugin.bank.sourceSnapshots.length}`
    );

    const bindingsHost = containerEl.createDiv({ cls: "flash-quiz-binding-list" });
    if (this.plugin.settings.sourceBindings.length === 0) {
      bindingsHost.createEl("p", {
        text: strings.noBindings,
        cls: "flash-quiz-settings-copy"
      });
    } else {
      this.plugin.settings.sourceBindings.forEach((binding) => {
        this.renderBinding(bindingsHost, binding, strings.removeBinding, strings);
      });
    }

    this.renderQuestionManager(containerEl, strings);
    this.renderStudyCalendar(containerEl, strings);
  }

  private renderBinding(
    containerEl: HTMLElement,
    binding: SourceBinding,
    removeLabel: string,
    strings: ReturnType<typeof getStrings>
  ): void {
    const row = containerEl.createDiv({ cls: "flash-quiz-binding-row" });
    const meta = row.createDiv({ cls: "flash-quiz-binding-meta" });
    meta.createDiv({
      text: binding.path,
      cls: "flash-quiz-binding-path"
    });
    meta.createDiv({
      text: binding.type === "folder" ? strings.folderLabel : strings.fileLabel,
      cls: "flash-quiz-binding-type"
    });

    const actions = row.createDiv({ cls: "flash-quiz-binding-actions" });
    new Setting(actions).addToggle((toggle) => {
      toggle.setValue(binding.enabled).onChange(async (value) => {
        await this.plugin.updateBinding(binding.id, { enabled: value });
      });
    });

    new Setting(actions).addButton((button) => {
      button.setButtonText(removeLabel).onClick(async () => {
        await this.plugin.removeBinding(binding.id);
        this.display();
      });
      });
  }

  private getVaultFolderPaths(): string[] {
    const folders: string[] = [];
    this.app.vault.getAllLoadedFiles().forEach((abstractFile) => {
      if (abstractFile instanceof TFolder && !abstractFile.isRoot()) {
        folders.push(abstractFile.path);
      }
    });
    return folders.sort((a, b) => a.localeCompare(b));
  }

  private renderQuestionManager(
    containerEl: HTMLElement,
    strings: ReturnType<typeof getStrings>
  ): void {
    new Setting(containerEl).setName(strings.questionManagerHeading).setHeading();
    containerEl.createEl("p", {
      text: strings.questionManagerDesc,
      cls: "flash-quiz-settings-copy"
    });

    const sourcePaths = Array.from(
      new Set(this.plugin.bank.quizItems.map((item) => item.sourcePath))
    ).sort((a, b) => a.localeCompare(b));

    if (this.sourceFilter !== "__all__" && !sourcePaths.includes(this.sourceFilter)) {
      this.sourceFilter = "__all__";
      this.currentPage = 1;
      this.selectedQuestionIds.clear();
    }

    const toolbar = containerEl.createDiv({ cls: "flash-quiz-question-toolbar" });
    const select = toolbar.createEl("select", { cls: "flash-quiz-question-filter" });
    select.createEl("option", {
      value: "__all__",
      text: strings.questionSourceAll
    });
    sourcePaths.forEach((path) => {
      const count = this.plugin.bank.quizItems.filter(
        (item) => item.sourcePath === path
      ).length;
      select.createEl("option", {
        value: path,
        text: `${path} · ${formatString(strings.questionSourceCount, { count })}`
      });
    });
    select.value = this.sourceFilter;
    select.onchange = () => {
      this.sourceFilter = select.value;
      this.currentPage = 1;
      this.selectedQuestionIds.clear();
      this.display();
    };

    this.createToolbarButton(toolbar, strings.selectAllQuestions, () => {
      this.getCurrentPageQuestions().forEach((item) => {
        this.selectedQuestionIds.add(item.id);
      });
      this.display();
    });

    this.createToolbarButton(toolbar, strings.clearQuestionSelection, () => {
      this.selectedQuestionIds.clear();
      this.display();
    });

    this.createToolbarButton(
      toolbar,
      strings.deleteSelectedQuestions,
      async () => {
        const deletedCount = await this.plugin.deleteQuestionsByIds(
          Array.from(this.selectedQuestionIds)
        );
        this.selectedQuestionIds.clear();
        this.reconcilePagination();
        new Notice(
          deletedCount > 0
            ? formatString(strings.questionDeleteSuccess, { count: deletedCount })
            : strings.questionDeleteEmpty
        );
        this.display();
      },
      "is-danger"
    );

    this.createToolbarButton(
      toolbar,
      strings.deleteSourceQuestions,
      async () => {
        if (this.sourceFilter === "__all__") {
          return;
        }

        const deletedCount = await this.plugin.deleteQuestionsBySourcePath(
          this.sourceFilter
        );
        this.selectedQuestionIds.clear();
        this.sourceFilter = "__all__";
        this.reconcilePagination();
        new Notice(
          deletedCount > 0
            ? formatString(strings.questionDeleteSuccess, { count: deletedCount })
            : strings.questionDeleteEmpty
        );
        this.display();
      },
      "is-danger",
      this.sourceFilter === "__all__"
    );

    const questionItems = this.getFilteredQuestions();
    if (questionItems.length === 0) {
      containerEl.createEl("p", {
        text: strings.questionListEmpty,
        cls: "flash-quiz-settings-copy"
      });
      return;
    }

    const pageItems = this.getCurrentPageQuestions();
    const list = containerEl.createDiv({ cls: "flash-quiz-binding-list" });
    pageItems.forEach((item) => {
      const row = list.createDiv({
        cls: "flash-quiz-binding-row flash-quiz-question-row"
      });
      const meta = row.createDiv({ cls: "flash-quiz-binding-meta" });
      meta.createDiv({
        text: item.prompt,
        cls: "flash-quiz-binding-path"
      });
      meta.createDiv({
        text: item.sourcePath,
        cls: "flash-quiz-binding-type"
      });

      const actions = row.createDiv({ cls: "flash-quiz-binding-actions" });
      new Setting(actions).addToggle((toggle) => {
        toggle.setValue(this.selectedQuestionIds.has(item.id)).onChange((value) => {
          if (value) {
            this.selectedQuestionIds.add(item.id);
          } else {
            this.selectedQuestionIds.delete(item.id);
          }
        });
      });
    });

    const totalPages = Math.max(1, Math.ceil(questionItems.length / this.pageSize));
    new Setting(containerEl)
      .setName(
        formatString(strings.questionPageLabel, {
          current: this.currentPage,
          total: totalPages
        })
      )
      .setDesc(
        `${questionItems.length} · ${formatString(strings.questionSelectedCount, {
          count: this.selectedQuestionIds.size
        })}`
      )
      .addButton((button) => {
        button
          .setButtonText(strings.questionPrevPage)
          .setDisabled(this.currentPage <= 1)
          .onClick(() => {
            this.currentPage -= 1;
            this.display();
          });
      })
      .addButton((button) => {
        button
          .setButtonText(strings.questionNextPage)
          .setDisabled(this.currentPage >= totalPages)
          .onClick(() => {
            this.currentPage += 1;
            this.display();
          });
      });
  }

  private getFilteredQuestions(): FlashQuizPlugin["bank"]["quizItems"] {
    const allQuestions = [...this.plugin.bank.quizItems].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );

    if (this.sourceFilter === "__all__") {
      return allQuestions;
    }

    return allQuestions.filter((item) => item.sourcePath === this.sourceFilter);
  }

  private getCurrentPageQuestions(): FlashQuizPlugin["bank"]["quizItems"] {
    const questions = this.getFilteredQuestions();
    this.reconcilePagination(questions.length);
    const start = (this.currentPage - 1) * this.pageSize;
    return questions.slice(start, start + this.pageSize);
  }

  private reconcilePagination(totalCount = this.getFilteredQuestions().length): void {
    const totalPages = Math.max(1, Math.ceil(totalCount / this.pageSize));
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  private renderStudyCalendar(
    containerEl: HTMLElement,
    strings: ReturnType<typeof getStrings>
  ): void {
    new Setting(containerEl).setName(strings.studyCalendarHeading).setHeading();
    containerEl.createEl("p", {
      text: strings.studyCalendarDesc,
      cls: "flash-quiz-settings-copy"
    });

    const statsByDate = new Map<
      string,
      { answered: number; correct: number }
    >();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const log of this.plugin.bank.reviewLogs) {
      const answeredDate = new Date(log.answeredAt);
      answeredDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - answeredDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (diffDays < 0 || diffDays >= 30) {
        continue;
      }

      const key = formatLocalDateKey(answeredDate);
      const current = statsByDate.get(key) ?? { answered: 0, correct: 0 };
      current.answered += 1;
      current.correct += log.isCorrect ? 1 : 0;
      statsByDate.set(key, current);
    }

    if (statsByDate.size === 0) {
      containerEl.createEl("p", {
        text: strings.studyCalendarEmpty,
        cls: "flash-quiz-settings-copy"
      });
      return;
    }

    const calendarHost = containerEl.createDiv({ cls: "flash-quiz-calendar-host" });
    const detail = containerEl.createDiv({ cls: "flash-quiz-calendar-detail" });
    const todayKey = formatLocalDateKey(today);
    this.selectedCalendarDate = todayKey;
    const start = new Date(today);
    start.setDate(today.getDate() - 29);

    this.studyCalendar = new Calendar(calendarHost, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: "dayGridMonth",
      initialDate: today,
      headerToolbar: false,
      fixedWeekCount: false,
      showNonCurrentDates: false,
      height: "auto",
      locale: this.plugin.settings.uiLanguage === "zh-CN" ? zhCnLocale : "en",
      validRange: {
        start,
        end: addDays(today, 1)
      },
      datesSet: () => {
        this.decorateCalendarCells(calendarHost, statsByDate);
      },
      dateClick: (info: { dateStr: string }) => {
        this.selectedCalendarDate = info.dateStr;
        this.decorateCalendarCells(calendarHost, statsByDate);
        this.renderCalendarDetail(detail, strings, info.dateStr, statsByDate, todayKey);
      }
    });
    this.studyCalendar.render();
    this.decorateCalendarCells(calendarHost, statsByDate);
    this.renderCalendarDetail(detail, strings, todayKey, statsByDate, todayKey);
  }

  private getCalendarIntensityClass(answered: number): string {
    if (answered >= 10) {
      return "is-level-4";
    }
    if (answered >= 6) {
      return "is-level-3";
    }
    if (answered >= 3) {
      return "is-level-2";
    }
    if (answered >= 1) {
      return "is-level-1";
    }

    return "is-level-0";
  }

  private decorateCalendarCells(
    calendarHost: HTMLElement,
    statsByDate: Map<string, { answered: number; correct: number }>
  ): void {
    calendarHost
      .querySelectorAll<HTMLElement>(".fc-daygrid-day")
      .forEach((cell) => {
        const date = cell.getAttribute("data-date");
        if (!date) {
          return;
        }

        cell.classList.remove(
          "is-level-0",
          "is-level-1",
          "is-level-2",
          "is-level-3",
          "is-level-4",
          "is-selected"
        );

        const stats = statsByDate.get(date) ?? { answered: 0, correct: 0 };
        cell.classList.add(this.getCalendarIntensityClass(stats.answered));
        if (date === this.selectedCalendarDate) {
          cell.classList.add("is-selected");
        }

        const dayFrame = cell.querySelector(".fc-daygrid-day-frame");
        if (!dayFrame) {
          return;
        }

        dayFrame.querySelector(".flash-quiz-calendar-count")?.remove();
        if (stats.answered > 0) {
          const badge = document.createElement("div");
          badge.className = "flash-quiz-calendar-count";
          badge.textContent = `${stats.answered}`;
          dayFrame.appendChild(badge);
        }
      });
  }

  private renderCalendarDetail(
    detail: HTMLElement,
    strings: ReturnType<typeof getStrings>,
    dateKey: string,
    statsByDate: Map<string, { answered: number; correct: number }>,
    todayKey: string
  ): void {
    const stats = statsByDate.get(dateKey) ?? { answered: 0, correct: 0 };
    detail.empty();
    detail.createEl("strong", {
      text: dateKey === todayKey ? `${strings.studyCalendarToday} · ${dateKey}` : dateKey
    });
    detail.createEl("p", {
      text: `${strings.studyCalendarAnswered}: ${stats.answered}`
    });
    detail.createEl("p", {
      text: `${strings.studyCalendarCorrect}: ${stats.correct}`
    });
    detail.createEl("p", {
      text: `${strings.studyCalendarAccuracy}: ${stats.answered === 0 ? "0%" : `${Math.round((stats.correct / stats.answered) * 100)}%`}`
    });
  }

  private createToolbarButton(
    toolbar: HTMLElement,
    label: string,
    onClick: () => void | Promise<void>,
    extraClass?: string,
    disabled = false
  ): void {
    const button = toolbar.createEl("button", {
      cls: `flash-quiz-toolbar-button${extraClass ? ` ${extraClass}` : ""}`,
      text: label
    });
    button.type = "button";
    button.disabled = disabled;
    button.onclick = () => {
      void onClick();
    };
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function normalizePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function resolveGenerationStatusLabel(
  plugin: FlashQuizPlugin,
  strings: ReturnType<typeof getStrings>
): string {
  switch (plugin.settings.generationStatus) {
    case "running":
      return strings.generationRunning;
    case "complete":
      return strings.generationComplete;
    case "error":
      return strings.generationError;
    default:
      return strings.generationIdle;
  }
}

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

class FolderPathSuggest extends AbstractInputSuggest<string> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private readonly getFolders: () => string[]
  ) {
    super(app, inputEl);
    this.limit = 50;
  }

  protected getSuggestions(query: string): string[] {
    const folders = this.getFolders();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return folders.slice(0, this.limit);
    }

    const search = prepareSimpleSearch(normalizedQuery);
    return folders.filter((folder) => search(folder) !== null).slice(0, this.limit);
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.createDiv({ text: value });
  }

  selectSuggestion(value: string): void {
    this.setValue(value);
    this.close();
  }
}
