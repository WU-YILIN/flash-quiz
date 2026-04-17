# Flash Quiz

## What This Is

Flash Quiz is an Obsidian plugin that converts user-selected vault files or folders into LLM-generated multiple-choice quizzes and reinforces memory with an internal review scheduler. It is aimed at users who already learn inside Obsidian but want a more motivating and visually stronger review experience than existing spaced repetition plugins.

## Core Value

Turn personal notes into a review flow that users actually want to open again and again.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Generate multiple-choice quiz items from bound vault files or folders
- [ ] Open a quiz modal from a ribbon icon with immediate answer feedback
- [ ] Maintain an internal spaced-review schedule and cached local question bank
- [ ] Provide a settings tab for LLM config, source binding, and UI language switching

### Out of Scope

- Reusing third-party spaced repetition plugin data - product direction is to own the experience end to end
- Non-multiple-choice question types - reduces v1 complexity and keeps review behavior stable
- External non-vault filesystem sources - conflicts with a cleaner Obsidian-first plugin surface
- Multi-user sync and cloud accounts - not required for the first usable release

## Context

- Product is greenfield and the workspace is currently empty aside from design mockups.
- The user wants the plugin to feel better than existing review plugins, not just functionally similar.
- The main interaction model is already decided: ribbon icon to modal, settings-driven source binding.
- The plugin should follow official Obsidian TypeScript plugin guidance.

## Constraints

- **Platform**: Must fit Obsidian community plugin architecture - implementation needs to work within Obsidian's plugin API model
- **Security**: API keys should use Obsidian secret storage - plaintext settings are not acceptable for secrets
- **Scope**: v1 supports only multiple-choice questions - avoids spreading effort across too many interaction types
- **Performance**: Expensive scans or LLM calls should not run in `onload()` - startup must stay lightweight
- **Compatibility**: Prefer vault-only bindings in v1 - aligns with Obsidian's normal content model and avoids desktop-only assumptions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build an internal review engine | Existing plugins do not meet the desired UX bar | Pending |
| Cache generated questions locally | Needed for stable review history and incremental sync | Pending |
| Use a ribbon icon to open the quiz modal | This is the fastest primary entry point for the user | Pending |
| Keep source selection in settings, not modal | Reduces modal complexity and keeps sessions focused | Pending |
| Support UI language switching in settings | Explicit user request and useful for plugin reach | Pending |

---
*Last updated: 2026-04-13 after initial design approval*
