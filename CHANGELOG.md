# Changelog

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
