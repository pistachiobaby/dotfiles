#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="$DOTFILES_DIR/config"

# Each line: <source relative to config/> <symlink target>
MAPPINGS=(
  "vim/vimrc:$HOME/.vimrc"
  "zsh/zshrc:$HOME/.zshrc"
  "zellij/config.kdl:$HOME/.config/zellij/config.kdl"
  "zellij/layouts/gadget-dev.kdl:$HOME/.config/zellij/layouts/gadget-dev.kdl"
  "zellij/scripts/stop-all-panes.sh:$HOME/.config/zellij/scripts/stop-all-panes.sh"
  "atuin/config.toml:$HOME/.config/atuin/config.toml"
)

for mapping in "${MAPPINGS[@]}"; do
  src="$CONFIG_DIR/${mapping%%:*}"
  target="${mapping#*:}"

  # Create parent directory if needed
  mkdir -p "$(dirname "$target")"

  # Already linked correctly — skip
  if [ -L "$target" ] && [ "$(readlink "$target")" = "$src" ]; then
    echo "ok       $target"
    continue
  fi

  # Regular file exists — back it up
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    mv "$target" "$target.backup"
    echo "backup   $target → $target.backup"
  fi

  # Stale symlink — remove it
  if [ -L "$target" ]; then
    rm "$target"
  fi

  ln -s "$src" "$target"
  echo "linked   $target → $src"
done
