---
name: pr-overview
description: |
  Write or rewrite a pull request title and description in the explain (malisper.me) voice. The result is short: it opens with what merging does and the evidence that it is safe, shows the problem with real numbers, explains each choice in the diff a reviewer would question, and says plainly what it doesn't fix and what wasn't verified.

  Use this skill every time a PR is opened or its description is written, updated, shortened, or improved. That includes the PR you open with `gh pr create` at the end of a task when nobody asked for a description by name.

  Triggers: "open a PR", "create a PR", "write a PR description", "PR overview", "describe this PR", "generate PR body", "write up this PR", "summarize for PR", "shrink the PR description", "rewrite the PR description"
argument-hint: "[optional PR number to update]"
---

# PR descriptions

A PR description is a short piece of explain-style prose for one reader: a teammate who has the diff open, about five minutes, and no history with this subsystem.

**Load the `explain` skill for the voice**: toy-sized real examples, a number on every claim, terms defined in one clause, plain sentences, the cut list. This skill sets the shape and the length. Where the two disagree, this skill wins for PRs:

- No tl;dr line. The opening paragraph is the tl;dr.
- No recap paragraph. The `Next:` line closes the description.
- Headers are the ones given below, not plain nouns.
- A table appears only when it carries the problem. A before/after can be one sentence.
- The check list at the end of this file replaces explain's §9.

The diff already says what changed. The description answers the four questions the diff can't:

1. What happens when this merges?
2. What was wrong, in real values?
3. Which choice in the diff would I question, and why was it made?
4. What is still broken or unproven?

## Gather first

1. **The diff and commits.** On the branch: `git diff origin/main...HEAD` and `git log --format="%h %s%n%n%b" origin/main..HEAD`. Given a PR number: `gh pr diff N` and `gh pr view N --json title,body,commits`.
2. **The surrounding code.** Read enough around each real change to know what calls it and what it calls.
3. **The evidence.** The actual test output, plan output, benchmark, or log line that shows the change works. Copy the numbers down. When rewriting an existing description, its numbers are your evidence; re-run only what looks wrong.
4. **The gaps.** What was not run, could not be checked, or was inferred from reading source.

Never invent a number. If the shape asks for one you can't source, leave it out.

## The shape

1. **Opening paragraph, no header.** What merging does, with a number, and the strongest evidence that it is safe. Prefer evidence from the real system ("the plan is `no changes`", "a read-only run over all 54 groups wrote nothing") over a test count, and a test count over nothing.
   - If part of the change is already live, say so here.
   - If merging does nothing by itself because a deploy, flag, or migration is a separate step, say that here too.
   - If you don't know what merging triggers, that goes here and in "Not verified".
2. **`## The problem`.** The failure, shown with real values: one table or one short trace. Define each unfamiliar term in one clause the first time it appears. One scenario (one build, one request, one row) carries the story through every section; other evidence can appear once. End the section with what the change does about it, in a sentence or two, including the guard rail a reviewer will look for ("an instance with a VM is never touched").
3. **`## Why <the thing>`.** One section for each choice in the diff a reviewer would question, named for the thing itself: "Why `ignore_changes`", "Why wait 2 minutes". Usually that is one section and never more than three. If there are more candidates, keep the ones that could hurt most if wrong and leave the rest to code comments. Show what the obvious version would have done, with its number when you have one.
4. **`## What this doesn't fix`.** Only when there is something. Show the remaining failure the way you showed the problem. Link the follow-up PR or issue if one exists.
5. **`## After merging`.** Only when merging isn't the end: the deploy or migration step, how to see it working, and how to back it out. Three lines at most.
6. **`## Not verified`.** Bullets. Each one says what wasn't checked and either where the claim came from instead ("the 52 replacements figure comes from the provider source, not an observed plan") or, for a plain unknown, what would settle it. Leave the section out only when there is truly nothing.
7. **Last line of prose.** `Next: …` in one sentence. When the next step waits on a person, name them.
8. After that, in this order: the repo template's required checklist if there is one, then any attribution footer the session requires as the final line.

Sections 2 to 6 are each optional. A PR that needs none of them is a trivial PR.

## Length

| Kind of PR | Budget | Shape |
|---|---|---|
| Trivial: typo, dependency bump, config value with no story | 1 to 3 sentences | Opening paragraph only, no headers |
| Default: almost every PR | 100 to 350 words | Opening paragraph plus the sections it needs |
| Extended: only with a stated reason | up to about 500 words | The full shape |

**The budget is a ceiling, not a target.** A 4-line change that is fully explained in 150 words gets 150 words. In dry runs under an earlier version of this skill, three PRs from +4 −2 to +915 −40 all came out at 542 or 543 words against a 550 ceiling. That is the failure to avoid.

