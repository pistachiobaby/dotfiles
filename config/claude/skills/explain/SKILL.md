---
name: explain
description: Write or rewrite technical prose in the style of Michael Malis (malisper.me), a plain first-person engineering voice that teaches by building up from a toy example, puts a number on every claim, and keeps the dead ends in. Use for explanations of how something works, summaries (end-of-task reports, investigation findings, recaps), PR descriptions (together with the pr-overview skill, which adds the PR shape), essays, blog posts, project updates, build logs, and postmortem narratives, or when the user says "/explain", "in malisper style", or asks to rewrite a draft in that voice. Do not use for customer emails (support skill) or Slack writeups (slack-writeup skill) unless the user explicitly asks for this voice there.
argument-hint: "[topic to explain, or path to a draft to rewrite]"
---

# Writing in the malisper.me style

Plain first-person engineering prose that teaches by building. Open with the result and a number. Shrink the problem to a toy. Add one piece at a time and measure each one. Keep the failures and the costs in. End with a recap or what's next.

The source is ~90 posts written from 2015 to 2026. They fall into four eras: Lisp macro walkthroughs (2015–16), a one-post-a-day Postgres internals series (2017), career and practice essays (2017–20), and long build narratives about rewriting Postgres in Rust (2026). The voice stays the same across all four eras. What changes is the shape of the post, so pick the shape first.

## 1. Pick the shape

**The build-up tutorial.** Use this to explain how something fast or clever works: a query engine, a JIT, a macro, a compiler.
1. Hook: the end result with a number ("300x faster", "compiles in 5μs").
2. One paragraph of why: the constraint or history that makes this interesting.
3. The smallest working version, in code, with its measured cost.
4. "The biggest problem with this is…" → one change → new measurement. Repeat.
5. A table with every step and its number.
6. Honest caveats and the benchmark setup: hardware, versions, number of runs.
7. What's next.

**The one-concept explainer.** 300–900 words on one idea, like the 2017 Postgres dailies.
1. Define the idea in the first two sentences.
2. Give a tiny concrete example. Reuse the same toy schema or dataset that the rest of the series uses.
3. Walk through the mechanism step by step with real values.
4. Tradeoffs: when it helps and when it hurts.
5. A one-line recap, plus links to the neighboring posts in the series.

**The field report.** For a project, investigation, or rewrite.
1. Chronological headers: "Day 1 – The Foundation", "Attempt #2 – c2rust".
2. Each section covers what I tried, what happened (with numbers), what broke, and what I changed.
3. Cost and time lines in italics at the end of sections (*cost: 8 accounts for one month*).
4. Give the failure modes memorable names ("organ transplant failure").
5. Set up risks early and pay them off later ("Remember how I said X was risky? Yeah, well…").

**The summary.** An end-of-task report, investigation findings, or a recap of changes. Usually a few paragraphs, not a post.
1. First sentence: the result, with its number ("Fixed; the 55 s p95 is now 40 ms", "3 of the 5 failures were the same flake").
2. What changed or what I found, in the order a reader needs it, not the order I did it. Don't narrate the process.
3. The one surprising thing, shown with its real value, not described.
4. What I didn't verify or don't know, said plainly.
5. What's next or the open question. Stop there.

**The PR description.** A summary for a reviewer who has the diff open. Load the `pr-overview` skill for the full shape, the length budget, and a worked example.
1. Opening paragraph with no header: what merging does, with a number and the evidence that it is safe.
2. The problem, shown with real values.
3. One section for each choice in the diff a reviewer would question.
4. What it doesn't fix, what wasn't verified, and one line of what's next.

**The advice essay.** For rules, tools, or career lessons.
1. State the claim up front and ground it in experience you can put numbers on.
2. Use numbered headers: "Rule #1: Centralize State", "Hurdle #2: Passing the Interview".
3. Each rule gets the failure it prevents, one concrete example, and the exception.
4. Add "When should you use X?" bullets where they fit.
5. Close briefly and invite disagreement.

## 2. Open with the result

- The first paragraph says what happened or what the reader will get, with a number. Skip the throat-clearing. Write "Two weeks ago I started X. It's now 250k lines and passes a third of the tests.", not "In today's fast-moving landscape…".
- Long pieces get an italic *tl;dr* above the first paragraph.
- Series posts get an italic preface that links the other parts.
- One sentence of purpose is fine ("In this post I'll walk you through how…"). Narrating the document structure between every section is not.

## 3. Explain by shrinking, then building

- **Toy first.** Use the smallest example that still shows the behavior: a `people`/`pets` table, the regex `b(an)*`, summing 500M floats. Use real names and real values, never "a large query" or "some table".
- **Reuse the toy.** Keep the same example across the piece, and across a series, so that each section changes only one thing.
- **Show, then explain.** Put the code, output, or transcript block first. Then walk through it: "What happened here is…", naming the actual values.
- **Trace state.** Write "N starts at 2. The first fraction that gives an integer is 9/2, so N becomes 9." Don't write "N gets updated".
- **One analogy per concept**, to something the reader already knows, and then show the real mechanism. "A lateral join is a foreach loop in SQL." "Dynamic workflows are map-reduce for coding agents."
- **Translate foreign constructs.** A five-line Python equivalent of a SQL construct beats a paragraph describing it.
- **Show the surprise before the explanation.** When behavior is counterintuitive, show it happening first ("When I first saw this I didn't believe it"), then explain why.
- **Go one level down.** Don't stop at "Postgres uses processes". Say why (history, isolation between connections) and what it costs (connection limits, parallelism only kicks in for big queries).
- **Answer objections where they come up**, not in an FAQ. "You may ask, why is there a connection limit at all? The answer comes down to…" "Now this may seem like cheating, and it is."

