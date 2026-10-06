# ai-receipt

A local-first prototype for understanding AI consumption and reflecting on task value. It imports observed Codex / local ChatGPT Work rollout JSONL and Claude Code / local Cowork transcript or audit JSONL.

## Try it

Open **index.html** or **trace-receipts.html** in a browser. The landing page includes the authorized real examples for both providers and Work/Code sources. `trace-receipts.html` remains a synthetic source template; the Vercel build replaces its demo loader with the real shared data. Choose a model vendor, then use **Upload trace files** to load your own JSONL files; processing stays in your browser.

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

## Build private receipts

Create a **private-sources.json** manifest, which is ignored by Git:

```json
[
  {
    "id": "my-project",
    "title": "My project",
    "subtitle": "Full imported trace history",
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

Arithmetic and UI logic tests cover deduplication, cache pricing, accounting conservation, source selection, vendor/topic/date filtering, read-only categories, star persistence, value formulas and optional API enrichment. Automated visual browser verification has not been completed.

Receipt imports read every record in each supplied file, without a daily or weekly cutoff. Coverage dates and refresh time are shown separately. `index.html` and the Vercel deployment use shared real data; the private standalone build writes `AI-receipts.html`. Receipt date filters default to All dates and select whole message entries; quota time windows are a separate feature.

## Receipt layout and value

The receipt is centered across the entire desktop window at 55% of its width. A 20% sidebar holds navigation and references. Headers, summaries and totals stay fixed; message items scroll behind a visible black rectangular scrollbar. On narrow screens the layout adapts to preserve usable controls.

- Use-case bars represent **shares of all recorded tokens**, not percentages relative to the largest category. Cost shares use the lower API scenario. Cached tokens and different model rates make token share and cost share differ.
- **Usefulness index** = average provided star rating / 5 × 100. Unrated messages are excluded, with coverage shown. This is a subjective index, not a validated economic utility measure.
- **Gain scenario** = (sum of user-assigned dollar values − matching API estimate) / matching API estimate × 100. Only messages with an explicitly supplied value and known, positive model cost contribute. Ranges reflect price scenarios. Stars are never converted to money. This omits human time and other costs and is not measured profit or subscription ROI.

## Optional mini-model labels and summaries

Defaults use local prompt keyword rules and a short summary of observed tools plus a bounded assistant excerpt. They do not call an LLM. A server-side command can enrich a normalized receipt using [GPT-4o mini](https://developers.openai.com/api/docs/models/gpt-4o-mini) and [Responses Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses):

```sh
# Configure OPENAI_API_KEY in your shell first; never put it in browser code.
node enrich-receipt.js lite-code.receipt.json
node build-traces.js private-sources.json
```

The enrichment command explicitly sends bounded prompt/assistant excerpts and observed tool names to OpenAI. It uses `store: false`, records additional input/output usage separately, and writes an ignored `*.annotations.private.json`. The build picks up that file automatically; you can also upload it through the receipt UI after importing its corresponding receipt. No enrichment requests run on page load or upload. A paid API key is required; a ChatGPT subscription does not supply one. Live API enrichment has not been run in this environment. Its request/response path is tested with mocked responses.

The [OpenAI value-assessment guidance](https://learn.chatgpt.com/docs/enterprise/usage-insights#assessing-value) motivates reviewing workflow evidence with the people doing the work. The formulas above are explicit prototype choices, not OpenAI-provided ROI measures.

## Deploy on Vercel

1. Import `kapa-moon/ai-receipt` from GitHub into Vercel.
2. Use Framework Preset **Other**, repository root **./**, Build Command **npm run build**, Output Directory **dist**. `vercel.json` already specifies these build settings.
3. Deploy, then share the deployment URL with your professor.

**No environment variables or API key are needed for the deployed receipt app.** Visitors can select trace files with the upload button, read instructions with its adjacent `?`, filter messages, rate results and export their own receipts. The selected files are processed in the browser, with no upload endpoint. Imported data is temporary until exported; reflections persist in that browser's local storage.

The owner explicitly authorized publication of all 12 original source files and their normalized receipts. These files are accessible in the repository and in the deployed app. The source snapshots are byte-for-byte copies and include conversation/tool content and metadata, not just token totals. The publisher checks common credential patterns and aborts on matches; this is a heuristic check, not a guarantee. Private configuration, auth files and API keys are not deployment assets.

To refresh the intentionally shared examples locally, run `npm run publish:data`, inspect the Git diff, then commit and push the generated `data/`, `shared-data.js` and `shared-quota.js`. Deployment builds use committed shared data and never reach into your home directory. `npm run test:web` verifies original file hashes, complete normalization and the static asset allowlist.

### Optional API key setup for mini-model enrichment

An API key is needed only for `enrich-receipt.js`, not for importing traces or deploying this static app.

- Create a key in the [OpenAI API dashboard](https://platform.openai.com/api-keys) and configure API billing.
- Run `bash setup-api-key.sh` in your own terminal to enter the key with hidden input and save it to ignored `.env.local` (permissions 600). Alternatively, set `OPENAI_API_KEY` in your terminal environment. Then run `node enrich-receipt.js lite-code.receipt.json`.
- Upload the resulting annotations JSON into the matching receipt, or rebuild the private standalone receipt.
- Do not add the key to Git, the HTML, `shared-data.js`, or a browser form. Adding it to Vercel alone will not enable summaries: this static app has no API backend. Runtime summaries would require a server-side endpoint with usage controls.

The `?` popup documents Codex/local Work rollouts, Claude Code transcripts, the experimental Cowork audit location, unsupported chat exports and how to keep imports across reloads.
