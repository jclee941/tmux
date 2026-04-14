#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  mock_sys_stats_commands
}

teardown() {
  teardown_test_env
}

@test "outputs CPU and MEM percentages in statusbar format" {
  export MOCK_LOADAVG_VALUE='1.50'
  export MOCK_NPROC_OUTPUT='4'
  export MOCK_CPU_PERCENT='38'
  export MOCK_MEM_VALUE='57'

  run "$TMUX_BIN_DIR/tmux-sys-stats"

  [ "$status" -eq 0 ]
  [ "$output" = "38%/57%" ]
}

@test "works without free because implementation reads procfs directly" {
  export MOCK_LOADAVG_VALUE='0.20'
  export MOCK_NPROC_OUTPUT='8'
  export MOCK_CPU_PERCENT='3'
  export MOCK_MEM_VALUE='41'
  write_mock free 'exit 99'

  run "$TMUX_BIN_DIR/tmux-sys-stats"

  [ "$status" -eq 0 ]
  [ "$output" = "3%/41%" ]
}

@test "output stays compact for statusbar width" {
  export MOCK_LOADAVG_VALUE='9.99'
  export MOCK_NPROC_OUTPUT='1'
  export MOCK_CPU_PERCENT='100'
  export MOCK_MEM_VALUE='100'

  run "$TMUX_BIN_DIR/tmux-sys-stats"

  [ "$status" -eq 0 ]
  [ "$output" = "100%/100%" ]
  [ "${#output}" -le 10 ]
}
