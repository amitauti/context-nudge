# context-nudge

Long chats with Claude get slower, cost more and make more mistakes. This plugin keeps a few lines of notes about what you have decided, and lets you start a fresh chat without losing your place. It never clears or deletes anything by itself.

## How to use it in 60 seconds

For anyone: writers, researchers, students, coders. No technical knowledge needed.

1. **Install it once** (see Install below). After that there is nothing to set up.
2. **Just work as usual.** When you decide something ("let's use the 2023 data", "keep it to two pages"), Claude jots it in a small notes file in your project folder. You do not have to do anything.
3. **When the chat feels long or slow, type `/context-nudge`.** Claude saves a short summary of where you are and tells you what to do next.
4. **To continue in a fresh chat, type `/clear`, then `/context-restart`.** Claude reads the summary, tells you where you left off in two lines, and asks "OK to proceed?". Say yes and carry on, with nothing to paste.

Good to know:
- The first time, Claude Code may ask permission to save the notes in the `.claude` folder. Choose the option that allows it every time.
- Claude also offers the fresh start on its own, but only after you make a decision or finish a task. A long stretch of reading with no decisions can slip past, so if a chat feels heavy, type `/context-nudge` yourself. It always works.
- Your notes stay on your computer, in your project folder. Nothing is sent anywhere.

This plugin is **skills only**: no hooks, no scripts, nothing to install beyond the plugin. Claude itself judges whether the session is heavy when you make a decision or finish a task, and offers the handoff. **Automatic measurement of context size needs the optional [`context-nudge-hook`](../context-nudge-hook) add-on** (see below); without it, the nudge relies on Claude's own judgement or on you running `/context-nudge`. Test results and known limits: [docs/TESTING.md](../../docs/TESTING.md).

## What you get

| Piece | What it does |
|---|---|
| `context-nudge` skill | Keeps `.claude/session-ledger.md` (250-word cap) at checkpoints, judges heaviness at checkpoints, and on `/context-nudge` writes `.claude/handoff.md`. |
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
- **Permission prompt.** Claude Code protects the `.claude` folder, so it may ask before the first save. In a non-interactive run (`claude -p`) that save is blocked unless you allow writes there.
- **One session per project.** Two sessions in the same project overwrite the same ledger and handoff.
- **Stale handoffs.** The handoff is dated; `/context-restart` asks before trusting one older than 2 days.
- **Skill names.** Installed as a plugin, skills are namespaced (`/context-nudge:context-nudge`); the bare `/context-nudge` and `/context-restart` also work unless another command uses the name.

## License

MIT, see [LICENSE](LICENSE). Changes are listed in the repository [CHANGELOG](../../CHANGELOG.md).