**The extended row needs a reason you can state in one sentence**, and the reason has to be about risk: merging or the deploy that follows changes a live system in a way that can break it (new destructive behavior, a data migration, an incident fix where part of the change is already live). A large diff is not a reason. Having a lot of evidence is not a reason. If you use the extended row, tell the user the reason when you hand over the description.

Count the body with `wc -w`, code blocks included. Leave out of the count the attribution footer and a checklist the repo's template requires. "About 500" means within 10%; 350 is a hard line.

When the draft is over budget, cut in this order:

1. Anything on the "leave out" list below.
2. Detail that a code comment in the diff already carries.
3. The third "Why" section, then the second.
4. Supporting evidence beyond the strongest one.
5. "Not verified" bullets that would not change a reviewer's decision.

Material that is true but doesn't fit (an incident timeline, option tables, ruled-out causes, extra test detail) is cut. Don't move it to a PR comment, and don't point to one from the description. If a cut item would change a reviewer's decision, it belongs in the description and something else goes instead.

## What to leave out

- **A "Summary" header.** The opening paragraph is the summary.
- **The architecture diagram.** Include one only when the reviewer can't follow the problem without it. Then put it where it is first needed and keep it under 10 lines.
- **Before/after trace pairs.** One trace of the failure is usually enough. The "after" is a sentence with a number.
- **The list of changed files.** The diff has it.
- **Checklists of your own** (test plans, verification boxes). Evidence goes in the opening paragraph. Gaps go in "Not verified". A checklist the repo's template requires is different: it stays, at the end.
- **A "Key insight" callout.** If the insight matters, it is the opening paragraph or a section header.
- **The investigation timeline.** Report in the order the reviewer needs, not the order you found things.
- **Version or option tables** when one sentence with the two numbers does the job.

## The title

The title says what the change does, not what you hope it achieves. "Prefer zones with capacity for Buildkite agent VMs (BALANCED target shape)" is checkable from the diff. The first title on that PR, "Create Buildkite agent VMs in whichever zone has capacity", promised more than the diff delivers: a group put 2 VMs in a full zone 8 minutes after the fix. A trailing "so that…" clause is usually the hope; cut it. Keep the repo's scope prefix (`ci-autoscaler:`) if it uses one, and stay under about 75 characters.

## PR-specific rules

- **Use "I"** for what was done and checked. It reads as the PR author. Name other people when a decision is theirs.
- **Reference same-repo PRs and issues as `#123`.** GitHub links them. Use a full URL for other repos.
- **Give every number a unit.** Say the timezone once wherever clock times appear.
- **Follow the repo's PR template** when there is one. A required checklist (gadget's `## PR Checklist`, for example) goes in verbatim as the last section, after the `Next:` line and before the attribution footer, with its boxes filled in honestly. It is outside the word count. Everything above it follows this shape; don't adopt the template's other headers unless the repo enforces them.
- **Updating an existing PR** follows the `pr-descriptions` rule: read the current body first and use a comment for additive information. For a rewrite, save the old body to a file in the scratchpad or notes folder before replacing it, and tell the user the path.

## Example

[example.md](./example.md) is the body of gadget-inc/global-infrastructure#1929. The first draft was 1,779 words with an architecture diagram, two trace pairs, a version table, a seven-step timeline, and a checklist. The rewrite is a 528-word body and is the one Nicholas kept. It sits on the extended budget, for a reason that qualifies: an incident fix where two live groups had already been patched. Most PRs should come in well under it. Its skeleton:

```
(opening)                 New groups will prefer zones with capacity. Merging changes
                          nothing that exists today: the plan is `no changes`.
## The problem            20 h 38 min wait; MIG and shape defined inline; one table
                          of creates per zone (f: 2 created, 89 failed); ends on the fix.
## Why `ignore_changes`   The one line alone would have planned 52 replacements.
## What this doesn't fix  A 4-line trace of the group stalling again; links #1930.
## Not verified           2 bullets, each naming where the claim came from.
Next: …
```

A trivial PR looks like this (illustrative):

> Bumps `undici` from 6.19.2 to 6.19.8 to pick up the fix for sockets leaking after an aborted request. No code changes. The existing suite passes (412 of 412).

## Before shipping, check

1. Does the first paragraph say what merging does, with a number and the evidence?
2. Does one scenario with real values carry through every section?
3. Does each unfamiliar term get a one-clause definition the first time it appears?
4. Is there a "Why" section for the choice a reviewer would most question, and no more than three?
5. Is "Not verified" present and honest, including anything unknown about what merging triggers?
6. Is `wc -w` at or under 350, or is there a one-sentence risk reason for the extended budget? Is it as short as this change needs, not as long as the budget allows?
7. Is anything from "What to leave out" still in?
8. Grep for em dashes and for the filler words and hedge phrases in `explain` §8.
