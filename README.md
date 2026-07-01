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
- [License / 라이선스](#license--라이선스)

---

## Overview / 개요

This repository bundles a battle-tested `tmux.conf`, a `sessionizer.conf` for project discovery, and a curated set of companion binaries under `bin/`. It ships shared shell libraries under `lib/`, project-style window layouts under `layouts/`, a modern Terminal UI (`tui/sessionizer/`), and a Slack ↔ tmux bridge (`slack/tmux-bridge/`).

The configuration follows Bash-first principles: every helper is a small, composable shell script that can be invoked from inside tmux key bindings, from the command palette, or from a login shell. The TUI sessionizer and the Slack bridge add graphical and remote surfaces without compromising the underlying philosophy.

### Who is this for? / 누가 사용하나요

- **Platform/SRE engineers** who operate across many services, hosts, and Proxmox/Splunk/Safework dashboards.
- **Polyglot developers** who keep dozens of branches and scratch sessions alive simultaneously.
- **Remote-first teams** that want a shared terminal surface via Slack and a web terminal.

이 저장소는 tmux의 실전 사용 경험에서 검증된 `tmux.conf`와 `sessionizer.conf`, 그리고 `bin/`의 보조 바이너리들을 함께 제공합니다. `lib/`의 공유 셸 라이브러리, `layouts/`의 선언적 윈도우 레이아웃, `tui/sessionizer/`의 모던 터미널 UI, `slack/tmux-bridge/`의 Slack 연동까지 한 저장소에 포함되어 있습니다.

핵심 철학은 **Bash-first**: 모든 헬퍼는 작고 조합 가능한 셸 스크립트로 작성되어, tmux 키 바인딩, 커맨드 팔레트, 로그인 셸 어디서나 호출할 수 있습니다. TUI 세션나이저와 Slack 브리지는 이 철학 위에 그래픽/원격 표면을 추가합니다.

---

## Features / 기능

### Sessions & Navigation / 세션 및 탐색
- **fzf-powered session picker** with MRU ordering and live preview.
- **TUI sessionizer** with React-based filter input, preview panel, and create wizard.
- **Auto-attach** on login shell; cycle sessions with `PgUp`/`PgDn`; jump with MRU fzf picker.
- **Tree-style sidebar** with colors, icons, and toggle visibility.

### Layouts / 레이아웃
- **Declarative YAML layouts** (`layouts/*.yml`) for multi-window, multi-pane setups.
- **Template creation** and **layout apply** for fast onboarding to a new project.
- **Layout export** from an existing session back to YAML.

### Workspace Utilities / 워크스페이스 유틸
- **Session dashboard** (formatted table popup), **session icon** (Nerd Font mapping), **session rename/kill/order** with safety checks.
- **Command palette** (fzf action picker), **cheatsheet** (categorized keybindings), **config reload** (with diff).
- **Git awareness**: per-session branch log, uncommitted-change tracking, status indicator.
- **System stats** (CPU/memory) and **responsive statusbar** that adapts to terminal width.

### Pane & Clipboard / 패널 및 클립보드
- **Pane sync** toggle, **clipboard history** ring browser, **copy word under cursor**, **file/url openers**.
- **SSH picker** from `~/.ssh/config`, **notify on long command** completion.

### Remote Surfaces / 원격 표면
- **Slack ↔ tmux bridge** (Node.js, socket or HTTPS via cloudflared) for shared terminal sessions.
- **Web terminal** launcher via `ttyd`.
- **OpenCode** session launcher for in-tmux AI coding sessions.

---

## Architecture / 아키텍처

The product is layered: a single `tmux.conf` entry point, a Bash toolkit of small scripts, a TypeScript TUI that wraps the same primitives, and an optional Node.js bridge for remote surfaces.

| Layer / 계층 | Component / 구성요소 | Responsibility / 책임 |
|---|---|---|
| Config | `tmux.conf`, `sessionizer.conf` | Single loader and project discovery config |
| Helpers | `bin/tmux-*` (40+ scripts) | Composable Bash primitives invoked from key bindings |
| Libraries | `lib/*` | Shared functions (sidebar render, wizard, common helpers) |
| Layouts | `layouts/*.yml` | Declarative multi-window/pane session templates |
| TUI | `tui/sessionizer/` (Bun + React + TypeScript) | Interactive session picker and creation wizard |
| Bridge | `slack/tmux-bridge/` | Slack channel ↔ tmux session two-way bridge |
| Docs | `docs/` | Design notes and governance (brainstorms, supermemory policy) |

### Request Flow (key binding → action) / 키 바인딩에서 실행까지

1. User presses a prefix key (default `C-a`) and a binding.
2. `tmux.conf` invokes a `bin/tmux-*` script via `run-shell` or `bind-key`.
3. The script sources a library from `lib/` if needed (e.g. `tmux-sessionizer-common`).
4. The script talks to the tmux server (`new-session`, `switch-client`, `send-keys`) or to an external tool (`fzf`, `ttyd`, `tsx`).
5. For TUI actions, `bin/tmux-sessionizer-tui` spawns the Bun binary in `tui/sessionizer/`; the TUI in turn shells out to the same `bin/tmux-*` helpers.
6. For Slack actions, `tmux-slack-bridge-start` launches the Node.js bridge, which forwards Slack channel events to a tmux session and vice versa.

---

## Repository Layout / 저장소 구조

```
.
├── README.md
├── AGENTS.md
├── CONTRIBUTING.md
├── LICENSE
├── OWNERS
├── tmux.conf                 # tmux loader configuration
├── sessionizer.conf          # Project discovery directories
├── bin/                      # Bash helper scripts (~40 binaries, all prefixed tmux-*)
├── lib/                      # Shared shell libraries
│   ├── sidebar-colors
│   ├── sidebar-render
│   ├── tmux-sessionizer-common
│   └── tmux-sessionizer-wizard
├── layouts/                  # Declarative YAML window/pane templates
│   ├── blacklist.yml
│   ├── default.yml
│   ├── proxmox.yml
│   ├── resume.yml
│   ├── safework.yml
│   ├── safework2.yml
│   └── splunk.yml
├── tui/
│   └── sessionizer/          # Bun + React + TypeScript TUI
│       ├── AGENTS.md
│       ├── package.json
│       ├── tsconfig.json
│       ├── bunfig.toml
│       ├── bun.lock
│       ├── src/              # App, components, hooks, actions, lib
│       └── __tests__/        # Bun test suites
├── docs/
│   ├── session-persistence-brainstorming.md
│   └── supermemory-governance.md
└── slack/
    └── tmux-bridge/          # Node.js Slack ↔ tmux bridge
        └── AGENTS.md
```

---

## Quick Start / 빠른 시작

### 1. Install / 설치

Prerequisites / 사전 요구사항:

- `tmux` ≥ 3.2
- `bash` ≥ 4
- `fzf`
- `git`
- Optional: `bun` (for the TUI), `node`/`tsx` (for the Slack bridge), `ttyd` (for web terminal)

Clone the repository and symlink it to `~/.tmux`:

```bash
git clone <repository-url> ~/code/tmux-suite
ln -s ~/code/tmux-suite ~/.tmux
```

Point tmux at the loader configuration by adding to `~/.tmux.conf`:

```tmux
source-file ~/.tmux/tmux.conf
```

### 2. First run / 첫 실행

```bash
tmux new-session -A -s main
```

Press `prefix + ?` to open the cheatsheet, or `prefix + s` to open the sessionizer.

### 3. Try the TUI / TUI 실행

```bash
~/.tmux/bin/tmux-sessionizer-tui
```

### 4. Optional Slack bridge / Slack 브리지 (선택)

```bash
~/.tmux/bin/tmux-slack-bridge-setup   # one-time interactive wizard
~/.tmux/bin/tmux-slack-bridge-start   # launch the bridge
```

---

## Configuration / 설정

### `tmux.conf` (root loader)

The root `tmux.conf` is intentionally minimal — it sets the prefix, sources any environment-specific overrides, and binds the most-used scripts in `bin/`. Override by sourcing your own file **after** `~/.tmux/tmux.conf` from `~/.tmux.conf`.

### `sessionizer.conf`

Used by `tmux-sessionizer` (and the TUI) to discover projects. A minimal example:

```bash
# Directories scanned for git repositories and named folders
SCAN_DIR="$HOME/code"
EXTRA_DIRS=(
  "$HOME/work"
  "$HOME/scratch"
)
```

| Variable / 변수 | Purpose / 용도 |
|---|---|
| `SCAN_DIR` | Primary directory to scan |
| `EXTRA_DIRS` | Additional paths appended to the scan list |
| `MAX_DEPTH` (optional) | Limit recursive descent |

### Environment variables

| Variable / 변수 | Used by / 사용처 | Purpose / 용도 |
|---|---|---|
| `EDITOR` | `tmux-sessionizer` | Default editor for new sessions |
| `BROWSER` | `tmux-url-open`, `tmux-file-open` | Open extracted URLs/paths |
| `SLACK_BOT_TOKEN` | `slack/tmux-bridge` | Slack bot OAuth token |
| `SLACK_APP_TOKEN` | `slack/tmux-bridge` | Slack app-level token (socket mode) |

---

## Commands Reference / 명령어 레퍼런스

All scripts live under `bin/` and follow the `tmux-<topic>` naming convention. Most are safe to invoke from outside tmux — they detect the current session and attach/switch as appropriate.

### Session management / 세션 관리

| Command / 명령 | Purpose / 용도 |
|---|---|
| `tmux-sessionizer` | fzf-based session picker with creation wizard |
| `tmux-sessionizer-tui` | Launch the React/Bun TUI sessionizer |
| `tmux-session-cycle` | Rotate to next/previous session (PgUp/PgDn) |
| `tmux-session-jump` | MRU fzf session picker |
| `tmux-session-kill` | Safe session termination with confirmation |
| `tmux-session-rename` | Rename a session with validation |
| `tmux-session-order` | List sessions sorted by recent activity |
| `tmux-session-dashboard` | Formatted session table popup |
| `tmux-session-icon` | Map a session name to a Nerd Font icon |
| `tmux-session-export` | Export a live session to a YAML layout |
| `tmux-session-branch-log` | Log session→branch on switch |
| `tmux-session-sync` | Sync tmux sessions with Slack channels |
| `tmux-auto-attach` | Login-shell auto-attach flow |

### Sidebar / 사이드바

| Command / 명령 | Purpose / 용도 |
|---|---|
| `tmux-sidebar` | Render the tree sidebar |
| `tmux-sidebar-init` | Initialize sidebar on new session |
| `tmux-sidebar-toggle` | Toggle sidebar visibility |

### Layouts / 레이아웃

| Command / 명령 | Purpose / 용도 |
|---|---|
| `tmux-template-create` | Create a session from a preset template |
| `tmux-layout-apply` | Apply a YAML layout to a session |

### Pane and clipboard / 패널 및 클립보드

| Command / 명령 | Purpose / 용도 |
|---|---|
| `tmux-pane-sync` | Toggle synchronized panes |
| `tmux-clipboard-history` | Browse tmux buffer history via fzf |
| `tmux-copy-word` | Copy the word under the cursor |
| `tmux-url-open` | Extract and open a URL from the current pane |
| `tmux-file-open` | Extract and open a file path from the current pane |

### Discovery and pickers / 검색 및 선택기

| Command / 명령 | Purpose / 용도 |
|---|---|
| `tmux-ssh-picker` | Pick an SSH host from `~/.ssh/config` |
| `tmux-command-palette` | fzf action picker for common operations |
| `tmux-cheatsheet` | Categorized keybinding reference popup |
| `tmux-config-reload` | Reload tmux config with a diff display |

### Status and monitoring / 상태 및 모니터링

| Command / 명령 | Purpose / 용도 |
|---|---|
| `tmux-responsive` | Width-tiered statusbar rendering |
| `tmux-sys-stats` | CPU/memory snapshot for status line |
| `tmux-git-status` | Branch + dirty/ahead/behind/stash indicator |
| `tmux-git-uncommitted` | Per-session uncommitted-change tracker |
| `tmux-notify-long-command` | Desktop notification when a command runs long |

### Remote surfaces / 원격 표면

| Command / 명령 | Purpose / 용도 |
|---|---|
| `tmux-slack-bridge-setup` | Interactive Slack app setup wizard |
| `tmux-slack-bridge-start` | Start the Slack ↔ tmux bridge |
| `tmux-web-terminal` | Launch a `ttyd` web terminal |
| `tmux-opencode` | Launch an OpenCode AI session |

### Library modules / 라이브러리 모듈

| Module / 모듈 | Sourceable from / 사용처 |
|---|---|
| `lib/tmux-sessionizer-common` | Shared sessionizer helpers |
| `lib/tmux-sessionizer-wizard` | Creation wizard logic |
| `lib/sidebar-render` | Sidebar tree rendering engine |
| `lib/sidebar-colors` | Sidebar color palette |

---

## Layouts / 레이아웃

Layouts are YAML files under `layouts/` that describe a multi-window, multi-pane session template. Apply one with:

```bash
tmux-layout-apply layouts/proxmox.yml my-session-name
```

| File / 파일 | Purpose / 용도 |
|---|---|
| `default.yml` | Sensible default 2-pane workspace |
| `resume.yml` | Resume a previously exported session |
| `proxmox.yml` | Proxmox operations dashboard (hosts + consoles) |
| `splunk.yml` | Splunk search + dashboard windows |
| `safework.yml`, `safework2.yml` | Safework monitoring presets |
| `blacklist.yml` | Patterns excluded from sessionizer scans |

A minimal layout:

```yaml
session: my-project
root: ~/code/my-project
windows:
  - name: editor
    panes:
      - command: "$EDITOR"
      - command: "git status -sb; sleep infinity"
  - name: shell
    panes:
      - command: "bash"
```

---

## TUI Sessionizer / 터미널 UI 세션나이저

`tui/sessionizer/` is a Bun + React + TypeScript application that provides an interactive, terminal-native alternative to the fzf picker.

### Stack

- **Runtime:** Bun
- **UI:** React (custom TUI renderer)
- **Language:** TypeScript (strict mode via `tsconfig.json`)
- **Tests:** Bun's built-in test runner

### Source map

| Path / 경로 | Role / 역할 |
|---|---|
| `src/index.tsx` | Entry point |
| `src/App.tsx` | Top-level component |
| `src/lib/config.ts` | Reads `sessionizer.conf` |
| `src/lib/dirs.ts` | Directory scanning helpers |
| `src/lib/tmux.ts` | tmux CLI wrappers |
| `src/lib/create-session.ts` | Session creation logic |
| `src/lib/state.ts` | Application state container |
| `src/lib/theme.ts` | Color theme |
| `src/hooks/use-keyboard-handler.ts` | Keyboard input handling |
| `src/actions/session-actions.ts` | Action dispatchers |
| `src/components/session-list.tsx` | List view |
| `src/components/filter-input.tsx` | Filter input |
| `src/components/preview-panel.tsx` | Preview pane |
| `src/components/create-wizard.tsx` | Multi-step wizard |
| `src/components/wizard-step-dir.tsx` | Wizard: directory step |
| `src/components/wizard-step-name.tsx` | Wizard: name step |
| `src/components/wizard-step-layout.tsx` | Wizard: layout step |
| `src/components/rename-dialog.tsx` | Rename dialog |
| `src/components/kill-confirm-dialog.tsx` | Kill confirmation dialog |
| `__tests__/config.test.ts` | Config parser tests |
| `__tests__/tmux.test.ts` | tmux wrapper tests |

### Running / 실행

```bash
cd tui/sessionizer
bun install
bun run dev          # development
bun start            # production-style launch
```

The TUI shells out to the same `bin/tmux-*` helpers used by the Bash toolkit, so behavior stays consistent across surfaces.

---

## Slack Bridge / 슬랙 브리지

`slack/tmux-bridge/` is a Node.js service that links Slack channels to tmux sessions in both directions: messages in a Slack channel appear in the linked session's pane, and tmux pane output is forwarded back to the channel.

### Modes / 모드

| Mode / 모드 | Description / 설명 |
|---|---|
| Socket direct | Uses Slack socket mode with an app-level token (no public URL) |
| HTTPS via cloudflared | Uses a bot token plus a cloudflared tunnel for the events endpoint |

### Setup / 설정

1. Run `tmux-slack-bridge-setup` once to create the Slack app, capture tokens, and store them.
2. Run `tmux-slack-bridge-start` to launch the bridge. The wrapper chooses socket mode or HTTPS automatically based on which tokens are present.
3. In Slack, invite the bot to a channel and use the bridge's slash commands (see `slack/tmux-bridge/AGENTS.md` for the exact command list).

Configuration lives in `slack/tmux-bridge/`; see that directory's `AGENTS.md` for runtime flags and environment variables.

---

## Local Development / 로컬 개발

### Bash scripts

All scripts under `bin/` and `lib/` are Bash. They are intentionally small and sourceable, so you can:

```bash
# Source a library in a subshell to test one function
bash -c 'source lib/tmux-sessionizer-common; type tmux_session_name_sanitize'
```

Linting: this repository does not pin a formatter. Use `shellcheck bin/* lib/*` and `shfmt -d` if you have them locally.

### TUI sessionizer

```bash
cd tui/sessionizer
bun install
bun run dev
```

Type-checking and tests:

```bash
bun run check      # tsc --noEmit
bun test           # bun test runner
```

### Slack bridge

```bash
cd slack/tmux-bridge
# See slack/tmux-bridge/AGENTS.md for the exact run scripts and flags
```

---

## Testing / 테스트

| Surface / 표면 | Test command / 테스트 명령 | Framework / 프레임워크 |
|---|---|---|
| TUI sessionizer | `cd tui/sessionizer && bun test` | Bun test runner |
| TUI sessionizer (types) | `cd tui/sessionizer && bun run check` | `tsc --noEmit` |
| Slack bridge | `cd slack/tmux-bridge && <see AGENTS.md>` | Per AGENTS.md |
| Bash scripts | `shellcheck bin/* lib/*` | shellcheck |

Test files currently shipped:

- `tui/sessionizer/__tests__/config.test.ts`
- `tui/sessionizer/__tests__/tmux.test.ts`

When adding new helpers in `bin/`, please add a corresponding `__tests__/` entry under the matching subsystem if the helper is non-trivial.

---

## Contributing / 기여

Contributions are welcome. Before opening a merge request, please:

1. Read `CONTRIBUTING.md` and `OWNERS` for review routing.
2. Keep new helpers small and composable; prefer extending `lib/` over duplicating logic.
3. Update `bin/`-prefixed names to follow the existing `tmux-<topic>` convention.
4. For layout additions, drop the YAML under `layouts/` and reference it from `tmux-template-create` if it should ship as a preset.
5. For TUI changes, run `bun test` and `bun run check` and ensure no regressions.
6. Document non-obvious behavior in `docs/` (see existing `session-persistence-brainstorming.md` and `supermemory-governance.md` for tone and depth).

`OWNERS` lists the maintainers who can merge; `AGENTS.md` at the repository root is the source of truth for internal project knowledge and is regenerated periodically.

---

## License / 라이선스

This repository is released under the terms described in `LICENSE`.

© Contributors to the tmux Productivity Suite. All product names, trademarks, and registered trademarks are property of their respective owners.