# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-04 18:00 KST
**Branch:** master

## OVERVIEW

Bash-first tmux configuration and session-management toolkit symlinked as `~/.tmux`. Core behavior lives in `conf.d/*.conf` and `bin/*`, with a nested Bun/OpenTUI sessionizer at `tui/sessionizer` and a Node.js Slack bridge at `slack/tmux-bridge`.

## STRUCTURE

```
tmux/
├── tmux.conf                # Root loader: sources conf.d/*.conf
├── sessionizer.conf         # SCAN_DIR + EXTRA_DIRS for session discovery
├── .gitlab-ci.yml           # GitLab CI for slack-bridge testing
├── bin/                     # Bash execution surface (session, sidebar, status)
│   ├── tmux-sessionizer     # fzf session picker + creation wizard (144 LOC)
│   ├── tmux-sessionizer-tui # Launch TUI sessionizer (Bun OpenTUI wrapper)
│   ├── tmux-sidebar         # Tree sidebar display engine (68 LOC)
│   ├── tmux-sidebar-init    # Sidebar initialization on session create
│   ├── tmux-sidebar-toggle  # Toggle sidebar visibility
│   ├── tmux-sidebar-responsive # Width-aware sidebar auto-resize
│   ├── tmux-sidebar-ensure  # Ensure sidebar exists before operations
│   ├── tmux-sidebar-add-all # Add sidebars to all existing sessions
│   ├── tmux-session-cycle   # PgUp/PgDn session rotation (excludes opencode)
│   ├── tmux-session-kill    # Safe session termination with confirmation
│   ├── tmux-session-rename  # Session rename with validation
│   ├── tmux-session-sync    # Sync tmux sessions with Slack channels (137 LOC)
│   ├── tmux-session-jump    # MRU fzf session picker (19 LOC)
│   ├── tmux-session-icon    # Nerd Font icon mapper for sessions (21 LOC)
│   ├── tmux-session-export  # Export session layout to YAML (50 LOC)
│   ├── tmux-session-branch-log # Log session→branch on switch (17 LOC)
│   ├── tmux-session-dashboard # Formatted session table popup (75 LOC)
│   ├── tmux-template-create # Quick-create session from preset templates (53 LOC)
│   ├── tmux-layout-apply    # Apply YAML layout templates to sessions (94 LOC)
│   ├── tmux-responsive      # Width-tiered statusbar rendering (67 LOC)
│   ├── tmux-auto-attach     # Login shell auto-attach flow
│   ├── tmux-opencode        # OpenCode session launcher
│   ├── tmux-command-palette  # fzf action picker for common operations (46 LOC)
│   ├── tmux-url-open        # URL extraction from pane via fzf (18 LOC)
│   ├── tmux-file-open       # File path extraction from pane via fzf (38 LOC)
│   ├── tmux-ssh-picker      # SSH config host picker via fzf (23 LOC)
│   ├── tmux-clipboard-history # tmux buffer ring browser via fzf (22 LOC)
│   ├── tmux-copy-word       # Smart word copy under cursor (17 LOC)
│   ├── tmux-pane-sync       # Synchronize-panes toggle (16 LOC)
│   ├── tmux-config-reload   # Reload config with settings diff (15 LOC)
│   ├── tmux-notify-long-command # Desktop notification for long commands (16 LOC)
│   ├── tmux-bash-preexec    # Sourceable shell preexec hook for command timing (31 LOC)
│   ├── tmux-cheatsheet      # Categorized keybinding reference popup (87 LOC)
│   ├── tmux-slack-bridge-start  # Startup wrapper: dual mode (socket direct / HTTP cloudflared) + tsx exec
│   ├── tmux-slack-bridge-setup  # Interactive Slack app setup wizard (154 LOC)
│   ├── tmux-git-status       # Git branch + dirty/ahead/behind/stash status (28 LOC)
│   ├── tmux-git-uncommitted  # Track uncommitted changes per session (73 LOC)
│   ├── tmux-session-order    # Sessions sorted by most recently active (8 LOC)
│   ├── tmux-sys-stats        # CPU load + MEM usage for status bar (13 LOC)
│   └── tmux-web-terminal     # ttyd web terminal launcher (36 LOC)
├── bin/lib/                 # Shared library modules
│   ├── tmux-sessionizer-common   # Shared sessionizer functions
│   ├── tmux-sessionizer-wizard   # Creation wizard logic
│   ├── sidebar-colors            # Sidebar color definitions
│   └── sidebar-render            # Sidebar rendering engine
├── conf.d/
│   ├── 00-core.conf         # Terminal/perf baseline + env propagation (60 LOC)
│   ├── 10-theme.conf        # Tokyo Night palette + pane border status (34 LOC)
│   ├── 20-keys.conf         # Keybindings (prefix=C-a) (98 LOC)
│   ├── 25-sidebar.conf      # Manual sidebar bindings (9 LOC)
│   ├── 30-statusbar.conf    # Dual-line status + resize/session-changed hooks (23 LOC)
│   └── 90-plugins.conf      # TPM + resurrect + continuum (18 LOC)
├── layouts/                 # YAML layout templates per project
│   ├── blacklist.yml
│   ├── default.yml
│   ├── proxmox.yml
│   ├── resume.yml
│   ├── safework.yml
│   ├── safework2.yml
│   └── splunk.yml
├── docs/                    # Policy and documentation
│   ├── supermemory-governance.md
│   ├── session-persistence-brainstorming.md
│   └── AGENTS.md
├── slack/tmux-bridge/       # Node.js + @slack/bolt Socket Mode service
│   ├── AGENTS.md            # Package-local knowledge base
│   ├── src/
│   │   ├── index.ts         # Bolt app + notify HTTP server entrypoint
│   │   ├── types.ts         # Shared type definitions
│   │   ├── lib/             # Core libraries (config, tmux, formatter, channels, opencode, idle-monitor)
│   │   ├── commands/        # Slash command parser + dispatcher
│   │   ├── actions/         # Button action + modal submission handlers
│   │   └── __tests__/       # Vitest test suite
│   ├── SETUP.md             # Slack API console setup guide
│   └── .env.example         # Required env vars template
├── systemd/
│   ├── tmux-server.service          # User persistent tmux server
│   ├── tmux-slack-bridge.service    # Slack bridge user service
│   ├── tmux-web-terminal.service    # ttyd web terminal user service
│   ├── tmux-session-watch.path      # Watches ~/dev for new project directories
│   ├── tmux-session-watch.service   # Auto-syncs tmux sessions on ~/dev changes
│   ├── tmux-resurrect-save.service  # Pre-shutdown session save (PartOf tmux-server)
│   └── tmux-resurrect-save.sh       # Save script triggered by systemd
├── tui/sessionizer/         # Bun + @opentui/solid TUI package
│   └── AGENTS.md            # Package-local knowledge base
└── data/
    └── in-memoria.db        # Binary cache, never edit directly
```

