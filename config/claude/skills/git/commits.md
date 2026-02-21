# Commit Discipline

## Atomic Commits

Each commit should represent a single logical change. Group related modifications together — if a refactor touches three files to rename a function, that's one commit, not three. If a feature requires a migration and a code change, those go together if one is meaningless without the other.

The test: could this commit be reverted cleanly without leaving the codebase in a broken state? If reverting a commit would require also reverting another commit to keep things working, they should have been one commit.

## Commit Messages

Keep messages concise but specific. The subject line should tell someone *what changed and why* without opening the diff.

**Good**: `Fix race condition in webhook retry by deduplicating on event ID`
**Bad**: `Fix bug` / `Update files` / `Changes to webhook handling and retry logic and also some cleanup`

Avoid stuffing paragraphs into commit messages. If the diff needs extended explanation, that belongs in a PR description, not the commit message. A second line of context is fine when needed — a wall of text is not.
