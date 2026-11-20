# Testing the skills-only plugin

The skills are instructions, not code, so the only real test is a real Claude session. This page has a script that does it for you and a checklist for doing it by hand. Run it before each release.

## Quick way: the script

```
docs/test-skills.sh          # about 10 minutes; needs the `claude` CLI, logged in
docs/test-skills.sh --keep   # also keep the scratch folder to look at the files
```

It makes a throwaway folder in your temp directory, runs real `claude -p` sessions against `plugins/context-nudge` with `--plugin-dir`, and prints `PASS`/`FAIL` for everything that can be checked mechanically. It bypasses permission prompts, so it only ever runs in that throwaway folder. Lines starting `READ:` need your judgement.

Behaviour comes from a model, not from code, so a **single** `FAIL` in step 1 or a `READ` of "offers seen = 0" in step 3 can be a one-off. Rerun. A miss that repeats is a defect in the skill wording.

## What "good" looks like

| # | You do | You should see |
|---|---|---|
| 0 | `claude plugin validate plugins/context-nudge --strict` and the file audit | Passes. Only `.md`, `.json`, `.png` etc., no `#!` lines, no `hooks/`, UTF-8, no NUL bytes. |
| 1 | State a decision ("use the 2023 data, not 2021, because ...") in a new project | `.claude/session-ledger.md` appears, bullets only, under 250 words, with that decision and its reason. |
| 2 | Add two more decisions or constraints | The same file is edited in place (no duplicate bullets), still under 250 words. **No** `/clear` offer on this short session. |
| 3 | Make the session heavy without the hook: dump several large files (`cat` on 130 KB files), about 8 turns | At most one or two offers, never one per turn. A good offer says why, has already written `.claude/handoff.md`, and offers `/clear` then `/context-restart`. |
| 4 | `/context-nudge` | Ledger updated, `.claude/handoff.md` written (starts `Resuming a session (today's date).`, about 300 words max, has every decision with its reason, constraints, files, open items, next step). One short message with the choice. Nothing cleared. |
| 5 | New session (or `/clear`), then `/context-restart` | Two lines (goal, next step) and "OK to proceed?". It waits. |
| 6 | Edit the handoff's first line to a date 10 days ago, restart | It says the handoff is old and asks before using it, and has **not** yet compacted the ledger or read files. |
| 7 | Delete the handoff, restart. Then delete the ledger too | First: it says it used the ledger instead. Then: it says there is nothing to resume and stops. |

## By hand (no script)

```
mkdir /tmp/cn-test && cd /tmp/cn-test && git init
claude --plugin-dir /path/to/context-nudge/plugins/context-nudge
```

Then follow rows 1 to 7 above in the one session (for 5, `/clear` then `/context-restart`). To check the ledger size: `wc -w .claude/session-ledger.md`.

## Known limits (observed, not fixed)

Last full run: Claude Code 2.1.329, 2026-11-20. See the PR for the transcript.

- **Without the hook, a heavy session is only noticed at a decision or a finished task.** Description and body are all Claude sees; it does not count turns or tokens. In 12 to 14 turns of nothing but large file dumps, with no decision, the skill never fired in any of three attempts, including after rewording the description to ask for a check every 10 messages. `/context-nudge` always works; the `context-nudge-hook` add-on measures size and is the fix.
- **The unprompted offer is hit and miss.** With the final wording, six runs of one decision then eight large dumps: 4 offered once (at dump 4 to 6) with the handoff already written and no repeat; 1 never invoked the skill at all; 1 invoked it but never offered. Earlier wording that allowed repeats offered in every run but then reminded the user on most later turns, so it was dropped.
- **First-save permission prompt.** Claude Code treats `.claude/` as protected. Interactively you get a prompt (allow always); in `claude -p` the write is blocked unless permissions are bypassed.
- **The ledger can arrive one turn late.** When the first message asks for real work as well as stating decisions (here: it went to look for a missing data file first), Claude did the work and only invoked the skill on the next decision. Nothing was lost (the ledger written then held the first turn's decisions), but a check right after turn 1 can see no ledger. In two script runs this happened both times; in 8 runs with no `data/` folder the ledger was written in turn 1 every time.
