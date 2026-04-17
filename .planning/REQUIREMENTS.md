# Requirements: Flash Quiz

**Defined:** 2026-04-13  
**Core Value:** Turn personal notes into a review flow that users actually want to open again and again.

## v1 Requirements

### Plugin Foundation

- [ ] **PLUG-01**: User can install and load the plugin as an Obsidian community plugin
- [ ] **PLUG-02**: User can open the main quiz experience from a ribbon icon
- [ ] **PLUG-03**: User can switch the plugin UI language between Chinese, English, and Follow Obsidian

### Settings and Configuration

- [ ] **CONF-01**: User can configure a custom `Base URL`
- [ ] **CONF-02**: User can configure a model identifier
- [ ] **CONF-03**: User can securely configure an API key
- [ ] **CONF-04**: User can bind one or more vault files or folders as quiz sources
- [ ] **CONF-05**: User can set the default number of generated questions per document, with default value `10`

### Question Generation

- [ ] **GEN-01**: Plugin can generate multiple-choice questions from a bound source through an LLM
- [ ] **GEN-02**: Plugin caches generated questions locally for later review
- [ ] **GEN-03**: Plugin can incrementally refresh question banks when bound content changes

### Quiz Experience

- [ ] **QUIZ-01**: User sees one multiple-choice question at a time in a modal
- [ ] **QUIZ-02**: User receives immediate correctness feedback after answering
- [ ] **QUIZ-03**: User sees the correct option and a short explanation after each answer
- [ ] **QUIZ-04**: User can continue through a finite review session with visible progress

### Review Scheduling

- [ ] **REVIEW-01**: Plugin stores a per-question review state
- [ ] **REVIEW-02**: Plugin schedules future reviews based on correct and incorrect answers
- [ ] **REVIEW-03**: Plugin prioritizes due review questions before filling with new questions
- [ ] **REVIEW-04**: Plugin stores answer history for later refinement and debugging

## v2 Requirements

### Content Expansion

- **CONT-01**: Support additional question types beyond multiple choice
- **CONT-02**: Support richer source extraction from complex note structures

### Learning Controls

- **LEARN-01**: Provide more advanced review strategy tuning
- **LEARN-02**: Provide analytics for progress, weak topics, and retention trends

## Out of Scope

| Feature | Reason |
|---------|--------|
| Reuse another spaced repetition plugin's data model | Product direction is to control UX and review behavior directly |
| External filesystem sources outside the vault | Increases complexity and weakens Obsidian-native design |
| Manual question authoring UI | Not needed to validate the core loop |
| Cloud accounts and cross-device sync | Significant scope increase for first release |
| Image- or OCR-based question generation | Not part of the initial note-to-quiz flow |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLUG-01 | Phase 1 | Pending |
| PLUG-02 | Phase 1 | Pending |
| PLUG-03 | Phase 2 | Pending |
| CONF-01 | Phase 2 | Pending |
| CONF-02 | Phase 2 | Pending |
| CONF-03 | Phase 2 | Pending |
| CONF-04 | Phase 2 | Pending |
| CONF-05 | Phase 2 | Pending |
| GEN-01 | Phase 3 | Pending |
| GEN-02 | Phase 3 | Pending |
| GEN-03 | Phase 3 | Pending |
| QUIZ-01 | Phase 4 | Pending |
| QUIZ-02 | Phase 4 | Pending |
| QUIZ-03 | Phase 4 | Pending |
| QUIZ-04 | Phase 4 | Pending |
| REVIEW-01 | Phase 3 | Pending |
| REVIEW-02 | Phase 4 | Pending |
| REVIEW-03 | Phase 4 | Pending |
| REVIEW-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-04-13*  
*Last updated: 2026-04-13 after initial design approval*
