# Flash Quiz Obsidian Plugin Design

**Date:** 2026-04-13  
**Status:** Approved for planning  
**Product:** Flash Quiz

## Summary

Flash Quiz is an Obsidian community plugin that turns user-selected vault files or folders into LLM-generated multiple-choice quizzes, then reinforces memory with an internal spaced-review scheduler. The primary interaction is a ribbon icon that opens a quiz modal. The plugin caches generated questions locally and prioritizes due review items on subsequent sessions.

## User Goal

Users want a better-looking, more motivating way to review knowledge captured in Obsidian notes without relying on existing spaced repetition plugins that feel visually unappealing or structurally limiting.

## Core Product Decisions

- The plugin owns the review system end to end. It does not reuse another spaced repetition plugin's data model.
- Source selection happens in the plugin settings tab, not inside the quiz modal.
- The quiz experience starts from a ribbon icon and opens in a modal.
- v1 supports only multiple-choice questions.
- Answer feedback is immediate: correctness, right answer, and a short explanation appear after each answer.
- Questions are generated into a local cached bank and reused across review sessions.
- Review selection prioritizes due questions first, then fills with new questions.
- The settings UI supports `Chinese`, `English`, and `Follow Obsidian`.

## Primary User Flow

1. User opens the settings tab.
2. User configures `Base URL`, `Model`, and `API key`.
3. User binds one or more vault files or folders.
4. Plugin generates or incrementally refreshes a local question bank.
5. User clicks the ribbon icon.
6. Plugin opens the quiz modal and loads a review session.
7. User answers a question and immediately sees the result and explanation.
8. Plugin updates review state and schedules the next appearance time for that question.
9. On the next session, the plugin prioritizes due items before introducing new items.

## UX Structure

### Quiz Modal

- Entry from ribbon icon.
- Default mode is `Start Review`.
- Secondary mode is `Learn New`.
- Header shows review context, such as due count and current source scope.
- Body shows one multiple-choice question at a time.
- After answer submission, the same card reveals:
  - whether the answer was correct
  - the correct option
  - a short explanation
- Footer shows session progress and next action.

### Settings Tab

- Section: interface language
- Section: LLM connection
- Section: content source bindings
- Section: generation and review parameters
- Section: manual maintenance actions

Recommended initial controls:

- `UI Language`: Chinese / English / Follow Obsidian
- `Base URL`
- `Model`
- `API key`
- `Default questions per document` with default `10`
- `Questions per session`
- `New question ratio cap`
- `Retry interval after wrong answer`
- `Test connection`
- `Incremental sync`
- `Regenerate selected source`

## Data Model

### SourceBinding

Tracks bound vault paths and sync metadata.

- `id`
- `path`
- `type` (`file` or `folder`)
- `enabled`
- `lastScannedAt`
- `contentHash`

### QuizItem

Represents one generated question.

- `id`
- `sourcePath`
- `sourceHash`
- `prompt`
- `options`
- `correctOption`
- `explanation`
- `createdAt`
- `version`

### ReviewState

Stores current memory state for each quiz item.

- `quizItemId`
- `stage` (`new`, `learning`, `reviewing`, `stable`, `weak`)
- `mastery`
- `lastReviewedAt`
- `nextReviewAt`
- `reviewCount`
- `streakCorrect`
- `streakWrong`

### ReviewLog

Stores historical answer attempts.

- `quizItemId`
- `answeredAt`
- `selectedOption`
- `isCorrect`
- `responseTimeMs`
- `quizItemVersion`

## Review Scheduling

v1 uses a simple staged scheduler rather than a complex adaptive model.

- `new` answered correctly: reappear in about `1 day`
- `new` answered incorrectly: reappear in `10-30 minutes`
- `learning` answered correctly: reappear in about `3 days`
- `reviewing` answered correctly: reappear in about `7 days`
- `stable` answered correctly: interval expands progressively, such as `14 days`, then `30 days`
- Any incorrect answer can demote the question into `learning` or `weak`

Session queue policy:

- about `70%` due review items
- about `30%` new items when available
- if there are no due items, fill the session mostly with new items

## Technical Constraints

The design is constrained by official Obsidian plugin guidance:

- Plugin development follows the official TypeScript plugin workflow in [Build a plugin](https://docs.obsidian.md/Plugins/Getting%20started/Build%20a%20plugin).
- `manifest.json` must follow the official schema in [Manifest](https://docs.obsidian.md/Reference/Manifest).
- API secrets should use Obsidian's secret storage guidance from [Store secrets](https://docs.obsidian.md/plugins/guides/secret-storage), not plaintext `data.json`.
- Expensive startup work should not happen in `onload()`, per [Optimize plugin load time](https://docs.obsidian.md/plugins/guides/load-time).

Engineering implications inferred from those docs:

- v1 should bind only files and folders inside the current vault.
- Question generation and folder scanning should run after layout readiness or by explicit user action.
- `API key` storage should use Obsidian secret storage, while non-secret settings can use normal plugin settings persistence.
- The plugin should avoid becoming desktop-only unless it truly depends on Node or Electron APIs.

## Capability Boundary

### In Scope for v1

- Obsidian community plugin
- Ribbon icon to open quiz modal
- Settings tab with language switch
- User-configurable `Base URL`, `Model`, `API key`
- Vault file and folder binding
- LLM-generated multiple-choice quizzes
- Cached local question bank
- Incremental regeneration by source change
- Internal review scheduler
- Immediate answer feedback

### Out of Scope for v1

- Reusing external spaced repetition plugin data
- Non-multiple-choice question types
- External filesystem sources outside the vault
- Multi-user sync or cloud accounts
- Complex analytics dashboards
- Manual question authoring tools
- OCR, image understanding, or table parsing
- Full algorithm tuning UI for advanced memory models

## Implementation Recommendation

Build v1 as a standard TypeScript Obsidian plugin with a narrow, stable surface:

- `main.ts` for plugin bootstrap and registrations
- `settings` module for configuration and language switching
- `quiz modal` module for session UI
- `question bank` module for local persistence and incremental refresh
- `review engine` module for scheduling and queue assembly
- `llm client` module for provider-compatible API calls

## Next Step

The next concrete step is project planning: scaffold the plugin structure, choose storage shape, and break implementation into foundation, settings, generation, and review phases.
