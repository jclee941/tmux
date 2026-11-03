#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  export MOCK_TMUX_SEND_KEYS_LOG="$TEST_TMPDIR/send-keys.log"
  export MOCK_TMUX_KILL_LOG="$TEST_TMPDIR/kill.log"
  : >"$MOCK_TMUX_SEND_KEYS_LOG"
  : >"$MOCK_TMUX_KILL_LOG"
  # Mock tmux: server is "running", new-window/target always resolve, and
  # the blocking `wait-for` (no -S) simulates the wrapper's own completion by
  # writing the exit code into the rc file it finds inside the recorded
  # send-keys wrapper text (rc files are named tmux-run-rc.XXXXXX).
  write_mock tmux '
cmd="${1:-}"
case "$cmd" in
  list-sessions)
    exit "${MOCK_TMUX_LIST_SESSIONS_EXIT:-0}"
    ;;
  new-window)
    printf "%s\n" "${MOCK_TMUX_NEW_WINDOW_OUTPUT:-work:1}"
    exit 0
    ;;
  display-message)
    if [[ -n "${MOCK_TMUX_PANE_ID+x}" ]]; then
      printf "%s\n" "$MOCK_TMUX_PANE_ID"
    else
      printf "%s\n" "%1"
    fi
    exit 0
    ;;
  send-keys)
    if [[ "${2:-}" == "-t" ]]; then
      printf "%s\n" "$*" >>"${MOCK_TMUX_SEND_KEYS_LOG:?}"
    fi
    exit 0
    ;;
  wait-for)
    rcfile=$(grep -oE "/[^ ]*tmux-run-rc\.[A-Za-z0-9]+" "$MOCK_TMUX_SEND_KEYS_LOG" | tail -1)
    [[ -n "$rcfile" ]] && printf "%s" "${MOCK_TMUX_EXIT_CODE:-0}" > "$rcfile"
    exit 0
    ;;
  kill-window)
    printf "%s\n" "$*" >>"${MOCK_TMUX_KILL_LOG:?}"
    exit 0
    ;;
  *)
    exit 0
    ;;
esac
'
}

teardown() {
  teardown_test_env
}

@test "tmux-run passes through a successful command's exit code (0)" {
  run "$TMUX_BIN_DIR/tmux-run" -q -- true
  [ "$status" -eq 0 ]
}

@test "tmux-run passes through a failing command's real exit code" {
  export MOCK_TMUX_EXIT_CODE=7
  run "$TMUX_BIN_DIR/tmux-run" -q -- false
  [ "$status" -eq 7 ]
}

@test "tmux-run errors when no command is given" {
  run "$TMUX_BIN_DIR/tmux-run" -t work:1
  [ "$status" -ne 0 ]
  [[ "$output" == *"no command given"* ]]
}

@test "tmux-run errors when the target does not resolve" {
  export MOCK_TMUX_PANE_ID=""
  run "$TMUX_BIN_DIR/tmux-run" -t nosuchsession -- true
  [ "$status" -ne 0 ]
  [[ "$output" == *"no such tmux target"* ]]
}

@test "tmux-run default path creates a new window and sends to it" {
  export MOCK_TMUX_NEW_WINDOW_OUTPUT="work:3"
  run "$TMUX_BIN_DIR/tmux-run" -q -- echo hi
  [ "$status" -eq 0 ]
  log="$(cat "$MOCK_TMUX_SEND_KEYS_LOG")"
  [[ "$log" == *"-t work:3"* ]]
  [[ "$log" == *"echo hi"* ]]
}

@test "tmux-run -l wires the logfile into the wrapper's tee" {
  run "$TMUX_BIN_DIR/tmux-run" -q -l "$TEST_TMPDIR/run.log" -- echo hi
  [ "$status" -eq 0 ]
  log="$(cat "$MOCK_TMUX_SEND_KEYS_LOG")"
  [[ "$log" == *"tee -a"* ]]
  [[ "$log" == *"$TEST_TMPDIR/run.log"* ]]
  [[ "$log" == *'PIPESTATUS[0]'* ]]
}

@test "tmux-run -q suppresses the human status line" {
  run "$TMUX_BIN_DIR/tmux-run" -q -- true
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "tmux-run without -q prints a status line with the exit code" {
  run "$TMUX_BIN_DIR/tmux-run" -- true
  [ "$status" -eq 0 ]
  [[ "$output" == *"exited 0"* ]]
}
