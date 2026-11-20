# context-nudge

Long Claude Code sessions cost more and answer worse. This plugin keeps a small ledger of the session and nudges you to `/clear` and resume from a handoff, so a fresh session loses nothing. It never clears or compacts on its own.

**Requires [Node.js](https://nodejs.org) 18 or newer on your PATH.** The hook is a small Node script. Claude Code's native installer does not install Node, so check with `node --version`. Without Node the hook cannot run and Claude Code shows a hook error on each prompt; the skills still work.

## What you get

| Piece | What it does |
|---|---|
| `context-nudge` skill | Keeps `.claude/session-ledger.md` (250-word cap) at checkpoints. `/context-nudge` writes `.claude/handoff.md`. |
| `context-restart` skill | `/context-restart` after `/clear` loads the handoff and asks "OK to proceed?". |
| `UserPromptSubmit` hook | Measures context size. When it reaches the limit, or the ledger passes 250 words, it tells Claude to run the nudge. Once per session per reason. |

## Install

In Claude Code:

```
/plugin marketplace add amitauti/context-nudge
/plugin install context-nudge@amitauti-plugins
```

Or from your shell:

```
claude plugin marketplace add amitauti/context-nudge
claude plugin install context-nudge@amitauti-plugins
```

For local development: `claude --plugin-dir /path/to/context-nudge`.

## Check that it works

1. `claude plugin list` shows `context-nudge@amitauti-plugins` as enabled, and `claude plugin details context-nudge` shows 2 skills and 1 hook.
2. Start Claude Code with a tiny limit: `CONTEXT_NUDGE_TOKENS=1 claude`. Send two messages. The first cannot trigger the size nudge (there is no earlier reply to measure); on the second, Claude responds by updating the ledger and offering `/clear` then `/context-restart`.
3. Without Claude Code, run the hook directly. It prints nothing when no nudge is due, and a JSON `additionalContext` message when one is:

   ```
   echo '{"session_id":"demo","cwd":".","transcript_path":"/no/such/file"}' | node hooks/context-nudge.js
   ```

## Use

1. Work as usual. The ledger updates at decisions and finished tasks.
2. When the hook fires (or you run `/context-nudge`), Claude writes the handoff and offers the choice.
3. To continue fresh: `/clear`, then `/context-restart`.

## Config

- `CONTEXT_NUDGE_TOKENS` sets the context size that triggers the nudge. Default `150000`. Lower it for a 200k window.

## What it stores and where

- **In your project:** `.claude/session-ledger.md` and `.claude/handoff.md`, written by Claude through the skills (nothing else is touched). The folder is created if it does not exist.
- **In your system temp directory:** one tiny file per session, `context-nudge-<session id>.json`, such as `{"heavy":true}`. It records which nudges already fired so each fires once. Deleting it is harmless.
- **Read, never sent:** the hook reads the session transcript locally, only to find the latest token count, and reads the ledger to count its words. It makes no network calls and sends nothing anywhere.

## Things to know

- **Writes files.** If your rules require consent for file changes, Claude asks before each update.
- **Add both files to `.gitignore`.** They can hold sensitive decisions:
  ```
  .claude/session-ledger.md
  .claude/handoff.md
  ```
- **One session per project.** Two sessions in the same project overwrite the same ledger and handoff.
- **Stale handoffs.** The handoff is dated; `/context-restart` asks before trusting one older than 2 days.
- **After a compaction** the hook uses the compacted size, so it does not nudge on the stale pre-compaction number.
- **Fails open.** A hook error never blocks your prompt. An unreadable transcript just means no token-based nudge.
- **Skill names.** Installed as a plugin, skills are namespaced (`/context-nudge:context-nudge`); the bare `/context-nudge` and `/context-restart` also work unless another command uses the name.

## Test

```
node --test hooks/context-nudge.test.js
```

## License

MIT, see [LICENSE](LICENSE). Changes are listed in [CHANGELOG.md](CHANGELOG.md).
