# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-24 17:00:00 KST
**Commit:** 3686cac
**Branch:** master

## OVERVIEW

Bash-first tmux configuration and session-management toolkit symlinked as `~/.tmux`. Core behavior lives in `conf.d/*.conf` and `bin/*`, with a nested Bun/OpenTUI sessionizer at `tui/sessionizer`.

## STRUCTURE

```
tmux/
├── tmux.conf                # Root loader: sources conf.d/*.conf
├── sessionizer.conf         # SCAN_DIR + EXTRA_DIRS for session discovery
├── .github/workflows/       # Repo automation (labeler, stale, auto-merge)
├── bin/                     # Bash execution surface (session, sidebar, status)
│   ├── tmux-slack-notify    # Fire-and-forget POST to Slack bridge notify endpoint
│   └── tmux-slack-bridge-start  # Startup wrapper: dual mode (socket direct / HTTP cloudflared) + tsx exec
├── conf.d/
│   ├── 00-core.conf         # Terminal/perf baseline
│   ├── 10-theme.conf        # Tokyo Night palette
│   ├── 20-keys.conf         # Keybindings (prefix=C-a)
│   ├── 25-sidebar.conf      # Manual sidebar bindings
│   ├── 30-statusbar.conf    # Dual-line status + resize hook
│   ├── 35-slack-hooks.conf  # Slack notify hooks (session/client events)
│   └── 90-plugins.conf      # TPM + resurrect + continuum
├── layouts/                 # YAML layout templates per project
├── docs/
│   └── supermemory-governance.md
├── slack/tmux-bridge/       # Node.js + @slack/bolt Socket Mode service
│   ├── src/
│   │   ├── index.ts         # Bolt app + notify HTTP server entrypoint
│   │   ├── types.ts         # Shared type definitions
│   │   ├── lib/             # Core libraries (config, tmux, formatter, channels)
│   │   ├── commands/        # Slash command parser + dispatcher
│   │   └── actions/         # Button action + modal submission handlers
│   ├── SETUP.md             # Slack API console setup guide
│   └── .env.example         # Required env vars template
├── systemd/
│   ├── tmux-server.service  # User persistent tmux server
│   └── tmux-slack-bridge.service  # Slack bridge user service
├── tui/sessionizer/         # Bun + @opentui/solid TUI package
└── data/
    └── in-memoria.db        # Binary cache, never edit directly
```

## WHERE TO LOOK

| Task                     | Location                                           | Notes                                   |
| ------------------------ | -------------------------------------------------- | --------------------------------------- |
| Change keybindings       | `conf.d/20-keys.conf`                              | Includes opencode Home-key binding      |
| Sidebar behavior         | `conf.d/25-sidebar.conf` + `bin/tmux-sidebar*`     | Manual toggle/resizing + helpers        |
| Modify theme colors      | `conf.d/10-theme.conf`                             | Keep Tokyo Night parity with fzf colors |
| Tune performance         | `conf.d/00-core.conf`                              | `escape-time` and terminal options      |
| Session picker behavior  | `bin/tmux-sessionizer`                             | fzf flow + creation wizard              |
| TUI sessionizer behavior | `tui/sessionizer/AGENTS.md`                        | Package-local rules and commands        |
| Statusbar/render hooks   | `conf.d/30-statusbar.conf` + `bin/tmux-responsive` | Width-tiered status strategy            |
| Plugin persistence       | `conf.d/90-plugins.conf`                           | Resurrect/continuum expectations        |
| Supermemory governance   | `docs/supermemory-governance.md`                   | Policy-only; no direct runtime hooks    |
| Slack bridge behavior  | `slack/tmux-bridge/` + `bin/tmux-slack-notify` | Node+TS service, /tmux slash command, button UI, per-channel routing |
| Slack event hooks      | `conf.d/35-slack-hooks.conf`                   | 5 tmux hooks → notify endpoint        |
| Slack bridge setup     | `slack/tmux-bridge/SETUP.md`                   | Slack API console config walkthrough          |

## CODE MAP

