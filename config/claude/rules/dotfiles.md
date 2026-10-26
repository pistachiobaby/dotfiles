# Dotfiles

The user manages dotfiles in a `~/dotfiles/` repo so configs are version-controlled and portable across machines. Config files in `~/.config/` should be symlinked from `~/dotfiles/config/`, not created as regular files. When creating or modifying a config file:

1. Write the file to `~/dotfiles/config/<name>` (or the appropriate subdirectory)
2. Symlink it back to `~/.config/<name>`

If a config file already exists as a regular file in `~/.config/`, move it into `~/dotfiles/config/` and replace it with a symlink.

On Windows, only `config/claude/` is installed so far: `./install.sh` from Git Bash links it into `~/.claude/` and skips everything else. Make links there with `MSYS=winsymlinks:nativestrict ln -s`, because a plain `ln -s` in Git Bash copies the file instead of linking it.
