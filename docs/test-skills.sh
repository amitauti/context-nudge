#!/usr/bin/env bash
# Rerunnable end-to-end test of the skills-only plugin, using real `claude -p` sessions.
# Usage: docs/test-skills.sh [--keep]     (needs the `claude` CLI, logged in; takes ~10 minutes)
# It runs in a throwaway folder with permissions bypassed, so never point it at a real project.
# Deterministic checks print PASS/FAIL. Behaviour checks (marked READ) are for you to judge: see docs/TESTING.md.
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
PLUGIN="$ROOT/plugins/context-nudge"
S=$(mktemp -d); trap '[ "${1:-}" = --keep ] || rm -rf "$S"' EXIT
FAILS=0
pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; FAILS=$((FAILS+1)); }
check() { if eval "$2"; then pass "$1"; else fail "$1"; fi; }
turn() { # turn <session-id> <new|resume> <prompt>  -> prints Claude's reply
  local flag=--resume; [ "$2" = new ] && flag=--session-id
  (cd "$S" && claude -p "$3" --plugin-dir "$PLUGIN" --setting-sources project,local \
     --permission-mode bypassPermissions $flag "$1" 2>&1)
}
sid() { python3 -c 'import uuid;print(uuid.uuid4())' 2>/dev/null || cat /proc/sys/kernel/random/uuid; }
words() { wc -w < "$1" | tr -d ' '; }

echo "== 0. Directory rules for plugins/context-nudge"
claude plugin validate "$PLUGIN" --strict >/dev/null 2>&1 && pass "claude plugin validate --strict" || fail "claude plugin validate --strict"
BAD=$(cd "$PLUGIN" && find . -type f ! -name '*.md' ! -name '*.json' ! -name '*.png' ! -name '*.txt' ! -name '*.yaml' ! -name '*.yml' ! -name '*.jpg' ! -name '*.jpeg' ! -name '*.gif' ! -name '*.webp' ! -name '*.ico' ! -name LICENSE)
check "only allowed file types ($BAD)" '[ -z "$BAD" ]'
check "no #! lines" '! grep -rIl "^#!" "$PLUGIN" | grep -q .'
check "no hooks dir" '[ ! -e "$PLUGIN/hooks" ]'
check "no NUL bytes in text files" '! (cd "$PLUGIN" && for f in $(find . -type f \( -name "*.md" -o -name "*.json" \)); do tr -d "\000" < "$f" | cmp -s - "$f" || echo "$f"; done) | grep -q .'
check "text files are UTF-8" 'find "$PLUGIN" -type f \( -name "*.md" -o -name "*.json" \) -exec iconv -f UTF-8 -t UTF-8 {} -o /dev/null \; 2>/dev/null'

git -C "$S" init -q; mkdir -p "$S/data"
python3 - "$S" <<'PY'
import random, sys
random.seed(1); w="hive bees colony queen honey swarm neighbour permit rooftop garden pollen apiary council survey respondent zoning".split()
for i in range(1, 9):
    open(f"{sys.argv[1]}/data/log{i}.txt", "w").write("\n".join(" ".join(random.choice(w) for _ in range(12)) + f" #{n}" for n in range(1, 1500)) + "\n")
PY
LEDGER="$S/.claude/session-ledger.md"; HANDOFF="$S/.claude/handoff.md"
A=$(sid)

echo "== 1. Ledger is created at a decision, and stays under 250 words"
turn "$A" new "I'm writing a report on urban beekeeping for city council. Decisions: 2 pages max, plain language, use the 2023 survey (data/survey.csv) not 2021 because it has more respondents. Create notes.md with a 3-bullet outline." >/dev/null
if [ -f "$LEDGER" ]; then pass "ledger created in the first turn"; check "ledger <= 250 words" '[ "$(words "$LEDGER")" -le 250 ]'
else echo "READ: no ledger after the first turn (known: when Claude does real work first, it can write the ledger one turn late; step 2 checks it then has the 2023 decision)"; fi

