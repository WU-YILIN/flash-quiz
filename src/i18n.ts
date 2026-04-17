import type { FlashQuizLanguage } from "./settings/types";

type Dictionary = {
  pluginName: string;
  openQuiz: string;
  modalTitle: string;
  modalLineOne: string;
  modalLineTwo: string;
  phasePill: string;
  settingsName: string;
  languageHeading: string;
  languageName: string;
  languageDesc: string;
  languageChinese: string;
  languageEnglish: string;
  languageFollow: string;
  activeLanguageName: string;
  activeLanguageValueZh: string;
  activeLanguageValueEn: string;
  llmHeading: string;
  baseUrlName: string;
  baseUrlDesc: string;
  modelName: string;
  modelDesc: string;
  apiKeyName: string;
  apiKeyDesc: string;
  apiKeyPlaceholder: string;
  apiKeySaved: string;
  apiKeyMissing: string;
  reviewHeading: string;
  defaultQuestionsName: string;
  defaultQuestionsDesc: string;
  sessionQuestionsName: string;
  sessionQuestionsDesc: string;
  newQuestionRatioName: string;
  newQuestionRatioDesc: string;
  retryIntervalName: string;
  retryIntervalDesc: string;
  sourceHeading: string;
  sourceDesc: string;
  addActiveFile: string;
  addActiveFolder: string;
  addFolderPath: string;
  folderPathName: string;
  folderPathDesc: string;
  folderPathPlaceholder: string;
  noActiveFile: string;
  invalidFolderPath: string;
  noBindings: string;
  removeBinding: string;
  fileLabel: string;
  folderLabel: string;
  duplicateBinding: string;
  addedBinding: string;
  syncNow: string;
  testConnection: string;
  generatedSummary: string;
  generatedEmpty: string;
  connectionSuccess: string;
  connectionFailure: string;
  syncFailure: string;
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
  lastSyncStatusName: string;
  generationStatusName: string;
  generationRunning: string;
  generationIdle: string;
  generationComplete: string;
  generationError: string;
  generationProgress: string;
  generationCurrentSourceName: string;
  questionManagerHeading: string;
  questionManagerDesc: string;
  questionSourceFilterName: string;
  questionSourceAll: string;
  questionListEmpty: string;
  selectAllQuestions: string;
  clearQuestionSelection: string;
  deleteSelectedQuestions: string;
  deleteSourceQuestions: string;
  questionDeleteSuccess: string;
  questionDeleteEmpty: string;
  questionPageLabel: string;
  questionPrevPage: string;
  questionNextPage: string;
  questionSelectedCount: string;
  questionSourceCount: string;
  studyCalendarHeading: string;
  studyCalendarDesc: string;
  studyCalendarEmpty: string;
  studyCalendarAnswered: string;
  studyCalendarCorrect: string;
  studyCalendarAccuracy: string;
  studyCalendarToday: string;
};

