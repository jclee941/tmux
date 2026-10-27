#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  mock_sys_stats_commands
}

teardown() {
  teardown_test_env
}

@test "outputs CPU MEM and DISK percentages in statusbar format" {
  export MOCK_MEM_VALUE='57'

  run "$TMUX_BIN_DIR/tmux-sys-stats"

  [ "$status" -eq 0 ]
  [[ "$output" =~ ^CPU\ ([0-9]|[1-9][0-9]|100)%\ MEM\ 57%\ DISK\ ([0-9]|[1-9][0-9]|100)%$ ]]
}

@test "works without free because implementation reads procfs directly" {
  export MOCK_MEM_VALUE='41'
  write_mock free 'exit 99'

  run "$TMUX_BIN_DIR/tmux-sys-stats"

  [ "$status" -eq 0 ]
  [[ "$output" =~ ^CPU\ ([0-9]|[1-9][0-9]|100)%\ MEM\ 41%\ DISK\ ([0-9]|[1-9][0-9]|100)%$ ]]
}

@test "output stays compact for statusbar width" {
  export MOCK_MEM_VALUE='100'

  run "$TMUX_BIN_DIR/tmux-sys-stats" --compact

  [ "$status" -eq 0 ]
  [[ "$output" =~ ^C([0-9]|[1-9][0-9]|100)\ M100\ D([0-9]|[1-9][0-9]|100)$ ]]
  [ "${#output}" -le 14 ]
}
