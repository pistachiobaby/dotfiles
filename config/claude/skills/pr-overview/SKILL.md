---
name: pr-overview
description: |
  Generate a detailed PR description from the current branch's changes. Analyzes diffs, commit messages, and code to produce an architecture-first, dual-path explanation with ASCII diagrams and traced concrete examples.

  Use this skill when the user wants to:
  - Write a PR description
  - Generate a PR overview
  - Summarize branch changes for review
  - Update or improve an existing PR description

  Triggers: "write a PR description", "PR overview", "describe this PR", "generate PR body", "write up this PR", "summarize for PR"
argument-hint: "[optional PR number to update]"
---

# PR Overview Generator

Generate a production-quality PR description from the current branch's changes, following progressive disclosure and architecture-first exposition.

## Exposition style reference

All PR descriptions MUST follow this exposition style. This is the authoritative reference for how to structure technical explanations in PRs.

### Architecture First

Start with the system topology. Use ASCII diagrams to show how components relate, how data flows, or where code paths diverge. The reader should understand the shape of the system before any details.

```
Component A ──► Component B
                    │
              ┌─────┴─────┐
              │  Path 1   │  Path 2
```

### Dual-Path Exposition

When explaining a fix, feature, or design decision, show **both sides**:
- The working path and the broken path (for bugs)
- The before and the after (for changes)
- The two systems being compared (for architecture)

Walk through each path step-by-step with inline annotations showing what happens at each stage. Don't just describe the outcome — trace the execution.

### Concrete Examples Over Abstract Rules

After explaining the mechanism, give 2-3 concrete scenarios that cover:
1. The happy path (everything works)
2. The edge case the design handles
3. The failure mode it prevents

Each example should trace real values through the system, showing intermediate state at every step.

### Progressive Disclosure

Structure explanations in layers:
1. **What** — one-line summary of the problem/feature
2. **Why** — the architecture that makes this non-obvious
3. **How** — the mechanism, with before/after
4. **Proof** — concrete examples with traced values

### Formatting Conventions

- Use `monospace` for values, field names, function names
- Use **bold** for key insights and important terms
- Use arrows (→, ←, ▼) to show data flow and transformations inline
- Annotate code/diagrams with inline comments showing what each piece resolves to
- End with a "Key insight" callout that captures the non-obvious takeaway

## Gathering context

Before writing anything, collect all the raw material:

1. **Diff against base branch** — run `git diff origin/main...HEAD` to see the full changeset. If large, also run `git diff --stat origin/main...HEAD` for a summary.
2. **Commit history** — run `git log --format="%h %s%n%n%b" origin/main..HEAD` to read all commit messages and bodies on the branch.
3. **Read changed files** — for each significantly changed file, read enough of the surrounding code to understand the architectural context. Don't just look at the diff — understand what the file does, what calls it, and what it calls.
4. **Identify the PR type** — is this a bug fix, new feature, refactor, performance improvement, or infrastructure change? This determines which exposition structure to use.

## Writing the description

Follow progressive disclosure — each section earns the reader's attention for the next.

### 1. Summary

A short paragraph (2-4 sentences) explaining **what** was broken or missing, and **what** this PR does about it. Be specific — name the component, the symptom, and the fix. Don't say "improved error handling" when you can say "access control filters referencing `$user` variables crashed the search API when no user was logged in."

### 2. Architecture / System Topology

An ASCII diagram showing the relevant components and how data flows between them. The reader should understand the **shape** of the system before any details.

```
Component A ──► Component B
                    │
              ┌─────┴─────┐
              │            │
          Path 1        Path 2
```

Use box-drawing characters: `─`, `│`, `┌`, `┐`, `└`, `┘`, `├`, `┤`, `┬`, `┴`, `►`, `▼`. Keep diagrams readable — no more than ~60 characters wide.

This section sets up the "why this is non-obvious" framing. Skip it only for trivial single-file changes.

### 3. Dual-Path Walkthrough

Show **both sides** depending on PR type:
- **Bug fix:** The working path vs the broken path. Walk through each step-by-step with inline annotations showing what happens at each stage.
- **Feature:** The before (without the feature) vs the after (with it).
- **Refactor:** The old architecture vs the new architecture.

