#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="$DOTFILES_DIR/config"

# Source nix if available (needed on Coder workspaces where nix isn't in PATH yet)
if [ -f /etc/profile.d/nix.sh ]; then
  source /etc/profile.d/nix.sh
fi

log()  { printf '  \033[1;32m%s\033[0m  %s\n' "$1" "$2"; }
warn() { printf '  \033[1;33m%s\033[0m  %s\n' "$1" "$2"; }
err()  { printf '  \033[1;31m%s\033[0m  %s\n' "$1" "$2"; }

header() {
  echo ""
  printf '\033[1;34m==> %s\033[0m\n' "$1"
}

# --- Require a package manager ---
if ! command -v brew >/dev/null 2>&1 && ! command -v nix >/dev/null 2>&1; then
  err "ERROR" "No package manager found (install Homebrew or Nix)"
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

header "Linking config files"

errors=0
linked=0
skipped=0
backed_up=0

while IFS= read -r src; do
  rel="${src#$CONFIG_DIR/}"

  target="$(resolve_target "$rel")" || { warn "SKIP" "$rel (not supported on this platform)"; continue; }

  # Create parent directory if needed
  mkdir -p "$(dirname "$target")"

  # Already linked correctly — skip
  if [ -L "$target" ] && [ "$(readlink "$target")" = "$src" ]; then
    ((skipped++)) || true
    continue
  fi

  # Regular file exists — back it up (don't clobber existing backups)
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    backup="$target.backup"
    if [ -e "$backup" ]; then
      backup="$target.backup.$(date +%s)"
    fi
    mv "$target" "$backup"
    warn "BACKUP" "$target → $backup"
    ((backed_up++)) || true
  fi

  # Stale symlink — remove it
  if [ -L "$target" ]; then
    rm "$target"
  fi

  ln -s "$src" "$target"
  log "LINK" "$target → $rel"
  ((linked++)) || true
done < <(find "$CONFIG_DIR" -type f | sort)

log "DONE" "$linked linked, $skipped unchanged, $backed_up backed up"

if [ "$errors" -gt 0 ]; then
  err "FAIL" "$errors error(s) — check output above"
  exit 1
fi

# --- Install packages (Homebrew preferred, Nix fallback) ---

header "Installing packages"

if command -v brew >/dev/null 2>&1 && [ -f "$DOTFILES_DIR/Brewfile" ]; then
  log "BREW" "Installing from Brewfile..."
  brew bundle --file="$DOTFILES_DIR/Brewfile"
  log "DONE" "Homebrew packages installed"
elif command -v nix >/dev/null 2>&1 && [ -f "$DOTFILES_DIR/flake.nix" ]; then
  log "NIX" "Installing from flake.nix..."
  if nix profile list 2>/dev/null | grep -q "dotfiles-tools"; then
    nix profile upgrade dotfiles-tools
    log "DONE" "Nix packages upgraded"
  else
    nix profile install "$DOTFILES_DIR"
    log "DONE" "Nix packages installed"
  fi
fi

# --- Set default shell to zsh ---

header "Shell"

zsh_path="$(command -v zsh 2>/dev/null || true)"
if [ -z "$zsh_path" ]; then
  warn "SKIP" "zsh not found"
elif [ "$SHELL" = "$zsh_path" ]; then
  log "OK" "Already using $zsh_path"
else
  if ! grep -qx "$zsh_path" /etc/shells 2>/dev/null; then
    echo "$zsh_path" | sudo tee -a /etc/shells >/dev/null
  fi
  if sudo chsh -s "$zsh_path" "$(whoami)" 2>/dev/null \
    || chsh -s "$zsh_path" 2>/dev/null; then
    log "SHELL" "Default shell set to $zsh_path"
  else
    warn "SKIP" "Could not change default shell to zsh"
  fi
fi

echo ""
log "✓" "All done"
