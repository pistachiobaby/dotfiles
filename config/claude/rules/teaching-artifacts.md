# Teaching Artifacts (Pedagogical RFCs & Explainers)

Apply this style when I ask for an RFC, design doc, or explainer as an **artifact** — especially when the audience is "engineers without background in X" or I say things like "explain it to a mid-level engineer", "go visual", "teaching-first". It captures the style of the DB rate-limiter RFC ("Rate limit by work, not time") that I want reproduced.

## Voice and pedagogy

- **Teach the primitive where it's first needed, never up front.** Use bordered "Concept" asides (uppercase `CONCEPT · <topic>` tag) placed exactly where a reader first needs the idea, written so an expert can skip them. Never open with a glossary or background section.
- **State who the doc is for in one sentence at the top**, and how to read it ("if you already know what a buffer cache is, skip the Concept boxes").
- **Plant load-bearing observations early, then call back.** If a later argument hinges on a property shown in an early figure, point at it when introducing the figure ("note this asymmetry — it's what makes the whole proposal possible") and reference it again when used ("Recall Figure 2…").
- **Name the failure modes memorably** ("Three ways wall clock lies", "the cache churner", "the convoy"). Named villains make sections navigable and quotable.
- **Trace real numbers everywhere.** Every scenario carries concrete values through the whole pipeline (8 ms of work → 1,208 ms billed → ×3 tier → 2,624 tokens → 328× overcharge). No abstract "a large query".
- **Re-price the same scenarios after the proposal.** A before/after table that revisits the exact scenarios from the problem sections, with numbers in both columns, is the proof section.
- **Answer objections in place.** When a reader would naturally object ("doesn't the sampler itself load the DB?"), answer it right there in the section, not in an FAQ.
- **End with a Key insight callout** — one paragraph, accent-tinted box, capturing the non-obvious takeaway.
- Follow my `technical-explanations` rule for the skeleton: architecture first, dual-path exposition, progressive disclosure. Number the sections (RFCs are genuine sequences); render section numbers in the accent color.
- Include "What this deliberately doesn't solve" and "Open questions" sections. Scope honesty builds trust.

## Visual treatment

Utilitarian-plus: doc-grade polish, no hero, the visual budget goes into hand-drawn diagrams.

- **Palette** (tokens, both themes via `:root` / media-guarded dark / `[data-theme]` override): warm paper ground (`#FAF9F6` light / `#111517` dark), ink `#1F2428`/`#E4E8E6`, neutrals hue-biased toward the accent. **One accent** (petrol teal `#0E7C7B` / `#33ADA9`) with a fixed meaning across every figure (e.g. "real work" / "the proposal"), plus **one semantic hot color** (burnt orange `#C2410C` / `#E8693A`) reserved for the offender/problem. Never let a color mean different things in different figures.
- **Type**: sans display for headings (`"Avenir Next", Seravek, system-ui`), serif body for long reading (`Charter, Georgia`), mono for code and diagram labels (`ui-monospace, "SF Mono", Menlo`). ~70ch prose column; figures may use the full ~880px page width.
- **Concept boxes**: surface background, 1px border, 3px accent left border, small uppercase tag.
- **Figures**: wrapped in a bordered surface frame with `overflow-x: auto`; `figcaption` starts with bold "Figure N." and states the figure's claim *with its numbers* — the caption should work standalone.

## Diagrams (inline SVG)

- Hand-authored inline SVG: `currentColor` strokes/text, CSS-var accents, `viewBox`-sized, mono labels ~11.5px, `role="img"` + `aria-label` stating the claim.
- Depict the mechanism, not names: labeled arrows ("−estimate, immediately", "every 10–30 s"), traced quantities on the marks, timeline lanes for convoy/queueing stories, paired bars on two scales for "the meter's view vs reality" comparisons.
- **Architecture diagrams use orthogonal connectors on a strict grid** — no long sweeping bezier curves; they always end up crossing something.

### Hygiene checklist (each bug here happened; check before publishing)

- Estimate text widths: ~6.9px/char at 11.5px mono. Verify every label fits its box and the viewBox; shorten the label rather than shrink the font.
- Route arrows through clear corridors; never through or over a box or another label. Give the diagram more viewBox height rather than squeezing.
- Don't bracket or annotate tiny elements (an 8px sliver) in-place — it renders as a floating glitch. Say it in a caption line below instead.
- Define markers/gradients in each SVG's own `<defs>` — never reference an id from another figure's fragment.
- Arrowheads must match their line's color (separate accent-colored marker defs, not one `currentColor` marker for everything).
- Tables: `colgroup` percentage widths; mono spans for figures only, never whole sentences; **no `white-space: nowrap` on cells containing prose** — it blows out the layout.
- Long bars representing huge values: clip with break marks rather than distorting scale silently.
