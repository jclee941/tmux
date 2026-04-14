#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  mock_tmux_list_sessions
}

teardown() {
  teardown_test_env
}

@test "outputs sessions sorted by descending activity timestamp" {
  export MOCK_TMUX_LIST_SESSIONS=$'10|alpha\n30|charlie\n20|bravo\n'

  run "$TMUX_BIN_DIR/tmux-session-order"

  [ "$status" -eq 0 ]
  [ "$output" = $'charlie\nbravo\nalpha' ]
}

@test "handles a single session" {
  export MOCK_TMUX_LIST_SESSIONS=$'42|solo\n'

  run "$TMUX_BIN_DIR/tmux-session-order"

  [ "$status" -eq 0 ]
  [ "$output" = "solo" ]
}

@test "handles an empty session list" {
  export MOCK_TMUX_LIST_SESSIONS=''

  run "$TMUX_BIN_DIR/tmux-session-order"

  [ "$status" -eq 0 ]
  [ -z "$output" ]
}
