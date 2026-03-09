#!/usr/bin/env bash
# Claude Code statusline — mirrors Starship default prompt style
# Receives JSON on stdin with session context

input=$(cat)

cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // empty')
[ -z "$cwd" ] && cwd=$(pwd)
# Abbreviate home directory as ~
cwd_display="${cwd/#$HOME/~}"

model=$(echo "$input" | jq -r '.model.display_name // empty')
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

# Git branch (skip optional lock to avoid contention)
git_branch=""
if git -C "$cwd" --no-optional-locks rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  git_branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null \
    || git -C "$cwd" --no-optional-locks rev-parse --short HEAD 2>/dev/null)
fi

# Build the line using printf for ANSI colors
# user@host in directory [on branch] | model ctx%
parts=""

# directory
parts+=$(printf '\033[36m%s\033[0m' "$cwd_display")

# on branch
if [ -n "$git_branch" ]; then
  parts+=$(printf ' \033[33mon\033[0m \033[35m%s\033[0m' "$git_branch")

  # PR number as clickable link (cached for 60s per branch)
  cache_key=$(echo "$cwd:$git_branch" | tr '/' '_')
  cache_file="/tmp/claude-statusline-pr-${cache_key}"
  cache_ttl=60
  now=$(date +%s)
  if [ -f "$cache_file" ] && [ "$(( now - $(stat -f %m "$cache_file") ))" -lt "$cache_ttl" ]; then
    pr_info=$(cat "$cache_file")
  else
    pr_info=$(gh pr view --json number,url --jq '"\(.number) \(.url)"' 2>/dev/null -R "$(git -C "$cwd" --no-optional-locks remote get-url origin 2>/dev/null)" || echo "")
    echo "$pr_info" > "$cache_file"
  fi
  if [ -n "$pr_info" ]; then
    pr_number=$(echo "$pr_info" | awk '{print $1}')
    pr_url=$(echo "$pr_info" | awk '{print $2}')
    # OSC 8 clickable hyperlink
    parts+=$(printf ' \033]8;;%s\033\\\033[90m#%s\033[0m\033]8;;\033\\' "$pr_url" "$pr_number")
  fi
fi

# separator
parts+=$(printf ' \033[90m|\033[0m')

# model
if [ -n "$model" ]; then
  parts+=$(printf ' \033[90m%s\033[0m' "$model")
fi

# context usage with color coding
if [ -n "$used_pct" ]; then
  used_int=${used_pct%%.*}
  if [ "${used_int:-0}" -ge 80 ]; then
    ctx_color='\033[31m'   # red
  elif [ "${used_int:-0}" -ge 50 ]; then
    ctx_color='\033[33m'   # yellow
  else
    ctx_color='\033[90m'   # dim
  fi
  parts+=$(printf " ${ctx_color}ctx %.0f%%\033[0m" "$used_pct")
fi

printf '%b\n' "$parts"
