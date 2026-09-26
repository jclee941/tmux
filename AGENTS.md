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
│   ├── tmux-session-cycle   # PgUp/PgDn session rotation
│   ├── tmux-opencode        # Home key: create/switch to the 'opencode' session in ~
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
│   ├── tmux-popup           # Responsive popup wrapper: full-screen on mobile (64 LOC)
│   ├── tmux-responsive      # Per-client width-tiered statusbar + SSH/MOSH tags
│   ├── tmux-auto-attach     # Login shell auto-attach flow
│   ├── tmux-omo-notify      # ntfy push when an OmO pane goes idle (user service)
│   ├── tmux-command-palette  # fzf action picker for common operations (46 LOC)
│   ├── tmux-url-open        # URL extraction from pane via fzf (18 LOC)
│   ├── tmux-file-open       # File path extraction from pane via fzf (38 LOC)
│   ├── tmux-ssh-picker      # SSH config host picker via fzf (23 LOC)
│   ├── tmux-clipboard-history # tmux buffer ring browser via fzf (22 LOC)
│   ├── tmux-copy-word       # Smart word copy under cursor (17 LOC)
│   ├── tmux-pane-sync       # Synchronize-panes toggle (16 LOC)
│   ├── tmux-config-reload   # Reload config with settings diff (15 LOC)
│   ├── tmux-notify-long-command # Desktop notification for long commands (16 LOC)
│   ├── tmux-bash-preexec    # Source-safe shell preexec hook for command timing (58 LOC)
│   ├── tmux-cheatsheet      # Categorized keybinding reference popup (91 LOC)
│   ├── tmux-slack-bridge-start  # Startup wrapper: dual mode (socket direct / HTTP cloudflared) + tsx exec (124 LOC)
│   ├── tmux-slack-bridge-setup  # Interactive Slack app setup wizard (154 LOC)
│   ├── tmux-git-status       # Git branch + dirty/ahead/behind/stash status (28 LOC)
│   ├── tmux-git-uncommitted  # Track uncommitted changes per session (74 LOC)
│   ├── tmux-session-order    # Sessions sorted by most recently active (8 LOC)
│   ├── tmux-sys-stats        # CPU load + MEM usage for status bar (13 LOC)
│   ├── tmux-web-terminal     # ttyd web terminal launcher (36 LOC)
│   └── tmux-run              # Synchronous command runner: send-keys + wait-for + real exit code (118 LOC)
├── bin/lib/                 # Shared library modules
│   ├── tmux-sessionizer-common   # Shared sessionizer functions
│   ├── tmux-sessionizer-wizard   # Creation wizard logic
│   ├── sidebar-colors            # Sidebar color definitions
│   ├── sidebar-render            # Sidebar rendering engine
│   ├── fzf-responsive            # Responsive fzf preview-window helper (24 LOC)
│   └── tmux-web-gateway.js       # Upload endpoint + ttyd reverse proxy for browser file drop (~310 LOC)
├── conf.d/
│   ├── 00-core.conf         # Terminal/perf baseline + env propagation (60 LOC)
│   ├── 10-theme.conf        # Tokyo Night palette + pane border status (34 LOC)
│   ├── 20-keys.conf         # Keybindings (prefix=C-a) (98 LOC)
│   ├── 25-sidebar.conf      # Manual sidebar bindings (9 LOC)
│   ├── 30-statusbar.conf    # Three-line status (tabs + DEV pill, PRD pill) + client hooks
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
│   ├── mobile-access.md     # Phone setup (Tailscale + mosh + Termius), ntfy alerts, CF Access switch
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
│   ├── SETUP.md             # Slack API console setup guide
│   └── .env.example         # Required env vars template
├── telegram/tmux-bot/       # Node.js + grammY Telegram bot: pane mirror + OpenCode bridge
│   ├── AGENTS.md            # Package-local knowledge base
│   ├── THIRD_PARTY_NOTICES.md # MIT attribution for ported render/streaming code
│   └── src/
│       ├── index.ts         # Bot entrypoint: wires mirror + bridge
│       ├── lib/opencode/    # opencode SDK client, API wrappers, SSE event subscription
│       ├── lib/router.ts    # (chat,thread) -> tmux session -> directory routing
│       ├── lib/store/       # Binding persistence (crash-safe JSON)
│       ├── bot/             # Bridge commands, callbacks, stream coordinator
│       ├── render/          # Ported Markdown-to-Telegram rendering pipeline
│       └── streaming/       # Ported throttled edit-loop streamer
├── systemd/
│   ├── tmux-server.service          # User persistent tmux server
│   ├── tmux-slack-bridge.service    # Slack bridge user service
│   ├── tmux-omo-notify.service      # OmO idle push notifier (ntfy) user service
│   ├── tmux-web-terminal.service    # ttyd web terminal user service
│   ├── tmux-session-watch.path      # Watches ~/dev for new project directories
│   ├── tmux-session-watch.service   # Auto-syncs tmux sessions on ~/dev changes
│   ├── tmux-resurrect-save.service  # Pre-shutdown session save (PartOf tmux-server)
│   └── tmux-resurrect-save.sh       # Save script triggered by systemd
├── wezterm/
│   └── wezterm.lua           # WezTerm terminal configuration
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
| Session ordering (MRU)   | `bin/tmux-session-order`                           | 8 LOC helper for most-recently-active sort |
| Session icons            | `bin/tmux-session-icon`                            | Nerd Font icon mapper (wired into status-left) |
| Session dashboard        | `bin/tmux-session-dashboard`                       | `prefix+D` formatted table popup        |
| Session export           | `bin/tmux-session-export`                          | `prefix+B` export to YAML layout        |
| Session branch logging   | `bin/tmux-session-branch-log` + `conf.d/30-statusbar.conf` | Auto-logs session→branch via client-session-changed hook |
| Uncommitted tracking     | `bin/tmux-git-uncommitted` + `conf.d/30-statusbar.conf` | Per-session git status via hook         |
| Template creation        | `bin/tmux-template-create`                         | `prefix+n` quick-create from presets    |
| TUI sessionizer behavior | `tui/sessionizer/AGENTS.md`                        | Package-local rules and commands        |
| Statusbar/render hooks   | `conf.d/30-statusbar.conf` + `bin/tmux-responsive` | Per-client width tiers (`#{client_width}` branches) + zoom/sync/SSH/MOSH tags |
| Responsive fzf preview   | `bin/lib/fzf-responsive`                           | Hides preview on narrow screens (<80 cols)              |
| Popup accessibility      | `bin/tmux-popup` + `conf.d/20-keys.conf`           | Full-screen popups on narrow/short mobile clients       |
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
| Telegram bot (pane mirror) | `telegram/tmux-bot/AGENTS.md`                    | grammY bot, `tmux capture-pane` polling |
| Telegram OpenCode bridge | `telegram/tmux-bot/AGENTS.md`                      | SSE streaming bridge to `opencode serve`, sharing the bot process |
| Layout management        | `layouts/*.yml` + `bin/tmux-layout-apply`          | YAML templates per project + auto-detect |
| Session lifecycle        | `bin/tmux-session-kill`, `bin/tmux-session-rename`  | Kill with confirmation, rename flow     |
| Session rotation         | `bin/tmux-session-cycle`                           | PgUp/PgDn + prefix+j/k (mobile) |
| Session sync             | `bin/tmux-session-sync`                            | Sync tmux sessions with each other      |
| Bridge setup wizard      | `bin/tmux-slack-bridge-setup`                      | Interactive Slack app configuration      |
| Auto-attach              | `bin/tmux-auto-attach`                             | Login shell session attachment           |
| OmO idle alerts          | `bin/tmux-omo-notify` + `systemd/tmux-omo-notify.service` | ntfy push when an OmO pane goes quiet |
| Mobile access            | `docs/mobile-access.md`                            | Tailscale + mosh + Termius, CF Access switch |
| Web terminal             | `bin/tmux-web-terminal` + `systemd/tmux-web-terminal.service` | ttyd via Cloudflare Tunnel (ssh.jclee.me) |
| Browser file drop        | `bin/lib/tmux-web-gateway.js`                      | Drag-and-drop upload into the attached pane's cwd       |
| Session persistence svc  | `systemd/tmux-resurrect-save.service`              | Pre-shutdown session save               |

