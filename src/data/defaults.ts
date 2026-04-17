import { DEFAULT_SETTINGS } from "../settings/defaults";
import type { PluginData, QuestionBankData } from "./types";

export const DEFAULT_BANK: QuestionBankData = {
  quizItems: [],
  reviewStates: [],
  reviewLogs: [],
  sourceSnapshots: []
};

export const DEFAULT_PLUGIN_DATA: PluginData = {
  settings: DEFAULT_SETTINGS,
  bank: DEFAULT_BANK,
  activeSession: null
};