## WHERE TO LOOK

| Task                     | Location                                           | Notes                                   |
| ------------------------ | -------------------------------------------------- | --------------------------------------- |
| Change keybindings       | `conf.d/20-keys.conf`                              | 98 LOC, includes all prefix + non-prefix bindings |
| Sidebar behavior         | `conf.d/25-sidebar.conf` + `bin/tmux-sidebar*`     | Manual toggle/resizing + helpers        |
| Modify theme colors      | `conf.d/10-theme.conf`                             | Keep Tokyo Night parity with fzf colors |
| Tune performance         | `conf.d/00-core.conf`                              | `escape-time`, terminal opts, env propagation |
| Session picker behavior  | `bin/tmux-sessionizer`                             | fzf flow + creation wizard              |
| Session jump (MRU)       | `bin/tmux-session-jump`                            | `prefix+Space` MRU fzf picker           |
| Session icons            | `bin/tmux-session-icon`                            | Nerd Font icon mapper (wired into status-left) |
| Session dashboard        | `bin/tmux-session-dashboard`                       | `prefix+D` formatted table popup        |
| Session export           | `bin/tmux-session-export`                          | `prefix+B` export to YAML layout        |
| Session branch logging   | `bin/tmux-session-branch-log` + `conf.d/30-statusbar.conf` | Auto-logs session→branch via client-session-changed hook |
| Uncommitted tracking     | `bin/tmux-git-uncommitted` + `conf.d/30-statusbar.conf` | Per-session git status via hook         |
| Template creation        | `bin/tmux-template-create`                         | `prefix+n` quick-create from presets    |
| TUI sessionizer behavior | `tui/sessionizer/AGENTS.md`                        | Package-local rules and commands        |
| Statusbar/render hooks   | `conf.d/30-statusbar.conf` + `bin/tmux-responsive` | Width-tiered status + zoom/sync/network indicators |
| Plugin persistence       | `conf.d/90-plugins.conf`                           | Resurrect/continuum expectations        |
| Command palette          | `bin/tmux-command-palette`                         | `prefix+P` fzf action picker            |
| URL/file extraction      | `bin/tmux-url-open`, `bin/tmux-file-open`          | `prefix+u` / `prefix+e` pane extractors |
| SSH picker               | `bin/tmux-ssh-picker`                              | `prefix+s` SSH config host picker       |
| Clipboard/copy tools     | `bin/tmux-clipboard-history`, `bin/tmux-copy-word` | `prefix+p` / `prefix+y` buffer tools   |
| Pane synchronization     | `bin/tmux-pane-sync`                               | `prefix+Y` toggle sync-panes           |
| Config reload            | `bin/tmux-config-reload`                           | `prefix+r` reload with settings diff   |
| Long command alerts      | `bin/tmux-notify-long-command`, `bin/tmux-bash-preexec` | Desktop notification + preexec hook |
| Cheatsheet               | `bin/tmux-cheatsheet`                              | `prefix+?` categorized keybinding popup |
| Git status in statusbar  | `bin/tmux-git-status`                              | Branch + dirty/ahead/behind/stash       |
| Supermemory governance   | `docs/supermemory-governance.md`                   | Policy-only; no direct runtime hooks    |
| Session persistence      | `docs/session-persistence-brainstorming.md`        | Save/restore strategy docs              |
| Slack bridge behavior    | `slack/tmux-bridge/AGENTS.md`                      | Node.js @slack/bolt Socket Mode service |
| Slack bridge setup       | `slack/tmux-bridge/SETUP.md`                       | Slack API console config walkthrough    |
| Layout management        | `layouts/*.yml` + `bin/tmux-layout-apply`          | YAML templates per project + auto-detect |
| Session lifecycle        | `bin/tmux-session-kill`, `bin/tmux-session-rename`  | Kill with confirmation, rename flow     |
| Session rotation         | `bin/tmux-session-cycle`                           | PgUp/PgDn excluding opencode session    |
| Session sync             | `bin/tmux-session-sync`                            | Sync tmux sessions with each other      |
| Bridge setup wizard      | `bin/tmux-slack-bridge-setup`                      | Interactive Slack app configuration      |
| Auto-attach              | `bin/tmux-auto-attach`                             | Login shell session attachment           |
| OpenCode integration     | `bin/tmux-opencode`                                | Dedicated opencode session launcher      |
| Web terminal             | `bin/tmux-web-terminal` + `systemd/tmux-web-terminal.service` | ttyd via Cloudflare Tunnel (ssh.jclee.me) |
| Session persistence svc  | `systemd/tmux-resurrect-save.service`              | Pre-shutdown session save               |

