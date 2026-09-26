#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  export MOCK_TMUX_CALLS="$TEST_TMPDIR/tmux-calls"
  : >"$MOCK_TMUX_CALLS"
  # Mock tmux: dims via display-message, record set/setw calls, swallow run-shell/hooks.
  write_mock tmux '
case "${1:-}" in
  display-message)
    fmt="${3:-}"
    case "$fmt" in
      *client_width*)  printf "%s\n" "${MOCK_TMUX_CLIENT_WIDTH:-999}" ;;
      *client_height*) printf "%s\n" "${MOCK_TMUX_CLIENT_HEIGHT:-999}" ;;
      *) printf "\n" ;;
    esac
    exit 0
    ;;
  set|setw)
    printf "%s\n" "$*" >>"${MOCK_TMUX_CALLS:?}"
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

# ── Status line count: ALWAYS three lines, never the invalid `status 1` ──
# `status` and `status-format[*]` are GLOBAL options; a per-client height
# tier mutating them duplicates the session tabs across mixed-size clients.
# So responsive must keep `status 3` and never inject session tabs into
# status-format[0]. (Also: `set status 1` is invalid in tmux — `on`=1 line.)

@test "DUP-001 short client still keeps status 3 (no invalid 'status 1')" {
  export MOCK_TMUX_CLIENT_WIDTH=120
  export MOCK_TMUX_CLIENT_HEIGHT=20
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
  grep -qE 'set -gq status 3' "$MOCK_TMUX_CALLS"
  # must NEVER emit the invalid 'status 1' (tmux rejects it)
  ! grep -qE 'set -gq status 1$' "$MOCK_TMUX_CALLS"
}

@test "DUP-002 never injects session tabs into status-format[0] (no duplication)" {
  # Root cause of the two-row session-tab duplication: a short client wrote
  # the session-tab strip into the GLOBAL status-format[0], so a tall client
  # showed tabs on BOTH rows. responsive must never set a session-tab format[0].
  for h in 20 24 40; do
    : >"$MOCK_TMUX_CALLS"
    export MOCK_TMUX_CLIENT_WIDTH=120 MOCK_TMUX_CLIENT_HEIGHT=$h
    run "$TMUX_BIN_DIR/tmux-responsive"
    [ "$status" -eq 0 ]
    # No 'set status-format[0]' with session-tab content may ever be emitted.
    ! grep -qE "set -gq status-format\[0\]" "$MOCK_TMUX_CALLS"
    ! grep -q 'range=session' "$MOCK_TMUX_CALLS"
  done
}

@test "DUP-003 never deletes status-format[0] (unsetting an element blanks line 0)" {
  # tmux treats `set -gu 'status-format[0]'` as "remove element 0", not
  # "restore the default", which left the first status line empty.
  export MOCK_TMUX_CLIENT_WIDTH=120 MOCK_TMUX_CLIENT_HEIGHT=40
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
  ! grep -q 'status-format\[0\]' "$MOCK_TMUX_CALLS"
}

@test "DUP-004 statusbar conf resets the status-format array before defining line 1" {
  # Restores tmux's default line 0 and drops stale [0] overrides on reload.
  local conf="$BATS_TEST_DIRNAME/../conf.d/30-statusbar.conf"
  local reset line1
  reset=$(grep -n '^set -gu status-format$' "$conf" | cut -d: -f1)
  line1=$(grep -n '^set -g status-format\[1\] ' "$conf" | cut -d: -f1)
  [ -n "$reset" ]
  [ -n "$line1" ]
  [ "$reset" -lt "$line1" ]
}

@test "DUP-005 statusbar conf stacks the DEV and PRD pills on separate lines" {
  local conf="$BATS_TEST_DIRNAME/../conf.d/30-statusbar.conf"
  local line1 line2
  line1=$(grep '^set -g status-format\[1\] ' "$conf")
  line2=$(grep '^set -g status-format\[2\] ' "$conf")
  grep -qx 'set -g status 3' "$conf"
  [[ "$line1" == *'[DEV]'* ]]
  [[ "$line1" != *'[PRD]'* ]]
  [[ "$line2" == *'[PRD]'* ]]
}

# ── Per-client tiers ──
# Status options are global, but a phone and a desktop are often attached at
# once. The tier must be picked by tmux per client at draw time, never from
# the width of whichever client happened to fire the hook.

@test "RESP-TIER-001 hook output does not depend on the triggering client's width" {
  export MOCK_TMUX_CLIENT_HEIGHT=40
  export MOCK_TMUX_CLIENT_WIDTH=35
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
  cp "$MOCK_TMUX_CALLS" "$TEST_TMPDIR/narrow-calls"
  : >"$MOCK_TMUX_CALLS"
  export MOCK_TMUX_CLIENT_WIDTH=200
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
  diff "$TEST_TMPDIR/narrow-calls" "$MOCK_TMUX_CALLS"
}

