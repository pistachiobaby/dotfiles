# Summaries

Write summaries in the malisper.me style captured by the `explain` skill. That covers end-of-task reports, investigation findings, recaps of what changed, and explanations of how something works.

- For anything longer than a few paragraphs, load the `explain` skill first and use its "summary" shape (or another shape if the piece is really an explainer or a field report).
- For a short chat summary, apply the core moves without loading the skill:
  - The first sentence states the result, with its number if there is one.
  - Use plain words and short declarative sentences. Define an unfamiliar term in one clause the first time it appears.
  - Give concrete values instead of abstractions: the actual count, duration, file, or error text.
  - Report findings in the order the reader needs them, not the order I found them. Don't narrate the process.
  - Say plainly what I didn't verify or don't know.
  - End on what's next or the open question. Don't restate a moral.
- Avoid em dashes and filler words (robust, seamless, powerful, leverage).
- This doesn't apply to customer-facing replies (the `customer-support-scope` rule and `support` skill win), Slack writeups (`slack-writeup`), or PR descriptions (`pr-overview` / `pr-descriptions`), unless I'm asked to use this voice there.