## CODE MAP

| Symbol                    | Type     | Location                                            | Refs   | Role                                                      |
| ------------------------- | -------- | --------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `tmux-sessionizer`        | Script   | `bin/tmux-sessionizer`                              | high   | fzf session picker + creation wizard                       |
| `tmux-sidebar`            | Script   | `bin/tmux-sidebar`                                  | high   | Tree sidebar display engine + session grouping             |
| `tmux-responsive`         | Script   | `bin/tmux-responsive`                               | high   | Width-tiered statusbar + zoom/sync/network indicators      |
| `tmux-session-cycle`      | Script   | `bin/tmux-session-cycle`                            | medium | PgUp/PgDn rotation excluding opencode                      |
| `tmux-session-sync`       | Script   | `bin/tmux-session-sync`                             | medium | Sync tmux sessions with Slack channels                     |
| `tmux-session-jump`       | Script   | `bin/tmux-session-jump`                             | medium | MRU fzf session picker (prefix+Space)                      |
| `tmux-session-icon`       | Script   | `bin/tmux-session-icon`                             | high   | Nerd Font icon mapper (wired into status-left)             |
| `tmux-session-export`     | Script   | `bin/tmux-session-export`                           | low    | Export session layout to YAML                              |
| `tmux-session-branch-log` | Script   | `bin/tmux-session-branch-log`                       | low    | Log session→branch mapping on switch                       |
| `tmux-session-dashboard`  | Script   | `bin/tmux-session-dashboard`                        | medium | Formatted session table popup                              |
| `tmux-template-create`    | Script   | `bin/tmux-template-create`                          | low    | Quick-create session from preset templates                 |
| `tmux-layout-apply`       | Script   | `bin/tmux-layout-apply`                             | medium | Apply YAML layout templates + auto-detect                  |
| `tmux-command-palette`    | Script   | `bin/tmux-command-palette`                          | medium | fzf action picker for common operations                    |
| `tmux-url-open`           | Script   | `bin/tmux-url-open`                                 | low    | URL extraction from pane via fzf                           |
| `tmux-file-open`          | Script   | `bin/tmux-file-open`                                | low    | File path extraction from pane via fzf                     |
| `tmux-ssh-picker`         | Script   | `bin/tmux-ssh-picker`                               | low    | SSH config host picker via fzf                             |
| `tmux-clipboard-history`  | Script   | `bin/tmux-clipboard-history`                        | low    | tmux buffer ring browser via fzf                           |
| `tmux-copy-word`          | Script   | `bin/tmux-copy-word`                                | low    | Smart word copy under cursor                               |
| `tmux-pane-sync`          | Script   | `bin/tmux-pane-sync`                                | low    | Synchronize-panes toggle with indicator                    |
| `tmux-config-reload`      | Script   | `bin/tmux-config-reload`                            | low    | Config reload with settings diff                           |
| `tmux-notify-long-command`| Script   | `bin/tmux-notify-long-command`                      | low    | Desktop notification for long-running commands             |
| `tmux-bash-preexec`       | Script   | `bin/tmux-bash-preexec`                             | low    | Sourceable shell preexec hook for command timing           |
| `tmux-cheatsheet`         | Script   | `bin/tmux-cheatsheet`                               | low    | Categorized keybinding reference popup                     |
| `tmux-git-status`         | Script   | `bin/tmux-git-status`                               | medium | Git branch + dirty/ahead/behind/stash for statusbar       |
| `tmux-git-uncommitted`    | Script   | `bin/tmux-git-uncommitted`                          | medium | Track uncommitted changes per session                      |
| `tmux-slack-bridge-setup` | Script   | `bin/tmux-slack-bridge-setup`                       | low    | Interactive Slack app setup wizard                         |
| `tmux-web-terminal`       | Script   | `bin/tmux-web-terminal`                             | low    | ttyd web terminal launcher for Cloudflare Tunnel           |
| `App`                     | Function | `tui/sessionizer/src/App.tsx`                       | high   | Main OpenTUI screen and keyboard workflow                  |
| `listSessions`            | Function | `tui/sessionizer/src/lib/tmux.ts`                   | high   | Enumerates tmux sessions with metadata                     |
| `switchClient`            | Function | `tui/sessionizer/src/lib/tmux.ts`                   | high   | Session switching primitive used by UI/actions             |
| `capturePanes`            | Function | `tui/sessionizer/src/lib/tmux.ts`                   | medium | ANSI preview capture for selected session                  |
| `scanDirs`                | Function | `tui/sessionizer/src/lib/dirs.ts`                   | medium | Candidate project directory discovery                      |
| `handleCommand`           | Function | `slack/tmux-bridge/src/commands/handler.ts`         | high   | Slack /tmux command dispatcher                             |
| `listSessions`            | Function | `slack/tmux-bridge/src/lib/tmux.ts`                 | high   | Tmux session enumeration for Slack bridge                  |
| `exec`                    | Function | `slack/tmux-bridge/src/lib/tmux.ts`                 | high   | child_process spawn wrapper with socket support            |
| `registerActions`         | Function | `slack/tmux-bridge/src/actions/handler.ts`          | high   | Button action + modal view_submission handlers             |
| `getNotifyChannel`        | Function | `slack/tmux-bridge/src/lib/channels.ts`             | high   | Returns #opencode channel ID for all notifications         |
| `startIdleMonitor`        | Function | `slack/tmux-bridge/src/lib/idle-monitor.ts`         | high   | Periodic opencode idle detection → Slack notification      |
| `getClient`               | Function | `slack/tmux-bridge/src/lib/opencode.ts`             | high   | Lazy singleton @opencode-ai/sdk client                     |
| `formatSessionDashboard`  | Function | `slack/tmux-bridge/src/lib/formatter/session.ts`    | high   | Slack Block Kit session dashboard builder                  |

