---
name: context-nudge
description: Keeps a short session ledger in .claude/session-ledger.md. Use this skill (invoke it) whenever the user states a decision, a constraint or preference, finishes a task, or changes direction, and whenever the session has become long or heavy (many turns, big tool outputs). Also use on /context-nudge. Updates the ledger, and when the session is heavy writes .claude/handoff.md and offers /clear then /context-restart. Never clears or compacts on its own.
---

# context-nudge

Long sessions cost more and answer worse. Keep a small ledger so a fresh session loses nothing.

## Ledger: `.claude/session-ledger.md`

Update at checkpoints only: a decision made, a task finished, a direction change. Edit in place (merge or replace bullets); never append duplicates. Bullets only, no prose.

**Hard cap: 250 words total.** Sections, in this order, with these caps:

```
## Goal / status        (max 3 bullets)
## Decisions            (max 8; "decision - one-line reason")
## Constraints / prefs  (max 8)
## Files                (max 12; path - touched|created - why in 3 words)
## Open / blockers      (max 6)
## Next step            (exactly 1 bullet, concrete enough to act on cold)
```

Writes are limited to `.claude/session-ledger.md` and `.claude/handoff.md`. Touch nothing else. If the user's own rules require consent before file changes, ask before each ledger update instead of writing silently.

## Compaction (when over the cap, or when a hook says so)

Compact in place, in this order, until under the cap:
1. Delete resolved items: finished steps, closed blockers, answered questions.
2. Merge decisions serving the same goal into one bullet; keep the reason.
3. Keep only files that still matter; drop files that were only read.
4. Cut wording, not facts: fragments, no articles, no decision history.

Never drop an open item, an unresolved blocker, a user-stated constraint, or the next step. If still over the cap after 1-4, do not silently drop anything: tell the user which items would go and ask.

## Check for heaviness yourself

Nothing measures the session for you unless the optional `context-nudge-hook` add-on is installed, so do it yourself. At each checkpoint (and after any unusually long tool output), ask: has this session had many turns (roughly 20+), four or more large tool outputs or file reads, or a long exploration that is now settled? If so, follow the manual trigger below in full: update the ledger, write `.claude/handoff.md` first (so `/clear` is safe the moment the user agrees), then offer the choice. Offer exactly once per session: after that, say nothing more about restarting or about the handoff being out of date unless the user asks (they can run `/context-nudge` any time). Never say "I can write a handoff": write it, then offer. Do not offer on short sessions.

## Manual trigger: `/context-nudge`

1. Update and, if needed, compact the ledger.
2. Verify coverage: list every decision and open item from this session and confirm each is in the ledger; add what's missing. If the session is too long to recall reliably, say so rather than claiming full coverage.
3. Write `.claude/handoff.md` (under ~300 words): "Resuming a session (YYYY-MM-DD)." with today's date, then goal, decisions with reasons, constraints, file paths, open items, next step. Written for a fresh session that has seen nothing.
4. Show ONE short message:
   - Why: what is driving the size (large tool outputs, long exploration, N turns).
   - The choice: continue here, or run `/clear` then `/context-restart` (it loads `.claude/handoff.md`; no pasting).
5. Stop. Never run /clear or /compact. If the user declines, carry on; do not re-nudge unless a hook asks again.

## When a hook reports a heavy or over-cap ledger

Heavy session: same as the manual trigger (update the ledger first if stale). Over-cap ledger: compact it, then continue the user's request.
