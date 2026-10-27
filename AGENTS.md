# PROJECT KNOWLEDGE BASE

**Generated:** 2026-09-26
**Commit:** 6d15e71
**Branch:** master

## OVERVIEW
Bash-first tmux config + session toolkit that runs live from this checkout: `~/.tmux.conf` → `tmux.conf`, and `~/.tmux/{bin,conf.d,systemd,slack,telegram}` are symlinks here, so edits hit the running setup. Nested TS packages: Bun TUI sessionizer, Slack bridge, Telegram bot.

## STRUCTURE
```
tmux/
├── tmux.conf           # loader: sources conf.d/*.conf in numeric order
├── sessionizer.conf    # SCAN_DIR / EXTRA_DIRS template (runtime reads ~/.tmux/sessionizer.conf)
├── conf.d/             # 00-core 10-theme 20-keys 25-sidebar 30-statusbar 90-plugins
├── bin/                # 43 bash scripts + lib/ → bin/AGENTS.md
├── tests/              # bats suites for bin/ and conf.d (see bin/AGENTS.md)
├── layouts/            # YAML templates (runtime reads ~/.tmux/layouts, a separate dir)
├── systemd/            # user units + ttyd.service.d drop-in for the system ttyd
├── docs/               # mobile-access runbook, persistence + memory policy
├── tui/sessionizer/    # Bun + @opentui/solid picker → own AGENTS.md
├── slack/tmux-bridge/  # Node + @slack/bolt /tmux bridge → own AGENTS.md
├── telegram/tmux-bot/  # Node + grammY mirror + OpenCode bridge → own AGENTS.md
├── wezterm/            # wezterm.lua (client terminal config)
├── .github/            # org-templated Actions: CI, auto-PR, release (bot-managed)
└── data/in-memoria.db  # ignored local binary cache
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Key bindings | `conf.d/20-keys.conf` | 51 binds; mirror changes in `bin/tmux-cheatsheet` (`prefix+?`) |
| Status bar | `conf.d/30-statusbar.conf` + `bin/tmux-responsive` | 3 lines; both pin `status 3` |
| DEV/PRD pills | `bin/tmux-host-stats`, `bin/tmux-remote-sys-probe` | PRD = `192.168.50.220` over ssh |
| Terminal baseline | `conf.d/00-core.conf` | truecolor, OSC 52 `clipboard` feature, `window-size latest` |
| Theme | `conf.d/10-theme.conf` | Tokyo Night |
| Save/restore | `conf.d/90-plugins.conf`, `systemd/tmux-resurrect-save.*` | manual save/restore, save on shutdown, pane contents off |
| Web terminal | `bin/tmux-web-terminal`, `bin/lib/tmux-web-gateway.js`, `systemd/ttyd.service.d/` | system `ttyd.service` |
| Phone access, alerts | `docs/mobile-access.md`, `bin/tmux-omo-notify` | Tailscale + mosh, ntfy, CF Access switch |
| Project layouts | `bin/tmux-layout-apply` | reads `~/.tmux/layouts` |
| Memory policy | `docs/supermemory-governance.md` | policy only, no runtime hooks |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `tmux-sidebar` | Script | `bin/tmux-sidebar` | 10 files | sidebar engine (init/toggle/render) |
| `tmux-sessionizer` | Script | `bin/tmux-sessionizer` | 8 files | fzf picker + creation wizard |
| `tmux-layout-apply` | Script | `bin/tmux-layout-apply` | 6 files | YAML layouts via `yq` |
| `fzf_preview_window` | Function | `bin/lib/fzf-responsive` | 6 files | preview hidden below 80 cols |
| `tmux-web-terminal` | Script | `bin/tmux-web-terminal` | 5 files | ttyd supervisor + patched index |
| `tmux-responsive` | Script | `bin/tmux-responsive` | 4 files | per-client status tiers, SSH/MOSH tags |
| `tmux_new_session_sized` | Function | `bin/lib/tmux-client-size` | 4 files | size new sessions to the active client |
| `THEME` | Const | `tui/sessionizer/src/lib/theme.ts` | 70 refs | TUI palette |
| `config` | Object | `slack/tmux-bridge/src/lib/config.ts` | 68 refs | Slack bridge env config |
| `ResponseStreamer` | Class | `telegram/tmux-bot/src/streaming/response-streamer.ts` | 45 refs | Telegram edit-loop streamer |

## CONVENTIONS
- Prefix `C-a`; `prefix+d` stays detach; `escape-time 0`.
- Execute `bin/tmux-auto-attach`; do not source it (it exits the caller shell).
- Non-prefix keys: F1–F5 windows, Alt+arrows panes, PgUp/PgDn (+Alt) session cycle, Home → `opencode` session in ~; `prefix+j/k` cycles on phone keyboards.
- `conf.d/NN-*.conf`: the numeric prefix is the load order.
- Status tiers are per client: formats branch on `#{client_width}`; hooks never rewrite global options from one client's width.
- Status layout: [0] tmux default (windows, git, time; compact local stats only below 40 cols), [1] session tabs + DEV pill, [2] PRD pill. Pills draw at ≥40 cols (one-letter labels below 80) and the DEV pill is padded so its columns line up with PRD; the tabs are a tmux list, so a short line trims them around the current session instead of cutting the DEV pill.
- Inside `#{?…}` branches, styles use spaces (`#[fg=x bold]`); a comma splits the branch.
- Tokyo Night across tmux, fzf, TUI; fzf `--color='bg+:#292e42,fg:#a9b1d6,fg+:#c0caf5,hl:#bb9af7,hl+:#bb9af7,info:#7aa2f7,prompt:#7dcfff,pointer:#bb9af7,marker:#9ece6a,header:#565f89'`.
- Persistence is manual (`prefix+S` / `prefix+R`); continuum auto-save is off.

