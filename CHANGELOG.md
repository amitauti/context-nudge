# Changelog

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
