const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { contextTokens, ledgerWords, decide, run } = require("./context-nudge.js");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cn-test-"));
const asst = (usage, extra = {}) => JSON.stringify({ type: "assistant", message: { usage }, ...extra });
const write = (name, lines) => {
  const f = path.join(tmp, name);
  fs.writeFileSync(f, lines.join("\n"));
  return f;
};

test("sums input + cache tokens of the last main-thread entry", () => {
  const f = write("a.jsonl", [
    asst({ input_tokens: 1, cache_read_input_tokens: 10, cache_creation_input_tokens: 100 }),
    asst({ input_tokens: 5, cache_read_input_tokens: 50, cache_creation_input_tokens: 500 }),
  ]);
  assert.strictEqual(contextTokens(f), 555);
});

test("skips sidechain and zero-usage entries", () => {
  const f = write("b.jsonl", [
    asst({ input_tokens: 300 }),
    asst({ input_tokens: 9999 }, { isSidechain: true }),
    asst({ input_tokens: 0, output_tokens: 0 }),
  ]);
  assert.strictEqual(contextTokens(f), 300);
});

test("tolerates a truncated first line in the tail and garbage lines", () => {
  const big = asst({ input_tokens: 1 }) + "x".repeat(300 * 1024);
  const f = write("c.jsonl", [big, "not json", asst({ input_tokens: 42 })]);
  assert.strictEqual(contextTokens(f), 42);
});

test("empty transcript gives 0", () => {
  assert.strictEqual(contextTokens(write("d.jsonl", [])), 0);
});

test("ledgerWords counts words, missing file is 0", () => {
  const f = write("ledger.md", ["one two", "three"]);
  assert.strictEqual(ledgerWords(f), 3);
  assert.strictEqual(ledgerWords(path.join(tmp, "nope.md")), 0);
});

test("decide: nothing due under limits", () => {
  assert.strictEqual(decide({ tokens: 10, words: 10, seen: {} }), "");
});

test("decide: heavy fires once, then cooldown", () => {
  const seen = {};
  assert.match(decide({ tokens: 999999, words: 10, seen }), /heavy session/);
  assert.strictEqual(decide({ tokens: 999999, words: 10, seen }), "");
});

test("decide: over-cap ledger fires once and takes priority", () => {
  const seen = {};
  assert.match(decide({ tokens: 999999, words: 251, seen }), /over the 250-word cap/);
  assert.match(decide({ tokens: 999999, words: 251, seen }), /heavy session/);
});

test("run: emits additionalContext JSON, then stays quiet; fails open on bad input", () => {
  const transcript = write("e.jsonl", [asst({ input_tokens: 999999 })]);
  const input = JSON.stringify({ transcript_path: transcript, session_id: "t-" + Date.now(), cwd: tmp });
  const out = JSON.parse(run(input));
  assert.strictEqual(out.hookSpecificOutput.hookEventName, "UserPromptSubmit");
  assert.match(out.hookSpecificOutput.additionalContext, /heavy session/);
  assert.strictEqual(run(input), "");
  assert.throws(() => run("not json")); // main() catches this and exits 0
});

// ---- transcript scanning ----------------------------------------------------

const MB = 1024 * 1024;
const user = (text) => JSON.stringify({ type: "user", message: { content: text } });

test("finds the last assistant entry when long tool outputs push it past the old 256 KB window", () => {
  const f = write("long-tail.jsonl", [
    asst({ input_tokens: 777 }),
    user("x".repeat(400 * 1024)),
    user("y".repeat(400 * 1024)),
    user("z".repeat(400 * 1024)),
  ]);
  assert.strictEqual(contextTokens(f), 777);
});

test("finds the assistant entry behind a single multi-megabyte line", () => {
  const f = write("huge-line.jsonl", [asst({ input_tokens: 888 }), user("q".repeat(5 * MB))]);
  assert.strictEqual(contextTokens(f), 888);
});

test("multi-byte characters straddling a chunk boundary do not corrupt the scan", () => {
  // Vary the padding so some chunk boundary lands inside a 2-3 byte character.
  for (let pad = 0; pad < 8; pad++) {
    const f = write(`utf8-${pad}.jsonl`, [
      asst({ input_tokens: 4242 }, { note: "é€😀".repeat(40000) + "a".repeat(pad) }),
      user("é€😀".repeat(100000) + "b".repeat(pad)),
    ]);
    assert.strictEqual(contextTokens(f), 4242, `pad=${pad}`);
  }
});

