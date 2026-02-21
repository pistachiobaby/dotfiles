#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="$DOTFILES_DIR/config"

# --- Target resolution ---
# Most files: config/<app>/<path> → ~/.config/<app>/<path>
# Exceptions handled by case statements in resolve_target.

# Directories to skip (source code, built artifacts, etc.)
EXCLUDE_DIRS=("zellij/plugins")

resolve_target() {
  local rel="$1"
  local top_dir="${rel%%/*}"
  local rest="${rel#*/}"

  # File-level overrides (files that don't follow any directory convention)
  case "$rel" in
    vim/vimrc)     echo "$HOME/.vimrc" ;;
    zsh/zshrc)     echo "$HOME/.zshrc" ;;
    ssh/config)    echo "$HOME/.ssh/config" ;;
    git/gitconfig) echo "$HOME/.gitconfig" ;;
    *)
      # Directory-level overrides
      case "$top_dir" in
        claude)  echo "$HOME/.claude/$rest" ;;
        ghostty) echo "$HOME/Library/Application Support/com.mitchellh.ghostty/$rest" ;;
        *)       echo "$HOME/.config/$rel" ;;
      esac
      ;;
  esac
}

# --- Symlink all config files ---

errors=0

while IFS= read -r src; do
  rel="${src#$CONFIG_DIR/}"

  # Skip excluded directories
  skip=false
  for excl in "${EXCLUDE_DIRS[@]}"; do
    if [[ "$rel" == "$excl"/* ]]; then skip=true; break; fi
  done
  $skip && continue

  target="$(resolve_target "$rel")"

  # Create parent directory if needed
  mkdir -p "$(dirname "$target")"

  # Already linked correctly — skip
  if [ -L "$target" ] && [ "$(readlink "$target")" = "$src" ]; then
    echo "ok       $target"
    continue
  fi

  # Regular file exists — back it up (don't clobber existing backups)
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    backup="$target.backup"
    if [ -e "$backup" ]; then
      backup="$target.backup.$(date +%s)"
    fi
    mv "$target" "$backup"
    echo "backup   $target → $backup"
  fi

  # Stale symlink — remove it
  if [ -L "$target" ]; then
    rm "$target"
  fi

  ln -s "$src" "$target"
  echo "linked   $target → $src"
done < <(find "$CONFIG_DIR" -type f | sort)

if [ "$errors" -gt 0 ]; then
  echo ""
  echo "$errors error(s) — check output above"
  exit 1
fi

# --- Build zellij plugins (requires Rust + wasm32-wasip1 target) ---

PANE_GROUPS_DIR="$CONFIG_DIR/zellij/plugins/pane-groups"
if [ -f "$PANE_GROUPS_DIR/build.sh" ] && command -v cargo >/dev/null 2>&1; then
  echo ""
  echo "Building zellij pane-groups plugin..."
  "$PANE_GROUPS_DIR/build.sh"
elif [ -f "$PANE_GROUPS_DIR/build.sh" ]; then
  echo ""
  echo "SKIP     pane-groups plugin (cargo not found — install Rust to build)"
fi
