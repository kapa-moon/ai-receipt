#!/usr/bin/env bash
# Run yourself in a terminal. Hidden input keeps the key out of command history.
set -euo pipefail
receipt_key_file="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/.env.local"
IFS= read -r -s -p 'Paste your replacement OpenAI API key (hidden): ' receipt_api_key
printf '\n'
if [[ ! "$receipt_api_key" =~ ^sk-[A-Za-z0-9_-]{24,}$ ]]; then
  printf 'That does not look like an OpenAI API key. Nothing was saved.\n' >&2
  exit 1
fi
umask 077
printf 'OPENAI_API_KEY=%s\n' "$receipt_api_key" > "$receipt_key_file"
chmod 600 "$receipt_key_file"
unset receipt_api_key
printf 'Saved locally in ignored .env.local. The key is not included in Git or the web build.\n'
printf 'Run: node enrich-receipt.js lite-code.receipt.json\n'
