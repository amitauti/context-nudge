# context-nudge

Long Claude Code sessions cost more and answer worse. This plugin keeps a small ledger of the session and offers a clean restart: `/clear`, then `/context-restart` resumes from a handoff, so a fresh session loses nothing. It never clears or compacts on its own.

This plugin is **skills only**: no hooks, no scripts, nothing to install beyond the plugin. Claude itself checks for a heavy session at checkpoints (a decision made, a task finished, a long tool output, many turns) and offers the handoff. **Automatic measurement of context size needs the optional [`context-nudge-hook`](../context-nudge-hook) add-on** (see below); without it, the nudge relies on Claude's own judgement or on you running `/context-nudge`.

## What you get

| Piece | What it does |
|---|---|
| `context-nudge` skill | Keeps `.claude/session-ledger.md` (250-word cap) at checkpoints, checks for heaviness itself, and on `/context-nudge` writes `.claude/handoff.md`. |
| `context-restart` skill | `/context-restart` after `/clear` loads the handoff and asks "OK to proceed?". |

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

For local development: `claude --plugin-dir /path/to/context-nudge/plugins/context-nudge`.

## Optional add-on: automatic measurement

`context-nudge-hook` adds a `UserPromptSubmit` hook that measures context size and tells Claude to run the nudge when it passes a limit. It works alongside this plugin and needs Node.js 18+. It is installed from this same marketplace, not from the Anthropic directory (the directory only accepts command hooks from verified organizations):

```
/plugin install context-nudge-hook@amitauti-plugins
```

See [its README](../context-nudge-hook/README.md).

## Use

1. Work as usual. The ledger updates at decisions and finished tasks.
2. When Claude offers it (or you run `/context-nudge`), it writes the handoff and offers the choice.
3. To continue fresh: `/clear`, then `/context-restart`.

## What it stores and where

- **In your project:** `.claude/session-ledger.md` and `.claude/handoff.md`, written by Claude through the skills (nothing else is touched). The folder is created if it does not exist.
- No network calls, no telemetry.

## Things to know

- **Writes files.** If your rules require consent for file changes, Claude asks before each update.
- **Add both files to `.gitignore`.** They can hold sensitive decisions:
  ```
  .claude/session-ledger.md
  .claude/handoff.md
  ```
- **One session per project.** Two sessions in the same project overwrite the same ledger and handoff.
- **Stale handoffs.** The handoff is dated; `/context-restart` asks before trusting one older than 2 days.
- **Skill names.** Installed as a plugin, skills are namespaced (`/context-nudge:context-nudge`); the bare `/context-nudge` and `/context-restart` also work unless another command uses the name.

## License

MIT, see [LICENSE](LICENSE). Changes are listed in the repository [CHANGELOG](../../CHANGELOG.md).
