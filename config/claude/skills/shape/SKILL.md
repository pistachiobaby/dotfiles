---
name: discover
description: "Iterative context building before feature planning. Use when the user wants to explore a feature idea through back-and-forth before committing to a plan. Triggers: /discover, 'let's discover', 'let's build context', 'I want to go back and forth before planning', 'help me figure out what we need', 'let's explore before we plan'."
argument-hint: "[optional feature or problem description]"
user-invocable: true
---

# Iterative Context Building for Feature Planning

Build shared understanding of a feature or problem space through alternating rounds of codebase exploration, external research, and targeted questions — until both sides have enough context to plan.

## When to Use

Use when:
- A feature idea exists but the scope, integrations, or approach aren't fully defined
- The feature touches external APIs, services, or systems that need research
- There are multiple valid approaches and you need to explore before committing
- The user wants to go back and forth to build context before jumping into a plan

Do NOT use when:
- Requirements are already clear and complete — go straight to `/compose` or plan mode
- Simple bug fixes or small changes — just do them
- Pure research with no intent to build — just ask directly

## Workflow

### Phase 1: Explore the Codebase

Before asking a single question, deeply explore the existing codebase to understand:
- **What already exists** — models, routes, integrations, UI patterns relevant to the feature
- **Adjacent systems** — code that the feature will interact with or extend
- **Conventions** — how similar features are structured, what patterns are in use
- **Gaps** — what's missing that the feature would need

Use thorough sub-agents for this. The goal is to ask informed questions, not naive ones.

### Phase 2: Ask Targeted Questions

Based on findings from Phase 1, ask clarifying questions that are:
- **Grounded in what you found** — reference specific code, models, or patterns
- **Decision-oriented** — each question should resolve an ambiguity that affects the design
- **Grouped by concern** — cluster related questions (trigger, data model, UI, integration)
- **Limited to what matters** — don't ask about things you can reasonably infer or decide later

Keep it to 3-5 questions per round. Format with bold headers and context so the user knows why you're asking.

### Phase 3: Research External Systems

When the user points to external docs, APIs, or services:
- Fetch and read the relevant documentation
- Map out the specific endpoints, payloads, and capabilities needed
- Confirm what's possible vs. what requires workarounds
- Cross-reference with what the codebase already does with that system

### Phase 4: Confirm and Iterate

After each round of answers:
- Summarize what you now understand (briefly — don't parrot back everything)
- Identify remaining gaps or new questions that arose from the answers
- Ask the next round of targeted questions

Repeat Phases 2-4 until both sides agree the context is sufficient.

### Phase 5: Distill

When context-building is complete, produce a concise summary that captures:

1. **What we're building** — one paragraph describing the feature
2. **Key decisions made** — bullet list of choices resolved during discovery
3. **External systems** — APIs, services, and their relevant capabilities
4. **Existing code to extend** — specific files, models, patterns to build on
5. **Open questions** — anything deliberately deferred to planning/implementation

This summary becomes the input for `/compose` or plan mode.

## Principles

- **Explore before you ask.** Never ask a question the codebase could answer.
- **Research before you assume.** When an external API is involved, read the docs — don't guess at capabilities.
- **One round at a time.** Don't front-load 15 questions. Ask 3-5, get answers, ask the next batch informed by those answers.
- **Questions should close doors.** Each answer should eliminate approaches or confirm a direction. Avoid open-ended "what do you think about X" unless genuinely exploring the problem space.
- **Don't rush to solutions.** The point is context-building, not premature solutioning. Understanding the shape of the problem is the deliverable.

## What NOT to Do

- Don't ask questions the codebase already answers
- Don't guess at external API capabilities — fetch the docs
- Don't propose architecture or write code — stay in discovery mode
- Don't dump all questions at once — iterate in focused rounds
- Don't repeat back everything the user said — summarize only what's new or confirmed
- Don't skip Phase 1 — uninformed questions waste the user's time