## CODE MAP

| Symbol                    | Type     | Location                                            | Refs   | Role                                                      |
| ------------------------- | -------- | --------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `tmux-sessionizer`        | Script   | `bin/tmux-sessionizer`                              | high   | fzf session picker + creation wizard                       |
| `tmux-sidebar`            | Script   | `bin/tmux-sidebar`                                  | high   | Tree sidebar display engine + session grouping             |
| `tmux-popup`              | Script   | `bin/tmux-popup`                                    | high   | Responsive display-popup wrapper: full-screen on mobile    |
| `tmux-responsive`         | Script   | `bin/tmux-responsive`                               | high   | Per-client width tiers + zoom/sync/SSH/MOSH tags      |
| `tmux-session-cycle`      | Script   | `bin/tmux-session-cycle`                            | medium | PgUp/PgDn + prefix+j/k (mobile) rotation |
| `tmux-omo-notify`         | Script   | `bin/tmux-omo-notify`                               | medium | Pane-silence OmO idle detector → ntfy push                 |
| `tmux-session-sync`       | Script   | `bin/tmux-session-sync`                             | medium | Sync tmux sessions with Slack channels                     |
| `tmux-session-jump`       | Script   | `bin/tmux-session-jump`                             | medium | MRU fzf session picker (prefix+Space)                      |
| `tmux-session-icon`       | Script   | `bin/tmux-session-icon`                             | high   | Nerd Font icon mapper (wired into status-left)             |
| `tmux-session-export`     | Script   | `bin/tmux-session-export`                           | low    | Export session layout to YAML                              |
| `tmux-session-branch-log` | Script   | `bin/tmux-session-branch-log`                       | low    | Log session→branch mapping on switch                       |
| `tmux-session-dashboard`  | Script   | `bin/tmux-session-dashboard`                        | medium | Formatted session table popup                              |
| `tmux-template-create`    | Script   | `bin/tmux-template-create`                          | low    | Quick-create session from preset templates                 |
| `tmux-layout-apply`       | Script   | `bin/tmux-layout-apply`                             | medium | Apply YAML layout templates + auto-detect                  |
| `tmux-slack-bridge-start` | Script   | `bin/tmux-slack-bridge-start`                       | low    | Startup wrapper: dual mode (socket direct / HTTP cloudflared) + tsx exec |
| `tmux-command-palette`    | Script   | `bin/tmux-command-palette`                          | medium | fzf action picker for common operations                    |
| `tmux-url-open`           | Script   | `bin/tmux-url-open`                                 | low    | URL extraction from pane via fzf                           |
| `tmux-file-open`          | Script   | `bin/tmux-file-open`                                | low    | File path extraction from pane via fzf                     |
| `tmux-ssh-picker`         | Script   | `bin/tmux-ssh-picker`                               | low    | SSH config host picker via fzf                             |
| `tmux-clipboard-history`  | Script   | `bin/tmux-clipboard-history`                        | low    | tmux buffer ring browser via fzf                           |
| `tmux-copy-word`          | Script   | `bin/tmux-copy-word`                                | low    | Smart word copy under cursor                               |
| `tmux-pane-sync`          | Script   | `bin/tmux-pane-sync`                                | low    | Synchronize-panes toggle with indicator                    |
| `tmux-config-reload`      | Script   | `bin/tmux-config-reload`                            | low    | Config reload with settings diff                           |
| `tmux-notify-long-command`| Script   | `bin/tmux-notify-long-command`                      | low    | Desktop notification for long-running commands             |
| `tmux-bash-preexec`       | Script   | `bin/tmux-bash-preexec`                             | low    | Source-safe shell preexec hook for command timing          |
| `tmux-cheatsheet`         | Script   | `bin/tmux-cheatsheet`                               | low    | Categorized keybinding reference popup                     |
| `tmux-git-status`         | Script   | `bin/tmux-git-status`                               | high   | Git branch + dirty/ahead/behind/stash for statusbar       |
| `tmux-git-uncommitted`    | Script   | `bin/tmux-git-uncommitted`                          | medium | Track uncommitted changes per session                      |
| `tmux-sys-stats`          | Script   | `bin/tmux-sys-stats`                                | high   | CPU load + MEM usage for status bar                        |
| `tmux-slack-bridge-setup` | Script   | `bin/tmux-slack-bridge-setup`                       | low    | Interactive Slack app setup wizard                         |
| `tmux-web-terminal`       | Script   | `bin/tmux-web-terminal`                             | low    | ttyd web terminal launcher for Cloudflare Tunnel           |
| `tmux-web-gateway.js`     | Node     | `bin/lib/tmux-web-gateway.js`                       | low    | Upload endpoint + ttyd proxy backing browser file drop     |
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
| `createStreamCoordinator` | Function | `telegram/tmux-bot/src/bot/stream-coordinator.ts`   | high   | SSE event -> `ResponseStreamer` dispatch for the Telegram bridge |
| `ResponseStreamer`        | Class    | `telegram/tmux-bot/src/streaming/response-streamer.ts` | high | Throttled edit-loop streamer, ported from opencode-telegram-bot |
| `createRouter`            | Function | `telegram/tmux-bot/src/lib/router.ts`               | high   | (chat,thread) -> tmux session -> directory routing          |
| `createBindingStore`      | Function | `telegram/tmux-bot/src/lib/store/bindings.ts`       | high   | Crash-safe JSON persistence for chat/session bindings        |
| `registerBridgeCommands`  | Function | `telegram/tmux-bot/src/bot/commands.ts`             | high   | `/sessions`, `/use`, `/new`, `/status`, `/abort`             |

