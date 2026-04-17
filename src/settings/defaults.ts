import type { FlashQuizSettingsData } from "./types";

export const DEFAULT_SETTINGS: FlashQuizSettingsData = {
  uiLanguage: "follow",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  defaultQuestionsPerDocument: 10,
  questionsPerSession: 12,
  newQuestionRatio: 30,
  retryIntervalMinutes: 15,
  sourceBindings: [],
  lastSyncStatus: "Idle",
  generationStatus: "idle",
  generationTotalSources: 0,
  generationCompletedSources: 0,
  generationGeneratedQuestions: 0,
  generationCurrentSource: ""
};
