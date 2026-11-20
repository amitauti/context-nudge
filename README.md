# context-nudge

Long Claude Code sessions cost more and answer worse. This plugin keeps a small ledger of the session and nudges you to `/clear` and resume from a handoff, so a fresh session loses nothing. It never clears or compacts on its own.

## What you get

| Piece | What it does |
|---|---|
| `context-nudge` skill | Keeps `.claude/session-ledger.md` (250-word cap) at checkpoints. `/context-nudge` writes `.claude/handoff.md`. |
| `context-restart` skill | `/context-restart` after `/clear` loads the handoff and asks "OK to proceed?". |
| `UserPromptSubmit` hook | Measures context size. When it reaches the limit, or the ledger passes 250 words, it tells Claude to run the nudge. Once per session per reason. |

## Install

```
claude plugin install context-nudge
```

For local development: `claude --plugin-dir /path/to/context-nudge`. Requires `node` on PATH.

## Use

1. Work as usual. The ledger updates at decisions and finished tasks.
2. When the hook fires (or you run `/context-nudge`), Claude writes the handoff and offers the choice.
3. To continue fresh: `/clear`, then `/context-restart`.

## Config

- `CONTEXT_NUDGE_TOKENS` sets the context size that triggers the nudge. Default `150000`. Lower it for a 200k window.

## Things to know

- **Writes files.** Only `.claude/session-ledger.md` and `.claude/handoff.md` in your project. If your rules require consent for file changes, Claude asks before each update.
- **Add both files to `.gitignore`.** They can hold sensitive decisions.
- **One session per project.** Two sessions in the same project overwrite the same ledger and handoff.
- **Stale handoffs.** The handoff is dated; `/context-restart` asks before trusting one older than 2 days.
- **Fails open.** A hook error never blocks your prompt.
- **Skill names.** Installed as a plugin, skills may appear namespaced (`/context-nudge:context-nudge`).

## Test

```
node --test hooks/context-nudge.test.js
```
