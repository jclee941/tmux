# tmux Productivity Suite / tmux 생산성 도구 모음

> A curated, opinionated tmux configuration plus a complete ecosystem of companion tools, shared libraries, declarative YAML layouts, a Bun/React/TypeScript TUI, and a Slack bridge — designed for power users who juggle many projects, branches, and remote hosts.
>
> 큐레이션된 tmux 설정과 풍부한 생태계(보조 도구, 공유 라이브러리, 선언적 YAML 레이아웃, Bun/React/TypeScript 기반 TUI, Slack 브리지)를 한 저장소에 담은, 다수의 프로젝트·브랜치·원격 호스트를 다루는 파워 유저용 환경입니다.

---

## Table of Contents / 목차

- [Overview / 개요](#overview--개요)
- [Features / 기능](#features--기능)
- [Architecture / 아키텍처](#architecture--아키텍처)
- [Repository Layout / 저장소 구조](#repository-layout--저장소-구조)
- [Quick Start / 빠른 시작](#quick-start--빠른-시작)
- [Configuration / 설정](#configuration--설정)
- [Commands Reference / 명령어 레퍼런스](#commands-reference--명령어-레퍼런스)
- [Layouts / 레이아웃](#layouts--레이아웃)
- [TUI Sessionizer / 터미널 UI 세션나이저](#tui-sessionizer--터미널-ui-세션나이저)
- [Slack Bridge / 슬랙 브리지](#slack-bridge--슬랙-브리지)
- [Local Development / 로컬 개발](#local-development--로컬-개발)
- [Testing / 테스트](#testing--테스트)
- [Contributing / 기여](#contributing--기여)
- [License / 라이선스](#라이선스)

---

## Overview / 개요

This repository bundles a battle-tested `tmux.conf`, a `sessionizer.conf` for project discovery, and a curated set of companion binaries under `bin/`. It ships shared shell libraries under `lib/`, project-style window layouts under `layouts/`, a modern Terminal UI (`tui/sessionizer/`), and a Slack ↔ tmux bridge (`slack/tmux-bridge/`).

The intended deployment model is a symlink farm: clone once, symlink to `~/.tmux/`, and let the shell entry point source the configuration. From there, every interactive workflow — session creation, layout switching, status rendering, branch logging, clipboard history, SSH jumping, Git awareness, and Slack coordination — is exposed through small, composable shell commands that compose into a single coherent keyboard-driven experience.

이 저장소는 실전에서 검증된 `tmux.conf`, 프로젝트 검색을 위한 `sessionizer.conf`, 그리고 `bin/` 디렉터리의 큐레이션된 보조 바이너리들을 함께 제공합니다. `lib/`의 공유 셸 라이브러리, `layouts/`의 프로젝트형 윈도우 레이아웃, 모던 터미널 UI(`tui/sessionizer/`), 그리고 Slack ↔ tmux 브리지(`slack/tmux-bridge/`)가 한 곳에서 동작합니다.

권장 배포 방식은 단일 클론 후 `~/.tmux/`로 심볼릭 링크를 거는 것이며, 셸 진입점에서 설정을 로드합니다. 세션 생성, 레이아웃 전환, 상태 표시줄 렌더링, 브랜치 로깅, 클립보드 히스토리, SSH 점프, Git 인식, Slack 연동 등 모든 인터랙티브 워크플로는 작고 조합 가능한 셸 명령으로 노출되어 하나의 키보드 중심 경험으로 통합됩니다.

### Who is this for? / 사용 대상

| Audience / 대상 | Use case / 활용 사례 |
| --- | --- |
| Multi-project developers / 다수 프로젝트 개발자 | Jump between repos, save layouts per project, fast session creation / 저장소 간 빠른 이동, 프로젝트별 레이아웃, 빠른 세션 생성 |
| DevOps / SRE engineers / DevOps · SRE 엔지니어 | SSH picker for fleet of hosts, persistent layout per service, system stats statusbar / 다수 호스트 SSH 점프, 서비스별 영속 레이아웃, 시스템 상태 표시줄 |
| Remote / distributed teams / 원격 · 분산 팀 | Slack ↔ tmux bridge for asynchronous collaboration, branch logging, session export / Slack ↔ tmux 브리지로 비동기 협업, 브랜치 로깅, 세션 내보내기 |
| TUI enthusiasts / TUI 애호가 | OpenTUI/Render-based session picker with live preview, theme, and wizard / 실시간 미리보기·테마·마법사를 갖춘 OpenTUI/Render 세션 선택기 |

---

## Features / 기능

### Core tmux experience / 핵심 tmux 경험

- **`prefix = C-a`** with Vim-style navigation, copy-mode, and resize keys.
- **Tokyo Night theme** as the default palette with pane border status and themed statusline.
- **Width-tiered statusbar** (`tmux-responsive`) that adapts to terminal width — left/center/right tier render different widgets depending on available columns.
- **Sidebar pane** with toggle, tree rendering, and per-session coloring.
- **Reload-safe configuration** with `tmux-config-reload` and settings-diff output for safe iteration.

### Session management / 세션 관리

- **Sessionizer** (`tmux-sessionizer`, `tmux-sessionizer-tui`) — fzf and OpenTUI pickers for project discovery with MRU ordering.
- **Session jump** — Most-recently-used session picker for fast cycling.
- **Session cycle** — `PgUp`/`PgDn` rotation that excludes suspended sessions.
- **Session kill**, **rename**, **order**, **icon** (Nerd Font mapper), and **dashboard** (popup table).
- **Template creation** — One-shot session creation from preset templates.
- **Layout apply / export** — Apply YAML layouts to existing sessions and export current session layouts to YAML.
- **Branch logging** — Log the active git branch when switching sessions.

### Git and filesystem awareness / Git · 파일시스템 인식

- **Git status** in statusline — branch, dirty, ahead/behind, stash counts.
- **Uncommitted change tracker** — Per-session tracking of uncommitted work.
- **File and URL extraction** — fzf-driven file or URL picker from the active pane.
- **SSH picker** — Browse `~/.ssh/config` hosts and open a session with the selected host.
- **Clipboard history** — Browse tmux paste buffer ring.

### Productivity / 생산성

- **Command palette** — fzf action picker for common operations.
- **Cheatsheet** — Categorized keybinding popup reference.
- **Pane sync toggle** — Send input to all panes.
- **Word copy** — Smart word-under-cursor copy into the buffer.
- **Long command notifications** — Desktop notifications when commands exceed a threshold.
- **Bash preexec hook** — Sourceable timing hook for command duration reporting.
- **OpenCode launcher** — Launch OpenCode sessions from a tmux binding.
- **Web terminal** — `ttyd` launcher for browser-based terminal access.

### Integrations / 통합

- **Slack bridge** — Bidirectional tmux ↔ Slack messaging via Node.js, with socket-direct or HTTP (cloudflared) transport.
- **Slack setup wizard** — Interactive Slack app configuration.
- **Sync sessions with Slack channels** — One-way mirror of session metadata.

---

## Architecture / 아키텍처

The product is organized as four loosely-coupled layers. Each layer can be installed or replaced independently because the public surface between layers is plain shell commands.

| Layer / 계층 | Path / 경로 | Role / 역할 |
| --- | --- | --- |
| Configuration / 설정 | `tmux.conf`, `sessionizer.conf`, `conf.d/*.conf` | Terminal baseline, keybindings, theme, statusline, env propagation |
| Bash surface / 셸 표면 | `bin/*` (40 binaries), `lib/*` (4 modules) | Interactive commands invoked from `bind-key` or shell prompt |
| Layouts / 레이아웃 | `layouts/*.yml` | Declarative window/pane recipes applied per project type |
| TUI / 터미널 UI | `tui/sessionizer/` (Bun + React + OpenTUI) | Interactive session picker with preview, filter, and creation wizard |
| Bridge / 브리지 | `slack/tmux-bridge/` (Node.js) | Bidirectional Slack ↔ tmux messaging |

### Request flow / 요청 흐름

1. User presses a binding (e.g. `C-a s` for sessionizer).
2. `tmux.conf` `bind-key` invokes a `bin/tmux-*` script.
3. The script sources one or more `lib/*` modules for shared logic (sidebar, sessionizer-common, wizard).
4. The script may inspect `layouts/*.yml` to suggest or apply a layout.
5. The script either talks to `tmux` directly, delegates to the `tui/sessionizer/` binary for interactive pickers, or — for Slack features — hands off to `slack/tmux-bridge/`.
6. State changes (session create, kill, rename, layout apply) feed back into the statusline via `tmux-responsive` and the sidebar via `sidebar-render`.

### Module ownership / 모듈 소유권

| Path / 경로 | Owner concern / 책임 |
| --- | --- |
| `tmux.conf`, `conf.d/` | Terminal emulation, keymap, env propagation, theme |
| `sessionizer.conf` | SCAN_DIR + EXTRA_DIRS project discovery |
| `bin/tmux-sessionizer*` | fzf and TUI session pickers |
| `bin/tmux-sidebar*`, `lib/sidebar-*` | Tree sidebar display and colors |
| `bin/tmux-session-*`, `lib/tmux-sessionizer-*` | Session lifecycle (create, kill, rename, cycle, jump, dashboard, icon, export, branch-log, order, sync) |
| `bin/tmux-layout-apply`, `bin/tmux-template-create`, `layouts/` | Declarative session templates |
| `bin/tmux-responsive`, `bin/tmux-git-*`, `bin/tmux-sys-stats` | Statusline data sources |
| `bin/tmux-command-palette`, `bin/tmux-cheatsheet`, `bin/tmux-clipboard-history`, `bin/tmux-copy-word`, `bin/tmux-pane-sync`, `bin/tmux-url-open`, `bin/tmux-file-open`, `bin/tmux-ssh-picker` | Keyboard-driven helpers |
| `bin/tmux-auto-attach`, `bin/tmux-opencode`, `bin/tmux-web-terminal` | Launcher surface |
| `bin/tmux-slack-bridge-*` | Slack bridge orchestration |
| `tui/sessionizer/` | Interactive OpenTUI/React sessionizer |
| `slack/tmux-bridge/` | Slack ↔ tmux bridge runtime |
| `docs/` | Design notes and brainstorming |

---

## Repository Layout / 저장소 구조

```
.
├── AGENTS.md                    # Project knowledge base (curated by maintainers)
├── CONTRIBUTING.md              # Contribution guidelines
├── LICENSE                      # License file
├── OWNERS                       # Code ownership
├── README.md                    # This file
├── tmux.conf                    # Root tmux config loader
├── sessionizer.conf             # Sessionizer project discovery config
├── bin/                         # Bash execution surface (40+ scripts)
│   ├── tmux-sessionizer         # fzf session picker + creation wizard
│   ├── tmux-sessionizer-tui     # TUI sessionizer wrapper
│   ├── tmux-sidebar*            # Sidebar display, init, toggle
│   ├── tmux-session-*           # Session lifecycle scripts
│   ├── tmux-layout-apply        # Apply YAML layouts
│   ├── tmux-template-create     # Quick-create from template
│   ├── tmux-responsive          # Width-tiered statusbar
│   ├── tmux-git-*               # Git status and uncommitted tracker
│   ├── tmux-sys-stats           # CPU/MEM statusbar data
│   ├── tmux-command-palette     # fzf action picker
│   ├── tmux-cheatsheet          # Keybinding popup reference
│   ├── tmux-clipboard-history   # Paste buffer browser
│   ├── tmux-copy-word           # Smart word copy
│   ├── tmux-pane-sync           # Synchronize-panes toggle
│   ├── tmux-url-open            # URL extraction from pane
│   ├── tmux-file-open           # File path extraction from pane
│   ├── tmux-ssh-picker          # SSH config host picker
│   ├── tmux-auto-attach         # Login shell auto-attach
│   ├── tmux-opencode            # OpenCode session launcher
│   ├── tmux-web-terminal        # ttyd launcher
│   ├── tmux-config-reload       # Reload config with diff
│   ├── tmux-notify-long-command # Long command desktop notification
│   ├── tmux-bash-preexec        # Sourceable timing hook
│   └── tmux-slack-bridge-*      # Slack bridge setup and start
├── lib/                         # Shared bash modules
│   ├── tmux-sessionizer-common  # Shared sessionizer helpers
│   ├── tmux-sessionizer-wizard  # Creation wizard logic
│   ├── sidebar-colors           # Sidebar color palette
│   └── sidebar-render           # Sidebar rendering engine
├── layouts/                     # Declarative session layouts
│   ├── default.yml              # Default two-window layout
│   ├── blacklist.yml            # Window/pane blacklist rules
│   ├── proxmox.yml              # Proxmox management layout
│   ├── resume.yml               # Resume / workspace layout
│   ├── safework.yml             # Safe work environment
│   ├── safework2.yml            # Safe work variant
│   └── splunk.yml               # Splunk operations layout
├── tui/                         # Terminal UI subsystem
│   └── sessionizer/             # Bun + React + TypeScript sessionizer
│       ├── AGENTS.md            # TUI-specific notes
│       ├── package.json         # Bun package manifest
│       ├── bunfig.toml          # Bun runtime config
│       ├── bun.lock             # Bun lockfile
│       ├── tsconfig.json        # TypeScript config
│       ├── src/                 # React components and hooks
│       │   ├── App.tsx          # Root component
│       │   ├── index.tsx        # Entry point
│       │   ├── lib/             # tmux, config, theme, dirs, state, create-session
│       │   ├── actions/         # Session actions
│       │   ├── components/      # UI components
│       │   └── hooks/           # Keyboard handler hook
│       └── __tests__/           # Bun test suites
├── slack/                       # Slack bridge subsystem
│   └── tmux-bridge/             # Node.js Slack ↔ tmux bridge
│       └── AGENTS.md            # Bridge-specific notes
└── docs/                        # Design and governance docs
    ├── session-persistence-brainstorming.md
    └── supermemory-governance.md
```

---

## Quick Start / 빠른 시작

### Prerequisites / 사전 요구 사항

| Tool / 도구 | Version / 버전 | Purpose / 용도 |
| --- | --- | --- |
| `tmux` | 3.2+ | Terminal multiplexer |
| `bash` | 4.0+ | Shell runtime for `bin/` and `lib/` |
| `fzf` | latest | Fuzzy picker for many `bin/tmux-*` scripts |
| `git` | 2.0+ | Git status and branch tracking |
| `Nerd Font` | any | Session icons and sidebar glyphs |
| `bun` | 1.x | TUI sessionizer runtime |
| `node` | 20+ | Slack bridge runtime |
| `tsx` | latest | Slack bridge dev runner |
| `ttyd` | optional | Web terminal launcher |

### Install / 설치

```bash
# 1. Clone
git clone <repository-url> ~/projects/tmux-suite
cd ~/projects/tmux-suite

# 2. Symlink to ~/.tmux
ln -sfn "$(pwd)" ~/.tmux

# 3. Source from your shell rc (~/.bashrc or ~/.zshrc)
echo 'export TMUX_CONF=~/.tmux/tmux.conf' >> ~/.bashrc
echo '[ -f ~/.tmux/tmux.conf ] && tmux source-file ~/.tmux/tmux.conf' >> ~/.bashrc

# 4. Install TUI sessionizer dependencies
cd tui/sessionizer && bun install && cd -

# 5. Install Slack bridge dependencies (optional)
cd slack/tmux-bridge && npm install && cd -

# 6. Launch tmux (or auto-attach via tmux-auto-attach)
tmux new-session -A -s main
```

### First session / 첫 세션

```bash
# Inside tmux, press: prefix + s
# This opens the fzf sessionizer. Type to filter projects, Enter to attach.
```

For the TUI variant, use `prefix + S` (capital S, if bound) or invoke `tmux-sessionizer-tui` directly.

---

## Configuration / 설정

### `tmux.conf`

The root loader. It sources `conf.d/*.conf` in numeric order, applies theme, keybindings, statusline, and environment propagation. The default prefix is `C-a`.

### `sessionizer.conf`

Defines the project discovery surface used by both fzf and TUI sessionizers.

```bash
# Default scan paths
SCAN_DIR="$HOME/projects"
SCAN_DIR="$HOME/work"

# Additional manual entries
EXTRA_DIRS=(
  "$HOME/sandbox"
  "$HOME/.config"
)
```

### `layouts/*.yml`

Declarative session recipes. Each YAML describes windows and panes with their initial commands and working directories. See the [Layouts / 레이아웃](#layouts--레이아웃) section.

### TUI config / TUI 설정

`tui/sessionizer/src/lib/config.ts` reads from `sessionizer.conf` and supports the same `SCAN_DIR` / `EXTRA_DIRS` model, with theme overrides and preview toggles.

### Slack bridge config / 슬랙 브리지 설정

`slack/tmux-bridge/` reads environment variables (typically `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `TMUX_SOCKET`) and optional transport mode (`socket` or `http`). Run `tmux-slack-bridge-setup` for the interactive wizard.

---

## Commands Reference / 명령어 레퍼런스

The `bin/` surface is intentionally flat. Every script is invokable directly and most are designed to be bound to a `prefix + key` combination. Below is the full reference grouped by concern.

### Session lifecycle / 세션 생명주기

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-sessionizer` | fzf-based session picker with creation wizard |
| `tmux-sessionizer-tui` | Launch the Bun/React OpenTUI sessionizer |
| `tmux-session-jump` | MRU (most recently used) session picker |
| `tmux-session-cycle` | Rotate through sessions with `PgUp`/`PgDn` (excludes suspended) |
| `tmux-session-kill` | Safe session termination with confirmation |
| `tmux-session-rename` | Rename current session with validation |
| `tmux-session-order` | Reorder sessions by most recently active |
| `tmux-session-icon` | Map Nerd Font icons to sessions |
| `tmux-session-dashboard` | Formatted popup table of all sessions |
| `tmux-session-export` | Export current session layout to YAML |
| `tmux-session-branch-log` | Log session → branch on switch |
| `tmux-session-sync` | Sync tmux sessions with Slack channels |
| `tmux-template-create` | Quick-create session from a preset template |
| `tmux-layout-apply` | Apply a YAML layout to current or specified session |
| `tmux-auto-attach` | Login shell auto-attach flow |

### Sidebar / 사이드바

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-sidebar` | Tree sidebar display engine |
| `tmux-sidebar-init` | Initialize sidebar when session is created |
| `tmux-sidebar-toggle` | Toggle sidebar visibility |

### Status and stats / 상태 · 통계

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-responsive` | Width-tiered statusbar rendering |
| `tmux-sys-stats` | CPU load and memory usage |
| `tmux-git-status` | Branch, dirty, ahead/behind, stash counts |
| `tmux-git-uncommitted` | Per-session uncommitted change tracker |

### Picking and helpers / 선택 · 보조

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-command-palette` | fzf action picker for common operations |
| `tmux-cheatsheet` | Categorized keybinding reference popup |
| `tmux-url-open` | Extract URL from pane via fzf and open it |
| `tmux-file-open` | Extract file path from pane via fzf and open it |
| `tmux-ssh-picker` | Pick host from `~/.ssh/config` and open a session |
| `tmux-clipboard-history` | Browse tmux paste buffer ring |
| `tmux-copy-word` | Smart copy of word under cursor |
| `tmux-pane-sync` | Toggle synchronize-panes |
| `tmux-file-open` | Open file under cursor in editor |
| `tmux-notify-long-command` | Desktop notification when a command runs long |
| `tmux-bash-preexec` | Sourceable timing hook for command duration |

### Launchers and config / 런처 · 설정

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-opencode` | Launch OpenCode session |
| `tmux-web-terminal` | Launch `ttyd` web terminal |
| `tmux-config-reload` | Reload `tmux.conf` with settings diff output |

### Slack bridge / 슬랙 브리지

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-slack-bridge-setup` | Interactive Slack app setup wizard |
| `tmux-slack-bridge-start` | Start bridge (socket direct or HTTP/cloudflared, then `tsx`) |

---

## Layouts / 레이아웃

Layouts are YAML files in `layouts/` that describe window and pane structure for a session. The schema is consumed by `tmux-layout-apply` and `tmux-template-create`.

| Layout / 레이아웃 | Use case / 용도 |
| --- | --- |
| `default.yml` | Generic two-window starting layout (editor + shell) |
| `blacklist.yml` | Define window/pane blacklist rules |
| `proxmox.yml` | Proxmox VE management: web console, SSH, monitoring |
| `resume.yml` | Resume / workspace layout |
| `safework.yml` | Read-only / safe environment for production hosts |
| `safework2.yml` | Safe work variant (alternate window ordering) |
| `splunk.yml` | Splunk operations: search, dashboards, logs |

Example skeleton:

```yaml
name: my-project
windows:
  - name: code
    panes:
      - cmd: nvim .
      - cmd: git status -sb
  - name: shell
    panes:
      - cmd: bash
      - cmd: tail -f /var/log/app.log
```

---

## TUI Sessionizer / 터미널 UI 세션나이저

`tui/sessionizer/` is a Bun + React + TypeScript application rendered through OpenTUI/Render. It replaces the fzf picker with a richer interface.

### Features / 기능

- **Live preview panel** — Peek at session contents before attaching.
- **Filter input** with debounced search.
- **Theme system** — Tokyo Night defaults, overridable per-user.
- **Create wizard** — Step-by-step session creation: directory → layout → name.
- **Rename dialog** and **kill-confirm dialog** for in-place management.
- **Keyboard handler hook** — Centralized binding for j/k/Enter/q/etc.

### Run / 실행

```bash
cd tui/sessionizer
bun install
bun start           # launches the TUI
bun test            # runs the Bun test suites
```

### Source layout / 소스 구조

| Path / 경로 | Role / 역할 |
| --- | --- |
| `src/index.tsx` | Entry point |
| `src/App.tsx` | Root component |
| `src/lib/tmux.ts` | tmux CLI bridge |
| `src/lib/config.ts` | Config reader (parses `sessionizer.conf`) |
| `src/lib/dirs.ts` | Directory scanning and filtering |
| `src/lib/state.ts` | Application state |
| `src/lib/theme.ts` | Tokyo Night theme tokens |
| `src/lib/create-session.ts` | Session creation orchestration |
| `src/actions/session-actions.ts` | Session lifecycle actions |
| `src/hooks/use-keyboard-handler.ts` | Global keyboard handler |
| `src/components/session-list.tsx` | Session list view |
| `src/components/filter-input.tsx` | Search/filter input |
| `src/components/preview-panel.tsx` | Live preview pane |
| `src/components/create-wizard.tsx` | Creation wizard root |
| `src/components/wizard-step-*.tsx` | Wizard steps (dir, layout, name) |
| `src/components/rename-dialog.tsx` | Rename dialog |
| `src/components/kill-confirm-dialog.tsx` | Kill confirmation dialog |
| `__tests__/config.test.ts` | Config parser tests |
| `__tests__/tmux.test.ts` | tmux CLI bridge tests |

---

## Slack Bridge / 슬랙 브리지

`slack/tmux-bridge/` is a Node.js service that bridges Slack channels and tmux sessions bidirectionally.

### Modes / 모드

| Mode / 모드 | Transport / 전송 | Use case / 용도 |
| --- | --- | --- |
| `socket` | Direct tmux control mode over a Unix socket | Local or single-host deployments |
| `http` | HTTP over a `cloudflared` tunnel | Remote Slack workspaces, multi-host setups |

### Setup / 설정

```bash
tmux-slack-bridge-setup    # Interactive wizard for Slack app credentials
tmux-slack-bridge-start    # Boots the bridge in the configured mode
```

The `start` script chooses the transport based on environment or interactive prompt, then executes the bridge via `tsx`.

### Environment variables / 환경 변수

| Variable / 변수 | Required / 필수 | Description / 설명 |
| --- | --- | --- |
| `SLACK_BOT_TOKEN` | Yes / 예 | Slack bot OAuth token (`xoxb-…`) |
| `SLACK_APP_TOKEN` | Yes / 예 | Slack app-level token (`xapp-…`) for Socket Mode |
| `TMUX_SOCKET` | Optional / 선택 | Override the tmux server socket path |
| `BRIDGE_TRANSPORT` | Optional / 선택 | `socket` or `http` |
| `CLOUDFLARED_TUNNEL` | When `http` | Tunnel name or ID |

See `slack/tmux-bridge/AGENTS.md` for bridge-specific operational notes.

---

## Local Development / 로컬 개발

### Bash scripts / 셸 스크립트

Edit any `bin/tmux-*` or `lib/*` script in place. Reload tmux configuration to pick up changes:

```bash
# Inside tmux
prefix + r         # typically bound to tmux-config-reload
```

For external changes, source the script manually:

```bash
source bin/tmux-sessionizer
```

### TUI / 터미널 UI

```bash
cd tui/sessionizer
bun install
bun --watch start        # hot-reload during development
```

Type-checking:

```bash
bun run tsc --noEmit
```

### Slack bridge / 슬랙 브리지

```bash
cd slack/tmux-bridge
npm install
npm run dev              # tsx watch mode
```

### Layouts / 레이아웃

Validate a layout before applying:

```bash
tmux-layout-apply --dry-run layouts/proxmox.yml
```

To create a new layout, copy an existing YAML in `layouts/` and adjust windows/panes.

---

## Testing / 테스트

### TUI tests / TUI 테스트

The TUI ships Bun-native tests under `tui/sessionizer/__tests__/`.

```bash
cd tui/sessionizer
bun test                  # full suite
bun test --watch          # watch mode
bun test config.test.ts   # single file
```

| Test file / 테스트 파일 | Coverage / 범위 |
| --- | --- |
| `__tests__/config.test.ts` | Config parser, `sessionizer.conf` loading |
| `__tests__/tmux.test.ts` | tmux CLI bridge correctness |

### Slack bridge tests / 슬랙 브리지 테스트

If a `.gitlab-ci.yml` is present at the repository root, the Slack bridge runs a CI pipeline. Locally:

```bash
cd slack/tmux-bridge
npm test
```

### Smoke testing bash scripts / 셸 스크립트 스모크 테스트

For quick verification of any script:

```bash
bash -n bin/tmux-sessionizer    # syntax check
shellcheck bin/tmux-sessionizer # lint (if shellcheck is installed)
```

---

## Contributing / 기여

1. Read `CONTRIBUTING.md` for the contribution policy, coding standards, and review process.
2. Open an issue describing the change before opening a PR for non-trivial work.
3. Follow the existing module boundaries:
   - New shell helpers go into `lib/`.
   - New bindings go into `bin/`.
   - New layouts go into `layouts/` and are listed in the [Layouts / 레이아웃](#layouts--레이아웃) table of this README.
   - TUI changes go into `tui/sessionizer/src/` and must include tests under `__tests__/`.
4. Run the full TUI test suite and `shellcheck` on changed bash scripts.
5. Update `AGENTS.md` if your change introduces new conventions or ownership boundaries.

See `OWNERS` for code ownership and reviewer assignments.

---

## License / 라이선스

See the `LICENSE` file at the repository root for the full license text.
저장소 루트의 `LICENSE` 파일에서 전체 라이선스 전문을 확인하세요.