# Flash Quiz

Flash Quiz is an Obsidian plugin that turns vault notes into multiple-choice quizzes and schedules them for review with a built-in memory model.

## Current Scope

This repository is in active foundation work. The current implemented goal is to establish a clean Obsidian plugin scaffold with a ribbon entry point and room for later settings, question generation, and review modules.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Build once:

```bash
npm run build
```

3. Or run watch mode:

```bash
npm run dev
```

4. Copy or symlink these files into your test vault plugin directory:

- `manifest.json`
- `main.js`
- `styles.css`

Target path:

```text
<your-vault>/.obsidian/plugins/flash-quiz/
```

5. Open Obsidian, enable community plugins, and enable `Flash Quiz`.

## Planned User Experience

- Open quiz flow from a ribbon icon
- Configure LLM and source bindings in settings
- Generate a cached question bank from vault notes
- Review due questions before seeing new ones

## Notes

- `API key` storage will use Obsidian secret storage in a later phase.
- v1 supports only multiple-choice questions.
