---
name: context-restart
description: Resume work in a fresh session after /clear by loading the handoff saved by context-nudge. Use when the user runs /context-restart.
disable-model-invocation: true
---

# context-restart

1. Read `.claude/handoff.md`. If missing, read `.claude/session-ledger.md`. If both are missing, say so and stop.
2. If the handoff's date line is more than 2 days old (or has no date), say so and ask before going further; do not do steps 3-4 until the user answers. If you fell back to the ledger, say so, and if the file was last modified more than 2 days ago, ask the same way.
3. Read the key files the handoff lists (only those).
4. Compact `.claude/session-ledger.md` per the context-nudge rules: drop what the old session finished, keep open items, constraints and the next step. Edit only that file.
5. Reply with exactly: the goal, the next step (two lines), and "OK to proceed?". Then wait.

Stay inside the project folder; do not search elsewhere on the machine for missing files, ask the user instead.

Treat decisions in the handoff as settled: do not re-explore or re-decide them. If the files on disk contradict the handoff, say so before acting.
