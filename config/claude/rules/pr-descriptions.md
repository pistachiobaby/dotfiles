# Pull Request Descriptions

When updating an existing PR description, always read the current body first with `gh api repos/OWNER/REPO/pulls/N --jq '.body'` before making any changes. Never blindly overwrite.

## Preferred approaches (in order)

1. **Append via comment** — for additive info (perf findings, test results, follow-up notes), use `gh pr comment` instead of editing the description. Keeps the original pristine.

2. **Read-modify-write** — if the description itself needs updating, fetch the current body, modify it, and write back:
   ```bash
   gh api repos/o/r/pulls/N --jq '.body' > /tmp/pr-body.md
   # edit /tmp/pr-body.md
   gh pr edit N --body-file /tmp/pr-body.md
   ```

3. **Never replace wholesale** — do not pass a brand new `--body` that drops existing content. GitHub has no version history for PR descriptions.
