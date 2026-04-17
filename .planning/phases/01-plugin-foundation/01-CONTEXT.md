# Phase 1 Context: Plugin Foundation

## Goal

Create a minimal but correct Obsidian community plugin foundation for Flash Quiz so later phases can build on a stable bootstrap, manifest, ribbon entry, and style structure.

## Why This Phase Exists

Everything else depends on a clean plugin skeleton. If the bootstrap, manifest, build output, and lifecycle usage are wrong, later settings, question generation, and review logic will be built on unstable ground.

## Inputs

- [.planning/PROJECT.md](D:\project\flash_quiz\.planning\PROJECT.md)
- [.planning/REQUIREMENTS.md](D:\project\flash_quiz\.planning\REQUIREMENTS.md)
- [.planning/ROADMAP.md](D:\project\flash_quiz\.planning\ROADMAP.md)
- [2026-04-13-flash-quiz-design.md](D:\project\flash_quiz\docs\superpowers\specs\2026-04-13-flash-quiz-design.md)

## Requirements Covered

- `PLUG-01`: User can install and load the plugin as an Obsidian community plugin
- `PLUG-02`: User can open the main quiz experience from a ribbon icon

## Technical Constraints

- Use standard Obsidian community plugin structure
- Keep startup work lightweight
- Avoid desktop-only assumptions unless they become necessary
- Keep `main.ts` small enough that later phases can split modules cleanly

## Official Guidance Anchors

- [Build a plugin](https://docs.obsidian.md/Plugins/Getting%20started/Build%20a%20plugin)
- [Manifest](https://docs.obsidian.md/Reference/Manifest)
- [Optimize plugin load time](https://docs.obsidian.md/Plugins/Guides/Optimizing%20plugin%20load%20time)
- [Obsidian October plugin self-critique checklist](https://docs.obsidian.md/oo/plugin)

## Planned Outputs

- `manifest.json`
- `package.json`
- `tsconfig.json`
- `esbuild`-based or equivalent plugin build setup
- `main.ts`
- `styles.css`
- minimal localization-ready string structure placeholder
- development README notes for loading in an Obsidian vault

## Phase Boundary

This phase does not include:

- settings tab implementation
- source binding UI
- secret storage wiring
- LLM calls
- question generation
- review scheduling
- final quiz UI
