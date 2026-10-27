#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  unset WEB_TERMINAL_PORT WEB_TERMINAL_IFACE WEB_TERMINAL_SESSION
  unset WEB_TERMINAL_SOCKET WEB_TERMINAL_SOCKET_NAME WEB_TERMINAL_RUN_AS
  unset WEB_TERMINAL_MAX_CLIENTS WEB_TERMINAL_FONT_SIZE
  unset WEB_TERMINAL_CREDENTIAL WEB_TERMINAL_AUTH_HEADER
  unset WEB_TERMINAL_UPLOAD WEB_TERMINAL_BACKEND_PORT
  export XDG_CACHE_HOME="$TEST_TMPDIR/cache"
  export MOCK_TTYD_ARGV="$TEST_TMPDIR/ttyd-argv"
  export MOCK_NODE_ENV="$TEST_TMPDIR/node-env"
  : >"$MOCK_TTYD_ARGV"
  : >"$MOCK_NODE_ENV"

  # MOCK_TTYD_LISTEN keeps the backend port open so the gateway handoff can be
  # exercised; generate_index uses -p, so only the real start-up listens.
  write_mock ttyd '
if [[ "${1:-}" == "--version" ]]; then
  printf "ttyd version 1.7.4\n"
  exit 0
fi
# shellcheck disable=SC2016
printf "%s\n" "$*" >"${MOCK_TTYD_ARGV:?}"

[[ "${MOCK_TTYD_LISTEN:-0}" == "1" ]] || exit 0

port=""
prev=""
for arg in "$@"; do
  [[ "$prev" == "--port" ]] && port="$arg"
  prev="$arg"
done
[[ -n "$port" ]] || exit 0

exec python3 -c "
import socket, sys, time
sock = socket.socket()
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind((\"127.0.0.1\", int(sys.argv[1])))
sock.listen(8)
time.sleep(60)
" "$port"
'

  write_mock curl '
output=""
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "-o" ]]; then
    output="$2"
    shift 2
    continue
  fi
  shift
done
printf "<html><body></body></html>" >"$output"
'
}

teardown() {
  teardown_test_env
}

@test "tmux-web-terminal uses the stable DOM renderer for scrolling long-running OpenCode screens" {
  run env \
    WEB_TERMINAL_UPLOAD=0 \
    WEB_TERMINAL_IFACE=127.0.0.1 \
    WEB_TERMINAL_SESSION=main \
    WEB_TERMINAL_SOCKET_NAME=qa \
    WEB_TERMINAL_AUTH_HEADER=Cf-Access-Authenticated-User-Email \
    WEB_TERMINAL_MAX_CLIENTS=7 \
    WEB_TERMINAL_FONT_SIZE=18 \
    "$TMUX_BIN_DIR/tmux-web-terminal" --port 8765

  [ "$status" -eq 0 ]
  argv="$(cat "$MOCK_TTYD_ARGV")"
  [[ "$argv" == *"--interface 127.0.0.1"* ]]
  [[ "$argv" == *"--port 8765"* ]]
  [[ "$argv" == *"--auth-header Cf-Access-Authenticated-User-Email"* ]]
  [[ "$argv" == *"--max-clients 7"* ]]
  [[ "$argv" == *"--client-option fontSize=18"* ]]
  [[ "$argv" == *"--client-option rendererType=dom"* ]]
  [[ "$argv" != *"--client-option rendererType=canvas"* ]]
  [[ "$argv" == *"--client-option reconnect=5"* ]]
  [[ "$argv" == *"tmux -N -L qa attach-session -t main"* ]]
  [[ "$argv" != *"--credential"* ]]
}

@test "tmux-web-terminal defaults to enough client slots for page token and websocket connections" {
  run env \
    WEB_TERMINAL_UPLOAD=0 \
    WEB_TERMINAL_AUTH_HEADER=Cf-Access-Authenticated-User-Email \
    "$TMUX_BIN_DIR/tmux-web-terminal" --port 8765

  [ "$status" -eq 0 ]
  argv="$(cat "$MOCK_TTYD_ARGV")"
  [[ "$argv" == *"--max-clients 8"* ]]
}

@test "tmux-web-terminal injects a stable IME composition anchor and the file drop client" {
  run env \
    WEB_TERMINAL_UPLOAD=0 \
    WEB_TERMINAL_AUTH_HEADER=Cf-Access-Authenticated-User-Email \
    "$TMUX_BIN_DIR/tmux-web-terminal" --port 8765

  [ "$status" -eq 0 ]
  index_html="$XDG_CACHE_HOME/tmux/ttyd-index-1.7.4-patch-v7.html"
  [ -s "$index_html" ]
  grep -q 'tmux-ime-anchor' "$index_html"
  grep -q "document.addEventListener('compositionstart'" "$index_html"
  grep -q -- '--tmux-ime-left' "$index_html"
  grep -q 'tmux-drop-overlay' "$index_html"
  grep -q "window.addEventListener('drop'" "$index_html"
  grep -q "'/__tmux-upload'" "$index_html"
  argv="$(cat "$MOCK_TTYD_ARGV")"
  [[ "$argv" == *"-I $index_html"* ]]
}

