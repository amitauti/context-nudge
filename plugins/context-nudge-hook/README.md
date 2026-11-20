# context-nudge-hook

Optional add-on for the [`context-nudge`](../context-nudge) skills plugin. A `UserPromptSubmit` hook that measures context size and, when it reaches the limit or the ledger passes 250 words, tells Claude to run the context-nudge skill. Once per session per reason. It never clears or compacts anything itself.

Install it **alongside** `context-nudge`: its messages tell Claude to follow the `context-nudge` skill, which lives in that plugin.

**Not in the Anthropic directory.** The directory only accepts command hooks from verified organizations, so this add-on is installed from this repository's own marketplace.

**Requires [Node.js](https://nodejs.org) 18 or newer on your PATH.** The hook is a small Node script. Claude Code's native installer does not install Node, so check with `node --version`. Without Node, Claude Code shows a hook error on each prompt.

## Install

```
/plugin marketplace add amitauti/context-nudge
/plugin install context-nudge@amitauti-plugins
/plugin install context-nudge-hook@amitauti-plugins
```

Or from your shell:

```
claude plugin marketplace add amitauti/context-nudge
claude plugin install context-nudge@amitauti-plugins
claude plugin install context-nudge-hook@amitauti-plugins
```

For local development: `claude --plugin-dir /path/to/context-nudge/plugins/context-nudge-hook`.

## Check that it works

1. `claude plugin list` shows `context-nudge-hook@amitauti-plugins` as enabled, and `claude plugin details context-nudge-hook` shows 1 hook.
2. Start Claude Code with a tiny limit: `CONTEXT_NUDGE_TOKENS=1 claude`. Send two messages. The first cannot trigger the size nudge (there is no earlier reply to measure); on the second, Claude responds by updating the ledger and offering `/clear` then `/context-restart`.
3. Without Claude Code, run the hook directly. It prints nothing when no nudge is due, and a JSON `additionalContext` message when one is:

   ```
   echo '{"session_id":"demo","cwd":".","transcript_path":"/no/such/file"}' | node hooks/context-nudge.js
   ```

## Config

- `CONTEXT_NUDGE_TOKENS` sets the context size that triggers the nudge. Default `150000`. Lower it for a 200k window.

## What it stores and where

- **In your system temp directory:** one tiny file per session, `context-nudge-<session id>.json`, such as `{"heavy":true}`. It records which nudges already fired so each fires once. Deleting it is harmless.
- **Read, never sent:** the hook reads the session transcript locally, only to find the latest token count, and reads `.claude/session-ledger.md` to count its words. It makes no network calls and sends nothing anywhere.

## Things to know

- **After a compaction** the hook uses the compacted size, so it does not nudge on the stale pre-compaction number.
- **Fails open.** A hook error never blocks your prompt. An unreadable transcript just means no token-based nudge.

## Test

```
node --test hooks/context-nudge.test.js
```

## License

MIT, see [LICENSE](LICENSE). Changes are listed in the repository [CHANGELOG](../../CHANGELOG.md).
