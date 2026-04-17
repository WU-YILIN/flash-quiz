# Roadmap: Flash Quiz

## Overview

The project moves from a minimal Obsidian plugin foundation into settings and secure configuration, then into question bank generation and local persistence, and finally into the quiz modal and review scheduler. The goal of v1 is not breadth; it is a clean note-to-review loop that already feels polished and dependable.

## Phases

- [ ] **Phase 1: Plugin Foundation** - Create the Obsidian plugin skeleton and primary entry points
- [ ] **Phase 2: Settings and Source Binding** - Build settings UI, language switching, and source configuration
- [ ] **Phase 3: Question Bank Pipeline** - Generate, cache, and incrementally refresh quiz items
- [ ] **Phase 4: Quiz Modal and Review Engine** - Deliver the user-facing quiz flow and scheduling logic

## Phase Details

### Phase 1: Plugin Foundation
**Goal**: Deliver a loadable Obsidian plugin with manifest, bootstrap, styles, and ribbon entry
**Depends on**: Nothing
**Requirements**: [PLUG-01, PLUG-02]
**Success Criteria** (what must be TRUE):
  1. The plugin loads successfully in an Obsidian development vault
  2. A ribbon icon appears and triggers a placeholder modal or notice
  3. Build output follows standard Obsidian community plugin expectations
**Plans**: 3 plans

Plans:
- [x] 01-01: Scaffold plugin files and build setup
- [ ] 01-02: Add bootstrap registrations and ribbon entry
- [ ] 01-03: Add baseline styles and development notes

### Phase 2: Settings and Source Binding
**Goal**: Deliver a functional settings tab with secure LLM config, language switching, and vault source bindings
**Depends on**: Phase 1
**Requirements**: [PLUG-03, CONF-01, CONF-02, CONF-03, CONF-04, CONF-05]
**Success Criteria** (what must be TRUE):
  1. User can view and update plugin settings from Obsidian settings
  2. User can switch plugin UI language and see the setting persist
  3. User can configure LLM connectivity and bind vault files or folders
**Plans**: 3 plans

Plans:
- [ ] 02-01: Define settings schema and persistence model
- [ ] 02-02: Build settings UI with localization support
- [ ] 02-03: Implement vault source binding management and secret storage wiring

### Phase 3: Question Bank Pipeline
**Goal**: Deliver question generation, local persistence, and incremental sync behavior
**Depends on**: Phase 2
**Requirements**: [GEN-01, GEN-02, GEN-03, REVIEW-01, REVIEW-04]
**Success Criteria** (what must be TRUE):
  1. Bound content can be transformed into stored multiple-choice quiz items
  2. Generated questions are cached locally and tied to source metadata
  3. Source changes trigger incremental refresh rather than blind full regeneration
**Plans**: 3 plans

Plans:
- [ ] 03-01: Implement LLM client and generation contract
- [ ] 03-02: Implement local question bank storage and review state models
- [ ] 03-03: Implement source hashing and incremental sync flow

### Phase 4: Quiz Modal and Review Engine
**Goal**: Deliver the visible quiz flow, immediate feedback, and due-first review scheduling
**Depends on**: Phase 3
**Requirements**: [QUIZ-01, QUIZ-02, QUIZ-03, QUIZ-04, REVIEW-02, REVIEW-03]
**Success Criteria** (what must be TRUE):
  1. User can complete a review session inside a modal opened from the ribbon icon
  2. Each submitted answer immediately shows correctness, correct option, and explanation
  3. The next session prioritizes due questions before supplementing with new questions
**Plans**: 3 plans

Plans:
- [ ] 04-01: Build quiz modal UI and session queue assembly
- [ ] 04-02: Implement answer feedback and session progression
- [ ] 04-03: Implement review scheduling updates and due-first selection

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Plugin Foundation | 1/3 | In progress | - |
| 2. Settings and Source Binding | 0/3 | Not started | - |
| 3. Question Bank Pipeline | 0/3 | Not started | - |
| 4. Quiz Modal and Review Engine | 0/3 | Not started | - |
