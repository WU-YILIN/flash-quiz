export type FlashQuizLanguage = "zh-CN" | "en" | "follow";

export interface SourceBinding {
  id: string;
  path: string;
  type: "file" | "folder";
  enabled: boolean;
}

export interface FlashQuizSettingsData {
  uiLanguage: FlashQuizLanguage;
  baseUrl: string;
  model: string;
  defaultQuestionsPerDocument: number;
  questionsPerSession: number;
  newQuestionRatio: number;
  retryIntervalMinutes: number;
  sourceBindings: SourceBinding[];
  lastSyncStatus: string;
  generationStatus: "idle" | "running" | "complete" | "error";
  generationTotalSources: number;
  generationCompletedSources: number;
  generationGeneratedQuestions: number;
  generationCurrentSource: string;
}
