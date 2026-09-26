#!/usr/bin/env bats

@test "new windows follow the most recently active client size" {
  local core="$BATS_TEST_DIRNAME/../conf.d/00-core.conf"

  [ "$(grep -cE '^setw -g window-size latest$' "$core")" -eq 1 ]
  grep -qE '^setw -g aggressive-resize on$' "$core"
}

@test "resize hooks do not force windows into manual sizing" {
  local root="$BATS_TEST_DIRNAME/.."

  run grep -R -nE '(^|[[:space:]])(resize-window|resizew)([[:space:]]|$)' \
    "$root/conf.d" "$root/bin"
  [ "$status" -ne 0 ]
}