## 4. Numbers everywhere

- Anything that can carry a number should: durations with units, row counts, percentages, dollars, lines of code, accounts, agents.
- Any optimization or comparison ends in a before/after table.
- Include honesty lines like "This isn't an apples-to-apples comparison", then say what's excluded and give the setup in one paragraph.
- Round honestly and say you rounded: "~20 s", "about two thirds", "on the order of thousands".
- Credentials are numbers, not adjectives. Write "I ran a Postgres cluster with over a petabyte of data", not "as an expert".

## 5. Sentence-level voice

- Use **I** for what you did and believe, **we** when walking the reader through a build, and **you** for advice.
- Keep sentences short and declarative, one idea each, in everyday words.
- **Define each term inline the first time it appears**, in one clause flagged so experts can skip it: "If you aren't familiar, X is Y." "For context, …". Don't open with a glossary.
- **Label opinions**, then give the reason: "Personally, I find…", "In my opinion…".
- **Ration enthusiasm and make it specific.** "The really cool part is…", "Believe it or not…". Use at most two or three per piece, each tied to a fact that is actually surprising.
- **Admit limits plainly.** "I've never run Docker in production, so I can't comment on that." "I don't know why it translated it that way." "If you know the real name for this, tell me."
- **Casual, not cute.** "a big pain", "pretty much", "it turns out", "that's all there is to it". Avoid slang pileups and puns.
- **Transitions are the connective tissue.** "Now that we have X, we can Y." "Let's take a look at…" "To give you a sense of…" "As an example…" "It turns out…". End with "To recap…" or "Ultimately…".
- **Punctuation.** Periods and commas. Parentheses for skippable asides, e.g. "(If you don't care about the SQL, skip to the results.)". Save exclamation points for real surprises. Avoid em dashes in prose. An en dash is fine in headings ("Attempt #1 – pgrust-og").

## 6. Formatting

- Headers are plain nouns that name the thing: "Hash Joins", "Rule #3: Buy over Build", "Days 8–14: Going Multi-Agent". No clever headers.
- A **bold lead-in** starts each item in a list of parallel ideas: "**Multi-threading:** …". Use the same pattern for "**What we're doing about it:**" after each problem.
- Use bullets for enumerations (options, steps, rules) and prose for reasoning.
- Code and output blocks are the main visual. No callout boxes, emoji, or decorative styling. If a diagram helps, keep it simple and put it where it's first needed.
- Use italic one-liners for meta: tl;dr, series preface, cost lines, "*Spoiler: it was not built by Fable.*"
- A dialogue transcript is fine when it's funny or telling. For example: Me: "Port all of it." Model: "Done. I ported 11 functions." Me: "…11? How many are there?"

## 7. Close

- Recap the chain in one paragraph ("We implemented X in terms of raw Y, then built Z on top…"), or use **Takeaways** bullets for write-ups.
- Then give one of: what's next, an honest remaining limitation, or a concrete invitation ("If you run a small Postgres workload and would try this as a replica, I'd love to hear from you.").
- Keep the last line short. No moral, no inspirational quote, no "Key insight" box.

## 8. What to cut

- Hype and filler: revolutionary, seamless, robust, powerful, leverage, cutting-edge, "in today's world".
- **Hedges without data.** "Can cause issues", "may behave unexpectedly", "in surprising ways". Each one marks a failure you know and didn't show, so show it.
- Abstract examples and hypothetical placeholders where a real value would fit.
- Performed humility and performed confidence. Say what you know and what you don't.
- Hidden dead ends and hidden costs. The dead ends are often the most useful part.

## 9. Before shipping, check

1. Does the first paragraph contain the result and a number?
2. Is there a toy example, and is it reused rather than swapped for a new one each section?
3. Is every mechanism shown running with real values?
4. Does every new term get a one-clause definition the first time it appears?
5. Are opinions marked as mine, with a reason?
6. Are the failures, costs, and benchmark caveats in?
7. Could a smart newcomer follow it without leaving the page, while an expert skims past the definitions?
8. Does it end with a recap or what's next, not a sermon?
9. Grep the draft for em dashes and the words in §8.

## A quick before/after (illustrative)

> **Before:** Caching is a powerful technique that can dramatically improve performance, but it can also cause subtle issues if not handled carefully.
>
> **After:** A cache is a saved copy of an answer you already computed. Our product page took 900 ms to render because it ran the same pricing query 40 times. Storing the first answer in Redis for 60 seconds brought the page down to 45 ms. The catch is that a copy can go stale. When a price changed, customers saw the old one for up to a minute. For prices, that was fine. For inventory, it wasn't, so inventory skips the cache.

The rewrite defines the term in one clause, uses real numbers, shows the failure instead of hedging about it, and ends on the decision.

## How this fits with the other writing rules

- `technical-explanations` and `teaching-artifacts` still apply wherever they agree with this skill: traced numbers, failure before rule, before/after tables that re-price the same scenarios.
- When this skill is active, it wins on three points:
  - Inline "If you aren't familiar…" clauses replace Concept boxes.
  - A plain recap paragraph replaces the Key insight callout.
  - The piece opens with the result, and the architecture diagram comes where it's first needed, not first.
- PR descriptions use this voice. The `pr-descriptions` rule and the `pr-overview` skill own their shape and length.
- Customer-facing replies keep their own rules (no signposting, no em dashes, no process narration). Don't import this voice there.
