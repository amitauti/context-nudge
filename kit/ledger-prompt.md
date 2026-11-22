# Ledger Prompt

Copy and paste the text block below into your current (heavy) AI chat when you want to pause, capture your work, and prepare a clean restart.

***

```markdown
Please pause and create a concise handoff ledger for this conversation so I can cleanly resume our work in a fresh chat.

Format rules:
1. Hard cap: Under 250 words total. Keep bullets terse and compact (short fragments, no conversational fluff).
2. Bullets only. No conversational opening, closing, or narrative prose outside the sections.
3. Output the date line plus six sections in this order (start with today's date):

## Date: YYYY-MM-DD
## Goal / status (max 3 bullets: current objective and current milestone)
## Decisions (max 8 bullets: format each as "Decision — one-line reason why")
## Constraints / preferences (max 8 bullets: hard rules, tone, style, deadlines, things to avoid)
## Documents / sources / files (max 12 bullets: format each as "Item name — status (touched/created/referenced) — purpose in 3-5 words")
## Open items / blockers (max 6 bullets: unresolved questions or missing inputs)
## Next step (exactly 1 bullet: one single concrete action to do next, clear enough to act on cold)

Compaction rules:
- Delete finished steps, closed blockers, and resolved questions.
- Merge decisions serving the same goal into one bullet with their reasons.
- Drop documents or sources that were only mentioned in passing.
- Never omit a stated constraint or the single next step.
```
