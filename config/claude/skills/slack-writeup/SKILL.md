---
name: slack-writeup
description: This skill should be used when the user asks to "write this up for Slack", "turn this into a post", "summarize this for the team", "make this shareable", "create a writeup", or wants to distill investigation findings, analysis results, or technical discoveries into a standalone markdown document suitable for posting in Slack or similar async communication channels.
argument-hint: "[optional topic or focus area]"
---

# Slack-Ready Technical Writeup

Distill the current conversation's investigation findings into a standalone document for async readers who weren't part of the investigation.

## When to use

Invoke after completing an investigation, analysis, or technical deep-dive where the findings need to be shared with a team. The conversation history contains the raw material — this skill structures it for consumption.

## Slack formatting reference

Slack messages support a limited subset of markdown. Every example in this skill uses only what Slack actually renders.

*Supported:*
- Blockquotes (`>`)
- Fenced code blocks (triple backticks)
- Inline code (single backticks)
- Emoji (shortcodes like `:white_check_mark:`)
- Automatic URL linking
- _Italic_ with underscores only (`_text_`)
- ~Strikethrough~ with single tildes (`~text~`)
- Unordered lists (`-` or `*` as bullet, though requires markup mode)
- Ordered lists (though requires markup mode)

*Not supported — never use these:*
- Headings (`#`, `##`, `###`) — they render as literal `#` characters
- Bold with double asterisks (`**text**`) — Slack treats single `*text*` as bold in mrkdwn but the message interface actually renders it as _italic_. There is no reliable bold in Slack messages.
- Tables (`| col | col |`) — render as raw pipe characters
- Horizontal rules (`---`) — not rendered
- Images, links with `[text](url)` syntax (requires markup mode disabled)
- Syntax highlighting on code blocks
- HTML of any kind

*Practical formatting strategy:*
- Section headers: Use a line of text in ALL CAPS or with an emoji prefix like `:mag:` to visually separate sections. Example: `:mag: WHY — THE MEASUREMENT ARCHITECTURE`
- Emphasis: Use `_italic_` with underscores for emphasis. For strong emphasis, use inline `code` backticks — they stand out more than italic in Slack.
- Tables: Put tabular data inside fenced code blocks with manual alignment
- Separators: Use `———` (em dashes) or a blank line between sections
- Bold callouts: Use `>` blockquotes to make key insights stand out

## Output structure

Follow progressive disclosure — each layer earns the reader's attention for the next.

### 1. Title + one-line What

An emoji + ALL CAPS title line, then a one-sentence summary. The reader decides in 5 seconds whether to keep reading.

```
:rotating_light: SANDBOX CPU BILLING: IDLE OVERHEAD IN "ACTIVE CPU TIME"

Development sandboxes consume ~3s of CPU per second while idle, and this feeds into both the ops dashboard and the actual bill.
```

### 2. Why — system topology

An ASCII diagram inside a fenced code block showing the relevant data flow. The reader should understand the shape of the system before details.

```
Component A
    │  what flows between them
    ▼
Component B
    │
    ├──► Path 1 (where it goes)
    └──► Path 2 (where else it goes)
```

Keep lines under 80 characters inside code blocks — Slack wraps poorly. Use `──►`, `▼`, `│`, `├`, `└` for flow.

### 3. How — dual-path walkthrough

Show both sides of the finding using concrete values from the investigation. Since Slack doesn't support tables, use an aligned code block:

```
                      Idle              Active
                      (08:08–08:44)     (10:50–11:50)
Requests              0                 ~100+
CPU per 2-min bucket  ~5.5–6s steady    ~6.5–7s base, 41s peak
Total sandbox CPU     102,270ms (~1.7m) ~299,313ms (~5m)
```

Walk through each path with inline annotations. Trace execution, don't just describe outcomes.

### 4. Proof — traced values

At least one annotated code block showing a real data point flowing from origin to destination, step by step:

```
Idle 2-min bucket (08:22–08:24 UTC):
  kubelet sample 1: usageCoreNanoSeconds = N
  kubelet sample 2: usageCoreNanoSeconds = N + 5,800,000,000
  ──► Monitor: delta = 5,800ms
  ──► Database: stored as 5800
  ──► Aggregation: summed into monthly total
  ──► Invoice: billed as compute time

  What was actually running: [list the real activity]
```

### 5. Key insight

End with a blockquote callout — one sentence capturing the non-obvious takeaway. Use `>` to make it visually distinct.

```
———

> _Key insight_: The idle CPU baseline is real CPU correctly measured by the kernel, but it doesn't match user expectations of what "active" means.
```

## Tone

- Written for engineers who have context on the broader system but weren't in this investigation
- Skip the investigation journey — go straight to findings
- State facts, then interpretation — don't editorialize
- Include specific tables, metrics, code paths, and file paths so readers can verify
- End with an open question or decision point if there is one

## What to include

- Real data from the investigation (timestamps, values, counts, durations)
- The specific tables, metrics, or code paths involved
- Enough system context that a reader unfamiliar with the subsystem can follow

## What to exclude

- The investigation process (queries tried, dead ends, tool iterations)
- Tool-specific syntax quirks (ClickHouse casting, query retries)
- Caveats about data quality unless they materially affect the conclusion
- Filler phrases ("It's worth noting that...", "Interestingly...")
