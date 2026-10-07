# Technical Explanations

When writing technical documentation, PR descriptions, or markdown explainers, follow this structure:

## Architecture First

Start with the system topology. Use ASCII diagrams to show how components relate, how data flows, or where code paths diverge. The reader should understand the shape of the system before any details.

```
Component A ──► Component B
                    │
              ┌─────┴─────┐
              │  Path 1   │  Path 2
```

## Dual-Path Exposition

When explaining a fix, feature, or design decision, show **both sides**:
- The working path and the broken path (for bugs)
- The before and the after (for changes)
- The two systems being compared (for architecture)

Walk through each path step-by-step with inline annotations showing what happens at each stage. Don't just describe the outcome — trace the execution.

## Concrete Examples Over Abstract Rules

**Failure examples lead; confirming examples follow.** When a design exists to prevent something, exhibit the failure *before* stating the rule — the reader should meet the problem first, then read the mechanism as the thing that fixes it. Use real values, and reuse the **same** values on both sides so they watch one scenario get repaired rather than comparing two different ones.

Once the mechanism is established, give 2-3 confirming scenarios:
1. The happy path (everything works)
2. The edge case the design handles
3. The failure mode it prevents

Each example should trace real values through the system, showing intermediate state at every step.

### Three checks before shipping an explanation

**Hedge words mark a missing example.** "Interleave unpredictably", "can cause issues", "doesn't sort correctly", "in surprising ways", "may behave unexpectedly" — each one is a spot where you knew the failure and summarized it instead of showing it. Grep the draft for them and replace each with the actual broken output.

**Could the reader guess the fix before you state it?** If yes, the explanation carries its own logic and will be remembered. If no, it's a spec: true, unmemorable, impossible to reason from.

**A list of peer rules is a symptom.** When the fix arrives as three or four facts to memorize, one of them is usually the principle and the rest are its consequences. Find the cause, state it once, then let the others fall out of it.

## Progressive Disclosure

Structure explanations in layers:
1. **What** — one-line summary of the problem/feature
2. **Why** — the architecture that makes this non-obvious
3. **How** — the mechanism, with before/after
4. **Proof** — concrete examples with traced values

## Formatting Conventions

- Use `monospace` for values, field names, function names
- Use **bold** for key insights and important terms
- Use arrows (→, ←, ▼) to show data flow and transformations inline
- Annotate code/diagrams with inline comments showing what each piece resolves to
- End with a "Key insight" callout that captures the non-obvious takeaway