const zhCN: Dictionary = {
  pluginName: "Flash Quiz",
  openQuiz: "\u6253\u5f00 quiz",
  modalTitle: "Flash Quiz",
  modalLineOne:
    "\u63d2\u4ef6\u57fa\u7840\u9aa8\u67b6\u5df2\u7ecf\u5c31\u4f4d\u3002\u8bbe\u7f6e\u9875\u3001\u9898\u5e93\u751f\u6210\u548c\u590d\u4e60\u8c03\u5ea6\u4f1a\u5728\u540e\u7eed\u9636\u6bb5\u7ee7\u7eed\u63a5\u5165\u3002",
  modalLineTwo:
    "\u5f53\u524d\u5165\u53e3\u5df2\u7ecf\u8bc1\u660e\u63d2\u4ef6\u53ef\u4ee5\u6b63\u5e38\u52a0\u8f7d\uff0c\u5e76\u6253\u5f00\u4e00\u4e2a\u7528\u6237\u53ef\u89c1\u7684 quiz \u754c\u9762\u3002",
  phasePill: "Phase 1 \u5360\u4f4d\u754c\u9762",
  settingsName: "Flash Quiz",
  languageHeading: "\u754c\u9762\u8bed\u8a00",
  languageName: "UI Language",
  languageDesc: "\u5207\u6362\u63d2\u4ef6\u8bbe\u7f6e\u9875\u3001\u5f39\u7a97\u548c\u63d0\u793a\u6587\u6848\u7684\u8bed\u8a00\u3002",
  languageChinese: "\u4e2d\u6587",
  languageEnglish: "English",
  languageFollow: "\u8ddf\u968f Obsidian",
  activeLanguageName: "\u5f53\u524d\u751f\u6548",
  activeLanguageValueZh: "\u4e2d\u6587",
  activeLanguageValueEn: "English",
  llmHeading: "LLM \u8fde\u63a5",
  baseUrlName: "Base URL",
  baseUrlDesc: "OpenAI \u517c\u5bb9\u63a5\u53e3\u5730\u5740\u3002",
  modelName: "Model",
  modelDesc: "\u540e\u7eed\u751f\u6210 quiz \u65f6\u4f7f\u7528\u7684\u6a21\u578b\u540d\u3002",
  apiKeyName: "API Key",
  apiKeyDesc:
    "\u5b89\u5168\u4fdd\u5b58\u5728 Obsidian Secret Storage\uff0c\u4e0d\u5199\u5165\u666e\u901a\u8bbe\u7f6e\u6587\u4ef6\u3002",
  apiKeyPlaceholder: "\u8f93\u5165\u6216\u66ff\u6362 API key",
  apiKeySaved: "\u5df2\u4fdd\u5b58",
  apiKeyMissing: "\u672a\u8bbe\u7f6e",
  reviewHeading: "\u751f\u6210\u4e0e\u590d\u4e60",
  defaultQuestionsName: "\u6bcf\u7bc7\u6587\u6863\u9ed8\u8ba4\u9898\u6570",
  defaultQuestionsDesc: "\u9ed8\u8ba4 10 \u9898\u3002",
  sessionQuestionsName: "\u6bcf\u8f6e\u9898\u6570",
  sessionQuestionsDesc:
    "\u4e00\u6b21 quiz session \u9ed8\u8ba4\u52a0\u8f7d\u7684\u9898\u76ee\u6570\u91cf\u3002",
  newQuestionRatioName: "\u65b0\u9898\u6bd4\u4f8b\u4e0a\u9650",
  newQuestionRatioDesc:
    "\u5230\u671f\u590d\u4e60\u9898\u4e0d\u8db3\u65f6\uff0c\u6700\u591a\u7528\u591a\u5c11\u65b0\u9898\u8865\u5145\u3002",
  retryIntervalName: "\u7b54\u9519\u540e\u91cd\u73b0\u95f4\u9694\uff08\u5206\u949f\uff09",
  retryIntervalDesc:
    "\u9519\u8bef\u9898\u76ee\u91cd\u65b0\u51fa\u73b0\u524d\u7684\u6700\u77ed\u7b49\u5f85\u65f6\u95f4\u3002",
  sourceHeading: "\u5185\u5bb9\u6765\u6e90\u7ed1\u5b9a",
  sourceDesc:
    "\u5f53\u524d\u7248\u672c\u5148\u652f\u6301\u7ed1\u5b9a\u5f53\u524d\u6d3b\u52a8\u6587\u4ef6\u6216\u5176\u6240\u5728\u6587\u4ef6\u5939\u3002",
  addActiveFile: "\u7ed1\u5b9a\u5f53\u524d\u6587\u4ef6",
  addActiveFolder: "\u7ed1\u5b9a\u5f53\u524d\u6587\u4ef6\u6240\u5728\u6587\u4ef6\u5939",
  addFolderPath: "\u6dfb\u52a0\u6587\u4ef6\u5939",
  folderPathName: "\u9898\u5e93\u6587\u4ef6\u5939",
  folderPathDesc:
    "\u8f93\u5165 vault \u5185\u7684\u6587\u4ef6\u5939\u8def\u5f84\uff0c\u53ef\u4ee5\u8fde\u7eed\u6dfb\u52a0\u591a\u4e2a\u6587\u4ef6\u5939\u4f5c\u4e3a\u9898\u5e93\u6765\u6e90\u3002",
  folderPathPlaceholder: "raw/inbox/notes",
  noActiveFile: "\u5f53\u524d\u6ca1\u6709\u6d3b\u52a8\u6587\u4ef6",
  invalidFolderPath: "\u6587\u4ef6\u5939\u8def\u5f84\u65e0\u6548\u6216\u4e0d\u5b58\u5728",
  noBindings: "\u8fd8\u6ca1\u6709\u7ed1\u5b9a\u4efb\u4f55\u6587\u4ef6\u6216\u6587\u4ef6\u5939\u3002",
  removeBinding: "\u79fb\u9664",
  fileLabel: "\u6587\u4ef6",
  folderLabel: "\u6587\u4ef6\u5939",
  duplicateBinding: "\u8be5\u6765\u6e90\u5df2\u7ed1\u5b9a",
  addedBinding: "\u5df2\u6dfb\u52a0\u6765\u6e90",
  syncNow: "\u589e\u91cf\u540c\u6b65\u9898\u5e93",
  testConnection: "\u6d4b\u8bd5\u8fde\u63a5",
  generatedSummary:
    "\u5df2\u5237\u65b0 {sources} \u4e2a\u6765\u6e90\uff0c\u751f\u6210 {questions} \u9053\u9898\u3002",
  generatedEmpty:
    "\u6ca1\u6709\u9700\u8981\u5237\u65b0\u7684\u6765\u6e90\uff0c\u6216\u6ca1\u6709\u53ef\u751f\u6210\u7684 Markdown \u6587\u6863\u3002",
  connectionSuccess: "\u8fde\u63a5\u6210\u529f",
  connectionFailure: "\u8fde\u63a5\u5931\u8d25",
  syncFailure: "\u540c\u6b65\u5931\u8d25",
  quizCountLabel: "\u5f53\u524d\u7f13\u5b58\u9898\u76ee\u6570",
  sourceCountLabel: "\u5f53\u524d\u5df2\u540c\u6b65\u6765\u6e90\u6570",
  noQuestionsTitle: "\u8fd8\u6ca1\u6709\u53ef\u590d\u4e60\u7684\u9898\u76ee",
  noQuestionsBody:
    "\u5148\u53bb\u8bbe\u7f6e\u9875\u6d4b\u8bd5\u8fde\u63a5\u5e76\u540c\u6b65\u9898\u5e93\uff0c\u7136\u540e\u518d\u6253\u5f00 quiz\u3002",
  sessionProgress: "\u8fdb\u5ea6 {current}/{total}",
  correctFeedback: "\u56de\u7b54\u6b63\u786e",
  wrongFeedback: "\u56de\u7b54\u9519\u8bef",
  correctAnswerLabel: "\u6b63\u786e\u7b54\u6848",
  nextQuestion: "\u4e0b\u4e00\u9898",
  finishSession: "\u5b8c\u6210\u672c\u8f6e",
  sessionComplete: "\u672c\u8f6e quiz \u5df2\u5b8c\u6210",
  sessionAccuracySummary: "\u6b63\u786e\u7387 {accuracy}%",
  sessionCorrectCount: "\u7b54\u5bf9 {correct}/{total} \u9898",
  restartSession: "\u518d\u6765\u4e00\u8f6e",
  closeAction: "\u5173\u95ed",
  sessionCompleteBadge: "\u672c\u8f6e\u5b8c\u6210",
  sessionCompleteBody:
    "\u672c\u8f6e\u7b54\u9898\u5df2\u7ed3\u675f\uff0c\u53ef\u4ee5\u76f4\u63a5\u518d\u6765\u4e00\u8f6e\uff0c\u6216\u5173\u95ed\u5f39\u7a97\u7ee7\u7eed\u6574\u7406\u9898\u5e93\u3002",
  lastSyncStatusName: "\u6700\u8fd1\u540c\u6b65\u72b6\u6001",
  generationStatusName: "\u9898\u5e93\u6784\u5efa\u72b6\u6001",
  generationRunning: "\u540e\u53f0\u6784\u5efa\u4e2d",
  generationIdle: "\u7a7a\u95f2",
  generationComplete: "\u5df2\u5b8c\u6210",
  generationError: "\u6784\u5efa\u51fa\u9519",
  generationProgress: "\u5df2\u5b8c\u6210 {completed}/{total} \u4e2a\u6765\u6e90\uff0c\u751f\u6210 {questions} \u9053\u9898",
  generationCurrentSourceName: "\u5f53\u524d\u6b63\u5728\u5904\u7406",
  questionManagerHeading: "\u9898\u76ee\u7ba1\u7406",
  questionManagerDesc: "\u6309\u6765\u6e90\u7b5b\u9009\u9898\u76ee\uff0c\u652f\u6301\u6279\u91cf\u9009\u62e9\u5220\u9664\uff0c\u6216\u76f4\u63a5\u5220\u9664\u8be5\u6765\u6e90\u7684\u5168\u90e8\u9898\u76ee\u3002",
  questionSourceFilterName: "\u6765\u6e90\u7b5b\u9009",
  questionSourceAll: "\u5168\u90e8\u6765\u6e90",
  questionListEmpty: "\u5f53\u524d\u6ca1\u6709\u53ef\u7ba1\u7406\u7684\u9898\u76ee\u3002",
  selectAllQuestions: "\u5168\u9009\u672c\u9875",
  clearQuestionSelection: "\u53d6\u6d88\u9009\u62e9",
  deleteSelectedQuestions: "\u5220\u9664\u6240\u9009\u9898\u76ee",
  deleteSourceQuestions: "\u5220\u9664\u8be5\u6765\u6e90\u5168\u90e8\u9898\u76ee",
  questionDeleteSuccess: "\u5df2\u5220\u9664 {count} \u9053\u9898\u76ee",
  questionDeleteEmpty: "\u6ca1\u6709\u53ef\u5220\u9664\u7684\u9898\u76ee",
  questionPageLabel: "\u7b2c {current} / {total} \u9875",
  questionPrevPage: "\u4e0a\u4e00\u9875",
  questionNextPage: "\u4e0b\u4e00\u9875",
  questionSelectedCount: "\u5df2\u9009 {count} \u9898",
  questionSourceCount: "{count} \u9898",
  studyCalendarHeading: "\u6253\u5361\u65e5\u5386",
  studyCalendarDesc: "\u6700\u8fd1 30 \u5929\u7684\u7b54\u9898\u8bb0\u5f55\u3002\u70b9\u51fb\u67d0\u4e00\u5929\u67e5\u770b\u7edf\u8ba1\u3002",
  studyCalendarEmpty: "\u6700\u8fd1 30 \u5929\u8fd8\u6ca1\u6709\u7b54\u9898\u8bb0\u5f55\u3002",
  studyCalendarAnswered: "\u7b54\u9898\u6570",
  studyCalendarCorrect: "\u7b54\u5bf9\u6570",
  studyCalendarAccuracy: "\u6b63\u786e\u7387",
  studyCalendarToday: "\u4eca\u5929"
};

