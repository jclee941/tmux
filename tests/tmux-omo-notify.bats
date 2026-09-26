#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  unset TMUX_OMO_NOTIFY_NTFY_TOPIC TMUX_OMO_NOTIFY_NTFY_SERVER
  export XDG_RUNTIME_DIR="$TEST_TMPDIR/run"
  mkdir -p "$XDG_RUNTIME_DIR"
  export TMUX_OMO_NOTIFY_CONFIG="$TEST_TMPDIR/omo-notify.env"
  printf 'TMUX_OMO_NOTIFY_NTFY_TOPIC=test-topic\n' >"$TMUX_OMO_NOTIFY_CONFIG"
  export MOCK_CURL_LOG="$TEST_TMPDIR/curl.log"
  : >"$MOCK_CURL_LOG"
  export MOCK_PANES='' MOCK_CLIENTS='' MOCK_NOW=1000
  write_mock tmux '
case "${1:-}" in
  list-panes) printf "%b" "$MOCK_PANES" ;;
  list-clients) printf "%b" "$MOCK_CLIENTS" ;;
  *) exit 1 ;;
esac
'
  write_mock date 'printf "%s\n" "$MOCK_NOW"'
  write_mock curl '
printf "%s\n" "$*" >>"$MOCK_CURL_LOG.args"
cat >>"$MOCK_CURL_LOG"
printf "\n" >>"$MOCK_CURL_LOG"
'
}

teardown() {
  teardown_test_env
}

# One --once scan at time $1 with a single OmO pane (%1, session "work")
# whose last output happened at $2.
scan_at() {
  export MOCK_NOW="$1"
  export MOCK_PANES="%1\tOmO\t$2\twork\t1\t1\n"
  run "$TMUX_BIN_DIR/tmux-omo-notify" --once
  [ "$status" -eq 0 ]
}

# Baseline, then 35s of continuous output ending at 1039.
work_burst() {
  scan_at 1000 990
  scan_at 1005 1004
  scan_at 1040 1039
}

@test "OMO-001 a long burst followed by silence sends exactly one push" {
  work_burst
  scan_at 1065 1039 # silent for 26s after the burst -> push
  scan_at 1070 1039 # still silent -> no second push
  [ "$(grep -c '"topic":"test-topic"' "$MOCK_CURL_LOG")" -eq 1 ]
  grep -qF '"title":"OmO · work"' "$MOCK_CURL_LOG"
}

@test "OMO-002 no push while the pane keeps producing output" {
  work_burst
  scan_at 1045 1044
  [ ! -s "$MOCK_CURL_LOG" ]
}

@test "OMO-003 a short redraw blip (resize) never pushes" {
  scan_at 1000 990
  scan_at 1005 1003
  scan_at 1030 1003
  [ ! -s "$MOCK_CURL_LOG" ]
}

@test "OMO-004 recent client input in that session suppresses the push" {
  export MOCK_CLIENTS='work\t1050\n'
  work_burst
  scan_at 1065 1039
  [ ! -s "$MOCK_CURL_LOG" ]
}

@test "OMO-005 panes not running OmO are ignored" {
  export MOCK_PANES='%2\tbash\t990\tshell\t1\t1\n'
  run "$TMUX_BIN_DIR/tmux-omo-notify" --once
  [ "$status" -eq 0 ]
  [ -z "$(ls -A "$XDG_RUNTIME_DIR/tmux-omo-notify")" ]
}

@test "OMO-006 state of a closed pane is forgotten" {
  scan_at 1000 990
  [ -f "$XDG_RUNTIME_DIR/tmux-omo-notify/%1" ]
  export MOCK_PANES=''
  run "$TMUX_BIN_DIR/tmux-omo-notify" --once
  [ "$status" -eq 0 ]
  [ ! -e "$XDG_RUNTIME_DIR/tmux-omo-notify/%1" ]
}

@test "OMO-007 the topic travels in the request body, never in argv" {
  work_burst
  scan_at 1065 1039
  grep -q 'test-topic' "$MOCK_CURL_LOG"
  ! grep -q 'test-topic' "$MOCK_CURL_LOG.args"
}

@test "OMO-008 refuses to run without an ntfy topic" {
  : >"$TMUX_OMO_NOTIFY_CONFIG"
  run "$TMUX_BIN_DIR/tmux-omo-notify" --once
  [ "$status" -eq 1 ]
  [[ "$output" == *TMUX_OMO_NOTIFY_NTFY_TOPIC* ]]
}
