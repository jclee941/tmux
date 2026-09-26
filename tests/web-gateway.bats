#!/usr/bin/env bats

load ./test_helper.bash

setup() {
  setup_test_env
  export PANE_DIR="$TEST_TMPDIR/pane"
  export UPLOAD_DIR_MARKER="$TEST_TMPDIR/tmux-calls"
  mkdir -p "$PANE_DIR"
  : >"$UPLOAD_DIR_MARKER"

  write_mock tmux '
record() { printf "%s\n" "$*" >>"${UPLOAD_DIR_MARKER:?}"; }

case "${1:-}" in
  list-clients)
    printf "1700000000\t4242\t/dev/pts/9\n"
    ;;
  display-message)
    if [[ "$*" == *"pane_current_path"* ]]; then
      printf "%s\n" "${PANE_DIR:?}"
    else
      record "display-message $*"
    fi
    ;;
  set-buffer)
    record "set-buffer ${*:2}"
    ;;
  *)
    exit 1
    ;;
esac
'
}

teardown() {
  if [[ -n "${GATEWAY_PID:-}" ]]; then
    kill "$GATEWAY_PID" 2>/dev/null || true
    wait "$GATEWAY_PID" 2>/dev/null || true
  fi
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  teardown_test_env
}

free_port() {
  node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{process.stdout.write(String(s.address().port));s.close()})'
}

await_port() {
  local port="$1" attempt
  for ((attempt = 0; attempt < 200; attempt++)); do
    if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
      return 0
    fi
    sleep 0.02
  done
  return 1
}

start_gateway() {
  GATEWAY_PORT_NUM="$(free_port)"
  BACKEND_PORT_NUM="${1:-$(free_port)}"
  GATEWAY_IFACE=127.0.0.1 \
  GATEWAY_PORT="$GATEWAY_PORT_NUM" \
  GATEWAY_BACKEND_PORT="$BACKEND_PORT_NUM" \
    node "$TMUX_BIN_DIR/lib/tmux-web-gateway.js" >"$TEST_TMPDIR/gateway.log" 2>&1 &
  GATEWAY_PID=$!
  await_port "$GATEWAY_PORT_NUM"
}

start_backend() {
  BACKEND_PORT_NUM="$(free_port)"
  node -e '
    require("http").createServer((req, res) => {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("ttyd-backend:" + req.url);
    }).listen(Number(process.argv[1]), "127.0.0.1");
  ' "$BACKEND_PORT_NUM" &
  BACKEND_PID=$!
  await_port "$BACKEND_PORT_NUM"
}

@test "gateway writes a dropped file into the attached pane directory" {
  start_gateway
  printf 'hello drop' >"$TEST_TMPDIR/note.txt"

  run curl -sS -o "$TEST_TMPDIR/out.json" -w '%{http_code}' \
    -X POST "http://127.0.0.1:$GATEWAY_PORT_NUM/__tmux-upload" \
    -H 'X-Upload-Filename: note.txt' \
    --data-binary "@$TEST_TMPDIR/note.txt"

  [ "$output" = "200" ]
  [ -f "$PANE_DIR/note.txt" ]
  [ "$(cat "$PANE_DIR/note.txt")" = "hello drop" ]
  grep -q "\"path\":\"$PANE_DIR/note.txt\"" "$TEST_TMPDIR/out.json"
  grep -q "set-buffer $PANE_DIR/note.txt" "$UPLOAD_DIR_MARKER"
  grep -q "uploaded: $PANE_DIR/note.txt" "$UPLOAD_DIR_MARKER"
}

@test "gateway never overwrites an existing file" {
  start_gateway
  printf 'original' >"$PANE_DIR/note.txt"
  printf 'dropped' >"$TEST_TMPDIR/note.txt"

  run curl -sS -o /dev/null -w '%{http_code}' \
    -X POST "http://127.0.0.1:$GATEWAY_PORT_NUM/__tmux-upload" \
    -H 'X-Upload-Filename: note.txt' \
    --data-binary "@$TEST_TMPDIR/note.txt"

  [ "$output" = "200" ]
  [ "$(cat "$PANE_DIR/note.txt")" = "original" ]
  [ "$(cat "$PANE_DIR/note-1.txt")" = "dropped" ]
}

@test "gateway confines traversal filenames to the pane directory" {
  start_gateway
  printf 'pwned' >"$TEST_TMPDIR/payload"

  run curl -sS -o /dev/null -w '%{http_code}' \
    -X POST "http://127.0.0.1:$GATEWAY_PORT_NUM/__tmux-upload" \
    -H "X-Upload-Filename: $(printf '%%2e%%2e%%2f%%2e%%2e%%2fescaped.txt')" \
    --data-binary "@$TEST_TMPDIR/payload"

  [ "$output" = "200" ]
  [ ! -e "$TEST_TMPDIR/escaped.txt" ]
  [ -f "$PANE_DIR/.._.._escaped.txt" ]
}

@test "gateway rejects an upload without the terminal credential" {
  export WEB_TERMINAL_CREDENTIAL='jclee:secret'
  start_gateway
  printf 'nope' >"$TEST_TMPDIR/payload"

  run curl -sS -o /dev/null -w '%{http_code}' \
    -X POST "http://127.0.0.1:$GATEWAY_PORT_NUM/__tmux-upload" \
    -H 'X-Upload-Filename: payload' \
    --data-binary "@$TEST_TMPDIR/payload"

  [ "$output" = "401" ]
  [ -z "$(ls -A "$PANE_DIR")" ]

  run curl -sS -o /dev/null -w '%{http_code}' -u 'jclee:secret' \
    -X POST "http://127.0.0.1:$GATEWAY_PORT_NUM/__tmux-upload" \
    -H 'X-Upload-Filename: payload' \
    --data-binary "@$TEST_TMPDIR/payload"

  [ "$output" = "200" ]
  [ -f "$PANE_DIR/payload" ]
}

@test "gateway rejects a file over the size cap without leaving a partial" {
  export WEB_TERMINAL_UPLOAD_MAX_MB=1
  start_gateway
  head -c 2000000 /dev/zero >"$TEST_TMPDIR/big.bin"

  run curl -sS -o /dev/null -w '%{http_code}' \
    -X POST "http://127.0.0.1:$GATEWAY_PORT_NUM/__tmux-upload" \
    -H 'X-Upload-Filename: big.bin' \
    --data-binary "@$TEST_TMPDIR/big.bin"

  [ "$output" = "413" ]
  [ ! -e "$PANE_DIR/big.bin" ]
}

@test "gateway reports the drop target directory" {
  start_gateway

  run curl -sS "http://127.0.0.1:$GATEWAY_PORT_NUM/__tmux-upload/target"

  [ "$status" -eq 0 ]
  [[ "$output" == *"\"dir\":\"$PANE_DIR\""* ]]
}

@test "gateway proxies every non-upload request to the ttyd backend" {
  start_backend
  start_gateway "$BACKEND_PORT_NUM"

  run curl -sS "http://127.0.0.1:$GATEWAY_PORT_NUM/token"

  [ "$status" -eq 0 ]
  [ "$output" = "ttyd-backend:/token" ]
}
