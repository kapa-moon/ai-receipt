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
- Subscription quota history: separate short/weekly provider-reported percentages, remaining capacity, reset times, and 5-hour/24-hour/7-day chart views. Open **quota.html** for the synthetic demo.

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

## Subscription quota observations

Quota is a separate account-level measure; token prices cannot reconstruct it. The quota view shows sparse observations with gaps and reset boundaries, rather than suggesting continuous measurement. It never treats missing windows as zero and never auto-resets a stored balance after a reported reset time passes.

Import local rollout JSONL into **quota.html**, or record percentages/reset times manually from the provider's usage dashboard. Snapshot JSON is also accepted in the shape `{ "capturedAt": "ISO timestamp", "raw": { "rateLimits": ... } }`. Export history to retain it outside browser storage.

The optional read-only collector scans local rollout files from the past seven days:

```sh
npm run quota
# Optional: keep collecting newly recorded local observations every 60 seconds
node collect-quota.js /path/to/.codex/sessions --watch
```

It writes ignored personal files: `quota-history.json`, `quota-real.js`, and the standalone **subscription-capacity.html**. It does not call a provider API or authenticate. If `quota-current.private.json` contains a timestamped provider snapshot, its account ID is used to separate matching records from records whose account identity is unverified. The account ID stays local and is omitted from exported history. Without this snapshot, collected records are labeled account-unverified.

Monitoring applies to the reported limit bucket, not all ordinary ChatGPT conversations. Plans and window availability can change. Check [official OpenAI pricing/usage guidance](https://learn.chatgpt.com/docs/pricing); public API dollars and subscription allowances are different measures.

## Verification

Arithmetic and UI logic tests cover deduplication, cache pricing, accounting conservation, source selection, category edits and reflection persistence. Automated visual browser verification has not been completed.