## ANTI-PATTERNS (THIS PROJECT)
| Never | Why |
|-------|-----|
| `escape-time` > 0 | TUI input lag |
| Rewrite global status options from a hook | one client's tier leaks to every client |
| `set -gu 'status-format[0]'` | deletes line 0 (blank row); reset the array with `set -gu status-format` |
| Change fzf colors in one script only | theme drift |
| `git checkout <branch>` in this directory | live `~/.tmux` switches instantly; merge in a `git worktree` |
| Commit `.env`, `.omo/`, `.omc/`, `.briefing/`, `.debug-journal.md` | secrets / agent state |
| Edit `data/in-memoria.db` | generated binary cache |
| Store raw pane, terminal, or shell-history text as memory | sensitive data (`docs/supermemory-governance.md`) |

## UNIQUE STYLES
- Scripts are extensionless `tmux-*`; tmux user options are `@name` (`@dev_cpu_p`, `@ssh_clients`, `@mosh_clients`).
- Long "why" comments atop scripts and conf blocks are the design record; keep them current with the code.

## COMMANDS
```bash
tmux source-file ~/.tmux.conf                      # full reload (or source a single conf.d file)
tmux source-file -n conf.d/30-statusbar.conf       # parse-only check
env -u TMUX TMUX_TMPDIR=$(mktemp -d) bats tests/   # 99 tests, isolated from the live server
systemctl --user restart tmux-server.service
~/.tmux/bin/tmux-omo-notify --test                 # ntfy delivery check
```
Package commands live in each package's AGENTS.md.

## NOTES
- GitHub `jclee941/tmux` is PUBLIC; `master` is protected (PR + jclee-bot checks) and bots push to it (README, deps), so fetch before merging. `.gitlab-ci.yml` is legacy.
- `~/.tmux` is a real directory: its `layouts/` is separate (only `tmux.yml`), `plugins/` holds TPM, and `sessionizer.conf` / `tui/` are absent. Repo `layouts/*.yml` and `sessionizer.conf` are therefore not read at runtime, and `bin/tmux-sessionizer-tui` resolves `~/.tmux/tui/sessionizer` (missing) and falls back to the fzf `tmux-sessionizer`.
- Render-check status formats without touching the live server: start `tmux -L probe -f /dev/null`, source the conf, attach it from a pane of a second `-L` server, then `capture-pane`.
- Web terminal = system `ttyd.service` + `systemd/ttyd.service.d/override.conf` → `bin/tmux-web-terminal`; the user `tmux-web-terminal.service` is legacy/disabled; cloudflared config is `/etc/cloudflared/config.yml`. Auth switch runbook: `docs/mobile-access.md`.
- `tmux-omo-notify` (user unit, config `~/.config/tmux/omo-notify.env`) pushes after ≥30 s of pane activity then ≥20 s of silence, unless a client typed in that session within 60 s.
- The Slack/Telegram bridges target `opencode serve` and are inactive; the Home key's `opencode` session name predates OmO.
- `~/.bashrc` sets `MOSH_SERVER_NETWORK_TMOUT=86400`, so orphaned mosh-servers exit after a day.
- `.sisyphus/`, `.briefing/`, and `data/` are local-only artifacts; their files are ignored and untracked.
