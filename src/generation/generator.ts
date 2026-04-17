import { hashString } from "../lib/hash";
import type { QuestionBankData, QuizItem, ReviewState, SourceSnapshot } from "../data/types";
import type { FlashQuizLlmClient } from "./llmClient";
import {
  resolveBoundMarkdownSources,
  resolvePendingMarkdownSources
} from "./sourceResolver";
import type { SourceBinding } from "../settings/types";
import type { GenerationResult } from "./types";
import type { Vault } from "obsidian";

export async function syncQuestionBank(args: {
  vault: Vault;
  llmClient: FlashQuizLlmClient;
  bindings: SourceBinding[];
  questionCount: number;
  currentBank: QuestionBankData;
}): Promise<{ bank: QuestionBankData; generatedCount: number; refreshedSources: number }> {
  const sources = await resolveBoundMarkdownSources(args.vault, args.bindings);
  const nextBank: QuestionBankData = {
    quizItems: [...args.currentBank.quizItems],
    reviewStates: [...args.currentBank.reviewStates],
    reviewLogs: [...args.currentBank.reviewLogs],
    sourceSnapshots: [...args.currentBank.sourceSnapshots]
  };

  let generatedCount = 0;
  let refreshedSources = 0;

  for (const source of sources) {
    const snapshot = nextBank.sourceSnapshots.find(
      (item) => item.sourcePath === source.sourcePath
    );

    if (snapshot?.sourceHash === source.sourceHash) {
      continue;
    }

    const questions = await args.llmClient.generateQuestions({
      sourcePath: source.sourcePath,
      content: source.content,
      questionCount: args.questionCount
    });

    const generated = materializeGeneration({
      sourcePath: source.sourcePath,
      sourceHash: source.sourceHash,
      questions
    });

    replaceSourceQuestions(nextBank, generated);
    generatedCount += generated.questions.length;
    refreshedSources += 1;
  }

  return { bank: nextBank, generatedCount, refreshedSources };
}

export async function getPendingSourceCount(args: {
  vault: Vault;
  bindings: SourceBinding[];
  currentBank: QuestionBankData;
}): Promise<number> {
  const pending = await resolvePendingMarkdownSources(
    args.vault,
    args.bindings,
    args.currentBank.sourceSnapshots
  );
  return pending.length;
}

export async function processQuestionBankBatch(args: {
  vault: Vault;
  llmClient: FlashQuizLlmClient;
  bindings: SourceBinding[];
  questionCount: number;
  currentBank: QuestionBankData;
  batchSize: number;
  concurrency: number;
}): Promise<{
  bank: QuestionBankData;
  generatedCount: number;
  refreshedSources: number;
  remainingSources: number;
  processedSourcePaths: string[];
}> {
  const pendingSources = await resolvePendingMarkdownSources(
    args.vault,
    args.bindings,
    args.currentBank.sourceSnapshots
  );
  const selected = pendingSources.slice(0, args.batchSize);
  const nextBank: QuestionBankData = {
    quizItems: [...args.currentBank.quizItems],
    reviewStates: [...args.currentBank.reviewStates],
    reviewLogs: [...args.currentBank.reviewLogs],
    sourceSnapshots: [...args.currentBank.sourceSnapshots]
  };

  let generatedCount = 0;
  let refreshedSources = 0;
  const processedSourcePaths: string[] = [];

  for (let start = 0; start < selected.length; start += args.concurrency) {
    const chunk = selected.slice(start, start + args.concurrency);
    const results = await Promise.all(
      chunk.map(async (source) => {
        const questions = await args.llmClient.generateQuestions({
          sourcePath: source.sourcePath,
          content: source.content,
          questionCount: args.questionCount
        });

        return materializeGeneration({
          sourcePath: source.sourcePath,
          sourceHash: source.sourceHash,
          questions
        });
      })
    );

    results.forEach((generated, index) => {
      const source = chunk[index];
      if (!source) {
        return;
      }

      replaceSourceQuestions(nextBank, generated);
      generatedCount += generated.questions.length;
      refreshedSources += 1;
      processedSourcePaths.push(source.sourcePath);
    });
  }

  return {
    bank: nextBank,
    generatedCount,
    refreshedSources,
    remainingSources: Math.max(0, pendingSources.length - selected.length),
    processedSourcePaths
  };
}

function materializeGeneration(result: GenerationResult): {
  questions: QuizItem[];
  reviewStates: ReviewState[];
  snapshot: SourceSnapshot;
} {
  const createdAt = new Date().toISOString();
  const questions = result.questions.map((question, index) => {
    const id = hashString(
      `${result.sourcePath}:${result.sourceHash}:${question.prompt}:${index}`
    );

    return {
      id,
      sourcePath: result.sourcePath,
      sourceHash: result.sourceHash,
      prompt: question.prompt,
      options: question.options,
      correctOption: question.correctOption,
      explanation: question.explanation,
      createdAt,
      version: 1
    };
  });

  return {
    questions,
    reviewStates: questions.map((question) => ({
      quizItemId: question.id,
      stage: "new",
      mastery: 0,
      stability: 1,
      difficulty: 0.35,
      lastIntervalDays: 0,
      lastReviewedAt: null,
      nextReviewAt: null,
      reviewCount: 0,
      streakCorrect: 0,
      streakWrong: 0
    })),
    snapshot: {
      sourcePath: result.sourcePath,
      sourceHash: result.sourceHash,
      generatedAt: createdAt,
      quizItemIds: questions.map((question) => question.id)
    }
  };
}

function replaceSourceQuestions(
  bank: QuestionBankData,
  generated: {
    questions: QuizItem[];
    reviewStates: ReviewState[];
    snapshot: SourceSnapshot;
  }
): void {
  const previousSnapshot = bank.sourceSnapshots.find(
    (snapshot) => snapshot.sourcePath === generated.snapshot.sourcePath
  );
  const previousIds = new Set(previousSnapshot?.quizItemIds ?? []);

  bank.quizItems = bank.quizItems.filter((item) => !previousIds.has(item.id));
  bank.reviewStates = bank.reviewStates.filter(
    (item) => !previousIds.has(item.quizItemId)
  );
  bank.reviewLogs = bank.reviewLogs.filter(
    (item) => !previousIds.has(item.quizItemId)
  );
  bank.sourceSnapshots = bank.sourceSnapshots.filter(
    (snapshot) => snapshot.sourcePath !== generated.snapshot.sourcePath
  );

  bank.quizItems.push(...generated.questions);
  bank.reviewStates.push(...generated.reviewStates);
  bank.sourceSnapshots.push(generated.snapshot);
}