## KEYBINDINGS

### No-prefix keys
| Key             | Action                  | Script/Command                     |
| --------------- | ----------------------- | ---------------------------------- |
| `F1`–`F5`       | Select window 1–5       | `select-window -t 1..5`           |
| `Alt+arrows`    | Pane navigation         | `select-pane -UDLR`               |
| `PgUp/PgDn`     | Session rotation        | `bin/tmux-session-cycle`           |
| `Alt+PgUp/PgDn` | Session rotation (alt)  | `bin/tmux-session-cycle`           |
| `Home`          | Home session (~)        | `bin/tmux-opencode`                |
| `prefix+j/k`    | Session cycle (mobile)  | `bin/tmux-session-cycle` next/prev |

### Prefix keys (C-a)
| Key         | Action                    | Script/Command                     |
| ----------- | ------------------------- | ---------------------------------- |
| `Space`     | Session jump (MRU)        | `bin/tmux-session-jump`            |
| `` ` ``     | Scratch popup             | `bin/tmux-popup --cwd '#{pane_current_path}' ... 75% 75%` |
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
| `C-h/C-l`  | Sidebar resize            | Sidebar shrink/grow (`conf.d/25-sidebar.conf`) |
| `b`         | Sidebar toggle            | `bin/tmux-sidebar-toggle`          |
| `p`         | Clipboard history         | `bin/tmux-clipboard-history`       |
| `y`         | Copy word under cursor    | `bin/tmux-copy-word`               |
| `u`         | Open URL from pane        | `bin/tmux-url-open`                |
| `e`         | Open file from pane       | `bin/tmux-file-open`               |
| `r`         | Reload config             | `bin/tmux-config-reload`           |
| `S`         | Save session (resurrect)  | `run-shell '~/.tmux/plugins/tmux-resurrect/scripts/save.sh'` |
| `R`         | Restore session           | `run-shell '~/.tmux/plugins/tmux-resurrect/scripts/restore.sh'` |
| `L`         | Last session              | `switch-client -l`                 |

## CONVENTIONS

- Prefix is `C-a` (not `C-b`)
- Keep `escape-time` at `0` for TUI responsiveness
- Preserve deterministic `conf.d` ordering with numeric prefixes
- Keep Tokyo Night palette aligned across tmux/fzf/TUI helpers
- fzf color string: `bg+:#292e42,fg:#a9b1d6,fg+:#c0caf5,hl:#bb9af7,hl+:#bb9af7,info:#7aa2f7,prompt:#7dcfff,pointer:#bb9af7,marker:#9ece6a,header:#565f89`
- Status tiers are chosen per client inside the formats (`#{client_width}` conditionals); never rewrite global status options from one client's width in a hook
- Bash scripts are extensionless and use `#!/usr/bin/env bash`; all scripts use `set -euo pipefail` or `set -uo pipefail` (omitting `-e` when scripts handle non-zero exits explicitly)
- Session persistence is manual save/restore (`prefix+S` / `prefix+R`) with continuum auto-save disabled
- Layout files are YAML with per-project window/pane definitions
- Sidebar scripts follow helper pattern: `tmux-sidebar-*` delegate to `tmux-sidebar` core
- Window tab format: `#I:#W` with zoom indicator `[Z]` and sync indicator `[S]`
- Status-left includes session icon via `bin/tmux-session-icon`
- Pane border shows `#{pane_current_command}` via `pane-border-format`
- `update-environment` includes `SSH_CONNECTION MOSH_KEY` for network indicator propagation
- Long command notification requires sourcing `bin/tmux-bash-preexec` in `.bashrc`; it is source-safe (no errexit/nounset/pipefail leak, idempotent) and must be sourced, not executed
- Use `bin/lib/fzf-responsive` for fzf `--preview-window` so previews hide on narrow screens
- Route interactive popups through `bin/tmux-popup` so they go full-screen on narrow/short mobile clients

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
| Hardcode `--preview-window=right,N%` in mobile-facing fzf pickers | Squeezes list on narrow screens; use `bin/lib/fzf-responsive` |
| Bind `display-popup` directly for interactive popups      | Breaks mobile full-screen; route via `bin/tmux-popup` |

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

