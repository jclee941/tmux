#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  export FZF_LIB="$TMUX_BIN_DIR/lib/fzf-responsive"
}

teardown() {
  teardown_test_env
}

@test "fzf_preview_window keeps right preview on wide terminal" {
  run env COLUMNS=120 bash -c "source '$FZF_LIB'; fzf_preview_window 'right,60%,border-left'"
  [ "$status" -eq 0 ]
  [ "$output" = "right,60%,border-left" ]
}

@test "fzf_preview_window hides preview on narrow terminal (width<80)" {
  run env COLUMNS=50 bash -c "source '$FZF_LIB'; fzf_preview_window 'right,60%,border-left'"
  [ "$status" -eq 0 ]
  [ "$output" = "hidden" ]
}

@test "fzf_preview_window preserves kill-session desktop spec on wide terminal" {
  run env COLUMNS=120 bash -c "source '$FZF_LIB'; fzf_preview_window 'right:50%:wrap'"
  [ "$status" -eq 0 ]
  [ "$output" = "right:50%:wrap" ]
}

@test "fzf_preview_window hides regardless of desktop spec on narrow terminal" {
  run env COLUMNS=40 bash -c "source '$FZF_LIB'; fzf_preview_window 'right:50%:wrap'"
  [ "$status" -eq 0 ]
  [ "$output" = "hidden" ]
}

@test "fzf-consuming scripts source the shared helper" {
  for s in tmux-session-jump tmux-clipboard-history tmux-template-create tmux-session-kill; do
    grep -q 'lib/fzf-responsive' "$TMUX_BIN_DIR/$s"
  done
}

@test "fzf scripts no longer hardcode preview-window literal right percentages" {
  for s in tmux-session-jump tmux-clipboard-history tmux-template-create; do
    run grep -nE "preview-window='right,60%" "$TMUX_BIN_DIR/$s"
    [ "$status" -ne 0 ]
  done
}

@test "SP-LIB-001 fzf-responsive can be sourced twice under set -euo pipefail" {
  run bash --noprofile --norc -c "
    set -euo pipefail
    source '$FZF_LIB'
    source '$FZF_LIB'
    COLUMNS=50 fzf_preview_window 'right,60%,border-left'
  "
  [ "$status" -eq 0 ]
  [ "$output" = "hidden" ]
}

@test "SP-LIB-001b fzf-responsive has no readonly declaration" {
  run grep -nE '^[[:space:]]*readonly ' "$FZF_LIB"
  [ "$status" -ne 0 ]
}
