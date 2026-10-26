# Clipboard

When generating content that I'll need to paste somewhere specific — emails, Slack messages, writeups, PR descriptions, etc. — automatically copy it to the clipboard (`pbcopy` on macOS, PowerShell's `Set-Clipboard` on Windows) instead of just displaying it. Still show the content inline so I can review it, but don't wait for me to ask for it to be copied.

Do NOT copy research findings, explanations, code examples, or general discussion to the clipboard. Only copy when the output is something I'm clearly going to paste into another tool or context.

When piping to `pbcopy`, use `printf '%s'` instead of `echo` to avoid issues. Do not escape exclamation marks with `\!` — use single-quoted strings so `!` is treated literally.

On Windows, prefer the PowerShell tool with a single-quoted here-string, so `$` and backticks stay literal: `Set-Clipboard -Value @'` on one line, the text, then `'@` at the start of its own line. From Bash, write the text to a UTF-8 file first and run `powershell.exe -NoProfile -Command "Get-Content -Raw -Encoding UTF8 '<file>' | Set-Clipboard"`.
