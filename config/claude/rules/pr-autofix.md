# Pull Request Auto-fix

After opening a pull request in the Claude desktop app, turn on Auto-fix for it without asking:

1. Call `mcp__ccd_pr__get_status`. If it doesn't report the PR, bind it with `mcp__ccd_pr__bind_pr`.
2. Call `mcp__ccd_pr__set_monitor` with `auto_fix: true`, `address_comments: true`, and the PR's URL.
3. Report the PR URL. Don't poll CI, schedule checks, or start a `ci-watch` watcher: Auto-fix wakes the session on CI failures, merge conflicts, and review comments.

This covers PRs I ask for and PRs opened at the end of a task. Don't offer Auto-fix in the wrap-up box, since it's already on. Skip this rule when the `ccd_pr` tools aren't available (the terminal CLI).

**Why:** on 15 Oct 2026 I asked for Auto-fix on every PR after turning it on by hand for gadget-inc/gadget#20958.