## KEYBINDINGS

### No-prefix keys
| Key             | Action                  | Script/Command                     |
| --------------- | ----------------------- | ---------------------------------- |
| `Home`          | Open OpenCode session   | `bin/tmux-opencode`                |
| `F1`–`F5`       | Select window 1–5       | `select-window -t 1..5`           |
| `Alt+arrows`    | Pane navigation         | `select-pane -UDLR`               |
| `PgUp/PgDn`     | Session rotation        | `bin/tmux-session-cycle`           |
| `Alt+PgUp/PgDn` | Session rotation (alt)  | `bin/tmux-session-cycle`           |

### Prefix keys (C-a)
| Key         | Action                    | Script/Command                     |
| ----------- | ------------------------- | ---------------------------------- |
| `Space`     | Session jump (MRU)        | `bin/tmux-session-jump`            |
| `` ` ``     | Scratch popup             | `display-popup -E -h 75% -w 75% -d '#{pane_current_path}'` |
| `/`         | Pane search               | `copy-mode; send-keys /`           |
| `=`         | Choose buffer             | `choose-buffer`                    |
| `?`         | Cheatsheet                | `bin/tmux-cheatsheet`              |
| `f` / `+`   | Sessionizer (TUI)        | `bin/tmux-sessionizer-tui`         |
| `n`         | Template create           | `bin/tmux-template-create`         |
| `s`         | SSH picker                | `bin/tmux-ssh-picker`              |
| `X`         | Kill session              | `bin/tmux-session-kill`            |
| `B`         | Export session layout     | `bin/tmux-session-export`          |
| `D`         | Session dashboard         | `bin/tmux-session-dashboard`       |
| `P`         | Command palette           | `bin/tmux-command-palette`         |
| `c`         | New window                | `new-window -c "#{pane_current_path}"` |
| `C-Space`   | Cycle layout              | `next-layout`                      |
| `\|`        | Split horizontal          | `split-window -h -c "#{pane_current_path}"` |
| `-`         | Split vertical            | `split-window -v -c "#{pane_current_path}"` |
| `M`         | Join pane                 | `join-pane`                        |
| `Y`         | Toggle pane sync          | `bin/tmux-pane-sync`               |
| `C-h/C-l`  | Sidebar resize            | Sidebar shrink/grow                |
| `b`         | Sidebar toggle            | `bin/tmux-sidebar-toggle`          |
| `p`         | Clipboard history         | `bin/tmux-clipboard-history`       |
| `y`         | Copy word under cursor    | `bin/tmux-copy-word`               |
| `u`         | Open URL from pane        | `bin/tmux-url-open`                |
| `e`         | Open file from pane       | `bin/tmux-file-open`               |
| `r`         | Reload config             | `bin/tmux-config-reload`           |
| `S`         | Save session (resurrect)  | `run resurrect_save`               |
| `R`         | Restore session           | `run resurrect_restore`            |
| `L`         | Last session              | `switch-client -l`                 |

## CONVENTIONS

- Prefix is `C-a` (not `C-b`)
- Keep `escape-time` at `0` for TUI responsiveness
- Preserve deterministic `conf.d` ordering with numeric prefixes
- Keep Tokyo Night palette aligned across tmux/fzf/TUI helpers
- fzf color string: `bg+:#292e42,fg:#a9b1d6,fg+:#c0caf5,hl:#bb9af7,hl+:#bb9af7,info:#7aa2f7,prompt:#7dcfff,pointer:#bb9af7,marker:#9ece6a,header:#565f89`
- Opencode isolation is intentional: Home-key entry, cycle exclusion, statusbar pin
- Bash scripts are extensionless and use `#!/usr/bin/env bash`; all scripts use `set -euo pipefail` or `set -uo pipefail` (omitting `-e` when scripts handle non-zero exits explicitly)
- Session persistence is manual save/restore (`prefix+S` / `prefix+R`) with continuum auto-save disabled
- Layout files are YAML with per-project window/pane definitions
- Sidebar scripts follow helper pattern: `tmux-sidebar-*` delegate to `tmux-sidebar` core
- Window tab format: `#I:#W` with zoom indicator `[Z]` and sync indicator `[S]`
- Status-left includes session icon via `bin/tmux-session-icon`
- Pane border shows `#{pane_current_command}` via `pane-border-format`
- `update-environment` includes `SSH_CONNECTION MOSH_KEY` for network indicator propagation
- Long command notification requires sourcing `bin/tmux-bash-preexec` in `.bashrc`

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
| Override `prefix+d` (detach)                              | Standard tmux behavior expectation  |
| Use fixed `/tmp` paths without `mktemp`                   | Race condition and cleanup risks    |

