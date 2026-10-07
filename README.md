# ai-receipt

A local-first prototype for understanding AI consumption and reflecting on task value. It imports observed Codex / local ChatGPT Work rollout JSONL and Claude Code / local Cowork transcript or audit JSONL.

## Try it

Open **index.html** or **trace-receipts.html** in a browser. The landing page includes the authorized real examples for both providers and Work/Code sources. `index.html`, `trace-receipts.html` and the Vercel deployment all load the full shared real data. Use `npm run build:demo` for an explicitly synthetic demo. Choose a model vendor, then use **Upload trace files** to load your own JSONL files; processing stays in your browser.

The private standalone build is **AI-receipts.html**. The public landing page now loads shared real examples. Original shared traces are in `data/traces/`, with coverage and SHA-256 hashes in `data/trace-manifest.json`.

## Features

- Provider-specific input, cached input, cache-write and output token accounting.
- Public API-equivalent cost scenarios, displayed to two decimal places.
- Tool activity and associated response usage, labeled when attribution overlaps.
- Read-only intent categories including correction, clarification and continuation; optional mini-model enrichment.
- Per-message five-star usefulness ratings, progress/result menus and optional subjective dollar-value scenarios.
- Local JSONL import, JSON receipt export and print support.
- Subscription quota history: separate short/weekly provider-reported percentages, remaining capacity, reset times, and 5-hour/24-hour/7-day chart views. Open **quota.html** for the synthetic demo.

This is an analysis prototype, not an invoice reconciler. Internal trace formats may change. Model estimates do not reproduce subscription charges. See [accounting rationale and official documentation](TRACE-RECEIPTS.md).

## Build and test

Node.js is needed only for the build scripts and tests; the dashboard has no runtime dependencies.

```sh
npm test
npm run build
```

The build creates `dist/`, the deployable static app with the shared data. `npm run build:demo` separately creates the portable synthetic demo.