| Symbol         | Type     | Location                          | Refs   | Role                                           |
| -------------- | -------- | --------------------------------- | ------ | ---------------------------------------------- |
| `App`          | Function | `tui/sessionizer/src/App.tsx`     | high   | Main OpenTUI screen and keyboard workflow      |
| `listSessions` | Function | `tui/sessionizer/src/lib/tmux.ts` | high   | Enumerates tmux sessions with metadata         |
| `switchClient` | Function | `tui/sessionizer/src/lib/tmux.ts` | high   | Session switching primitive used by UI/actions |
| `capturePanes` | Function | `tui/sessionizer/src/lib/tmux.ts` | medium | ANSI preview capture for selected session      |
| `scanDirs`     | Function | `tui/sessionizer/src/lib/dirs.ts` | medium | Candidate project directory discovery          |
| `handleCommand`| Function | `slack/tmux-bridge/src/commands/handler.ts` | high | Slack /tmux command dispatcher          |
| `listSessions` | Function | `slack/tmux-bridge/src/lib/tmux.ts`  | high   | Tmux session enumeration for Slack bridge      |
| `exec`         | Function | `slack/tmux-bridge/src/lib/tmux.ts`  | high   | child_process spawn wrapper with socket support |
| `registerActions`| Function | `slack/tmux-bridge/src/actions/handler.ts` | high | Button action + modal view_submission handlers |
| `resolveSessionChannel` | Function | `slack/tmux-bridge/src/lib/channels.ts` | high   | Dynamic per-session channel creation and resolution |
| `initChannelRegistry` | Function | `slack/tmux-bridge/src/lib/channels.ts` | high   | Startup channel sync: maps tmux sessions to Slack channels |

## CONVENTIONS

- Prefix is `C-a` (not `C-b`)
- Keep `escape-time` at `0` for TUI responsiveness
- Preserve deterministic `conf.d` ordering with numeric prefixes
- Keep Tokyo Night palette aligned across tmux/fzf/TUI helpers
- Opencode isolation is intentional: Home-key entry, cycle exclusion, statusbar pin
- Bash scripts are extensionless and use `#!/usr/bin/env bash`; major scripts use `set -euo pipefail`
- Session persistence is manual save/restore (`prefix+S` / `prefix+R`) with continuum auto-save disabled

## ANTI-PATTERNS

| Never                                                     | Why                                 |
| --------------------------------------------------------- | ----------------------------------- |
| Set `escape-time` > 0                                     | Breaks interactive responsiveness   |
| Add conf files without numeric prefix                     | Breaks deterministic load order     |
| Change fzf colors in one script only                      | Theme drift across tools            |
| Modify `data/in-memoria.db` directly                      | Binary cache, auto-generated        |
| Add memory automation without schema/ttl/redaction/audit  | Durable secret/noise risk           |
| Store raw pane/terminal/command-history content as memory | Sensitive data persistence risk     |
| Skip `tmux source-file` after `conf.d` edits              | Changes appear missing until reload |
| Commit `.env`                                             | Secret leakage                      |

## COMMANDS

```bash
# tmux runtime
tmux source-file ~/.tmux/tmux.conf

# TUI package
cd ~/.tmux/tui/sessionizer && bun test
cd ~/.tmux/tui/sessionizer && bun src/index.tsx --smoke

# service lifecycle
systemctl --user restart tmux-server.service

# Slack bridge
cd ~/.tmux/slack/tmux-bridge && npm install
cd ~/.tmux/slack/tmux-bridge && npx tsx src/index.ts
systemctl --user enable --now tmux-slack-bridge.service
```

## NOTES

- `.github/workflows/` currently handles labeling, stale cleanup, and trusted auto-merge; this repo has no heavy CI test pipeline yet
- `bin/tmux-auto-attach` is login-oriented flow; keep behavior aligned with shell startup assumptions
- `tmux-session-cycle` intentionally excludes `opencode` from PgUp/PgDn and Up/Down rotation
- Supermemory governance is policy-level in `docs/supermemory-governance.md`; preserve opencode boundary while applying controls upstream
- `slack/tmux-bridge/` is an independent Node+TS package; `.env` must be created from `.env.example` with Slack app credentials
- `conf.d/35-slack-hooks.conf` requires `bin/tmux-slack-notify` and running bridge service; hooks are no-op when bridge is down
- `tmux-slack-bridge.service` is `PartOf=tmux-server.service` and restarts on failure with 5s delay
- Slack bridge supports Socket Mode (default) with app-level token or HTTP mode with cloudflared tunnel
- Notifications route to `#opencode` (opencode session) or `#tmux` (all other sessions) via `resolveChannel()`
