# Pull Request Descriptions

## Writing

Write every PR title and description in the `explain` voice. This covers PRs I ask for and PRs you open on your own at the end of a task. Before `gh pr create` or `gh pr edit --body-file`, load the `pr-overview` skill. It loads `explain` for the voice and adds the PR shape and length budget.

If the skills can't be loaded, apply the core moves:

- The first paragraph has no header. It says what merging does, with a number and the strongest evidence that it is safe (test result, plan output, measurement).
- Show the problem with real values: one table or one short trace, one scenario reused throughout. Define each unfamiliar term in one clause the first time it appears.
- Give one section to each choice in the diff a reviewer would question, named for the thing ("Why `ignore_changes`").
- Say plainly what the PR doesn't fix and what wasn't verified. End with "Next: ...".
- Keep it short: a few sentences for a trivial change and 100 to 350 words for almost everything else. Go up to about 500 only with a one-sentence reason about risk (a live system the merge or deploy can break), and say the reason. The budget is a ceiling, not a target.
- If the repo's PR template requires a checklist, keep it verbatim as the last section, outside the word count.
- Leave out the "Summary" header, the architecture diagram, the list of changed files, checklists, "Key insight" callouts, and the investigation timeline.
- The title says what the change does, not what I hope it achieves.
- No em dashes or filler words (robust, seamless, powerful, leverage).

**Why:** the first description on gadget-inc/global-infrastructure#1929 (Oct 2026) followed the architecture-first structure and came to 1,779 words. The explain-style rewrite was 528 words and much easier to read.

## Updating an existing description

When updating an existing PR description, always read the current body first with `gh api repos/OWNER/REPO/pulls/N --jq '.body'` before making any changes. Never blindly overwrite.

Preferred approaches, in order:

1. **Append via comment** — for additive info (perf findings, test results, follow-up notes), use `gh pr comment` instead of editing the description. Keeps the original pristine.

2. **Read-modify-write** — if the description itself needs updating, fetch the current body, modify it, and write back:
   ```bash
   gh api repos/o/r/pulls/N --jq '.body' > /tmp/pr-body.md
   # edit /tmp/pr-body.md
   gh pr edit N --body-file /tmp/pr-body.md
   ```

3. **Never replace wholesale** — do not pass a brand new `--body` that drops existing content. GitHub has no version history for PR descriptions. The exception is when I ask for a rewrite or a shorter version: save the old body to a file first, replace it, and tell me where the old one is.
