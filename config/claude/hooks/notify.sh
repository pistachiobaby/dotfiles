#!/bin/bash
# Send a macOS notification that, when clicked, activates Ghostty and focuses the correct zellij tab
# Usage: notify.sh <message> [title]

MESSAGE="$1"
TITLE="${2:-Claude Code}"

# Dynamically discover our tab name and index using a marker trick:
# 1. Temporarily rename our tab to a unique marker
# 2. Find the marker in query-tab-names to get our tab index
# 3. Undo the rename to restore the original name
# 4. Read the restored name at our index
TAB_NAME=""
TAB_INDEX=""
if [ -n "$ZELLIJ_SESSION_NAME" ]; then
  MARKER="__claude_notify_$$__"
  zellij action rename-tab "$MARKER" 2>/dev/null
  TAB_INDEX=$(zellij action query-tab-names 2>/dev/null | grep -n "$MARKER" | cut -d: -f1)
  zellij action undo-rename-tab 2>/dev/null
  if [ -n "$TAB_INDEX" ]; then
    TAB_NAME=$(zellij action query-tab-names 2>/dev/null | sed -n "${TAB_INDEX}p")
  fi
fi

if command -v terminal-notifier &> /dev/null; then
  ARGS=(-title "$TITLE" -message "$MESSAGE" -sound default -activate com.mitchellh.ghostty)

  if [ -n "$TAB_NAME" ]; then
    ARGS+=(-subtitle "$TAB_NAME")
  fi

  if [ -n "$TAB_INDEX" ] && [ -n "$ZELLIJ_SESSION_NAME" ]; then
    ARGS+=(-execute "/bin/bash -c 'ZELLIJ_SESSION_NAME=$ZELLIJ_SESSION_NAME /opt/homebrew/bin/zellij action go-to-tab $TAB_INDEX'")
  fi

  if [ -n "$ZELLIJ_SESSION_NAME" ]; then
    ARGS+=(-group "$ZELLIJ_SESSION_NAME-$ZELLIJ_PANE_ID")
  fi

  terminal-notifier "${ARGS[@]}"
else
  osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\""
fi