Use annotated code blocks with inline comments showing intermediate values at each step. Trace execution, don't just describe outcomes.

```
Step 1: input arrives         → value = X
Step 2: function processes it → intermediate = Y
Step 3: result                → output = Z  ← this is where it broke
```

### 4. Concrete Examples

2-3 scenarios with real (or realistic) values traced through the system:

1. **Happy path** — everything works as expected
2. **Edge case** — the scenario this PR specifically handles
3. **Failure mode prevented** — what would go wrong without this change

Each example should show intermediate state at every step, not just input and output.

### 5. Key Insight

A single callout (use `>` blockquote or **bold**) capturing the non-obvious takeaway. This is the thing a reviewer would miss by just reading the diff.

### 6. Changes

A bulleted list of changed files with a brief description of what changed in each. Group by logical concern, not alphabetically.

### 7. Test Plan

A checklist of what was tested:

```markdown
- [x] Unit tests for X (N tests, all passing)
- [x] Integration tests for Y
- [ ] Manual verification of Z
```

### 8. PR Checklist

Include the repository's standard PR checklist if one exists.

## Updating an existing PR

If updating a PR that already has a description:

1. Fetch the current body: `gh api repos/OWNER/REPO/pulls/N --jq '.body'`
2. Modify the existing content — never replace wholesale
3. Write back with `gh pr edit N --body-file /tmp/pr-body.md`

For additive information (test results, perf findings, follow-up notes), prefer `gh pr comment` over editing the description.

## Formatting conventions

- Use `monospace` for values, field names, function names, file paths
- Use **bold** for key insights and important terms
- Use arrows (→, ←, ▼) to show data flow and transformations inline
- Annotate code/diagrams with inline comments showing what each piece resolves to
- Keep ASCII diagrams inside fenced code blocks
- Use GitHub-flavored markdown (headings, checklists, code blocks with language hints)

## Internal terminology and jargon

Use precise internal names (AST node types, class names, internal abstractions) — they help reviewers map the description to the code. But **always explain what the term means in plain English on first use**. The reader should never have to open the codebase to understand a term in the PR description.

Good:
- "`RelationAttributeScalar` (a value accessed through a relationship — e.g. `.email` on `$session.user`)"
- "The expression compiles to a `Project` node (Gelly's representation of a subquery/join)"
- "`compileStaticScalarValue` resolves a variable expression to its concrete value at query time"

Bad:
- "`RelationAttributeScalar wrapping Project(variableRelationshipTraversal)`" — three jargon terms with no explanation
- "The `ScalarExpression` is compiled via `tryCompileScalarExpressionPair`" — tells you the class and method but not what's actually happening

The pattern: **`InternalName` (plain English explanation)**. On subsequent uses in the same section, the bare internal name is fine — the reader already has the context.

## What to include

- Enough architectural context that a reviewer unfamiliar with the subsystem can follow
- Specific file paths, function names, and line references
- Real or realistic values traced through the system
- The "why" behind design decisions, not just the "what"
- Internal type/class names with inline plain-English definitions on first use

## What to exclude

- The investigation/debugging journey (how you found the bug)
- Obvious changes that the diff speaks for itself (import reordering, formatting)
- Caveats and edge cases that don't affect the reviewer's understanding
- Filler phrases ("It's worth noting that...", "As we can see...")

## Calibrating depth

Not every PR needs a full architecture diagram and three traced examples. Match the depth to the complexity:

- **Trivial** (typo fix, config change, dependency bump): Summary + Changes only. Skip architecture, examples, and key insight.
- **Moderate** (single-concern bug fix, small feature): Summary + brief walkthrough + Changes + Test plan. A diagram only if the code path isn't obvious.
- **Complex** (multi-file bug fix, cross-cutting feature, architectural change): Full treatment — Summary, Architecture diagram, Dual-path walkthrough, 2-3 Concrete examples, Key insight, Changes, Test plan.

Use your judgment. A reviewer should finish reading and think "I understand exactly what this does and why" — no more, no less.
