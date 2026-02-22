# dotfiles

Personal dotfiles for macOS. One script sets up everything — symlinks configs, installs packages, and builds plugins.

## Setup

Requires [Homebrew](https://brew.sh) or [Nix](https://nixos.org/download/).

```bash
git clone https://github.com/pistachiobaby/dotfiles.git ~/dotfiles
cd ~/dotfiles && ./install.sh
```

`install.sh` does three things:

1. Symlinks everything in `config/` to the right place (`~/.config/`, `~/.zshrc`, etc.)
2. Installs packages via Homebrew (`Brewfile`) or Nix (`flake.nix`) as a fallback
3. Builds the Zellij pane-groups plugin if Rust is available

Existing files are backed up before being replaced. Running it again is safe — it skips links that are already correct.

## What's in here

```
config/
├── atuin/        Shell history sync
├── claude/       Claude Code hooks, rules, skills, keybindings
├── gh/           GitHub CLI
├── ghostty/      Terminal (Dracula+, BlexMono Nerd Font)
├── git/          User config, global gitignore
├── karabiner/    Caps Lock → Ctrl, Right Cmd+hjkl → arrows
├── ssh/          SSH client config
├── vim/          fd → Esc, Space leader, visual line movement
├── zellij/       Multiplexer config, layouts, custom WASM plugin
└── zsh/          Oh My Zsh, aliases, brew wrapper, Zellij auto-start
```

### Shell

Zsh with Oh My Zsh, Starship prompt, Atuin for history, and Zellij as the multiplexer. A `brew` wrapper auto-regenerates the `Brewfile` on any install/uninstall so it stays in sync without thinking about it.

Useful aliases: `p` (pnpm), `k` (kubectl), `zdev` (Gadget dev layout), `zstop` / `Ctrl+Q` (kill all panes), `dev-fucked` (nuke common dev ports).

### Zellij

Vim-style keybindings with cleared defaults. Includes a custom Rust/WASM plugin for pane groups — `Alt+g` to open, `Alt+,`/`Alt+.` to cycle between groups. Two layouts: a default stacked layout and `gadget-dev` for backend work.

### Claude Code

Two terminal hooks integrate Claude sessions with Zellij:
- **notify.sh** — macOS notifications on permission prompts and idle, clicking focuses the right Ghostty tab
- **rename-tab.sh** — auto-names Zellij tabs with a 2-4 word summary of the session

Plus custom skills (git workflow, PR overviews, Slack writeups) and global rules for commit style, email tone, and technical writing.

### Keyboard

Karabiner remaps Caps Lock to Ctrl and Right Cmd+hjkl to arrow keys. Vim maps `fd` to Escape.

## Adding a new config

Drop the file under `config/<app>/` and it gets symlinked automatically on the next `./install.sh` run. The default target is `~/.config/<app>/...` — see `resolve_target()` in `install.sh` for exceptions.
