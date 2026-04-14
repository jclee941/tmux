#!/usr/bin/env bash

setup_test_env() {
  export TMUX_BIN_DIR="$BATS_TEST_DIRNAME/../bin"
  export TEST_TMPDIR
  TEST_TMPDIR="$(mktemp -d)"
  export TEST_ORIGINAL_PATH="$PATH"
  export TEST_REAL_AWK
  TEST_REAL_AWK="$(command -v awk)"
  export TEST_MOCK_BIN="$TEST_TMPDIR/mock-bin"
  mkdir -p "$TEST_MOCK_BIN"
  export PATH="$TEST_MOCK_BIN:$PATH"
}

teardown_test_env() {
  export PATH="$TEST_ORIGINAL_PATH"
  rm -rf "$TEST_TMPDIR"
}

write_mock() {
  local name="$1"
  local body="$2"

  printf '%s\n' "#!/usr/bin/env bash" >"$TEST_MOCK_BIN/$name"
  printf '%s\n' "set -euo pipefail" >>"$TEST_MOCK_BIN/$name"
  printf '%s\n' "$body" >>"$TEST_MOCK_BIN/$name"
  chmod +x "$TEST_MOCK_BIN/$name"
}

mock_tmux_list_sessions() {
  write_mock tmux '
if [[ "${1:-}" == "list-sessions" ]]; then
  printf "%s" "${MOCK_TMUX_LIST_SESSIONS:-}"
  exit 0
fi

if [[ "${1:-}" == "display-message" ]]; then
  printf "%s\n" "${MOCK_TMUX_PANE_PATH:-$PWD}"
  exit 0
fi

exit 1
'
}

mock_git_status() {
  write_mock git '
cmd="${1:-}"
shift || true

case "$cmd" in
  symbolic-ref)
    exit_code="${MOCK_GIT_SYMBOLIC_REF_EXIT:-0}"
    [[ "$exit_code" -ne 0 ]] && exit "$exit_code"
    printf "%s\n" "${MOCK_GIT_BRANCH:-}"
    ;;
  rev-parse)
    exit_code="${MOCK_GIT_REV_PARSE_EXIT:-0}"
    [[ "$exit_code" -ne 0 ]] && exit "$exit_code"
    if [[ "${1:-}" == "--short" && "${2:-}" == "HEAD" ]]; then
      printf "%s\n" "${MOCK_GIT_SHORT_HEAD:-}"
    fi
    ;;
  diff)
    if [[ "${1:-}" == "--cached" ]]; then
      exit "${MOCK_GIT_CACHED_DIFF_EXIT:-0}"
    fi
    exit "${MOCK_GIT_DIFF_EXIT:-0}"
    ;;
  rev-list)
    printf "%s\n" "${MOCK_GIT_REV_LIST:-}"
    ;;
  stash)
    if [[ "${1:-}" == "list" ]]; then
      printf "%s" "${MOCK_GIT_STASH_LIST:-}"
    fi
    ;;
  *)
    exit 1
    ;;
esac
'
}

mock_sys_stats_commands() {
  write_mock free '
printf "%s\n" "${MOCK_FREE_OUTPUT:-Mem: 1000 500 500 0 0 500}"
'

  write_mock uptime '
printf "%s\n" "${MOCK_UPTIME_OUTPUT:- 00:00:00 up 1 day,  1 user,  load average: 0.10, 0.20, 0.30}"
'

  write_mock nproc '
printf "%s\n" "${MOCK_NPROC_OUTPUT:-4}"
'

  write_mock awk '
case "$*" in
  *"/proc/loadavg"*)
    printf "%s\n" "${MOCK_LOADAVG_VALUE:-1.00}"
    ;;
  *"/proc/meminfo"*)
    printf "%s\n" "${MOCK_MEM_VALUE:-50}"
    ;;
  *"BEGIN {printf \"%.0f\", "*)
    printf "%s\n" "${MOCK_CPU_PERCENT:-25}"
    ;;
  *)
    "$TEST_REAL_AWK" "$@"
    ;;
esac
'
}
