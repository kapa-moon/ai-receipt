# Real-trace AI receipts

Open **trace-receipts.html** for the synthetic demo, or build **AI-receipts.html** from a private source manifest. It is a standalone file with its code and normalized trace data embedded. No server, API key, login, or enterprise access is needed. Everything runs locally; no telemetry or prompts are uploaded.

## Local private snapshot sources (excluded from Git)

- **Lite AI · Codex:** two main-thread rollout files, September 27 and September 30. This is the observed file coverage, not guaranteed lifetime project usage.
- **Lite AI · Work:** September 15 original and continuation files. Metadata identifies `codex_work_desktop`; this tests the Work-originated local format. It does not validate Work Cloud exports.
- **Small-biz-mock · Claude Code:** the local boba accounting session. The source was active during development, so this is a snapshot, not a live feed.
- **Claude · Cowork:** one local `audit.jsonl` for a knowledge-space task. This is a different project from small-biz-mock and is an adapter demonstration, not an equivalent-workload comparison.
- **Lite AI · automatic review overhead:** separately discovered guardian sessions scoped to the Lite AI directory. The runtime review model has no verified public price in the rate card. Its tokens are visible; its cost is unknown. These are excluded from the main Codex receipt.

Raw logs remain untouched. Bundled data includes user prompts, model usage, IDs, tool names and source paths; it omits raw tool arguments/results and reasoning text. Keep the HTML/JSON private if prompts are private.

## What the prototype does

1. Shows measured token categories and current public API-equivalent token costs.
2. Groups consumption by inferred user intent: build/create, research/explore, explain/learn, correction/refinement, back-and-forth/clarification, setup/connect, continue work, other. Classification uses local rules over the opening of the prompt, costs nothing, and is editable. This is a proposed taxonomy, not OpenAI's proprietary classifier.
3. Counts AI tool calls and associates model responses with actions. `exec` wrapper source identifies nested invocation expressions. It does not prove each expression ran or succeeded. Browser `js` is counted at the observed call level, not each browser click.
4. Gives every request a reflection form: usefulness, result status, progress and evidence/next step. This is self-report; it does not claim profit, time saved or causal value.
5. Allows actual additional payment and monthly subscription to be entered separately. Unknown is the default; zero is not assumed.
6. Imports raw JSONL locally, exports normalized receipts with category edits/reflections/rates, and prints via the browser. Multiple raw files in one import should be from one provider and one intended scope.

## Accounting

**OpenAI:** use `token_usage_record.payload.usage`, once per `response_id`. Never add `turn_token_usage`, `thread_token_usage`, `token_count` or reasoning subsets to response totals. Cached input is included in input; normalize fresh input as input minus cache reads and writes. Cache writes in the supplied traces are zero. The nonzero cache-write interpretation would need schema verification before use against a different runtime.

**Claude:** `input_tokens` excludes cache-read and cache-creation tokens. Input consumed = fresh + cache read + cache creation. Cache creation is partitioned by 5-minute/1-hour fields; missing duration creates a price range. Multiple streamed blocks share the same request/message ID: retain the final/largest output count, merge unique tool-use IDs, do not sum every streamed row. Top-level usage is authoritative; do not add `iterations` usage again. Thinking/reasoning is already in output.

**Model costs:** each token category × its rate / 1,000,000. Pricing checked October 6, 2026. The OpenAI estimate uses standard-speed short and long context as two scenarios; the importer does not resolve context tier, service tier or regional routing. The displayed range is not a guaranteed minimum/maximum bill. Rate edits let you test scenarios. Historical request pricing may differ from current pricing.

**Tool costs:** client-side commands, file writes and browser actions do not receive invented flat fees. Claude explicitly recorded server web-search counts add $0.01 per search. OpenAI `web__run` is a product wrapper, not a reliable API billing count: its fees, compute/container charges and other separate charges are excluded. Totals are labeled API-equivalent estimates with potential unrecorded tool fees. They are not provider infrastructure costs or invoices.

**Action costs:** a single response can involve several tools. Each action row shows tokens/cost from associated responses, deduplicated within that row. Rows overlap, so they are not summable. Tokens for reading a tool result normally occur on later responses; this prototype does not claim causal per-tool attribution or allocate shared tokens equally. Task totals are mutually exclusive and conserve the measured total.

**Missing usage:** invalid/incomplete usage records are skipped and counted in the source notes. Unknown model prices are shown as unknown, never silently zero. A prompt with no metered response is not evidence of free work.

## Rationale and official sources

- [OpenAI Usage Insights](https://learn.chatgpt.com/docs/enterprise/usage-insights): separate token, message and credit measures; organize use cases/tasks; inspect model/settings and available skill/plugin activity; assess value using workflow evidence. The prototype adapts these principles for one person's local work, rather than copying enterprise metrics or claiming the same coverage.
- [OpenAI API pricing](https://developers.openai.com/api/docs/pricing): per-model token rates and separate tool charges.
- [ChatGPT Work usage and cost](https://learn.chatgpt.com/docs/enterprise/chatgpt-work-usage-and-cost): consumption, committed credits, subscription fees and new invoiced charges are different measures.
- [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing): cache durations, model rates, fast-mode and inference-geography modifiers, client/server tool billing.
- [Claude prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#tracking-cache-performance): the three disjoint input categories and cache duration fields.
- [Claude monitoring](https://code.claude.com/docs/en/monitoring-usage): API-request model/token/estimated-cost events and tool monitoring.
- [Claude sessions](https://code.claude.com/docs/en/sessions#where-transcripts-are-stored): local JSONL files and the internal-format limitation.
- [Cowork monitoring](https://support.claude.com/en/articles/14477985-monitor-claude-cowork-activity-with-opentelemetry): the supported organizational OTel route for future collection; the sample here comes from observed local files.
- [Work local security](https://learn.chatgpt.com/docs/enterprise/chatgpt-work-local-security): distinguish local records/telemetry from cloud compliance records.

## Development and checks

`node build-traces.js private-sources.json` rebuilds normalized snapshots and the portable HTML from local source files listed in an ignored manifest. Without a manifest, the command builds a synthetic demo. It reads source traces only and writes artifacts in this directory.

`node test-traces.js` checks provider normalization, duplicate-stream handling, Claude cache-duration pricing, reasoning subsets, unknown rates, and conservation across all five synthetic demo datasets. `node test-ui.js` checks rendering, source switching, edits and reflection persistence with a lightweight DOM harness. This is not visual browser testing.

The browser preview rejected local `file:` URLs; the headless test environment had no installed browser. Visual QA and a real browser import/export round trip remain unverified. Open the standalone file yourself to inspect the desktop/mobile layout.

## Next improvements

- More reliable intent annotation (manual first; optional classifier later), possibly multiple tags with one primary category for totals.
- Versioned adapters and stronger correlation for concurrent/subagent traces.
- Read-only live file watch, billing reconciliation, verified context/speed rates and tool-fee records.
- A study of what users actually infer and decide from a receipt; reflection answers are not yet a validated value measure.
