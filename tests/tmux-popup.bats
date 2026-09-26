#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  # Mock tmux: display-message returns injected client dims; display-popup is recorded.
  write_mock tmux '
if [[ "${1:-}" == "display-message" ]]; then
  fmt="${3:-}"
  case "$fmt" in
    *client_width*)  printf "%s\n" "${MOCK_TMUX_CLIENT_WIDTH:-999}" ;;
    *client_height*) printf "%s\n" "${MOCK_TMUX_CLIENT_HEIGHT:-999}" ;;
    *) printf "\n" ;;
  esac
  exit 0
fi
if [[ "${1:-}" == "display-popup" ]]; then
  printf "%s\n" "$*" >>"${MOCK_TMUX_POPUP_LOG:?}"
  exit 0
fi
exit 0
'
  export MOCK_TMUX_POPUP_LOG="$TEST_TMPDIR/popup.log"
  : >"$MOCK_TMUX_POPUP_LOG"
}

teardown() {
  teardown_test_env
}

@test "tmux-popup --print-size keeps requested desktop size on wide+tall client" {
  run "$TMUX_BIN_DIR/tmux-popup" --print-size 120 40 80% 60% 'true'
  [ "$status" -eq 0 ]
  [[ "$output" == *"-w 80%"* ]]
  [[ "$output" == *"-h 60%"* ]]
}

@test "tmux-popup --print-size forces full-screen on narrow client (width<80)" {
  run "$TMUX_BIN_DIR/tmux-popup" --print-size 50 40 80% 60% 'true'
  [ "$status" -eq 0 ]
  [[ "$output" == *"-w 100%"* ]]
  [[ "$output" == *"-h 100%"* ]]
}

@test "tmux-popup --print-size forces full-screen on short client (height<24)" {
  run "$TMUX_BIN_DIR/tmux-popup" --print-size 120 20 95% 90% 'true'
  [ "$status" -eq 0 ]
  [[ "$output" == *"-w 100%"* ]]
  [[ "$output" == *"-h 100%"* ]]
}

@test "tmux-popup launches display-popup -E with computed size and command" {
  run "$TMUX_BIN_DIR/tmux-popup" 120 40 70% 70% '~/.tmux/bin/tmux-command-palette'
  [ "$status" -eq 0 ]
  log="$(cat "$MOCK_TMUX_POPUP_LOG")"
  [[ "$log" == *"display-popup -E"* ]]
  [[ "$log" == *"-w 70%"* ]]
  [[ "$log" == *"-h 70%"* ]]
  [[ "$log" == *"tmux-command-palette"* ]]
}

@test "tmux-popup --cwd preserves start directory option for scratch popup" {
  run "$TMUX_BIN_DIR/tmux-popup" --cwd '/tmp' 120 40 75% 75% ''
  [ "$status" -eq 0 ]
  log="$(cat "$MOCK_TMUX_POPUP_LOG")"
  [[ "$log" == *"-d /tmp"* ]]
}

@test "all interactive popup bindings route through tmux-popup (no direct display-popup -w)" {
  local conf="$BATS_TEST_DIRNAME/../conf.d/20-keys.conf"
  # No interactive popup should call display-popup with a hardcoded -w percentage directly.
  run grep -nE 'display-popup -E -w [0-9]+%' "$conf"
  [ "$status" -ne 0 ]
  # Each interactive popup binding key must route through the helper. Asserting
  # the exact set (not a loose >=N count) so any single binding that silently
  # stops using tmux-popup is caught.
  grep -qE "^bind f run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind [+] run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind D run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind [?] run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind [\`] run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind Space run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind n run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind u run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind e run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind P run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind s run-shell '[^']*tmux-popup" "$conf"
  grep -qE "^bind p run-shell '[^']*tmux-popup" "$conf"
  # The MouseDown1Status new-session click must also route through the helper.
  grep -qE "run-shell .[^']*tmux-popup[^']*tmux-sessionizer-tui" "$conf"
  # Total occurrences must be exactly 13 (12 key bindings + 1 mouse click).
  local n
  n=$(grep -cE "tmux-popup " "$conf")
  [ "$n" -eq 13 ]
}

@test "popup bindings quote client dims so empty expansion stays positional" {
  local conf="$BATS_TEST_DIRNAME/../conf.d/20-keys.conf"
  run grep -nE 'tmux-popup' "$conf"
  [ "$status" -eq 0 ]
  # Every #{client_width} OCCURRENCE must be wrapped in quotes ("..." or
  # escaped \"...\") so an empty expansion keeps argv alignment. We count
  # OCCURRENCES (grep -oE | wc -l), not lines, so a line carrying both a
  # quoted and a bare reference is still caught.
  local total quoted
  total=$(grep -oE '#\{client_width\}' "$conf" | wc -l)
  quoted=$(grep -oE '("|\\")#\{client_width\}' "$conf" | wc -l)
  [ "$total" -gt 0 ]
  [ "$total" -eq "$quoted" ]
}

@test "tmux-popup --cwd handles a directory path containing spaces" {
  run "$TMUX_BIN_DIR/tmux-popup" --cwd '/tmp/has space' 120 40 75% 75% ''
  [ "$status" -eq 0 ]
  log="$(cat "$MOCK_TMUX_POPUP_LOG")"
  [[ "$log" == *"-d /tmp/has space"* ]]
}

@test "tmux-popup treats empty client dims as desktop (no crash, honors request)" {
  run "$TMUX_BIN_DIR/tmux-popup" --print-size '' '' 60% 50% 'true'
  [ "$status" -eq 0 ]
  [[ "$output" == *"-w 60%"* ]]
  [[ "$output" == *"-h 50%"* ]]
}