test("handles CRLF line endings", () => {
  const f = path.join(tmp, "crlf.jsonl");
  fs.writeFileSync(f, [asst({ input_tokens: 5 }), asst({ input_tokens: 6 })].join("\r\n") + "\r\n");
  assert.strictEqual(contextTokens(f), 6);
});

test("a last line with no trailing newline and blank trailing lines still parse", () => {
  const f = path.join(tmp, "noeol.jsonl");
  fs.writeFileSync(f, asst({ input_tokens: 9 }) + "\n\n\n");
  assert.strictEqual(contextTokens(f), 9);
});

test("a transcript with no assistant entry gives 0 even when it is large", () => {
  const f = write("no-asst.jsonl", [user("a".repeat(2 * MB)), user("b")]);
  assert.strictEqual(contextTokens(f), 0);
});

test("a missing, unset or unreadable transcript gives 0 instead of throwing", () => {
  assert.strictEqual(contextTokens(path.join(tmp, "does-not-exist.jsonl")), 0);
  assert.strictEqual(contextTokens(undefined), 0);
  assert.strictEqual(contextTokens(tmp), 0); // a directory
});

test("after a compaction the stale pre-compact usage is ignored", () => {
  const boundary = (compactMetadata) => JSON.stringify({ type: "system", subtype: "compact_boundary", compactMetadata });
  const f = write("compact.jsonl", [
    asst({ input_tokens: 250000 }),
    boundary({ trigger: "auto", preTokens: 250000, postTokens: 18000 }),
    user("summary"),
  ]);
  assert.strictEqual(contextTokens(f), 18000);
  const g = write("compact2.jsonl", [asst({ input_tokens: 250000 }), boundary({ trigger: "manual" }), user("summary")]);
  assert.strictEqual(contextTokens(g), 0);
  // an assistant entry after the boundary wins again
  const h = write("compact3.jsonl", [
    asst({ input_tokens: 250000 }),
    boundary({ postTokens: 18000 }),
    asst({ input_tokens: 20000 }),
  ]);
  assert.strictEqual(contextTokens(h), 20000);
});

// ---- run(): end-to-end behaviour --------------------------------------------

const input = (o) => JSON.stringify({ session_id: "s-" + Math.random().toString(36).slice(2), cwd: tmp, ...o });
const project = (name, ledgerWordsCount) => {
  const dir = path.join(tmp, name);
  fs.mkdirSync(path.join(dir, ".claude"), { recursive: true });
  if (ledgerWordsCount) fs.writeFileSync(path.join(dir, ".claude", "session-ledger.md"), "word ".repeat(ledgerWordsCount));
  return dir;
};

test("run: an unreadable transcript does not hide the over-cap ledger nudge", () => {
  const dir = project("proj-cap", 300);
  const out = JSON.parse(run(input({ transcript_path: path.join(tmp, "gone.jsonl"), cwd: dir })));
  assert.match(out.hookSpecificOutput.additionalContext, /over the 250-word cap/);
});

test("run: a project with no .claude directory and a missing transcript is quiet, not an error", () => {
  const dir = path.join(tmp, "bare-project");
  fs.mkdirSync(dir);
  assert.strictEqual(run(input({ transcript_path: path.join(tmp, "gone.jsonl"), cwd: dir })), "");
});

test("run: CLAUDE_PROJECT_DIR wins over the hook's cwd for finding the ledger", () => {
  const root = project("proj-root", 300);
  const sub = path.join(root, "packages", "a");
  fs.mkdirSync(sub, { recursive: true });
  const prev = process.env.CLAUDE_PROJECT_DIR;
  process.env.CLAUDE_PROJECT_DIR = root;
  try {
    const out = JSON.parse(run(input({ transcript_path: path.join(tmp, "gone.jsonl"), cwd: sub })));
    assert.match(out.hookSpecificOutput.additionalContext, /over the 250-word cap/);
  } finally {
    if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR; else process.env.CLAUDE_PROJECT_DIR = prev;
  }
});

test("run: two sessions keep separate once-only state", () => {
  const t = write("two.jsonl", [asst({ input_tokens: 999999 })]);
  const a = input({ transcript_path: t, session_id: "two-a-" + Date.now() });
  const b = input({ transcript_path: t, session_id: "two-b-" + Date.now() });
  assert.match(run(a), /heavy session/);
  assert.match(run(b), /heavy session/);
  assert.strictEqual(run(a), "");
  assert.strictEqual(run(b), "");
});

