#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="$DOTFILES_DIR/config"

# Each line: <source relative to config/> <symlink target>
MAPPINGS=(
  # vim
  "vim/vimrc:$HOME/.vimrc"
  # zsh
  "zsh/zshrc:$HOME/.zshrc"
  # zellij
  "zellij/config.kdl:$HOME/.config/zellij/config.kdl"
  "zellij/layouts/gadget-dev.kdl:$HOME/.config/zellij/layouts/gadget-dev.kdl"
  "zellij/scripts/stop-all-panes.sh:$HOME/.config/zellij/scripts/stop-all-panes.sh"
  # atuin
  "atuin/config.toml:$HOME/.config/atuin/config.toml"
  # git
  "git/gitconfig:$HOME/.gitconfig"
  "git/ignore:$HOME/.config/git/ignore"
  # ssh
  "ssh/config:$HOME/.ssh/config"
  # karabiner
  "karabiner/karabiner.json:$HOME/.config/karabiner/karabiner.json"
  # github cli
  "gh/config.yml:$HOME/.config/gh/config.yml"
  # claude code
  "claude/settings.json:$HOME/.claude/settings.json"
  "claude/settings.local.json:$HOME/.claude/settings.local.json"
  "claude/keybindings.json:$HOME/.claude/keybindings.json"
  "claude/rules/clipboard.md:$HOME/.claude/rules/clipboard.md"
  "claude/rules/cost-optimization.md:$HOME/.claude/rules/cost-optimization.md"
  "claude/rules/email-tone.md:$HOME/.claude/rules/email-tone.md"
  "claude/rules/pr-descriptions.md:$HOME/.claude/rules/pr-descriptions.md"
  "claude/rules/technical-explanations.md:$HOME/.claude/rules/technical-explanations.md"
  "claude/hooks/notify.sh:$HOME/.claude/hooks/notify.sh"
  "claude/hooks/rename-tab.sh:$HOME/.claude/hooks/rename-tab.sh"
  "claude/skills/pr-overview/SKILL.md:$HOME/.claude/skills/pr-overview/SKILL.md"
  "claude/skills/slack-writeup/SKILL.md:$HOME/.claude/skills/slack-writeup/SKILL.md"
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
