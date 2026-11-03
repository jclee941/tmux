# bin/ — tmux execution surface

## OVERVIEW
43 extensionless bash scripts + 7 `lib/` helpers (~3k LOC) called by conf.d bindings, hooks, `#()` status jobs, and systemd units. Own file: score 12 (50 files, 100% code, high reference centrality) with conventions stricter than plain bash.

## WHERE TO LOOK
| Domain | Scripts | Notes |
|--------|---------|-------|
| Status bar | `tmux-responsive`, `tmux-host-stats`, `tmux-remote-sys-probe`, `tmux-git-status`, `tmux-session-icon`, `tmux-sys-stats` | `#()` jobs rerun every `status-interval` (1 s; 5 s with a mosh client) |
| Sessions | `tmux-session-{cycle,jump,kill,rename,sync,dashboard,export,order}`, `tmux-opencode`, `tmux-auto-attach` | cycle = name order, no exclusions; Home → `tmux-opencode` (`opencode` session in ~) |
| Sessionizers | `tmux-sessionizer` + `lib/tmux-sessionizer-{common,wizard}`, `tmux-sessionizer-tui`, `tmux-template-create` | `-tui` runs the Bun TUI only if `<root>/tui/sessionizer` resolves, else execs `tmux-sessionizer` (root NOTES) |
| Pickers, popups | `tmux-popup`, `lib/fzf-responsive`, `tmux-{cheatsheet,command-palette,clipboard-history,url-open,file-open,ssh-picker}` | `tmux-cheatsheet` is the key reference — update with `conf.d/20-keys.conf` |
| Sidebar | `tmux-sidebar{,-init,-toggle}`, `lib/sidebar-{colors,render}` | `tmux-sidebar` is referenced by 10 files |
| Layouts | `tmux-layout-apply` | reads `~/.tmux/layouts/*.yml` (not repo `layouts/`) via `yq`; no-op without `yq` |
| Web terminal | `tmux-web-terminal` (659 LOC), `lib/tmux-web-gateway.js` (Node, 356 LOC) | ttyd + patched index (OSC 52 clipboard, drag-and-drop upload) |
| Alerts | `tmux-omo-notify` (ntfy daemon), `tmux-notify-long-command`, `tmux-bash-preexec` | |
| Runners | `tmux-run` (blocking, real exit code), `tmux-stream` (read-only live mirror) | `prefix+g`, `prefix+W` |
| Git hooks | `tmux-git-uncommitted`, `tmux-session-branch-log` | fired by `client-session-changed` |
| Slack glue | `tmux-slack-bridge-{start,setup}` | the Slack package also shells out to `tmux-session-sync`, `tmux-opencode` |
| Sizing | `lib/tmux-client-size` | `tmux_new_session_sized` |

## CONVENTIONS
- `#!/usr/bin/env bash` + `set -euo pipefail`, except hook and `#()` scripts: `set -uo pipefail` and an explicit final `exit 0`.
- Sourced files (`lib/*`, `tmux-bash-preexec`): no `set -e`/`-u` leak, no `readonly`, re-source guard that `return`s.
- Interactive popups: `tmux-popup CLIENT_W CLIENT_H W% H% CMD` → full screen below 80 cols or 24 rows.
- fzf previews: `--preview-window="$(fzf_preview_window 'right,60%,border-left')"` → `hidden` below 80 cols.
- User-facing sessions: `tmux_new_session_sized` so detached sessions don't inherit a phone's size.
- `tmux-host-stats --push <pfx>` sets `@<pfx>_<metric>` and pad3 `@<pfx>_<metric>_p`; status formats read the options, never parse `#()` output.
- Temp files: `mktemp` + trap. Optional tools: silent `command -v` guard.

## ANTI-PATTERNS
| Never | Why |
|-------|-----|
| `set -e` in a hook or status script | a nonzero exit flashes "returned 1" on the status line |
| `readonly` / `set -u` in sourced helpers | aborts or pollutes the caller shell |
| Source `tmux-auto-attach`; execute `tmux-bash-preexec` | the first calls `exit`; the second only works sourced |
| Direct `display-popup` or fixed `--preview-window=right,N%` | breaks phone layouts |
| Plain `tmux new-session -d` for user sessions | windows collapse to the last client's size |
| Let `tmux-web-terminal` start a tmux server | it must attach to the existing socket only |
| `resize-window` anywhere | `tests/tmux-window-size.bats` forbids manual sizing |

## TESTS
- bats suites in `tests/`; `tests/test_helper.bash` gives `setup_test_env` (`TEST_TMPDIR`, mock-bin first on `PATH`, `TMUX_BIN_DIR`), `write_mock <cmd> <body>`, `mock_tmux_list_sessions`.
- Mocked `tmux` never reaches a real server; from inside tmux still run `env -u TMUX TMUX_TMPDIR=$(mktemp -d) bats tests/`.
- Covered: responsive, popup (+ 20-keys), fzf-responsive, remote probe, sys-stats, git-status, session-icon/order, run, omo-notify, web-terminal, web-gateway, ttyd drop-in, shell-pollution, window-size. Not covered: sidebar, sessionizers, session-cycle/kill/sync, layout-apply.