## COMMANDS

```bash
# tmux runtime
tmux source-file ~/.tmux.conf

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

# Session branch logging (systemd)
systemctl --user enable --now tmux-session-watch.path

# Session persistence (pre-shutdown save)
systemctl --user enable --now tmux-resurrect-save.service

# Web terminal
systemctl --user enable --now tmux-web-terminal.service

# Long command notifications (add to .bashrc)
source ~/.tmux/bin/tmux-bash-preexec
```

## NOTES

- `.gitlab-ci.yml` handles slack-bridge CI tests (Node.js) - GitHub Actions migrated to GitLab CI
- `bin/tmux-auto-attach` is login-oriented flow; keep behavior aligned with shell startup assumptions
- `tmux-session-cycle` intentionally excludes `opencode` from PgUp/PgDn and Up/Down rotation
- Supermemory governance is policy-level in `docs/supermemory-governance.md`; preserve opencode boundary while applying controls upstream
- `slack/tmux-bridge/` is an independent Node+TS package; `.env` must be created from `.env.example` with Slack app credentials
- `tmux-slack-bridge.service` is `PartOf=tmux-server.service` and restarts on failure with 5s delay
- Slack bridge supports Socket Mode (default) with app-level token or HTTP mode with cloudflared tunnel
- All Slack notifications route to single `#opencode` channel via `getNotifyChannel()`
- OpenCode SDK integration: `/tmux oc` subcommands connect to `opencode serve` API for session management, prompting, todos, and diffs
- `bin/tmux-session-sync` bridges tmux session lifecycle; runs standalone or via `/tmux sync`
- `layouts/*.yml` templates define window/pane layouts per project; applied via `bin/tmux-layout-apply`
- `bin/tmux-layout-apply` includes `detect_layout()` for auto-detection based on directory name matching
- `bin/tmux-slack-bridge-setup` is interactive — walks through Slack API console configuration and writes `.env`
- `bin/tmux-web-terminal` serves ttyd on port 7681, exposed via Cloudflare Tunnel at `ssh.jclee.me` with CF Access auth
- `tmux-web-terminal.service` is `PartOf=tmux-server.service` and auto-restarts on failure
- Cloudflare Tunnel config lives at `/etc/cloudflared/config.yml` (system service), NOT `~/.cloudflared/config.yml`
- `tmux-session-watch.path` + `.service` enable automatic session sync when `~/dev` changes (new project directories)
- Session→branch logging is triggered by `client-session-changed` hook in `conf.d/30-statusbar.conf`, not by systemd
- `tmux-bash-preexec` must be sourced in `.bashrc` to enable long-command desktop notifications
- `tmux-config-reload` uses `mktemp` + trap cleanup for safe temp file handling
- `tmux-sidebar` supports session grouping and stale session indicators
- `tmux-responsive` renders network indicator (SSH/Mosh) based on `SSH_CONNECTION`/`MOSH_KEY` env vars
- `tmux-resurrect-save.service` triggers save before shutdown; software-only solution (power loss requires UPS)
- 39 bash scripts in `bin/` totaling ~2118 LOC; 6 conf files in `conf.d/` totaling ~242 LOC
