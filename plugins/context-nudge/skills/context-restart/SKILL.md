---
name: context-restart
description: Resume work in a fresh session after /clear by loading the handoff saved by context-nudge. Use when the user runs /context-restart.
disable-model-invocation: true
---

# context-restart

1. Read `.claude/handoff.md`. If missing, read `.claude/session-ledger.md`. If both are missing, say so and stop.
2. If the handoff's date line is more than 2 days old (or has no date), say so and ask before trusting it.
3. Read the key files the handoff lists (only those).
4. Compact `.claude/session-ledger.md` per the context-nudge rules: drop what the old session finished, keep open items, constraints and the next step. Edit only that file.
5. Reply with exactly: the goal, the next step (two lines), and "OK to proceed?". Then wait.

Treat decisions in the handoff as settled: do not re-explore or re-decide them. If the files on disk contradict the handoff, say so before acting.
