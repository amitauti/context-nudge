#!/usr/bin/env node
// UserPromptSubmit hook. Tells Claude (via additionalContext) when the session is heavy
// or the ledger is over its cap. Nudges once per session per reason.
const fs = require("fs");
const os = require("os");
const path = require("path");

const LIMIT = Number(process.env.CONTEXT_NUDGE_TOKENS) || 150000;
const WORD_CAP = 250;
const TAIL_BYTES = 256 * 1024; // shortcut: assumes the last assistant entry is in the tail, raise if long tool outputs push it out

// Last main-thread assistant request with real usage = current context size (sidechains are subagents).
function contextTokens(file) {
  const fd = fs.openSync(file, "r");
  let text;
  try {
    const size = fs.fstatSync(fd).size;
    const len = Math.min(size, TAIL_BYTES);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    text = buf.toString("utf8");
  } finally {
    fs.closeSync(fd);
  }
  const lines = text.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    let e;
    try { e = JSON.parse(lines[i]); } catch { continue; } // first line of the tail may be cut mid-JSON
    const u = e.type === "assistant" && !e.isSidechain && e.message && e.message.usage;
    if (!u) continue;
    const n = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    if (n > 0) return n; // zero-usage entries are synthetic/error rows
  }
  return 0;
}

function ledgerWords(file) {
  try { return fs.readFileSync(file, "utf8").split(/\s+/).filter(Boolean).length; } catch { return 0; }
}

// Returns the message to inject, or "" when nothing is due. `seen` is mutated.
function decide({ tokens, words, seen }) {
  if (words > WORD_CAP && !seen.cap) {
    seen.cap = true;
    return `context-nudge: .claude/session-ledger.md is ${words} words, over the ${WORD_CAP}-word cap. Compact it per the context-nudge skill, then continue the user's request.`;
  }
  if (tokens >= LIMIT && !seen.heavy) {
    seen.heavy = true;
    return `context-nudge: heavy session (~${tokens} tokens of context). Follow the context-nudge skill's manual trigger: update the ledger, write .claude/handoff.md, and offer the user /clear then /context-restart. Never clear or compact yourself.`;
  }
  return "";
}

function run(raw) {
  const { transcript_path, session_id, cwd } = JSON.parse(raw);
  const root = process.env.CLAUDE_PROJECT_DIR || cwd || process.cwd();
  const stateFile = path.join(os.tmpdir(), `context-nudge-${String(session_id || "x").replace(/[^\w-]/g, "")}.json`);
  let seen = {};
  try { seen = JSON.parse(fs.readFileSync(stateFile, "utf8")); } catch {}
  const msg = decide({
    tokens: contextTokens(transcript_path),
    words: ledgerWords(path.join(root, ".claude", "session-ledger.md")),
    seen,
  });
  if (!msg) return "";
  fs.writeFileSync(stateFile, JSON.stringify(seen));
  return JSON.stringify({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: msg } });
}

module.exports = { contextTokens, ledgerWords, decide, run };

if (require.main === module) {
  let raw = "";
  process.stdin.on("data", (d) => (raw += d));
  process.stdin.on("end", () => {
    try {
      process.stdout.write(run(raw));
    } catch (err) {
      // Fail open: a broken hook must never block the user's prompt.
      process.stderr.write(`context-nudge: ${err.message}\n`);
    }
  });
}
