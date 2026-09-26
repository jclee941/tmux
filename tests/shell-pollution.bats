#!/usr/bin/env bats
#
# Shell-pollution regression tests.
# Sourced scripts (preexec hook, libs) must NOT corrupt the caller's
# interactive shell: no errexit/nounset/pipefail leak, no shell-killing
# exit, no readonly re-declaration abort, no per-Enter unbound errors.

load ./test_helper.bash

setup() {
  setup_test_env
  export PREEXEC="$TMUX_BIN_DIR/tmux-bash-preexec"
  export SIDEBAR_COLORS="$TMUX_BIN_DIR/lib/sidebar-colors"
  export AGENTS_MD="$BATS_TEST_DIRNAME/../AGENTS.md"
  export AUTO_ATTACH="$TMUX_BIN_DIR/tmux-auto-attach"
}

teardown() {
  teardown_test_env
}

# ── SP-PREEXEC: tmux-bash-preexec must be source-safe ──────────────

@test "SP-PREEXEC-001 sourcing preexec does not leak errexit/nounset/pipefail" {
  run bash --noprofile --norc -c "
    set +e +u +o pipefail
    source '$PREEXEC'
    case \$- in *e*) echo LEAK_E; exit 10;; esac
    case \$- in *u*) echo LEAK_U; exit 11;; esac
    set -o | grep -qE '^pipefail[[:space:]]+on' && { echo LEAK_PIPE; exit 12; }
    echo clean
  "
  [ "$status" -eq 0 ]
  [ "$output" = "clean" ]
}

@test "SP-PREEXEC-002 undefined variable after sourcing preexec is not an unbound error" {
  run bash --noprofile --norc -c "
    set +u
    source '$PREEXEC'
    : \"\${THIS_VAR_IS_UNDEFINED}\"
    echo ok
  "
  [ "$status" -eq 0 ]
  [ "$output" = "ok" ]
}

@test "SP-PREEXEC-003 sourcing preexec twice is idempotent (single PROMPT_COMMAND hook)" {
  run bash --noprofile --norc -c "
    source '$PREEXEC'
    source '$PREEXEC'
    n=\$(grep -o '__tmux_precmd' <<<\"\${PROMPT_COMMAND:-}\" | wc -l)
    [ \"\$n\" -eq 1 ] || { echo \"dup=\$n\"; exit 1; }
    echo ok
  "
  [ "$status" -eq 0 ]
  [ "$output" = "ok" ]
}

@test "SP-PREEXEC-004 long-command notifier fires via the LIVE trap+PROMPT_COMMAND path" {
  # Real integration: drive an interactive bash under a PTY so the actual
  # DEBUG trap and PROMPT_COMMAND run. This is RED against the old hook,
  # where the DEBUG trap reset the start time right before __tmux_precmd.
  command -v script >/dev/null || skip "util-linux 'script' not available"
  fakehome="$TEST_TMPDIR/home"
  mkdir -p "$fakehome/.tmux/bin"
  cat >"$fakehome/.tmux/bin/tmux-notify-long-command" <<'STUB'
#!/usr/bin/env bash
printf 'NOTIFIED elapsed=%s cmd=%s\n' "${1:-}" "${2:-}" >>"$HOME/notify.out"
STUB
  chmod +x "$fakehome/.tmux/bin/tmux-notify-long-command"
  printf 'sleep 2\nexit\n' >"$TEST_TMPDIR/in"
  env HOME="$fakehome" TMUX_NOTIFY_THRESHOLD=1 \
    script -qec "bash --rcfile <(echo 'source $PREEXEC') -i" /dev/null \
    <"$TEST_TMPDIR/in" >/dev/null 2>&1 || true
  [ -f "$fakehome/notify.out" ]
  grep -q 'NOTIFIED elapsed=' "$fakehome/notify.out"
  grep -q 'cmd=sleep 2' "$fakehome/notify.out"
}

@test "SP-PREEXEC-004b fast command does NOT notify (no false positives)" {
  command -v script >/dev/null || skip "util-linux 'script' not available"
  fakehome="$TEST_TMPDIR/home_fast"
  mkdir -p "$fakehome/.tmux/bin"
  cat >"$fakehome/.tmux/bin/tmux-notify-long-command" <<'STUB'
#!/usr/bin/env bash
printf 'NOTIFIED\n' >>"$HOME/notify.out"
STUB
  chmod +x "$fakehome/.tmux/bin/tmux-notify-long-command"
  printf 'echo hi\nexit\n' >"$TEST_TMPDIR/in_fast"
  env HOME="$fakehome" TMUX_NOTIFY_THRESHOLD=30 \
    script -qec "bash --rcfile <(echo 'source $PREEXEC') -i" /dev/null \
    <"$TEST_TMPDIR/in_fast" >/dev/null 2>&1 || true
  [ ! -f "$fakehome/notify.out" ]
}

@test "SP-PREEXEC-005 executing preexec directly does not kill shell with exit" {
  # When run (not sourced) it must not 'exit' destructively; a friendly
  # message + exit 0 is acceptable. Mainly: must not contain '|| exit'.
  run grep -nE '\|\|[[:space:]]*exit' "$PREEXEC"
  [ "$status" -ne 0 ]
}

@test "SP-PREEXEC-006 sourcing installs the DEBUG trap and precmd hook" {
  # Proves the live timing machinery is wired up after sourcing:
  # a DEBUG trap calling __tmux_preexec, and __tmux_precmd in PROMPT_COMMAND.
  run bash --noprofile --norc -c "
    source '$PREEXEC'
    trap -p DEBUG
    printf '|PC=%s' \"\${PROMPT_COMMAND:-}\"
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"__tmux_preexec"* ]]
  [[ "$output" == *"DEBUG"* ]]
  [[ "$output" == *"PC=__tmux_precmd"* ]]
}

