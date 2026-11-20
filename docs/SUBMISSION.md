# Directory submission draft (owner step)

Submission is done by the repository owner in the developer portal, https://claude.ai/directory/manage (needs a paid claude.ai plan and a connected GitHub account with push access). This file holds the answers to paste. Procedure: https://code.claude.com/docs/en/plugins/publish.md#submit-to-anthropics-directory

## Before you submit

1. Merge the PR that adds this file, so the default branch carries `.claude-plugin/marketplace.json` and `plugins/context-nudge`.
2. Make sure `claude plugin validate plugins/context-nudge --strict` is clean on the default branch (it should report nothing).
3. The icon is `plugins/context-nudge/.claude-plugin/icon.png` (512x512, regenerate with `node tools/make-icon.js`). The directory reads it once, at first submission; it cannot be changed afterwards.

## Why only the skills plugin is submitted

The directory accepts command hooks and non-text files (scripts, anything starting with `#!`) only from Verified organizations, and a personal account is not one. So the hook and its Node script live in a separate plugin, `plugins/context-nudge-hook`, installable from this repository's own marketplace (`/plugin marketplace add amitauti/context-nudge`, then `/plugin install context-nudge-hook@amitauti-plugins`). It is **not** submitted to the directory. The submitted plugin contains only Markdown, JSON and the PNG icon. The validator also says that when a repository holds other files or plugins, the plugin goes in a subfolder and that folder is what you submit.

## Source step

| Field | Value |
|---|---|
| Submit | Plugin bundle |
| Repository | `amitauti/context-nudge` |
| Plugin path | `plugins/context-nudge` |
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

## What the plugin runs (for the data-handling and security steps; skills plugin only)

| Component | What it does | Network |
|---|---|---|
| `context-nudge` skill | Instructs Claude to keep `.claude/session-ledger.md`, check for a heavy session itself at checkpoints, and write `.claude/handoff.md`. Writes limited to those two files. | none |
| `context-restart` skill | User-invoked only (`disable-model-invocation`). Reads the handoff and ledger, edits only the ledger. | none |

## Data handling answers

- **Reads or stores personal data?** No personal data is collected. The plugin stores a user-visible ledger and handoff note in the user's own project folder; they hold whatever the user's session discussed, stay on the user's machine, and the README tells users to gitignore them.
- **Sends data to services other than declared connectors?** No. No network calls, no telemetry, no MCP servers, no credentials read.
- **Retention?** Ledger and handoff stay until the user deletes them. The temp marker file (`context-nudge-<session id>.json`, contents like `{"heavy":true}`) is left for the OS to clean.
- **Intended for people under 18?** No.

## Expected review notes

- No hooks, scripts, bundled binaries, lockfile install, package launcher or credentials. Files are Markdown, JSON and one PNG.
- Automatic context measurement is the separate, optional `context-nudge-hook` add-on, installed from the owner's own marketplace.
- The author name is `amitauti` (the GitHub handle), to avoid the look-alike hold.

## Compliance step

Use a monitored contact email, and tick all four acknowledgements.
