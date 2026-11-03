#!/usr/bin/env bats
# tmux-auto-attach: a Windows console (DA2 reply 0;10;1) whose DA1 reply does
# not list 52 (OSC 52) attaches as xterm-256color-nomouse, which lacks kmous, so
# tmux never turns on mouse reporting for it; Windows Terminal (DA1 lists 52)
# and every other terminal attach with their own TERM.

load ./test_helper.bash

setup() {
  setup_test_env
  export HOME="$TEST_TMPDIR/home"
  mkdir -p "$HOME"
  export SSH_CONNECTION="203.0.113.7 50000 192.0.2.1 22"
  export TERM=xterm-256color
  unset TMUX MOSH_KEY TERMINFO XDG_CACHE_HOME
  # Mock tmux: record the TERM the client would attach with, then "attach".
  write_mock tmux 'printf "%s\n" "$TERM" >"$TEST_TMPDIR/attach-term"'
}

teardown() {
  teardown_test_env
}

# Run tmux-auto-attach on a pty that answers its DA2+DA1 query with $1.
run_on_terminal() {
  python3 -I - "$TMUX_BIN_DIR/tmux-auto-attach" "$1" <<'PY'
import os, pty, select, sys, time

script, reply = sys.argv[1], os.fsencode(sys.argv[2])
pid, fd = pty.fork()
if pid == 0:
    os.execv(script, [script])
seen = b""
deadline = time.monotonic() + 10
while b"\x1b[c" not in seen and time.monotonic() < deadline:
    if select.select([fd], [], [], 1)[0]:
        try:
            seen += os.read(fd, 1024)
        except OSError:
            break
if b"\x1b[>c\x1b[c" not in seen:
    sys.exit("no DA2+DA1 query on the tty")
if reply:
    os.write(fd, reply)
while select.select([fd], [], [], 10)[0]:
    try:
        if not os.read(fd, 1024):
            break
    except OSError:
        break
_, status = os.waitpid(pid, 0)
sys.exit(os.waitstatus_to_exitcode(status))
PY
}

@test "Windows console without OSC 52 attaches as xterm-256color-nomouse" {
  run run_on_terminal $'\e[>0;10;1c\e[?61;6;7;14;21;22;23;24;28;32;42c'
  [ "$status" -eq 0 ]
  [ "$(cat "$TEST_TMPDIR/attach-term")" = "xterm-256color-nomouse" ]
  [[ "$(cat "$HOME/.cache/tmux/auto-attach.log")" == ""*" 203.0.113.7 "*" TERM=xterm-256color-nomouse" ]]
  # The compiled entry differs from xterm-256color only by the missing kmous.
  run infocmp -x -d xterm-256color xterm-256color-nomouse
  [ "$status" -eq 0 ]
  [ "$(printf '%s\n' "$output" | grep -c $'^\t')" -eq 1 ]
  [[ "$output" == *$'\tkmous: '*", NULL."* ]]
}

@test "Windows Terminal advertising OSC 52 keeps mouse reporting" {
  run run_on_terminal $'\e[>0;10;1c\e[?61;4;6;7;14;21;22;23;24;28;32;42;52c'
  [ "$status" -eq 0 ]
  [ "$(cat "$TEST_TMPDIR/attach-term")" = "xterm-256color" ]
}

@test "other terminals attach with their own TERM" {
  run run_on_terminal $'\e[>0;276;0c\e[?1;2c'
  [ "$status" -eq 0 ]
  [ "$(cat "$TEST_TMPDIR/attach-term")" = "xterm-256color" ]
}

@test "a terminal that never answers still attaches" {
  run run_on_terminal ''
  [ "$status" -eq 0 ]
  [ "$(cat "$TEST_TMPDIR/attach-term")" = "xterm-256color" ]
}

@test "without a tty no query is written" {
  run "$TMUX_BIN_DIR/tmux-auto-attach" </dev/null
  [ "$status" -eq 0 ]
  [[ "$output" != *$'\e[>c'* ]]
  [ "$(cat "$TEST_TMPDIR/attach-term")" = "xterm-256color" ]
}
