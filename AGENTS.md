# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-01 09:11 KST
**Commit:** 068f8fe
**Branch:** master

## OVERVIEW

Bash-first tmux configuration and session-management toolkit symlinked as `~/.tmux`. Core behavior lives in `conf.d/*.conf` and `bin/*`, with a nested Bun/OpenTUI sessionizer at `tui/sessionizer` and a Node.js Slack bridge at `slack/tmux-bridge`.

## STRUCTURE

```
tmux/
├── tmux.conf                # Root loader: sources conf.d/*.conf
├── sessionizer.conf         # SCAN_DIR + EXTRA_DIRS for session discovery
├── .github/workflows/       # Repo automation (labeler, stale, auto-merge)
├── bin/                     # Bash execution surface (session, sidebar, status)
│   ├── tmux-sessionizer     # fzf session picker + creation wizard (273 LOC)
│   ├── tmux-sessionizer-tui # Launch TUI sessionizer (Bun OpenTUI wrapper)
│   ├── tmux-sidebar         # Tree sidebar display engine (209 LOC)
│   ├── tmux-sidebar-init    # Sidebar initialization on session create
│   ├── tmux-sidebar-toggle  # Toggle sidebar visibility
│   ├── tmux-sidebar-responsive # Width-aware sidebar auto-resize
│   ├── tmux-sidebar-ensure  # Ensure sidebar exists before operations
│   ├── tmux-sidebar-add-all # Add sidebars to all existing sessions
│   ├── tmux-session-cycle   # PgUp/PgDn session rotation (excludes opencode)
│   ├── tmux-session-kill    # Safe session termination with confirmation
│   ├── tmux-session-rename  # Session rename with validation
│   ├── tmux-session-sync    # Sync tmux sessions with Slack channels (137 LOC)
│   ├── tmux-layout-apply    # Apply YAML layout templates to sessions
│   ├── tmux-responsive      # Width-tiered statusbar rendering
│   ├── tmux-auto-attach     # Login shell auto-attach flow
│   ├── tmux-opencode        # OpenCode session launcher
│   ├── tmux-slack-notify    # Fire-and-forget POST to Slack bridge notify endpoint
│   ├── tmux-slack-bridge-start  # Startup wrapper: dual mode (socket direct / HTTP cloudflared) + tsx exec
│   └── tmux-slack-bridge-setup  # Interactive Slack app setup wizard (154 LOC)
├── conf.d/
│   ├── 00-core.conf         # Terminal/perf baseline (47 LOC)
│   ├── 10-theme.conf        # Tokyo Night palette (31 LOC)
│   ├── 20-keys.conf         # Keybindings (prefix=C-a) (55 LOC)
│   ├── 25-sidebar.conf      # Manual sidebar bindings (9 LOC)
│   ├── 30-statusbar.conf    # Dual-line status + resize hook (26 LOC)
│   ├── 35-slack-hooks.conf  # Slack notify hooks (session/client events) (10 LOC)
│   └── 90-plugins.conf      # TPM + resurrect + continuum (18 LOC)
├── layouts/                 # YAML layout templates per project
│   ├── blacklist.yml
│   ├── default.yml
│   ├── proxmox.yml
│   ├── resume.yml
│   ├── safework.yml
│   ├── safework2.yml
│   └── splunk.yml
├── docs/
│   └── supermemory-governance.md
├── slack/tmux-bridge/       # Node.js + @slack/bolt Socket Mode service
│   ├── AGENTS.md            # Package-local knowledge base
│   ├── src/
│   │   ├── index.ts         # Bolt app + notify HTTP server entrypoint
│   │   ├── types.ts         # Shared type definitions
│   │   ├── lib/             # Core libraries (config, tmux, formatter, channels, opencode)
│   │   ├── commands/        # Slash command parser + dispatcher
│   │   ├── actions/         # Button action + modal submission handlers
│   │   └── __tests__/       # Vitest test suite
│   ├── SETUP.md             # Slack API console setup guide
│   └── .env.example         # Required env vars template
├── systemd/
│   ├── tmux-server.service  # User persistent tmux server
│   └── tmux-slack-bridge.service  # Slack bridge user service
├── tui/sessionizer/         # Bun + @opentui/solid TUI package
│   └── AGENTS.md            # Package-local knowledge base
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
| Slack bridge behavior    | `slack/tmux-bridge/AGENTS.md`                      | Package-local rules and commands        |
| Slack event hooks        | `conf.d/35-slack-hooks.conf`                       | 5 tmux hooks → notify endpoint         |
| Slack bridge setup       | `slack/tmux-bridge/SETUP.md`                       | Slack API console config walkthrough    |
| Layout management        | `layouts/*.yml` + `bin/tmux-layout-apply`          | YAML templates per project              |
| Session lifecycle        | `bin/tmux-session-kill`, `bin/tmux-session-rename`  | Kill with confirmation, rename flow     |
| Session rotation         | `bin/tmux-session-cycle`                           | PgUp/PgDn excluding opencode session    |
| Session sync             | `bin/tmux-session-sync`                            | Sync tmux sessions ↔ Slack channels     |
| Bridge setup wizard      | `bin/tmux-slack-bridge-setup`                      | Interactive Slack app configuration      |
| Auto-attach              | `bin/tmux-auto-attach`                             | Login shell session attachment           |
| OpenCode integration     | `bin/tmux-opencode`                                | Dedicated opencode session launcher      |

## CODE MAP

| Symbol                  | Type     | Location                                            | Refs   | Role                                                      |
| ----------------------- | -------- | --------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `tmux-sessionizer`      | Script   | `bin/tmux-sessionizer`                              | high   | fzf session picker + creation wizard                       |
| `tmux-sidebar`          | Script   | `bin/tmux-sidebar`                                  | high   | Tree sidebar display engine                                |
| `tmux-session-cycle`    | Script   | `bin/tmux-session-cycle`                            | medium | PgUp/PgDn rotation excluding opencode                      |
| `tmux-session-sync`     | Script   | `bin/tmux-session-sync`                             | medium | Sync tmux sessions with Slack channels                     |
| `tmux-layout-apply`     | Script   | `bin/tmux-layout-apply`                             | medium | Apply YAML layout templates to sessions                    |
| `tmux-responsive`       | Script   | `bin/tmux-responsive`                               | medium | Width-tiered statusbar rendering                           |
| `tmux-slack-bridge-setup` | Script | `bin/tmux-slack-bridge-setup`                       | low    | Interactive Slack app setup wizard                         |
| `App`                   | Function | `tui/sessionizer/src/App.tsx`                       | high   | Main OpenTUI screen and keyboard workflow                  |
| `listSessions`          | Function | `tui/sessionizer/src/lib/tmux.ts`                   | high   | Enumerates tmux sessions with metadata                     |
| `switchClient`          | Function | `tui/sessionizer/src/lib/tmux.ts`                   | high   | Session switching primitive used by UI/actions             |
| `capturePanes`          | Function | `tui/sessionizer/src/lib/tmux.ts`                   | medium | ANSI preview capture for selected session                  |
| `scanDirs`              | Function | `tui/sessionizer/src/lib/dirs.ts`                   | medium | Candidate project directory discovery                      |
| `handleCommand`         | Function | `slack/tmux-bridge/src/commands/handler.ts`         | high   | Slack /tmux command dispatcher                             |
| `listSessions`          | Function | `slack/tmux-bridge/src/lib/tmux.ts`                 | high   | Tmux session enumeration for Slack bridge                  |
| `exec`                  | Function | `slack/tmux-bridge/src/lib/tmux.ts`                 | high   | child_process spawn wrapper with socket support            |
| `registerActions`       | Function | `slack/tmux-bridge/src/actions/handler.ts`          | high   | Button action + modal view_submission handlers             |
| `resolveSessionChannel` | Function | `slack/tmux-bridge/src/lib/channels.ts`             | high   | Dynamic per-session channel creation and resolution        |
| `initChannelRegistry`   | Function | `slack/tmux-bridge/src/lib/channels.ts`             | high   | Startup channel sync: maps tmux sessions to Slack channels |
| `getClient`             | Function | `slack/tmux-bridge/src/lib/opencode.ts`             | high   | Lazy singleton @opencode-ai/sdk client                     |
| `formatSessionDashboard`| Function | `slack/tmux-bridge/src/lib/formatter.ts`            | high   | Slack Block Kit session dashboard builder                  |

## CONVENTIONS

- Prefix is `C-a` (not `C-b`)
- Keep `escape-time` at `0` for TUI responsiveness
- Preserve deterministic `conf.d` ordering with numeric prefixes
- Keep Tokyo Night palette aligned across tmux/fzf/TUI helpers
- Opencode isolation is intentional: Home-key entry, cycle exclusion, statusbar pin
- Bash scripts are extensionless and use `#!/usr/bin/env bash`; major scripts use `set -euo pipefail`
- Session persistence is manual save/restore (`prefix+S` / `prefix+R`) with continuum auto-save disabled
- Layout files are YAML with per-project window/pane definitions
- Sidebar scripts follow helper pattern: `tmux-sidebar-*` delegate to `tmux-sidebar` core

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
| Bypass `bin/tmux-sidebar` with direct tmux split commands | Breaks sidebar state tracking       |
| Add bin scripts without `#!/usr/bin/env bash` shebang     | Portability and exec failures       |

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
cd ~/.tmux/slack/tmux-bridge && npm test
cd ~/.tmux/slack/tmux-bridge && npm run typecheck
cd ~/.tmux/slack/tmux-bridge && npx tsx src/index.ts
systemctl --user enable --now tmux-slack-bridge.service

# Layout management
bin/tmux-layout-apply <layout-name>

# Session sync
bin/tmux-session-sync
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
- Notifications route to `#opencode` (opencode session) or per-session `tmux-*` channels via `resolveSessionChannel()`
- OpenCode SDK integration: `/tmux oc` subcommands connect to `opencode serve` API for session management, prompting, todos, and diffs
- `bin/tmux-session-sync` bridges tmux session lifecycle with Slack channel management; runs standalone or via `/tmux sync`
- `layouts/*.yml` templates define window/pane layouts per project; applied via `bin/tmux-layout-apply`
- `bin/tmux-slack-bridge-setup` is interactive — walks through Slack API console configuration and writes `.env`
- 22 bash scripts in `bin/` totaling ~1443 LOC; 7 conf files in `conf.d/` totaling ~196 LOC
