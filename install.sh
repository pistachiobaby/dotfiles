#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="$DOTFILES_DIR/config"

# --- Require a package manager ---
if ! command -v brew >/dev/null 2>&1 && ! command -v nix >/dev/null 2>&1; then
  echo "ERROR    No package manager found (install Homebrew or Nix)"
  exit 1
fi

# --- Target resolution ---
# Most files: config/<app>/<path> → ~/.config/<app>/<path>
# Exceptions handled by case statements in resolve_target.

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
        ghostty)
          if [[ "$(uname)" == "Darwin" ]]; then
            echo "$HOME/Library/Application Support/com.mitchellh.ghostty/$rest"
          else
            return 1
          fi
          ;;
        *)       echo "$HOME/.config/$rel" ;;
      esac
      ;;
  esac
}

# --- Symlink all config files ---

errors=0

while IFS= read -r src; do
  rel="${src#$CONFIG_DIR/}"

  target="$(resolve_target "$rel")" || continue

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

# --- Install packages (Homebrew preferred, Nix fallback) ---

echo ""
if command -v brew >/dev/null 2>&1 && [ -f "$DOTFILES_DIR/Brewfile" ]; then
  echo "Installing packages via Homebrew..."
  brew bundle --file="$DOTFILES_DIR/Brewfile"
elif command -v nix >/dev/null 2>&1 && [ -f "$DOTFILES_DIR/flake.nix" ]; then
  echo "Installing packages via Nix..."
  if nix profile list 2>/dev/null | grep -q "dotfiles-tools"; then
    nix profile upgrade dotfiles-tools
  else
    nix profile install "$DOTFILES_DIR"
  fi
fi

# --- Set default shell to zsh ---

zsh_path="$(command -v zsh 2>/dev/null || true)"
if [ -n "$zsh_path" ] && [ "$SHELL" != "$zsh_path" ]; then
  if ! grep -qx "$zsh_path" /etc/shells 2>/dev/null; then
    echo "$zsh_path" | sudo tee -a /etc/shells >/dev/null
  fi
  sudo chsh -s "$zsh_path" "$(whoami)" 2>/dev/null \
    || chsh -s "$zsh_path" 2>/dev/null \
    || echo "SKIP     chsh (could not change default shell to zsh)"
  echo "shell    $zsh_path"
fi
