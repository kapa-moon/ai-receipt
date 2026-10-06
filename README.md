# ai-receipt

A local-first prototype for understanding AI consumption and reflecting on task value. It imports observed Codex / local ChatGPT Work rollout JSONL and Claude Code / local Cowork transcript or audit JSONL.

## Try it

Open **trace-receipts.html** in a browser. It includes synthetic examples for both providers and Work/Code sources. Use **Import traces** to load your own JSONL files; processing stays in your browser.

The original simpler receipt prototype is available in **index.html**.

## Features

- Provider-specific input, cached input, cache-write and output token accounting.
- Public API-equivalent cost scenarios, with actual payments entered separately.
- Tool activity and associated response usage, labeled when attribution overlaps.
- Editable intent categories including correction, clarification and continuation.
- Per-request reflections on usefulness, progress, evidence and next steps.
- Local JSONL import, JSON receipt export and print support.

This is an analysis prototype, not an invoice reconciler. Internal trace formats may change. Model estimates do not reproduce subscription charges. See [accounting rationale and official documentation](TRACE-RECEIPTS.md).

## Build and test

Node.js is needed only for the build scripts and tests; the dashboard has no runtime dependencies.

```sh
npm test
npm run build
```

The build creates `demo-receipts.html`, a portable standalone demo.

## Build private receipts

Create a **private-sources.json** manifest, which is ignored by Git:

```json
[
  {
    "id": "my-project",
    "title": "My project",
    "subtitle": "Local trace snapshot",
    "files": ["/absolute/path/to/session.jsonl"]
  }
]
```

Then run:

```sh
node build-traces.js private-sources.json
```

This creates `AI-receipts.html`, `real-data.js` and normalized `*.receipt.json` files. These files contain private trace material and are ignored by Git. The original logs are never modified.

The browser dashboard persists reflections in local storage; exported receipts include them. Imports are not uploaded to a server.

## Verification

Arithmetic and UI logic tests cover deduplication, cache pricing, accounting conservation, source selection, category edits and reflection persistence. Automated visual browser verification has not been completed.
