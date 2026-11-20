# Directory submission draft (owner step)

Submission is done by the repository owner in the developer portal, https://claude.ai/directory/manage (needs a paid claude.ai plan and a connected GitHub account with push access). This file holds the answers to paste. Procedure: https://code.claude.com/docs/en/plugins/publish.md#submit-to-anthropics-directory

## Before you submit

1. Merge the PR that adds this file, so the default branch carries `.claude-plugin/marketplace.json`, the 0.2.1 manifest and the README.
2. Make sure `claude plugin validate . --strict` is clean on the default branch (it should report nothing).
3. The icon is `.claude-plugin/icon.png` (512x512, regenerate with `node tools/make-icon.js`). The directory reads it once, at first submission; it cannot be changed afterwards. Validation warns `ICON_MISSING` if it is absent.

## Source step

| Field | Value |
|---|---|
| Submit | Plugin bundle |
| Repository | `amitauti/context-nudge` |
| Plugin path | empty (plugin is at the repository root) |
| Branch or tag | empty (follows `main`) |
| New versions | GitHub push webhook (needs repo admin), or scheduled check |

## Listing text

- **Name:** context-nudge
- **Short description:** Keeps a terse session ledger and nudges you to /clear then /context-restart when a session gets heavy. Never clears or compacts on its own.
- **Long description (the README is shown as the listing; this is the pitch):**
  Long Claude Code sessions cost more and answer worse. context-nudge keeps a small, capped session ledger in your project and, when the conversation reaches a size you choose, tells Claude to write a handoff note and offer you a clean restart: `/clear`, then `/context-restart`. You stay in control: the plugin never clears or compacts anything itself.
- **Category / keywords:** productivity; context, session, handoff, ledger
- **Support / homepage:** https://github.com/amitauti/context-nudge (issues enabled)
- **License:** MIT

## What the plugin runs (for the data-handling and security steps)

| Component | What it does | Network |
|---|---|---|
| `UserPromptSubmit` hook, `hooks/context-nudge.js` (Node, readable source, no dependencies, no install step) | Reads the tail of the local session transcript to find the latest token count, counts words in `.claude/session-ledger.md`, and may return an `additionalContext` message. Keeps a tiny once-per-session marker file in the OS temp directory. Fails open. | none |
| `context-nudge` skill | Instructs Claude to keep `.claude/session-ledger.md` and write `.claude/handoff.md`. Writes limited to those two files. | none |
| `context-restart` skill | User-invoked only (`disable-model-invocation`). Reads the handoff and ledger, edits only the ledger. | none |

## Data handling answers

- **Reads or stores personal data?** No personal data is collected. The plugin stores a user-visible ledger and handoff note in the user's own project folder; they hold whatever the user's session discussed, stay on the user's machine, and the README tells users to gitignore them.
- **Sends data to services other than declared connectors?** No. No network calls, no telemetry, no MCP servers, no credentials read.
- **Retention?** Ledger and handoff stay until the user deletes them. The temp marker file (`context-nudge-<session id>.json`, contents like `{"heavy":true}`) is left for the OS to clean.
- **Intended for people under 18?** No.

## Expected review notes

- The hook command is `node "${CLAUDE_PLUGIN_ROOT}/hooks/context-nudge.js"`. The pre-submission checklist says a hook running a non-shell file is held for a reviewer ("Scripts the validator couldn't follow"). That hold is expected; the script is one readable file under 256 KiB.
- No bundled binaries, no lockfile install, no package launcher, no credentials.
- The plugin requires Node.js 18+ on the user's PATH; the README states this at the top.

## Compliance step

Use a monitored contact email, and tick all four acknowledgements.