test("run: a hostile session id cannot escape the temp directory", () => {
  const t = write("host.jsonl", [asst({ input_tokens: 999999 })]);
  assert.match(run(input({ transcript_path: t, session_id: "..\\..\\x/../y" + Date.now() })), /heavy session/);
  assert.ok(!fs.existsSync(path.join(os.tmpdir(), "..", "y.json")));
});

test("run: Windows-style transcript path with backslashes is passed straight to fs", () => {
  // On POSIX a backslash path is just a missing file: must not throw.
  assert.strictEqual(run(input({ transcript_path: "C:\\Users\\a\\.claude\\projects\\p\\s.jsonl", cwd: tmp })), "");
});

// ---- CLI contract -----------------------------------------------------------

const { spawnSync } = require("node:child_process");
const HOOK = path.join(__dirname, "context-nudge.js");
const cli = (stdin) => spawnSync(process.execPath, [HOOK], { input: stdin, encoding: "utf8" });

test("cli: prints hookSpecificOutput JSON on stdout and exits 0", () => {
  const t = write("cli.jsonl", [asst({ input_tokens: 999999 })]);
  const r = cli(input({ transcript_path: t }));
  assert.strictEqual(r.status, 0);
  assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext, /heavy session/);
});

test("cli: fails open on garbage or empty stdin (exit 0, nothing on stdout)", () => {
  for (const bad of ["not json", ""]) {
    const r = cli(bad);
    assert.strictEqual(r.status, 0);
    assert.strictEqual(r.stdout, "");
  }
});

// ---- packaging --------------------------------------------------------------

const REPO = path.join(__dirname, "..", "..", "..");
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(REPO, p), "utf8"));
const PLUGINS = ["context-nudge", "context-nudge-hook"];

test("manifests: marketplace lists both plugins and each plugin.json carries listing metadata", () => {
  const market = readJson(".claude-plugin/marketplace.json");
  assert.strictEqual(market.name, "amitauti-plugins");
  assert.strictEqual(market.owner.name, "amitauti");
  for (const name of PLUGINS) {
    const plugin = readJson(`plugins/${name}/.claude-plugin/plugin.json`);
    const entry = market.plugins.find((p) => p.name === plugin.name);
    assert.ok(entry, `marketplace lists ${name}`);
    assert.strictEqual(plugin.name, name);
    assert.strictEqual(entry.source, `./plugins/${name}`);
    for (const k of ["version", "description", "license", "repository", "homepage"]) assert.ok(plugin[k], `${name} plugin.json ${k}`);
    assert.strictEqual(plugin.author.name, "amitauti");
    assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
    assert.ok(!entry.version, "version lives in plugin.json only");
    assert.match(fs.readFileSync(path.join(REPO, "CHANGELOG.md"), "utf8"), new RegExp("## " + plugin.version.replace(/\./g, "\\.")));
  }
});

test("skills plugin is skills only: no hooks, scripts, or non-text files besides the icon", () => {
  const dir = path.join(REPO, "plugins", "context-nudge");
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      e.isDirectory() ? walk(f) : files.push(f);
    }
  })(dir);
  for (const f of files) {
    const rel = path.relative(dir, f);
    assert.ok(!/hooks|\.mcp|\.js$|\.sh$/.test(rel), `unexpected file ${rel}`);
    const buf = fs.readFileSync(f);
    if (rel.endsWith(".png")) continue;
    assert.ok(!buf.includes(0), `${rel} has a NUL byte`);
    assert.ok(!buf.slice(0, 2).equals(Buffer.from("#!")), `${rel} starts with #!`);
  }
});

test("skill tells Claude to check for heaviness itself (works without the hook)", () => {
  const skill = fs.readFileSync(path.join(REPO, "plugins/context-nudge/skills/context-nudge/SKILL.md"), "utf8");
  assert.match(skill, /Check for heaviness yourself/);
});

test("READMEs: install lines match the marketplace name", () => {
  const market = readJson(".claude-plugin/marketplace.json");
  for (const name of PLUGINS) {
    const readme = fs.readFileSync(path.join(REPO, "plugins", name, "README.md"), "utf8");
    assert.ok(readme.includes("/plugin marketplace add amitauti/context-nudge"));
    assert.ok(readme.includes(`/plugin install ${name}@${market.name}`));
  }
});
