#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  mkdir -p "$TEST_TMPDIR/pane"
  export MOCK_TMUX_PANE_PATH="$TEST_TMPDIR/pane"
  mock_tmux_list_sessions
  mock_git_status
}

teardown() {
  teardown_test_env
}

@test "clean repo shows branch name only" {
  export MOCK_GIT_BRANCH='main'
  export MOCK_GIT_DIFF_EXIT=0
  export MOCK_GIT_CACHED_DIFF_EXIT=0
  export MOCK_GIT_REV_LIST='0 0'
  export MOCK_GIT_STASH_LIST=''

  run "$TMUX_BIN_DIR/tmux-git-status"

  [ "$status" -eq 0 ]
  [ "$output" = " main" ]
}

@test "dirty repo shows branch and indicators" {
  export MOCK_GIT_BRANCH='feature/test'
  export MOCK_GIT_DIFF_EXIT=1
  export MOCK_GIT_CACHED_DIFF_EXIT=1
  export MOCK_GIT_REV_LIST='0 0'
  export MOCK_GIT_STASH_LIST=''

  run "$TMUX_BIN_DIR/tmux-git-status"

  [ "$status" -eq 0 ]
  [ "$output" = " feature/test*+" ]
}

@test "ahead and behind counts are appended" {
  export MOCK_GIT_BRANCH='main'
  export MOCK_GIT_DIFF_EXIT=0
  export MOCK_GIT_CACHED_DIFF_EXIT=0
  export MOCK_GIT_REV_LIST='2 3'
  export MOCK_GIT_STASH_LIST=''

  run "$TMUX_BIN_DIR/tmux-git-status"

  [ "$status" -eq 0 ]
  [ "$output" = " main↑2↓3" ]
}

@test "stash indicator is appended" {
  export MOCK_GIT_BRANCH='main'
  export MOCK_GIT_DIFF_EXIT=0
  export MOCK_GIT_CACHED_DIFF_EXIT=0
  export MOCK_GIT_REV_LIST='0 0'
  export MOCK_GIT_STASH_LIST=$'stash@{0}: WIP on main\nstash@{1}: WIP on feature\n'

  run "$TMUX_BIN_DIR/tmux-git-status"

  [ "$status" -eq 0 ]
  [ "$output" = " main≡2" ]
}

@test "non-git directory returns empty output" {
  export MOCK_GIT_BRANCH=''
  export MOCK_GIT_SHORT_HEAD=''
  export MOCK_GIT_SYMBOLIC_REF_EXIT=1
  export MOCK_GIT_REV_PARSE_EXIT=1
  export MOCK_GIT_DIFF_EXIT=0
  export MOCK_GIT_CACHED_DIFF_EXIT=0
  export MOCK_GIT_REV_LIST=''
  export MOCK_GIT_STASH_LIST=''

  run "$TMUX_BIN_DIR/tmux-git-status"

  [ -z "$output" ]
}
