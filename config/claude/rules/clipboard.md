# Clipboard

When generating content that I'll need to paste somewhere specific — emails, Slack messages, writeups, PR descriptions, etc. — automatically copy it to the clipboard with `pbcopy` instead of just displaying it. Still show the content inline so I can review it, but don't wait for me to ask for it to be copied.

Do NOT copy research findings, explanations, code examples, or general discussion to the clipboard. Only copy when the output is something I'm clearly going to paste into another tool or context.

When piping to `pbcopy`, use `printf '%s'` instead of `echo` to avoid issues. Do not escape exclamation marks with `\!` — use single-quoted strings so `!` is treated literally.