# Telegram bot (pane mirror + OpenCode bridge)
cd ~/.tmux/telegram/tmux-bot && npm install
cd ~/.tmux/telegram/tmux-bot && npm test
cd ~/.tmux/telegram/tmux-bot && npm run typecheck
cd ~/.tmux/telegram/tmux-bot && npm start
systemctl --user enable --now tmux-telegram-bot.service
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

# OmO idle push (ntfy topic in ~/.config/tmux/omo-notify.env)
systemctl --user enable --now ~/.tmux/systemd/tmux-omo-notify.service
~/.tmux/bin/tmux-omo-notify --test

# Long command notifications (add to .bashrc)
[[ -n "${TMUX:-}" ]] && source ~/.tmux/bin/tmux-bash-preexec
```

## NOTES

- `.gitlab-ci.yml` handles slack-bridge CI tests (Node.js) - GitHub Actions migrated to GitLab CI
- `bin/tmux-auto-attach` is a standalone helper for login shell auto-attach; execute it (run as a subprocess) from `.bashrc`, do not source it (it calls `exit`), and do not call it from tmux config
- `tmux-session-cycle` rotates through every session in name order; no session is special-cased since opencode was retired for OmO
- Supermemory governance is policy-level in `docs/supermemory-governance.md`
- `slack/tmux-bridge/` is an independent Node+TS package; `.env` must be created from `.env.example` with Slack app credentials
- `tmux-slack-bridge.service` is `PartOf=tmux-server.service` and restarts on failure with 5s delay
- Slack bridge supports Socket Mode (default) with app-level token or HTTP mode with cloudflared tunnel
- All Slack notifications route to single `#opencode` channel via `getNotifyChannel()`
- OpenCode SDK integration: `/tmux oc` subcommands connect to `opencode serve` API for session management, prompting, todos, and diffs
- `bin/tmux-session-sync` bridges tmux session lifecycle; runs standalone or via `/tmux sync`
- `layouts/*.yml` templates define window/pane layouts per project; applied via `bin/tmux-layout-apply`
- `bin/tmux-layout-apply` includes `detect_layout()` for auto-detection based on directory name matching
- `bin/tmux-slack-bridge-setup` is a standalone one-time interactive Slack app setup wizard; run it manually to create `.env`
- `bin/tmux-web-terminal` serves ttyd on port 7681 (bound to `lo`), exposed via Cloudflare Tunnel at `ssh.jclee.me`; supports auto-reconnect, font/scrollback client-options, and per-deploy config via `WEB_TERMINAL_*` env vars
- Web terminal clipboard: stock ttyd/xterm.js ignores OSC 52, so `bin/tmux-web-terminal` generates a patched `index.html` at startup (default page + an OSC 52 handler that writes to `navigator.clipboard`, cached per ttyd version in `${XDG_CACHE_HOME:-~/.cache}/tmux/`) and serves it via `ttyd --index`. This makes tmux `set-clipboard on` yanks reach the browser clipboard. Do not remove the `--index` wiring or the tmux-side `set-clipboard on`
- Web terminal file drop: dragging files onto the browser terminal uploads them into the current path of the tmux pane that browser client is attached to. ttyd has no upload endpoint, so `bin/tmux-web-terminal` starts ttyd on a loopback-only backend port (first free port above `WEB_TERMINAL_PORT`) and gives the public port to `bin/lib/tmux-web-gateway.js`, which serves `POST /__tmux-upload` + `GET /__tmux-upload/target` and byte-level proxies everything else, including the terminal WebSocket. The drop overlay and XHR client are injected into the patched `index.html` alongside the OSC 52 handler. Uploads reuse ttyd's Basic Auth (identical `realm="ttyd"`, so the browser resends cached credentials), never overwrite (`name-1.ext` on collision), are capped by `WEB_TERMINAL_UPLOAD_MAX_MB` (default 100), and land the path in a tmux paste buffer plus a `display-message`. Set `WEB_TERMINAL_UPLOAD=0` to fall back to plain ttyd on the public port
- The browser tmux client is identified by walking `#{client_pid}` up to the ttyd pid, so a drop targets the pane seen in the browser even when a local terminal is attached to the same tmux server
- The active web terminal runs as the **system** `ttyd.service` (`/usr/lib/systemd/system/ttyd.service`) with a drop-in at `/etc/systemd/system/ttyd.service.d/override.conf` that runs `bin/tmux-web-terminal`, loads `/etc/default/ttyd` (non-secret config) + `/etc/ttyd/credential.env` (0600, Basic Auth secret), and sets `Restart=on-failure`. The legacy user-level `tmux-web-terminal.service` is disabled to avoid port 7681 contention
- CF Access app `ssh.jclee.me` (aud `4789bb71…`) exists but its policy is set to **bypass** (staged, not enforced); switch the policy to `allow` + owner email and set `WEB_TERMINAL_AUTH_HEADER=Cf-Access-Authenticated-User-Email` (commenting `WEB_TERMINAL_CREDENTIAL`) to remove the plaintext password from the ttyd cmdline Procedure and edge gate (expect `302` to cloudflareaccess.com before switching): `docs/mobile-access.md`
- Cloudflare Tunnel config lives at `/etc/cloudflared/config.yml` (system service), NOT `~/.cloudflared/config.yml`
- `tmux-session-watch.path` + `.service` enable automatic session sync when `~/dev` changes (new project directories)
- Session→branch logging is triggered by `client-session-changed` hook in `conf.d/30-statusbar.conf`, not by systemd
- `bin/tmux-notify-long-command` + `bin/tmux-bash-preexec` are standalone shell integrations for long-command desktop notifications; source `bin/tmux-bash-preexec` in `.bashrc`
- `tmux-config-reload` uses `mktemp` + trap cleanup for safe temp file handling
- `tmux-sidebar` supports session grouping and stale session indicators
- `tmux-responsive` tags SSH/MOSH per client: on `client-attached` it walks each client's process ancestry to `sshd`/`mosh-server` and publishes the ttys as `@ssh_clients`/`@mosh_clients`, which the formats match against `#{client_tty}`
- `tmux-resurrect-save.service` triggers save before shutdown; software-only solution (power loss requires UPS)
- 38 bash scripts in `bin/` totaling ~1846 LOC; 5 shared libraries in `bin/lib/` totaling ~353 LOC
- 6 conf files in `conf.d/` totaling ~242 LOC
- `telegram/tmux-bot/` merges two feature sets into one bot process: the pre-existing pane mirror (`tmux capture-pane` polling) and a newer OpenCode-native SSE bridge; both share the same `Bot` instance and allow-list middleware in `src/index.ts`
- The bridge's `src/render/` and `src/streaming/` are ported from the MIT-licensed [opencode-telegram-bot](https://github.com/grinev/opencode-telegram-bot); see `telegram/tmux-bot/THIRD_PARTY_NOTICES.md` for the full adapted-file list
- Bridge chat-to-session bindings persist in `telegram/tmux-bot/data/bindings.json` (path overridable via `BINDINGS_PATH`), written crash-safely: temp file → backup rotation → rename
- `~/.bashrc` exports `MOSH_SERVER_NETWORK_TMOUT=86400` above its non-interactive guard (bash reads it for ssh commands, which is how `mosh` starts mosh-server), so an orphaned mosh-server exits after a day
- `tmux-omo-notify` counts an OmO pane as working while `#{window_activity}` keeps advancing (the idle OmO TUI draws nothing) and pushes once after >=30s of work followed by >=20s of silence, unless a client typed in that session within 60s
