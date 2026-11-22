# Changelog

## Unreleased

- Added the Portable Handoff Kit in `kit/` for non-coders (writers, researchers, small-business owners) using ChatGPT, Claude web, Gemini, and other chat apps: 60-second how-to, ledger prompt, restart prompt, heaviness guide, three worked examples, and a feedback issue template.

## 0.3.1

- Tested the skills-only plugin end to end with real `claude -p` sessions (results in `docs/TESTING.md`; rerun with `docs/test-skills.sh`).
- Fix: the `context-nudge` skill description now says plainly when to invoke it (a decision, constraint, finished task, direction change, or a long/heavy session). The old wording was often ignored, so no ledger was written.
- Fix: the heaviness check now writes the handoff before offering `/clear`, and uses lower, countable thresholds (about 20 turns, or 4 large outputs).
- Fix: `/context-restart` waits for an answer before reading files or compacting when the handoff is stale or undated, also checks the ledger's age when it falls back to it, and no longer searches the rest of the machine for missing files.
- README: a plain-language "How to use it in 60 seconds" section; notes on the `.claude` permission prompt and on what the skills alone can miss.

## 0.3.0

- Restructured into two plugins in one marketplace so the skills can go in the Anthropic directory: `plugins/context-nudge` (skills only, no hook, no scripts) and `plugins/context-nudge-hook` (the optional `UserPromptSubmit` hook, installable from this marketplace; the directory accepts command hooks only from verified organizations).
- The `context-nudge` skill now checks for a heavy session itself at checkpoints, so it is useful without the hook.
- Author and marketplace owner are now `amitauti`; repository and homepage URLs on both plugins.
- Install `context-nudge-hook` with `/plugin install context-nudge-hook@amitauti-plugins`. Existing 0.2.x users: the hook now lives in that separate plugin.
- Added the plugin icon (`plugins/context-nudge/.claude-plugin/icon.png`, 512x512), regenerable with `node tools/make-icon.js`.

## 0.2.1

- Added a plugin icon (`.claude-plugin/icon.png`, 512x512), regenerable with `node tools/make-icon.js`.

## 0.2.0

- Marketplace-ready: added `.claude-plugin/marketplace.json` (`/plugin marketplace add amitauti/context-nudge`, then `/plugin install context-nudge@amitauti-plugins`) and fixed the README install line.
- `plugin.json` now carries author, repository, homepage and license.
- Fix: the hook read only the last 256 KB of the transcript, so long tool outputs hid the latest usage and the hook silently never nudged. It now reads backwards in chunks until it finds it (capped at 64 MB, safe across multi-byte characters).
- Fix: a missing or unreadable transcript no longer disables the over-cap ledger nudge; it just means no token signal.
- Fix: right after a compaction the hook used the stale pre-compaction token count and could nudge needlessly; it now uses the compacted size.
- README: Node requirement up front, what is stored and where, how to confirm it works.
- Tests: long tails, huge lines, UTF-8 chunk boundaries, CRLF, missing transcript, compaction, two sessions, the CLI contract, manifest consistency.

## 0.1.0

- Initial release: session ledger skill, `/context-restart` skill, `UserPromptSubmit` nudge hook.
