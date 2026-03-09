---
name: support
description: Draft customer-facing technical communication — emails, support ticket replies, or any response to a customer or external developer. Use when the user asks to "draft an email", "write an email", "reply to this ticket", "respond to the customer", "email the customer", "send them findings", or wants to communicate technical analysis, optimization recommendations, or investigation results.
argument-hint: "[customer name or context]"
---

# Customer Technical Communication

Draft a customer-facing response communicating technical findings, analysis results, or recommendations. Whether it's an email, support ticket reply, or async message, it should read like it came from a knowledgeable peer who did the work and is sharing what they found — not from a support agent following a script.

## Voice and feel

- Casual and friendly, never corporate or formal
- Open with "Hi [Name]!" — use their first name and an exclamation mark
- Use contractions naturally ("I'm", "that's", "you're", "don't")
- Acknowledge the other person before redirecting or declining
- Be direct but kind — don't over-explain or pad with filler
- Sign off with "Thanks, Nicholas" or just "Nicholas"

## Structure

- Short paragraphs, conversational flow — no bullet points or numbered lists, but code snippets, inline code, and examples are fine
- Lead with the most impactful finding, then work outward to smaller observations
- Give each finding enough room to breathe — explain the mechanism, show the data, then present options. Don't compress complex technical points into a single sentence
- Group related observations together; use paragraph breaks to separate distinct topics
- End with a warm, low-pressure close that makes it easy for them to engage or not

## Technical depth

Show your work. Include specific numbers, field names, timing patterns, and data correlations so the reader can verify your reasoning:

- Good: "~5K `companies/update` webhooks peak at 06:00 UTC, which lines up almost exactly with the ~5K enrichment calls in the same window"
- Good: "That's coming out to roughly ~80K enrichments per week at 1.0 credit each, which accounts for about a third of the app's total credit usage"
- Bad: "a lot of webhooks are causing high costs"
- Bad: "enrichment is a significant portion of your usage"

Explain the *why* behind observations, not just the *what*:

- Good: "There's a consistent daily spike of ~5K webhooks around 06:00 UTC, which looks like Shopify's nightly recalculation of computed fields like `totalSpent` and `orderCount`"
- Good: "On top of that, the import pipeline pushes mutations to Shopify, which would generate echo webhooks back that also get enriched"
- Bad: "there's a spike in webhooks every day"
- Bad: "your import pipeline may be causing extra webhooks"

When discussing platform features or config options, explain what they do and what they unlock — don't assume the reader already knows:

- Good: "Starting with framework 1.6.0, Gadget surfaces a 'When should this field's data be fetched?' setting on each non-webhook field in the model editor, with the option to switch from 'Fetch on webhook' to 'Fetch later'"
- Good: "`includeFields` tells Shopify which fields you care about, and Shopify suppresses webhooks when none of those fields have changed"
- Bad: "you could add `fetchData: 'later'` to fix this"
- Bad: "consider using `includeFields`"

Always describe changes in terms of what the user does in the Gadget UI — not in terms of schema files, code config, or internal implementation. If a feature is version-gated, explain what version unlocks it and what the user experience looks like.

Link to relevant docs where the reader can learn more, inline and naturally ("More on how non-webhook fields work: [url]"). Always verify doc URLs are real before including them.

## Tone with technical customers

**Descriptive, not prescriptive** — present findings as observations and options, never mandates:

- Good: "From what I can see in the code, the app primarily uses these models for relational linking"
- Good: "If a slightly longer polling interval would be acceptable for the integration, that would reduce the no-op overhead"
- Bad: "You should change the polling interval to 5 minutes"
- Bad: "These models need to have includeFields added"

Acknowledge the limits of your perspective — you've looked at the server-side code, but you can't see frontend queries, external API consumers, or the full business context:

- Good: "The enriched fields don't appear to be read anywhere in the server-side code. Of course, you'd know better than me whether any of that data is consumed elsewhere — frontend queries, GraphQL from external clients, etc."
- Good: "From what I can see, the actual company data management flows through the Ogasys pipeline rather than through the synced Shopify model data"
- Bad: "These fields are unused and should be removed"
- Bad: "The enrichment is wasted"

Frame recommendations as approaches with tradeoffs, not instructions. Give them two or three options where possible, explain what each unlocks, and let them choose:

- Good: "One thing worth knowing: the app is currently on framework ^1.2.0, and on that version there's no way to control when non-webhook fields get fetched. Starting with framework 1.6.0, Gadget surfaces a 'When should this field's data be fetched?' setting... Another approach that works on the current framework version is `includeFields`."
- Bad: "You need to upgrade to framework 1.6.0 and set fetchData to later on all fields"

Recognize what they're already doing well — call it out before noting where it's missing:

- Good: "I noticed you're already using deterministic IDs with `onDuplicateID: 'ignore'` in the order sync pipeline, which is great — the company import pipeline doesn't have that yet"
- Good: "Overall the app is well-structured — search indexing is already disabled across all models, and you've got `includeFields` set up on shopifyProduct and shopifyCollection"
- Bad: "The company pipeline is missing idempotency IDs on enqueue calls"
- Bad: "You don't have includeFields on the company models"

Close with explicit acknowledgment of their expertise: "you know the app better than I do", "these are observations and options rather than hard recommendations", "happy to chat about any of this".

## Workflow

1. Draft the response based on findings from the conversation
2. Display the response inline so the user can review it
3. Copy the response to the clipboard with `pbcopy` automatically
4. If the user asks for revisions, apply them and re-copy to clipboard

## What NOT to do

- Don't use bullet points or numbered lists in the response body
- Don't be prescriptive or use directive language ("you need to", "you should", "you must")
- Don't reference internal schema files, code config, or implementation details — describe changes in terms of the Gadget UI
- Don't include URLs you haven't verified
- Don't pad with filler phrases ("It's worth noting that...", "Interestingly...", "As you may know...")
- Don't over-hedge — be confident in your observations while soft on prescriptions
