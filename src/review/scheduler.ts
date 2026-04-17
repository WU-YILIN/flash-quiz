import type { ReviewLog, ReviewStage, ReviewState } from "../data/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_DIFFICULTY = 0.15;
const MAX_DIFFICULTY = 0.95;
const MIN_STABILITY = 0.6;
const MAX_STABILITY = 12;

export function updateReviewState(args: {
  reviewState: ReviewState;
  isCorrect: boolean;
  retryIntervalMinutes: number;
  answeredAt: string;
}): ReviewState {
  const answeredAtMs = new Date(args.answeredAt).getTime();
  const nextStageValue = nextStage(args.reviewState, args.isCorrect);
  const difficulty = clampDifficulty(
    args.isCorrect
      ? args.reviewState.difficulty - 0.05 + args.reviewState.streakWrong * 0.01
      : args.reviewState.difficulty + 0.12 + args.reviewState.streakWrong * 0.03
  );
  const stability = clampStability(
    args.isCorrect
      ? growStability(args.reviewState, difficulty)
      : Math.max(
          MIN_STABILITY,
          args.reviewState.stability * (args.reviewState.stage === "stable" ? 0.45 : 0.6)
        )
  );
  const lastIntervalDays = args.isCorrect
    ? chooseNextIntervalDays({
        reviewState: args.reviewState,
        nextStage: nextStageValue,
        difficulty,
        stability
      })
    : 0;
  const nextReviewAt = args.isCorrect
    ? new Date(answeredAtMs + lastIntervalDays * DAY_MS).toISOString()
    : new Date(
        answeredAtMs + args.retryIntervalMinutes * 60 * 1000
      ).toISOString();

  return {
    ...args.reviewState,
    stage: nextStageValue,
    mastery: Math.max(0, args.reviewState.mastery + (args.isCorrect ? 1 : -1)),
    stability,
    difficulty,
    lastIntervalDays,
    lastReviewedAt: args.answeredAt,
    nextReviewAt,
    reviewCount: args.reviewState.reviewCount + 1,
    streakCorrect: args.isCorrect ? args.reviewState.streakCorrect + 1 : 0,
    streakWrong: args.isCorrect ? 0 : args.reviewState.streakWrong + 1
  };
}

export function createReviewLog(args: {
  quizItemId: string;
  selectedOption: number;
  isCorrect: boolean;
  answeredAt: string;
  responseTimeMs: number;
  quizItemVersion: number;
}): ReviewLog {
  return {
    quizItemId: args.quizItemId,
    answeredAt: args.answeredAt,
    selectedOption: args.selectedOption,
    isCorrect: args.isCorrect,
    responseTimeMs: args.responseTimeMs,
    quizItemVersion: args.quizItemVersion
  };
}

function nextStage(state: ReviewState, isCorrect: boolean): ReviewStage {
  if (!isCorrect) {
    return state.streakWrong + 1 >= 2 ? "weak" : "learning";
  }

  switch (state.stage) {
    case "new":
      return "reviewing";
    case "learning":
      return "reviewing";
    case "reviewing":
      return state.streakCorrect + 1 >= 2 ? "stable" : "reviewing";
    case "stable":
      return "stable";
    case "weak":
      return state.streakCorrect + 1 >= 1 ? "learning" : "weak";
    default:
      return "reviewing";
  }
}

function chooseNextIntervalDays(args: {
  reviewState: ReviewState;
  nextStage: ReviewStage;
  difficulty: number;
  stability: number;
}): number {
  const stageBaseInterval = getStageBaseInterval(args.reviewState.stage, args.nextStage);
  const streakBonus = Math.max(0, args.reviewState.streakCorrect) * 0.9;
  const stabilityFactor = Math.max(0.9, args.stability);
  const difficultyFactor = Math.max(0.55, 1.2 - args.difficulty);
  const rawInterval = (stageBaseInterval + streakBonus) * stabilityFactor * difficultyFactor;

  return clampIntervalDays(Math.round(rawInterval), args.nextStage);
}

function getStageBaseInterval(currentStage: ReviewStage, nextStage: ReviewStage): number {
  if (currentStage === "new" && nextStage === "reviewing") {
    return 1;
  }

  if (currentStage === "learning" && nextStage === "reviewing") {
    return 3;
  }

  if (currentStage === "weak") {
    return nextStage === "learning" ? 1 : 2;
  }

  switch (nextStage) {
    case "reviewing":
      return 5;
    case "stable":
      return 10;
    default:
      return 2;
  }
}

function clampIntervalDays(intervalDays: number, stage: ReviewStage): number {
  if (stage === "stable") {
    return clamp(intervalDays, 7, 30);
  }

  if (stage === "reviewing") {
    return clamp(intervalDays, 1, 14);
  }

  if (stage === "learning" || stage === "weak") {
    return clamp(intervalDays, 1, 3);
  }

  return clamp(intervalDays, 1, 30);
}

function growStability(reviewState: ReviewState, difficulty: number): number {
  const growthBase =
    reviewState.stage === "stable"
      ? 1.45
      : reviewState.stage === "reviewing"
        ? 1.32
        : 1.18;
  const difficultyDiscount = 1 - (difficulty - MIN_DIFFICULTY) * 0.45;
  const streakBonus = Math.min(0.7, reviewState.streakCorrect * 0.12);
  const masteryBonus = Math.min(0.8, reviewState.mastery * 0.05);

  return reviewState.stability * growthBase * difficultyDiscount + streakBonus + masteryBonus;
}

function clampDifficulty(value: number): number {
  return clamp(value, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

function clampStability(value: number): number {
  return clamp(Number(value.toFixed(2)), MIN_STABILITY, MAX_STABILITY);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
