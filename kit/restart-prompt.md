# Restart Prompt

Copy the text block below, paste it into a **brand new chat window**, and paste your saved handoff ledger directly underneath it.

***

```markdown
I am resuming an ongoing project from a previous session. Below is my handoff ledger containing the project state, settled decisions, constraints, and the next step.

Please follow these instructions:
1. Treat decisions as settled: Do NOT re-explore, question, second-guess, or alter decisions listed in the ledger unless I explicitly ask you to revisit them. Respect all stated constraints and preferences.
2. Staleness check: Check the date line at the top of the ledger. If the date is more than 2 days ago (or if the date is missing), flag this immediately: state that the handoff is older than 2 days, and ask if the context is still current before doing any work.
3. If the handoff is current (within 2 days):
   Do NOT generate drafts, solutions, or pages of text yet.
   Reply ONLY with:
   - Goal: (1 sentence confirming the current goal)
   - Next step: (1 sentence confirming the single immediate next action)
   - "Ready to proceed?"
4. Wait for my confirmation ("Yes", "Go ahead", or any adjustments) before starting the actual work.

---
[PASTE YOUR HANDOFF LEDGER DIRECTLY BELOW THIS LINE]
```
