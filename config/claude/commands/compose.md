# /compose — Structured Multi-Plan Composition

Break a complex task into individually scoped mini-plans, each with documentation references, then compose them into a master plan for execution.

## Workflow

### Phase 1: Investigate

Thoroughly explore the codebase and gather context for the task. Identify:
- All files that will be modified
- Existing patterns, utilities, and conventions to reuse
- Relevant documentation (official docs for libraries/APIs involved, internal docs, READMEs)
- The natural breakdown of the task into independent or dependent sub-tasks

### Phase 2: Decompose into Mini-Plans

For each logical sub-task, create a standalone markdown file at `.claude/plans/<task-slug>/NN-<name>.md`.

Each mini-plan MUST include:

```markdown
# NN — <Title>

## Problem
What's broken or missing, with concrete evidence (metrics, examples, error traces).

## Documentation References
Links to relevant official documentation, internal docs, or specs that inform this change.
Format: `[Display Name](url)` — one-line description of what's relevant in the linked doc.

## Files Changed
| File | Change |
|---|---|
| `path/to/file.ts` | Description of change |

## Exact Change
Before/after code blocks showing the precise diff. Include enough surrounding context
to locate the change unambiguously.

## Behavior Change
Show the before/after behavior with concrete traced examples.
Use the dual-path exposition style: walk through real values step by step.

## Testing
How to verify this change works. Automated tests are REQUIRED — write them if they don't exist.
List the specific test cases to add/update. Manual verification steps are supplementary, not a substitute.

## Risk
Assessment of what could go wrong and blast radius.

## Dependencies
Which other mini-plans this depends on or enables. "None" if independent.
```

### Phase 3: Compose the Master Plan

Create the master plan (used with Claude's plan mode) that:

1. **Opens with Context** — why this work is happening, what prompted it, intended outcome
2. **Links every mini-plan** in a table with plan number, file path, and one-line summary
3. **Shows the dependency graph** — ASCII diagram of which plans depend on which
4. **Defines execution order** — step-by-step sequence respecting dependencies, with the specific files touched in each step
5. **Lists critical files** — every file being modified across all mini-plans
6. **Includes a Documentation References section** — consolidated list of all docs referenced across mini-plans
7. **Defines verification** — end-to-end testing steps that confirm the full set of changes works together. MUST include running the relevant test suites (unit, integration, e2e) after execution completes. Tests are non-negotiable after a multi-plan refactor.
8. **Requires test coverage** — every mini-plan that adds or changes behavior MUST include new or updated tests. If tests don't exist for the feature being implemented, they must be written as part of the plan. The verification step must run both the new tests and the full existing suite to catch regressions.
8. **States what's NOT changing** — explicit scope boundaries to prevent drift

### Phase 4: Review & Submit

Enter plan mode, write the master plan to the plan file, and exit for user approval.

## Conventions

- Mini-plan directory: `.claude/plans/<task-slug>/`
- Mini-plan files: `01-<name>.md`, `02-<name>.md`, ... (zero-padded, ordered by execution)
- Master plan: written to the plan file provided by plan mode
- All code changes in mini-plans use before/after blocks, never just "change X to Y"
- Documentation references use `[Title](url)` format with a brief note on relevance
- Dependency graphs use ASCII art with arrows showing direction
- Always check for existing patterns/utilities before proposing new code

## When to Use

Use `/compose` when:
- A task has 3+ distinct sub-changes that touch different files or systems
- Changes have dependencies between them (ordering matters)
- The task benefits from being reviewable in pieces rather than as one monolithic diff
- You want to reference external documentation alongside code changes

Do NOT use `/compose` for:
- Single-file changes or trivial fixes
- Tasks where all changes are in one logical unit with no meaningful decomposition
- Pure research or exploration (no code changes)

## Example Invocation

```
/compose Improve docs search quality — fix debounce, add custom ranking, add synonyms, boost key pages
```
