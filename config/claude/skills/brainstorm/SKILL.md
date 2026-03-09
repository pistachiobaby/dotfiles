---
name: brainstorm
description: "Use when the user wants to brainstorm a project idea, explore a problem space, or design a system. Triggers: /brainstorm, 'let's brainstorm', 'help me think through', 'I want to explore an idea', 'let's figure out the architecture'."
argument-hint: "[optional topic or problem space]"
user-invocable: true
---

# Research-Heavy Brainstorming

A structured, research-driven brainstorming process for exploring ideas, designing systems, and finding paths to a final concept. This is NOT a quick chat — it's a rigorous back-and-forth where every opinion is grounded in real research.

## How it works

### Phase 1: Understand the Problem Space

Start by asking the user what they're trying to build or solve. Listen for:
- **Prior art** — what existing tools/platforms/projects are they referencing?
- **Pain points** — what specifically doesn't work about existing solutions?
- **Scale constraints** — what makes their use case different from the default?
- **User persona** — who is this for?

Do NOT jump to solutions. Ask clarifying questions until the problem is sharp.

### Phase 2: Deep Research

When the user references existing tools, platforms, or projects — research them thoroughly before responding. Use the Task tool with subagent_type="general-purpose" to research multiple platforms in parallel. For each platform, understand:

- Architecture (how it works under the hood)
- Configuration model (how users define what they want)
- Strengths (what it does well)
- Limitations (where it breaks down, especially at the user's scale)
- Key design decisions (what tradeoffs were made and why)

**Research standards:**
- Search the web, GitHub repos, docs sites, and community discussions
- Get specific: line counts, resource limits, API designs, data models
- Find the failure modes — where does each approach fall apart?
- Look for open issues, community complaints, and architectural limitations

### Phase 3: Synthesize and Present

After researching, present findings as a structured comparison:

1. **Landscape overview** — ASCII diagram or table showing the approaches side by side
2. **Per-platform breakdown** — architecture, strengths, and limitations for each
3. **The gap** — what none of them solve, framed as the opportunity
4. **Key tensions** — the fundamental tradeoffs in the design space (not solutions, just the tensions)
5. **Driving questions** — 3-5 specific questions that force design decisions

Save the research to a file in the project's `research/` directory so it persists across sessions.

### Phase 4: Iterative Design

Now go back and forth with the user. Each round:

1. **Listen** — let the user react, redirect, add constraints, or change direction
2. **Research if needed** — if the user raises a new reference, technology, or approach, research it before responding
3. **Propose concrete options** — not vague suggestions, but specific architectural choices with tradeoffs. Use ASCII diagrams to show system topology.
4. **Stress-test** — for each option, walk through 2-3 concrete scenarios (happy path, edge case, failure mode) with real values
5. **Narrow** — help the user eliminate options and converge on a direction

### Phase 5: Capture Decisions

As decisions solidify, save them. Use the project's `research/` directory:
- `research/platform-comparison.md` — competitive landscape
- `research/architecture-decisions.md` — ADRs as they're made
- `research/open-questions.md` — unresolved questions for future sessions

When the user explicitly asks to save or wrap up, consolidate the current state into these files.

## Tone and Style

- **Opinionated but flexible** — have a point of view, but defer to the user's judgment
- **Concrete over abstract** — use real numbers, real limits, real code examples
- **Progressive disclosure** — start with the shape, then add detail as requested
- **Respect the user's expertise** — they know their domain. Fill in gaps, don't lecture.
- **Keep responses focused** — answer what was asked, propose next steps, don't monologue

## What NOT to do

- Don't propose solutions before understanding the problem
- Don't skip research and give opinions based on general knowledge
- Don't write code until the user explicitly asks for it
- Don't create implementation plans prematurely — stay in exploration mode
- Don't overwhelm with options — present 2-3 concrete choices, not 10 vague ones
- Don't lose track of previous decisions — reference the saved research files
