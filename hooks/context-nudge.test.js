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