@test "RESP-TIER-002 status formats branch on each client's own width" {
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
  grep -qF 'set -gq status-left #{?#{e|<:#{client_width},40},' "$MOCK_TMUX_CALLS"
  grep -qF 'set -gq status-right #{?#{e|<:#{client_width},40},' "$MOCK_TMUX_CALLS"
  grep -qF '#{?#{e|<:#{client_width},80},' "$MOCK_TMUX_CALLS"
  grep -qF 'setw -gq window-status-format #{?#{e|<:#{client_width},40},' "$MOCK_TMUX_CALLS"
  grep -qF 'setw -gq window-status-current-format #{?#{e|<:#{client_width},40},' "$MOCK_TMUX_CALLS"
}

@test "RESP-TIER-003 length caps are fixed so no client's tier truncates another's" {
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
  grep -qxF 'set -gq status-left-length 30' "$MOCK_TMUX_CALLS"
  grep -qxF 'set -gq status-right-length 90' "$MOCK_TMUX_CALLS"
}

# ── Per-client SSH/MOSH tags from process ancestry ──

@test "RESP-NET-001 publishes ssh and mosh client ttys from process ancestry" {
  write_mock tmux '
case "${1:-}" in
  list-clients) printf "/dev/pts/3 100\n/dev/pts/4 200\n/dev/pts/5 300\n" ;;
  set|setw) printf "%s\n" "$*" >>"${MOCK_TMUX_CALLS:?}" ;;
esac
exit 0
'
  # pid -> "ppid comm": 100 under sshd, 200 under mosh-server, 300 under ttyd
  write_mock ps '
case "${@: -1}" in
  100) echo "101 tmux" ;;
  101) echo "102 bash" ;;
  102) echo "1 sshd" ;;
  200) echo "201 tmux" ;;
  201) echo "202 bash" ;;
  202) echo "1 mosh-server" ;;
  300) echo "301 tmux" ;;
  301) echo "1 ttyd" ;;
esac
'
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
  grep -qxF 'set -gq @ssh_clients  /dev/pts/3 ' "$MOCK_TMUX_CALLS"
  grep -qxF 'set -gq @mosh_clients  /dev/pts/4 ' "$MOCK_TMUX_CALLS"
  grep -qxF 'set -gq status-interval 5' "$MOCK_TMUX_CALLS"
}

@test "RESP-NET-002 without mosh clients the status refresh stays at 1s" {
  write_mock tmux '
case "${1:-}" in
  list-clients) printf "/dev/pts/5 300\n" ;;
  set|setw) printf "%s\n" "$*" >>"${MOCK_TMUX_CALLS:?}" ;;
esac
exit 0
'
  write_mock ps '
case "${@: -1}" in
  300) echo "301 tmux" ;;
  301) echo "1 ttyd" ;;
esac
'
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
  grep -qxF 'set -gq @mosh_clients  ' "$MOCK_TMUX_CALLS"
  grep -qxF 'set -gq status-interval 1' "$MOCK_TMUX_CALLS"
}

@test "RESP-HOOK-001 always exits 0 when a tmux set/setw call returns nonzero" {
  # Hook scripts run via 'run-shell -b'; a nonzero exit makes tmux flash
  # "'...tmux-responsive' returned 1" on the status line. The script must
  # never propagate a failed tmux call as its own exit code.
  write_mock tmux '
case "${1:-}" in
  display-message)
    case "${3:-}" in
      *client_width*)  printf "120\n" ;;
      *client_height*) printf "40\n" ;;
      *) printf "\n" ;;
    esac
    exit 0 ;;
  set|setw) exit 1 ;;   # simulate a failing tmux option write
  *) exit 0 ;;
esac
'
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
}

@test "RESP-HOOK-002 always exits 0 in a mosh environment" {
  export MOSH_KEY=fake-mosh-key
  export MOCK_TMUX_CLIENT_WIDTH=120
  export MOCK_TMUX_CLIENT_HEIGHT=40
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
}

@test "RESP-HOOK-003 always exits 0 when client dims are empty (no client / detached)" {
  write_mock tmux '
case "${1:-}" in
  display-message) printf "\n" ;;   # empty dims, as in a clientless hook
  set|setw) exit 0 ;;
  *) exit 0 ;;
esac
'
  run "$TMUX_BIN_DIR/tmux-responsive"
  [ "$status" -eq 0 ]
}
