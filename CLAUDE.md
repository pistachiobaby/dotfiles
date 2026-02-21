# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Personal dotfiles for macOS. Configs are stored in `config/` and symlinked to their home directory locations by `install.sh`.

## Installation

```bash
./install.sh
```

This creates symlinks from `config/` to `~/.config/`, `~/.claude/`, `~/.vimrc`, `~/.zshrc`, etc. Existing files are backed up to `*.backup`. The script also builds the Zellij pane-groups plugin if `cargo` is available.

To add a new config: add the source file under `config/`, then add a `source:target` entry to the `links` array in `install.sh`.

## Building the Zellij Pane-Groups Plugin

```bash
cd config/zellij/plugins/pane-groups && ./build.sh
```

Requires Rust with the `wasm32-wasip1` target. Builds a WASM plugin loaded by Zellij at `~/.config/zellij/plugins/pane-groups.wasm`.

## Architecture

### Symlink Mapping

`install.sh` defines ~44 symlink mappings. Each entry maps a repo path to a home directory path. The script handles conflict detection, backup, stale symlink replacement, and parent directory creation.

### Shell Environment (zsh)

`config/zsh/zshrc` sets up Oh My Zsh, Atuin (shell history sync), and auto-starts Zellij. It wraps `brew` to auto-update `Brewfile` on install/uninstall/tap changes. Key aliases: `p=pnpm`, `zdev` for Gadget dev layout, `claude` runs with `--dangerously-skip-permissions`.

### Zellij Integration

The terminal multiplexer setup has three layers:
- **config.kdl**: Keybindings (vim-style, cleared defaults), plugin aliases, general settings
- **layouts/**: Predefined pane arrangements (`default.kdl` for stacked, `gadget-dev.kdl` for work)
- **plugins/pane-groups/**: Custom Rust/WASM plugin for grouping and cycling panes (Alt+g to open, Alt+,/. to cycle)

### Claude Code Hooks

Two hooks in `config/claude/hooks/` integrate Claude sessions with the terminal:
- **notify.sh**: Sends macOS notifications on permission/idle prompts, includes Zellij tab name and session info, clicking focuses the correct tab in Ghostty
- **rename-tab.sh**: On session stop, feeds the transcript to Claude (Haiku) to generate a 2-4 word tab title for the Zellij pane

### Keyboard Remapping

Karabiner maps Caps Lock to Ctrl and Right Cmd+hjkl to arrow keys. Vim config maps `fd` to Escape and uses Space as leader.

### Package Management

`Brewfile` is the source of truth for installed packages. The shell `brew` wrapper automatically keeps it in sync — any `brew install`, `brew uninstall`, or `brew tap` regenerates the Brewfile.