const en: Dictionary = {
  pluginName: "Flash Quiz",
  openQuiz: "Open quiz",
  modalTitle: "Flash Quiz",
  modalLineOne:
    "The plugin foundation is active. Settings, question generation, and spaced review will be added in later phases.",
  modalLineTwo:
    "This entry already proves the plugin can load and open a visible quiz surface.",
  phasePill: "Phase 1 placeholder",
  settingsName: "Flash Quiz",
  languageHeading: "Interface language",
  languageName: "UI language",
  languageDesc: "Switch the language for settings, modal UI, and notices.",
  languageChinese: "Chinese",
  languageEnglish: "English",
  languageFollow: "Follow Obsidian",
  activeLanguageName: "Currently active",
  activeLanguageValueZh: "Chinese",
  activeLanguageValueEn: "English",
  llmHeading: "LLM connection",
  baseUrlName: "Base URL",
  baseUrlDesc: "OpenAI-compatible API endpoint.",
  modelName: "Model",
  modelDesc: "Model id to use for quiz generation in later phases.",
  apiKeyName: "API key",
  apiKeyDesc: "Stored in Obsidian Secret Storage instead of normal settings data.",
  apiKeyPlaceholder: "Enter or replace API key",
  apiKeySaved: "Saved",
  apiKeyMissing: "Not set",
  reviewHeading: "Generation and review",
  defaultQuestionsName: "Default questions per document",
  defaultQuestionsDesc: "Default is 10 questions.",
  sessionQuestionsName: "Questions per session",
  sessionQuestionsDesc: "Default number of items loaded into one quiz session.",
  newQuestionRatioName: "New question ratio cap",
  newQuestionRatioDesc: "Maximum percentage of new questions when due items are insufficient.",
  retryIntervalName: "Retry interval after wrong answer (minutes)",
  retryIntervalDesc: "Minimum wait before a failed item can reappear.",
  sourceHeading: "Source bindings",
  sourceDesc: "This version starts with binding the active file or its parent folder.",
  addActiveFile: "Bind active file",
  addActiveFolder: "Bind active file folder",
  addFolderPath: "Add folder",
  folderPathName: "Question bank folder",
  folderPathDesc:
    "Enter a folder path inside the vault. You can add multiple folders as question bank sources.",
  folderPathPlaceholder: "raw/inbox/notes",
  noActiveFile: "No active file",
  invalidFolderPath: "Folder path is invalid or does not exist",
  noBindings: "No files or folders are bound yet.",
  removeBinding: "Remove",
  fileLabel: "File",
  folderLabel: "Folder",
  duplicateBinding: "This source is already bound",
  addedBinding: "Source added",
  syncNow: "Sync question bank",
  testConnection: "Test connection",
  generatedSummary: "Refreshed {sources} sources and generated {questions} questions.",
  generatedEmpty: "No source needed refresh, or no eligible Markdown files were found.",
  connectionSuccess: "Connection succeeded",
  connectionFailure: "Connection failed",
  syncFailure: "Sync failed",
  quizCountLabel: "Cached questions",
  sourceCountLabel: "Synced sources",
  noQuestionsTitle: "No questions are ready yet",
  noQuestionsBody: "Open settings, test the connection, sync the question bank, and then start the quiz again.",
  sessionProgress: "Progress {current}/{total}",
  correctFeedback: "Correct",
  wrongFeedback: "Incorrect",
  correctAnswerLabel: "Correct answer",
  nextQuestion: "Next question",
  finishSession: "Finish session",
  sessionComplete: "This quiz session is complete",
  sessionAccuracySummary: "Accuracy {accuracy}%",
  sessionCorrectCount: "{correct}/{total} correct",
  restartSession: "Restart session",
  closeAction: "Close",
  sessionCompleteBadge: "Session complete",
  sessionCompleteBody:
    "You finished this round. Start another pass right away or close the modal and continue managing your question bank.",
  lastSyncStatusName: "Last sync status",
  generationStatusName: "Question bank build status",
  generationRunning: "Running in background",
  generationIdle: "Idle",
  generationComplete: "Complete",
  generationError: "Error",
  generationProgress: "Processed {completed}/{total} sources and generated {questions} questions",
  generationCurrentSourceName: "Currently processing",
  questionManagerHeading: "Question manager",
  questionManagerDesc: "Filter questions by source, delete selected questions in bulk, or remove all questions from one source.",
  questionSourceFilterName: "Source filter",
  questionSourceAll: "All sources",
  questionListEmpty: "No questions are available for management.",
  selectAllQuestions: "Select page",
  clearQuestionSelection: "Clear selection",
  deleteSelectedQuestions: "Delete selected",
  deleteSourceQuestions: "Delete source questions",
  questionDeleteSuccess: "Deleted {count} questions",
  questionDeleteEmpty: "No questions to delete",
  questionPageLabel: "Page {current} / {total}",
  questionPrevPage: "Previous",
  questionNextPage: "Next",
  questionSelectedCount: "{count} selected",
  questionSourceCount: "{count} questions",
  studyCalendarHeading: "Study calendar",
  studyCalendarDesc: "Your last 30 days of quiz activity. Click a day to inspect the stats.",
  studyCalendarEmpty: "No quiz activity in the last 30 days.",
  studyCalendarAnswered: "Answered",
  studyCalendarCorrect: "Correct",
  studyCalendarAccuracy: "Accuracy",
  studyCalendarToday: "Today"
};

export function resolveLanguage(
  preferred: FlashQuizLanguage,
  appLocale: string | undefined
): Exclude<FlashQuizLanguage, "follow"> {
  if (preferred === "follow") {
    return appLocale?.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
  }

  return preferred;
}

export function getStrings(
  preferred: FlashQuizLanguage,
  appLocale?: string
): Dictionary {
  return resolveLanguage(preferred, appLocale) === "zh-CN" ? zhCN : en;
}

export function formatString(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
