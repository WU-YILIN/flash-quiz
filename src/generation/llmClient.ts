import { requestUrl } from "obsidian";
import { extractJsonBlock } from "../lib/json";
import type { GeneratedQuestion } from "./types";

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class FlashQuizLlmClient {
  constructor(private readonly config: LlmConfig) {}

  async testConnection(): Promise<void> {
    const response = await this.requestChatCompletion([
      {
        role: "system",
        content: "Reply with exactly: ok"
      },
      {
        role: "user",
        content: "ok"
      }
    ]);

    const rawContent = response.json?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string" || rawContent.length === 0) {
      throw new Error("Connection test did not return message content");
    }
  }

  async generateQuestions(args: {
    sourcePath: string;
    content: string;
    questionCount: number;
  }): Promise<GeneratedQuestion[]> {
    const response = await this.requestChatCompletion([
      {
        role: "system",
        content:
          "You generate multiple-choice quiz questions from note content. Return valid JSON only. Each item must contain prompt, options, correctOption, explanation. correctOption may be 0-based, 1-based, or A-D."
      },
      {
        role: "user",
        content: [
          `Source path: ${args.sourcePath}`,
          `Question count: ${args.questionCount}`,
          "Generate rigorous multiple-choice questions from the content below.",
          "Constraints:",
          "- exactly 4 options per question",
          "- only one correct answer",
          "- concise explanation",
          "- output JSON array only",
          "",
          args.content
        ].join("\n")
      }
    ]);

    const rawContent = response.json?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string" || rawContent.length === 0) {
      throw new Error("Model response did not contain message content");
    }

    const extracted = extractJsonBlock(rawContent);
    let parsed: unknown;
    try {
      parsed = JSON.parse(extracted);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON";
      throw new Error(
        `${message}. Raw preview: ${rawContent.slice(0, 260).replace(/\s+/g, " ")}`
      );
    }
    const normalizedArray = unwrapQuestionArray(parsed);
    if (!Array.isArray(normalizedArray)) {
      throw new Error("Model response was not a JSON array");
    }

    const questions = normalizedArray
      .map(normalizeGeneratedQuestion)
      .filter((item): item is GeneratedQuestion => item !== null);

    if (questions.length === 0) {
      throw new Error(
        `Model returned no valid questions. Raw preview: ${rawContent.slice(0, 240)}`
      );
    }

    return questions;
  }

  async translateQuizItem(args: {
    prompt: string;
    options: string[];
    explanation: string;
    targetLanguage: "zh-CN" | "en";
  }): Promise<GeneratedQuestion> {
    const languageLabel = args.targetLanguage === "zh-CN" ? "Simplified Chinese" : "English";
    const response = await this.requestChatCompletion([
      {
        role: "system",
        content:
          "Translate quiz content into the requested language. Preserve meaning, keep exactly 4 options, and return valid JSON only with prompt, options, explanation."
      },
      {
        role: "user",
        content: [
          `Target language: ${languageLabel}`,
          "Return JSON only.",
          "",
          JSON.stringify({
            prompt: args.prompt,
            options: args.options,
            explanation: args.explanation
          })
        ].join("\n")
      }
    ]);

    const rawContent = response.json?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string" || rawContent.length === 0) {
      throw new Error("Translation response did not contain message content");
    }

    const extracted = extractJsonBlock(rawContent);
    let parsed: unknown;
    try {
      parsed = JSON.parse(extracted);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON";
      throw new Error(
        `${message}. Raw preview: ${rawContent.slice(0, 260).replace(/\s+/g, " ")}`
      );
    }

    const record = normalizeTranslatedQuestion(parsed);
    if (!record) {
      throw new Error("Translation response was missing required fields");
    }

    return {
      ...record,
      correctOption: 0
    };
  }

  private async requestChatCompletion(
    messages: Array<{ role: string; content: string }>
  ) {
    const response = await requestUrl({
      url: normalizeEndpoint(this.config.baseUrl, "/chat/completions"),
      method: "POST",
      contentType: "application/json",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.2,
        messages
      })
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response;
  }
}

function normalizeEndpoint(baseUrl: string, suffix: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${suffix}`;
}

function normalizeGeneratedQuestion(value: unknown): GeneratedQuestion | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
  const explanation =
    typeof record.explanation === "string" ? record.explanation.trim() : "";
  const options = Array.isArray(record.options)
    ? record.options.filter((option): option is string => typeof option === "string")
    : [];
  const correctOption = normalizeCorrectOption(record.correctOption);

  if (
    prompt.length === 0 ||
    explanation.length === 0 ||
    options.length !== 4 ||
    correctOption < 0 ||
    correctOption > 3
  ) {
    return null;
  }

  return {
    prompt,
    options,
    correctOption,
    explanation
  };
}

function unwrapQuestionArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.questions)) {
    return record.questions;
  }
  if (Array.isArray(record.items)) {
    return record.items;
  }

  return null;
}

function normalizeTranslatedQuestion(
  value: unknown
): Pick<GeneratedQuestion, "prompt" | "options" | "explanation"> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
  const explanation =
    typeof record.explanation === "string" ? record.explanation.trim() : "";
  const options = Array.isArray(record.options)
    ? record.options.filter((option): option is string => typeof option === "string")
    : [];

  if (prompt.length === 0 || explanation.length === 0 || options.length !== 4) {
    return null;
  }

  return {
    prompt,
    options,
    explanation
  };
}

function normalizeCorrectOption(value: unknown): number {
  if (typeof value === "number") {
    if (value >= 0 && value <= 3) {
      return value;
    }
    if (value >= 1 && value <= 4) {
      return value - 1;
    }
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toUpperCase();
    if (["A", "B", "C", "D"].includes(trimmed)) {
      return trimmed.charCodeAt(0) - 65;
    }

    const numeric = Number.parseInt(trimmed, 10);
    if (Number.isFinite(numeric)) {
      if (numeric >= 0 && numeric <= 3) {
        return numeric;
      }
      if (numeric >= 1 && numeric <= 4) {
        return numeric - 1;
      }
    }
  }

  return -1;
}
