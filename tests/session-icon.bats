#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
}

teardown() {
  teardown_test_env
}

@test "known session names map to themed icons" {
  run "$TMUX_BIN_DIR/tmux-session-icon" opencode-main
  [ "$status" -eq 0 ]
  [ "$output" = "󰚩" ]

  run "$TMUX_BIN_DIR/tmux-session-icon" git-worktree
  [ "$status" -eq 0 ]
  [ "$output" = "" ]

  run "$TMUX_BIN_DIR/tmux-session-icon" docker-dev
  [ "$status" -eq 0 ]
  [ "$output" = "" ]

  run "$TMUX_BIN_DIR/tmux-session-icon" node-api
  [ "$status" -eq 0 ]
  [ "$output" = "" ]

  run "$TMUX_BIN_DIR/tmux-session-icon" tmux-lab
  [ "$status" -eq 0 ]
  [ "$output" = "" ]
}

@test "unknown session name falls back to uppercased first letter" {
  run "$TMUX_BIN_DIR/tmux-session-icon" workspace
  [ "$status" -eq 0 ]
  [ "$output" = "W" ]
}

@test "empty input falls back to question mark" {
  run "$TMUX_BIN_DIR/tmux-session-icon"
  [ "$status" -eq 0 ]
  [ "$output" = "?" ]
}
