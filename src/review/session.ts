import type { QuestionBankData, QuizItem, ReviewState } from "../data/types";

export interface SessionItem {
  quizItem: QuizItem;
  reviewState: ReviewState;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildReviewSession(
  bank: QuestionBankData,
  sessionSize: number,
  newQuestionRatio: number
): SessionItem[] {
  const now = Date.now();
  const statesById = new Map(
    bank.reviewStates.map((state) => [state.quizItemId, state] as const)
  );

  const due: SessionItem[] = [];
  const fresh: SessionItem[] = [];
  const upcoming: SessionItem[] = [];

  for (const quizItem of bank.quizItems) {
    const reviewState = statesById.get(quizItem.id);
    if (!reviewState) {
      continue;
    }

    const item = { quizItem, reviewState };
    if (reviewState.stage === "new") {
      fresh.push(item);
      continue;
    }

    if (isDue(reviewState, now)) {
      due.push(item);
      continue;
    }

    upcoming.push(item);
  }

  due.sort((left, right) => scoreDueItem(right, now) - scoreDueItem(left, now));
  fresh.sort(sortFreshItems);
  upcoming.sort((left, right) => scoreUpcomingItem(right, now) - scoreUpcomingItem(left, now));

  const targetNewItems = Math.min(
    fresh.length,
    Math.ceil(sessionSize * (newQuestionRatio / 100))
  );
  const targetReviewItems = Math.max(0, sessionSize - targetNewItems);

  const reviewItems = due.slice(0, targetReviewItems);
  const remainingAfterReviews = Math.max(0, sessionSize - reviewItems.length);
  const newItems = fresh.slice(0, Math.min(targetNewItems, remainingAfterReviews));

  const combined = [...reviewItems, ...newItems];
  if (combined.length >= sessionSize) {
    return combined.slice(0, sessionSize);
  }

  const excluded = new Set(combined.map((item) => item.quizItem.id));
  const fallback = [...due.slice(reviewItems.length), ...upcoming, ...fresh.slice(newItems.length)]
    .filter((item) => !excluded.has(item.quizItem.id))
    .slice(0, sessionSize - combined.length);

  return [...combined, ...fallback];
}

function isDue(state: ReviewState, now: number): boolean {
  if (state.stage === "new" || !state.nextReviewAt) {
    return false;
  }

  return new Date(state.nextReviewAt).getTime() <= now;
}

function scoreDueItem(item: SessionItem, now: number): number {
  const dueAtMs = item.reviewState.nextReviewAt
    ? new Date(item.reviewState.nextReviewAt).getTime()
    : now;
  const overdueDays = Math.max(0, (now - dueAtMs) / DAY_MS);
  const stageWeight = getStageWeight(item.reviewState.stage);

  return (
    overdueDays * 18 +
    stageWeight +
    item.reviewState.difficulty * 12 +
    item.reviewState.streakWrong * 9 -
    item.reviewState.stability * 2
  );
}

function scoreUpcomingItem(item: SessionItem, now: number): number {
  const nextReviewAtMs = item.reviewState.nextReviewAt
    ? new Date(item.reviewState.nextReviewAt).getTime()
    : now + 30 * DAY_MS;
  const daysUntilDue = Math.max(0, (nextReviewAtMs - now) / DAY_MS);

  return (
    getStageWeight(item.reviewState.stage) +
    item.reviewState.difficulty * 10 -
    daysUntilDue * 4 -
    item.reviewState.stability
  );
}

function getStageWeight(stage: ReviewState["stage"]): number {
  switch (stage) {
    case "weak":
      return 24;
    case "learning":
      return 18;
    case "reviewing":
      return 12;
    case "stable":
      return 6;
    case "new":
    default:
      return 0;
  }
}

function sortFreshItems(left: SessionItem, right: SessionItem): number {
  return left.quizItem.createdAt.localeCompare(right.quizItem.createdAt);
}