@test "tmux-web-terminal hands the public port to the upload gateway and moves ttyd to loopback" {
  export MOCK_TTYD_LISTEN=1
  write_mock node '
{
  printf "argv=%s\n" "$*"
  printf "GATEWAY_IFACE=%s\n" "${GATEWAY_IFACE:-}"
  printf "GATEWAY_PORT=%s\n" "${GATEWAY_PORT:-}"
  printf "GATEWAY_BACKEND_PORT=%s\n" "${GATEWAY_BACKEND_PORT:-}"
  printf "GATEWAY_TTYD_PID=%s\n" "${GATEWAY_TTYD_PID:-}"
  printf "GATEWAY_TMUX_ARGS=%s\n" "${GATEWAY_TMUX_ARGS:-}"
} >"${MOCK_NODE_ENV:?}"
'

  run env \
    WEB_TERMINAL_IFACE=127.0.0.1 \
    WEB_TERMINAL_SOCKET_NAME=qa \
    WEB_TERMINAL_AUTH_HEADER=Cf-Access-Authenticated-User-Email \
    WEB_TERMINAL_BACKEND_PORT=8766 \
    "$TMUX_BIN_DIR/tmux-web-terminal" --port 8765

  [ "$status" -eq 0 ]
  argv="$(cat "$MOCK_TTYD_ARGV")"
  [[ "$argv" == *"--interface lo"* ]]
  [[ "$argv" == *"--port 8766"* ]]
  [[ "$argv" != *"--port 8765"* ]]

  env_dump="$(cat "$MOCK_NODE_ENV")"
  [[ "$env_dump" == *"tmux-web-gateway.js"* ]]
  [[ "$env_dump" == *"GATEWAY_IFACE=127.0.0.1"* ]]
  [[ "$env_dump" == *"GATEWAY_PORT=8765"* ]]
  [[ "$env_dump" == *"GATEWAY_BACKEND_PORT=8766"* ]]
  [[ "$env_dump" == *'GATEWAY_TMUX_ARGS=["-L","qa"]'* ]]
  [[ "$env_dump" != *"GATEWAY_TTYD_PID="$'\n'* ]]
}

@test "tmux-web-terminal runs ttyd directly on the public port when uploads are disabled" {
  run env \
    WEB_TERMINAL_UPLOAD=0 \
    WEB_TERMINAL_IFACE=127.0.0.1 \
    WEB_TERMINAL_AUTH_HEADER=Cf-Access-Authenticated-User-Email \
    "$TMUX_BIN_DIR/tmux-web-terminal" --port 8765

  [ "$status" -eq 0 ]
  argv="$(cat "$MOCK_TTYD_ARGV")"
  [[ "$argv" == *"--interface 127.0.0.1"* ]]
  [[ "$argv" == *"--port 8765"* ]]
  [ ! -s "$MOCK_NODE_ENV" ]
}

@test "tmux-web-terminal rejects conflicting tmux socket settings before ttyd" {
  local socket_path="$TEST_TMPDIR/tmux.sock"

  run env \
    WEB_TERMINAL_SOCKET="$socket_path" \
    WEB_TERMINAL_SOCKET_NAME=qa \
    "$TMUX_BIN_DIR/tmux-web-terminal" --port 8765

  [ "$status" -ne 0 ]
  [[ "$output" == *"WEB_TERMINAL_SOCKET and WEB_TERMINAL_SOCKET_NAME are mutually exclusive"* ]]
  [ ! -s "$MOCK_TTYD_ARGV" ]
}

@test "tmux-web-terminal rejects conflicting auth modes before ttyd" {
  run env \
    WEB_TERMINAL_AUTH_HEADER=Cf-Access-Authenticated-User-Email \
    WEB_TERMINAL_CREDENTIAL=user:secret \
    "$TMUX_BIN_DIR/tmux-web-terminal" --port 8765

  [ "$status" -ne 0 ]
  [[ "$output" == *"WEB_TERMINAL_AUTH_HEADER and WEB_TERMINAL_CREDENTIAL are mutually exclusive"* ]]
  [ ! -s "$MOCK_TTYD_ARGV" ]
}

@test "tmux-web-terminal refuses to create a replacement tmux server" {
  run env \
    WEB_TERMINAL_UPLOAD=0 \
    WEB_TERMINAL_AUTH_HEADER=Cf-Access-Authenticated-User-Email \
    "$TMUX_BIN_DIR/tmux-web-terminal" --port 8765

  [ "$status" -eq 0 ]
  argv="$(cat "$MOCK_TTYD_ARGV")"
  [[ "$argv" == *"tmux -N attach-session"* ]]
  [[ "$argv" != *"tmux attach-session"* ]]
}
