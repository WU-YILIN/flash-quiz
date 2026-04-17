import type { SourceBinding } from "../settings/types";

export type ReviewStage = "new" | "learning" | "reviewing" | "stable" | "weak";

export interface QuizItem {
  id: string;
  sourcePath: string;
  sourceHash: string;
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
  createdAt: string;
  version: number;
}

export interface ReviewState {
  quizItemId: string;
  stage: ReviewStage;
  mastery: number;
  stability: number;
  difficulty: number;
  lastIntervalDays: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  reviewCount: number;
  streakCorrect: number;
  streakWrong: number;
}

export interface ReviewLog {
  quizItemId: string;
  answeredAt: string;
  selectedOption: number;
  isCorrect: boolean;
  responseTimeMs: number;
  quizItemVersion: number;
}

export interface SourceSnapshot {
  sourcePath: string;
  sourceHash: string;
  generatedAt: string;
  quizItemIds: string[];
}

export interface QuestionBankData {
  quizItems: QuizItem[];
  reviewStates: ReviewState[];
  reviewLogs: ReviewLog[];
  sourceSnapshots: SourceSnapshot[];
}

export interface ActiveSessionAnswer {
  quizItemId: string;
  selectedOption: number;
  isCorrect: boolean;
  responseTimeMs: number;
  answeredAt: string;
}

export interface ActiveSessionData {
  quizItemIds: string[];
  currentIndex: number;
  answers: ActiveSessionAnswer[];
  startedAt: string;
}

export interface PluginData {
  settings: {
    uiLanguage: string;
    baseUrl: string;
    model: string;
    defaultQuestionsPerDocument: number;
    questionsPerSession: number;
    newQuestionRatio: number;
    retryIntervalMinutes: number;
    sourceBindings: SourceBinding[];
  };
  bank: QuestionBankData;
  activeSession: ActiveSessionData | null;
}