echo "== 2. Ledger updates in place on later decisions, and a short session gets NO restart offer"
OUT=$(turn "$A" resume "Decision: bar chart, not pie chart, for hive counts, because councillors read bars faster.")
OUT2=$(turn "$A" resume "Constraint from the council: never name individual respondents.")
check "ledger exists and has the first-turn 2023 decision" 'grep -q 2023 "$LEDGER"'
check "ledger has the bar-chart decision" 'grep -qi "bar" "$LEDGER"'
check "ledger has the privacy constraint" 'grep -qi "respondent" "$LEDGER"'
check "ledger <= 250 words" '[ "$(words "$LEDGER")" -le 250 ]'
check "no /context-restart offer yet (short session)" '! printf "%s\n%s" "$OUT" "$OUT2" | grep -q "context-restart"'

echo "== 3. Heavy session: eight large file dumps, no hook. READ the replies for one handoff offer."
OFFERS=0
for i in 1 2 3 4 5 6 7 8; do
  R=$(turn "$A" resume "Run: cat data/log$i.txt  (I want the raw output) then say how many lines mention 'zoning' in the first 20 lines.")
  if printf '%s' "$R" | grep -q "context-restart"; then OFFERS=$((OFFERS+1)); echo "   offer seen after dump $i"; fi
done
echo "READ: offers seen = $OFFERS (wanted: 1 or 2, never one per dump; 0 is the known miss, see docs/TESTING.md)"
echo "READ: handoff written by the offer? $( [ -f "$HANDOFF" ] && echo yes || echo no )"

echo "== 4. /context-nudge writes a correct handoff"
R=$(turn "$A" resume "/context-nudge")
echo "$R" | sed 's/^/   | /'
check "handoff exists" '[ -f "$HANDOFF" ]'
check "handoff first line is 'Resuming a session (YYYY-MM-DD).'" 'head -1 "$HANDOFF" | grep -Eq "^Resuming a session \([0-9]{4}-[0-9]{2}-[0-9]{2}\)\.$"'
check "handoff date is today" 'head -1 "$HANDOFF" | grep -q "$(date +%F)"'
check "handoff <= ~300 words" '[ "$(words "$HANDOFF")" -le 330 ]'
check "handoff has the 2023 decision and the privacy rule" 'grep -q 2023 "$HANDOFF" && grep -qi respondent "$HANDOFF"'
check "ledger <= 250 words" '[ "$(words "$LEDGER")" -le 250 ]'
check "reply offers /clear then /context-restart" 'printf "%s" "$R" | grep -q "/clear" && printf "%s" "$R" | grep -q "context-restart"'

echo "== 5. Fresh session (what /clear gives you) + /context-restart resumes and asks"
R=$(turn "$(sid)" new "/context-restart")
echo "$R" | sed 's/^/   | /'
check "asks OK to proceed?" 'printf "%s" "$R" | grep -q "OK to proceed?"'
check "restates the bar chart or 2023 decision" 'printf "%s" "$R" | grep -Eqi "bar chart|2023"'

echo "== 6. Stale handoff (dated 10 days ago)"
cp "$HANDOFF" "$S/handoff.keep"; OLD=$(date -d '10 days ago' +%F 2>/dev/null || date -v-10d +%F)
{ echo "Resuming a session ($OLD)."; tail -n +2 "$S/handoff.keep"; } > "$HANDOFF"
R=$(turn "$(sid)" new "/context-restart"); echo "$R" | sed 's/^/   | /'
check "flags the old date and asks" 'printf "%s" "$R" | grep -Eqi "days|old|stale|still (accurate|current)"'

echo "== 7. Missing handoff (ledger present) and nothing at all"
rm -f "$HANDOFF"; R=$(turn "$(sid)" new "/context-restart"); echo "$R" | sed 's/^/   | /'
check "falls back to the ledger and says so" 'printf "%s" "$R" | grep -qi "ledger"'
rm -f "$LEDGER"; R=$(turn "$(sid)" new "/context-restart"); echo "$R" | sed 's/^/   | /'
check "stops cleanly when both are missing" 'printf "%s" "$R" | grep -Eqi "neither|nothing to restart|no handoff|missing|does not exist|doesn.t exist"'

echo; [ "$FAILS" -eq 0 ] && echo "ALL AUTOMATED CHECKS PASSED (now read the READ lines)" || echo "$FAILS CHECK(S) FAILED"
[ "${1:-}" = --keep ] && echo "scratch kept: $S"
exit "$FAILS"
