# Phase 1 Research: Plugin Foundation

## Summary

Phase 1 should stay very close to standard Obsidian community plugin conventions. The fastest path is a minimal TypeScript plugin scaffold with predictable top-level files and a light bootstrap that only registers visible entry points during startup.

## Source Notes

### Official Obsidian docs

- [Build a plugin](https://docs.obsidian.md/Plugins/Getting%20started/Build%20a%20plugin)
  - Use the standard plugin development flow and plugin folder structure.
- [Manifest](https://docs.obsidian.md/Reference/Manifest)
  - `manifest.json` must include correct metadata and consistent plugin id/version details.
- [Optimize plugin load time](https://docs.obsidian.md/Plugins/Guides/Optimizing%20plugin%20load%20time)
  - Startup should avoid expensive work in `onload()`, and UI setup can wait until layout readiness when needed.
- [Obsidian October plugin self-critique checklist](https://docs.obsidian.md/oo/plugin)
  - Prefer `requestUrl` over raw `fetch` later, keep styles plugin-scoped, avoid hardcoded `.obsidian` assumptions, and keep `main.ts` from growing into a dumping ground.

## Engineering Interpretation

- Choose a plain scaffold over a custom architecture-heavy bootstrap.
- Keep Phase 1 focused on correctness and extension points, not final UI quality.
- Treat localization, settings, question bank, and scheduling as later modules, not responsibilities of the initial plugin class.
- Start with plugin-scoped CSS conventions early so later UI work does not spill into global Obsidian styles.

## Recommendations

- Use `TypeScript + esbuild` or the closest standard Obsidian template structure.
- Keep the first ribbon action intentionally simple, such as a placeholder modal.
- Add README instructions immediately, because plugin development requires a vault-side manual loop.
