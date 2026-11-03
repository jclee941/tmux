#!/usr/bin/env bats

@test "system ttyd service runs as the tmux owner and cleans its client cgroup" {
  local drop_in="$BATS_TEST_DIRNAME/../systemd/ttyd.service.d/override.conf"

  run grep -Fx 'User=jclee' "$drop_in"
  [ "$status" -eq 0 ]

  run grep -Fx 'Group=jclee' "$drop_in"
  [ "$status" -eq 0 ]

  run grep -Fx 'Environment=HOME=/home/jclee' "$drop_in"
  [ "$status" -eq 0 ]

  run grep -Fx 'KillMode=control-group' "$drop_in"
  [ "$status" -eq 0 ]
}
