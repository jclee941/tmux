#!/usr/bin/env bats
#
# tmux-remote-sys-probe output contract: "cpu mem disk steal gpu" — steal must
# stay before the possibly-empty gpu field so positional `read` never misaligns.

load ./test_helper.bash

setup() {
  setup_test_env
}

teardown() {
  teardown_test_env
}

@test "prints 4-5 fields: cpu mem disk steal [gpu]" {
  run "$TMUX_BIN_DIR/tmux-remote-sys-probe"
  [ "$status" -eq 0 ]
  local -a f
  read -ra f <<< "$output"
  [ "${#f[@]}" -ge 4 ]
  [ "${#f[@]}" -le 5 ]
}

@test "cpu mem disk steal fields are numeric percentages" {
  run "$TMUX_BIN_DIR/tmux-remote-sys-probe"
  [ "$status" -eq 0 ]
  local -a f
  read -ra f <<< "$output"
  [[ "${f[0]}" =~ ^[0-9]+$ ]]
  [[ "${f[1]}" =~ ^[0-9]+$ ]]
  [[ "${f[2]}" =~ ^[0-9]+$ ]]
  [[ "${f[3]}" =~ ^[0-9]+$ ]]
}

@test "steal is the 4th field so an empty gpu stays last" {
  run "$TMUX_BIN_DIR/tmux-remote-sys-probe"
  [ "$status" -eq 0 ]
  [[ "$output" =~ ^[0-9]+\ [0-9]+\ [0-9]+\ [0-9]+ ]]
}