# ── SP-LIB: sidebar-colors must survive re-source under strict mode ──

@test "SP-LIB-002 sidebar-colors can be sourced twice under set -euo pipefail" {
  run bash --noprofile --norc -c "
    set -euo pipefail
    source '$SIDEBAR_COLORS'
    source '$SIDEBAR_COLORS'
    printf '%s' \"\${C_RESET}\" >/dev/null
    echo clean
  "
  [ "$status" -eq 0 ]
  [ "$output" = "clean" ]
}

@test "SP-LIB-002b sidebar-colors has no readonly declarations" {
  run grep -nE '^[[:space:]]*readonly ' "$SIDEBAR_COLORS"
  [ "$status" -ne 0 ]
}

# ── SP-AUTO: auto-attach is execute-only; docs must not say "source" ──

@test "SP-AUTO-001 AGENTS.md does not say source/invoke for auto-attach" {
  run grep -nE 'source/invoke' "$AGENTS_MD"
  [ "$status" -ne 0 ]
}

@test "SP-AUTO-003 auto-attach header usage does not instruct sourcing" {
  run grep -nE 'source .*tmux-auto-attach' "$AUTO_ATTACH" "$AGENTS_MD"
  [ "$status" -ne 0 ]
}

@test "SP-AUTO-002 AGENTS.md explicitly says do not source auto-attach" {
  grep -qiE 'do not source' "$AGENTS_MD"
}

# ── SP-HOOK: hook-chain scripts must never return nonzero ──────────
# Run via 'run-shell -b'; nonzero exit makes tmux flash "'...' returned N".

@test "SP-HOOK-001 tmux-git-uncommitted exits 0 even when tmux set fails" {
  repo="$TEST_TMPDIR/repo"
  mkdir -p "$repo"
  ( cd "$repo" && git init -q && printf x >dirty ) 2>/dev/null || skip "git unavailable"
  # tmux mock: report a session/path but FAIL on 'set'.
  write_mock tmux '
case "${1:-}" in
  display-message) printf "%s\n" "${MOCK_TMUX_PANE_PATH:-/tmp}" ;;
  set) exit 1 ;;
  *) exit 0 ;;
esac
'
  export MOCK_TMUX_PANE_PATH="$repo"
  run "$TMUX_BIN_DIR/tmux-git-uncommitted" "$repo"
  [ "$status" -eq 0 ]
}

@test "SP-HOOK-002 tmux-session-branch-log exits 0 in normal use" {
  run "$TMUX_BIN_DIR/tmux-session-branch-log"
  [ "$status" -eq 0 ]
}

@test "SP-HOOK-003 tmux-git-uncommitted exits 0 outside a git repo" {
  mkdir -p "$TEST_TMPDIR/plain"
  mock_tmux_list_sessions
  export MOCK_TMUX_PANE_PATH="$TEST_TMPDIR/plain"
  run "$TMUX_BIN_DIR/tmux-git-uncommitted" "$TEST_TMPDIR/plain"
  [ "$status" -eq 0 ]
}

@test "SP-HOOK-004 tmux-session-branch-log leaves no temp file when tail fails" {
  # mktemp creates a temp file before tail runs; if tail fails the temp must
  # still be removed (no leak). Force tail to fail and count stray temps.
  workdir="$TEST_TMPDIR/blog"
  mkdir -p "$workdir"
  # tmux mock: report session + a valid path (so the script reaches the tmp logic).
  write_mock tmux '
case "${1:-}" in
  display-message) printf "%s\n" "sess" ;;
  *) exit 0 ;;
esac
'
  # Stub tail to always fail (simulates an unreadable/locked log).
  write_mock tail 'exit 1'
  # Redirect the script's temp + log into our sandbox via HOME + TMPDIR.
  before=$(find "$TEST_TMPDIR" -name 'tmp.*' 2>/dev/null | wc -l)
  run env TMPDIR="$workdir" "$TMUX_BIN_DIR/tmux-session-branch-log"
  [ "$status" -eq 0 ]
  after=$(find "$workdir" -name 'tmp.*' 2>/dev/null | wc -l)
  [ "$after" -eq 0 ]
}
