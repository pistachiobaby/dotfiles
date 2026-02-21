#!/bin/bash
# Rename zellij tab using headless Claude to summarize the initial prompt
# Only runs once per zellij session+pane to avoid repeated Claude calls

if [ -z "$ZELLIJ" ]; then
  exit 0
fi

# Only rename once per session+pane
marker="/tmp/.zellij-tab-renamed-${ZELLIJ_SESSION_NAME}-${ZELLIJ_PANE_ID}"
if [ -f "$marker" ]; then
  exit 0
fi
touch "$marker"

# Try to get content from transcript
CONTENT=""
if [ -f "$CLAUDE_SESSION_TRANSCRIPT_PATH" ]; then
  CONTENT=$(head -c 2000 "$CLAUDE_SESSION_TRANSCRIPT_PATH")
fi

if [ -n "$CONTENT" ]; then
  TITLE=$(printf 'Generate a concise 2-4 word tab title for a coding session based on this conversation. Output ONLY the title — no quotes, no punctuation, no explanation:\n\n%s' "$CONTENT" | claude -p --model haiku 2>/dev/null | head -1 | sed 's/^["'"'"']*//;s/["'"'"']*$//' | cut -c1-40)
else
  TITLE=$(basename "$PWD")
fi

if [ -n "$TITLE" ]; then
  # Delay to avoid Claude Code's terminal title escape sequences overriding our rename
  (sleep 1 && zellij action rename-tab "$TITLE") &
fi
