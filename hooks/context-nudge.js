#!/usr/bin/env node
// UserPromptSubmit hook. Tells Claude (via additionalContext) when the session is heavy
// or the ledger is over its cap. Nudges once per session per reason.
const fs = require("fs");
const os = require("os");
const path = require("path");

const LIMIT = Number(process.env.CONTEXT_NUDGE_TOKENS) || 150000;
const WORD_CAP = 250;
const CHUNK = 256 * 1024;
const SCAN_CAP = 64 * 1024 * 1024; // bound the hook's latency on pathological transcripts

// Walks the transcript's lines newest-first, reading the file backwards in chunks. Lines are
// split on raw 0x0A bytes and decoded only once complete, so a multi-byte character cut by a
// chunk boundary can't corrupt a line. Stops when `visit` returns something other than undefined.
function scanLinesBackwards(file, visit) {
  const fd = fs.openSync(file, "r");
  try {
    let pos = fs.fstatSync(fd).size;
    const floor = Math.max(0, pos - SCAN_CAP);
    let parts = []; // pieces, in file order, of a line whose start is still in an earlier chunk
    while (pos > floor) {
      const len = Math.min(CHUNK, pos - floor);
      pos -= len;
      const chunk = Buffer.alloc(len);
      fs.readSync(fd, chunk, 0, len, pos);
      let end = len;
      for (let nl = chunk.lastIndexOf(10, end - 1); nl !== -1; nl = end > 0 ? chunk.lastIndexOf(10, end - 1) : -1) {
        const r = visit(Buffer.concat([chunk.subarray(nl + 1, end), ...parts]));
        if (r !== undefined) return r;
        parts = [];
        end = nl;
      }
      parts.unshift(chunk.subarray(0, end));
    }
    if (pos === 0) return visit(Buffer.concat(parts)); // the first line of the file
  } finally {
    fs.closeSync(fd);
  }
}

// Current context size from the last main-thread assistant request with real usage (sidechains are
// subagents). A compaction after it makes that usage stale, so the boundary's postTokens wins.
// Any read problem gives 0: no token signal, never an error.
function contextTokens(file) {
  const visit = (line) => {
    if (!line.includes('"usage"') && !line.includes("compact_boundary")) return undefined; // skip big tool outputs cheaply
    let e;
    try { e = JSON.parse(line.toString("utf8")); } catch { return undefined; }
    if (e.type === "system" && e.subtype === "compact_boundary") {
      return Number(e.compactMetadata && e.compactMetadata.postTokens) || 0;
    }
    const u = e.type === "assistant" && !e.isSidechain && e.message && e.message.usage;
    if (!u) return undefined;
    const n = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    return n > 0 ? n : undefined; // zero-usage entries are synthetic/error rows
  };
  try { return scanLinesBackwards(file, visit) || 0; } catch { return 0; }
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
