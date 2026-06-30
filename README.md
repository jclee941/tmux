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

이 저장소는 실전에서 검증된 `tmux.conf`, 프로젝트 검색을 위한 `sessionizer.conf`, 그리고 `bin/` 디렉터리의 큐레이션된 보조 바이너리들을 함께 제공합니다. `lib/`의 공유 셸 라이브러리, `layouts/`의 프로젝트형 윈도우 레이아웃, 모던 터미널 UI(`tui/sessionizer/`), 그리고 Slack ↔ tmux 브리지(`slack/tmux-bridge/`)가 한 곳에서 동작합니다.

### Who is this for? / 사용 대상

| Audience / 대상 | Use case / 활용 사례 |
| --- | --- |
| Multi-project developers / 다수 프로젝트 개발자 | Jump between repos, save layouts per project, fast session creation / 저장소 간 빠른 이동, 프로젝트별 레이아웃, 빠른 세션 생성 |
| DevOps / SRE engineers / DevOps · SRE 엔지니어 | SSH host picker, system stats, layout templates for infra panes / SSH 호스트 선택기, 시스템 통계, 인프라용 레이아웃 템플릿 |
| Remote / pair workers / 원격 · 페어 작업자 | Slack bridge for shared sessions, web terminal fallback / 공유 세션을 위한 Slack 브리지, 웹 터미널 폴백 |
| Keyboard-first users / 키보드 우선 사용자 | fzf-driven command palette, session dashboard, cheatsheet / fzf 기반 커맨드 팔레트, 세션 대시보드, 단축키 시트 |

### Design principles / 설계 원칙

- **Bash-first** / **Bash 우선**: All shell tooling is plain bash plus `fzf`; no Python/Ruby runtime dependency. / 모든 셸 도구는 순수 bash와 `fzf`만 사용하며 Python/Ruby 런타임 의존성이 없습니다.
- **Composable** / **조합 가능**: Every helper is a standalone binary that sources shared modules from `lib/`. / 모든 헬퍼는 `lib/`의 공유 모듈을 가져오는 독립 실행형 바이너리입니다.
- **Declarative layouts** / **선언적 레이아웃**: Project windows live in YAML, not in shell scripts. / 프로젝트 윈도우는 셸 스크립트가 아닌 YAML로 정의됩니다.
- **Two UIs, one model** / **두 개의 UI, 하나의 모델**: fzf picker and the Bun TUI speak the same sessionizer protocol. / fzf 피커와 Bun TUI는 동일한 세션나이저 프로토콜을 사용합니다.

---

## Features / 기능

### Core tmux experience / 핵심 tmux 경험

- Tokyo Night-themed status line with pane-border status, responsive width tiers, and live CPU/MEM/git indicators / Tokyo Night 테마 상태 표시줄, 패널 보더 상태, 반응형 너비 등급, 실시간 CPU/MEM/git 인디케이터
- Tree-style sidebar that visualizes sessions, windows, and panes, toggleable from the prefix / 세션·윈도우·패널을 트리 형태로 시각화하는 사이드바, 프리픽스로 토글
- fzf-driven command palette, session dashboard, URL/file/SSH pickers, and clipboard history browser / fzf 기반 커맨드 팔레트, 세션 대시보드, URL/파일/SSH 선택기, 클립보드 히스토리 브라우저
- Session lifecycle helpers: create, kill, rename, jump (MRU), cycle, branch-log, dashboard, export / 세션 수명 주기 헬퍼: 생성, 종료, 이름 변경, 점프(MRU), 순환, 브랜치 로그, 대시보드, 내보내기
- Config reload with diff view, synchronize-panes toggle, smart word copy under cursor / 설정 리로드와 diff 뷰, 동기화 패널 토글, 커서 단어 스마트 복사

### Project workflow / 프로젝트 워크플로

- **Sessionizer** (`tmux-sessionizer`): discover git worktrees, configured paths, and `EXTRA_DIRS` from `sessionizer.conf`; create or jump to a session in one keystroke / `sessionizer.conf`의 git worktree, 설정 경로, `EXTRA_DIRS`를 검색하여 한 번의 키 입력으로 세션을 생성하거나 점프
- **TUI Sessionizer** (`tmux-sessionizer-tui`): keyboard-first React-style interface with preview, filters, and a multi-step creation wizard / 키보드 우선 React 스타일 인터페이스, 미리보기, 필터, 다단계 생성 마법사 제공
- **Layout apply** (`tmux-layout-apply`): turn a YAML layout file into live windows with named panes, working directories, and pre-run commands / YAML 레이아웃 파일을 작업 디렉터리와 사전 실행 명령이 지정된 라이브 윈도우로 변환
- **Template create** (`tmux-template-create`): scaffold a new layout YAML from a preset / 프리셋에서 새 레이아웃 YAML 생성
- **Session export** (`tmux-session-export`): serialize the current session into a YAML layout for reuse / 현재 세션을 재사용 가능한 YAML 레이아웃으로 직렬화

### Integrations / 통합

- **Slack bridge** (`slack/tmux-bridge/`): bidirectional tmux ↔ Slack channel mirroring (inbound commands, outbound pane output), with both direct-socket and tunneled modes / tmux ↔ Slack 채널 양방향 미러링 (인바운드 명령, 아웃바운드 패널 출력), 다이렉트 소켓 및 터널 모드 지원
- **Web terminal** (`tmux-web-terminal`): launch `ttyd` bound to a session for browser-based access / 브라우저 기반 접속을 위해 세션에 `ttyd` 바인딩
- **Desktop notifications** (`tmux-notify-long-command`): alert when commands exceed a configurable threshold / 설정 가능한 임계값을 초과하는 명령에 데스크톱 알림
- **OpenCode launcher** (`tmux-opencode`): pre-wired session launcher for OpenCode workflows / OpenCode 워크플로를 위한 사전 구성된 세션 실행기
- **Auto-attach** (`tmux-auto-attach`): seamless login-shell auto-attach flow / 로그인 셸 자동 attach 흐름

---

## Architecture / 아키텍처

#### Diagram summary 1

- Type: flowchart
- User / prefix C-a + key (User) -> tmux.conf / (root loader) (TmuxConf)
- tmux.conf / (root loader) (TmuxConf) -> conf.d/00-core.conf (CoreConf)
- tmux.conf / (root loader) (TmuxConf) -> conf.d/10-theme.conf (ThemeConf)
- tmux.conf / (root loader) (TmuxConf) -> conf.d/20-keys.conf (KeysConf)
- tmux.conf / (root loader) (TmuxConf) -> conf.d/25-sidebar.conf (SidebarConf)
- conf.d/20-keys.conf (KeysConf) -> bin/ scripts (Bin)
- bin/ scripts (Bin) -> lib/ shared modules / (sessionizer, sidebar, wizard) (Lib)
- bin/ scripts (Bin) -> tmux server / sessions / windows / panes (TmuxSrv)
- bin/ scripts (Bin) -> layouts/.yml / (declarative window templates) (Layouts)
- bin/ scripts (Bin) -> fzf / (pickers, palettes, history) (Fzf)
- bin/ scripts (Bin) -> tui/sessionizer / (Bun + React/Ink) (Tui)
- tui/sessionizer / (Bun + React/Ink) (Tui) -> tmux server / sessions / windows / panes (TmuxSrv)
- bin/ scripts (Bin) -> slack/tmux-bridge / (Node.js) (Slack)
- slack/tmux-bridge / (Node.js) (Slack) -> tmux server / sessions / windows / panes (TmuxSrv)
- slack/tmux-bridge / (Node.js) (Slack) -> Slack API / (channels, messages) (SlackAPI)
- fzf / (pickers, palettes, history) (Fzf) -> tmux server / sessions / windows / panes (TmuxSrv)
- layouts/.yml / (declarative window templates) (Layouts) -> tmux server / sessions / windows / panes (TmuxSrv)
- tmux server / sessions / windows / panes (TmuxSrv) -> Panes: shell, ssh, editor, logs (Pane)


The whole toolkit is layered: `tmux.conf` only sources `conf.d/*.conf`; each `conf.d` file binds keys to `bin/*` helpers; helpers share code from `lib/`; the TUI and Slack bridge are external consumers of the same `tmux server` that the bash scripts drive.

전체 도구 모음은 계층화되어 있습니다. `tmux.conf`는 `conf.d/*.conf`만 로드하고, 각 `conf.d` 파일은 `bin/*` 헬퍼에 키를 바인딩하며, 헬퍼는 `lib/`의 코드를 공유합니다. TUI와 Slack 브리지는 bash 스크립트가 제어하는 동일한 `tmux server`를 사용하는 외부 컨슈머입니다.

---

## Repository Layout / 저장소 구조

```
.
├── AGENTS.md                 # Internal project knowledge (build/structure notes)
├── CONTRIBUTING.md           # Contribution guidelines
├── LICENSE                   # Project license
├── OWNERS                    # Code owners
├── README.md                 # This document
├── sessionizer.conf          # Project discovery paths for the sessionizer
├── tmux.conf                 # Root tmux configuration loader
├── bin/                      # Executable bash companions (37+ scripts)
│   ├── tmux-sessionizer      # fzf-based session picker + creation wizard
│   ├── tmux-sessionizer-tui  # Launch the Bun/React TUI sessionizer
│   ├── tmux-sidebar*         # Sidebar engine, init, toggle
│   ├── tmux-session-*        # Cycle, kill, rename, jump, dashboard, export, branch-log, icon, order, sync
│   ├── tmux-template-create  # Scaffold a layout YAML
│   ├── tmux-layout-apply     # Apply a YAML layout to the current session
│   ├── tmux-responsive       # Width-tiered statusline
│   ├── tmux-auto-attach      # Login-shell auto-attach
│   ├── tmux-opencode         # OpenCode session launcher
│   ├── tmux-command-palette  # fzf action picker
│   ├── tmux-url-open         # Extract URL from pane via fzf
│   ├── tmux-file-open        # Extract file path from pane via fzf
│   ├── tmux-ssh-picker       # SSH config host picker
│   ├── tmux-clipboard-history# tmux buffer ring browser
│   ├── tmux-copy-word        # Smart word copy under cursor
│   ├── tmux-pane-sync        # Synchronize-panes toggle
│   ├── tmux-config-reload    # Reload config with diff
│   ├── tmux-notify-long-command # Desktop notification for long commands
│   ├── tmux-bash-preexec     # Sourceable preexec hook
│   ├── tmux-cheatsheet       # Categorized keybinding reference popup
│   ├── tmux-slack-bridge-*   # Slack bridge setup + start
│   ├── tmux-git-status       # Git branch + dirty/ahead/behind/stash status
│   ├── tmux-git-uncommitted  # Track uncommitted changes per session
│   ├── tmux-sys-stats        # CPU load + MEM usage
│   └── tmux-web-terminal     # ttyd web terminal launcher
├── lib/                      # Shared bash modules
│   ├── sidebar-colors        # Sidebar color definitions
│   ├── sidebar-render        # Sidebar rendering engine
│   ├── tmux-sessionizer-common   # Shared sessionizer functions
│   └── tmux-sessionizer-wizard   # Creation wizard logic
├── layouts/                  # Declarative YAML window layouts
│   ├── blacklist.yml
│   ├── default.yml
│   ├── proxmox.yml
│   ├── resume.yml
│   ├── safework.yml
│   ├── safework2.yml
│   └── splunk.yml
├── tui/
│   └── sessionizer/          # Bun + React/Ink Terminal UI
│       ├── AGENTS.md
│       ├── package.json
│       ├── tsconfig.json
│       ├── bunfig.toml
│       ├── bun.lock
│       ├── src/
│       │   ├── App.tsx
│       │   ├── index.tsx
│       │   ├── bun-env.d.ts
│       │   ├── actions/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── lib/
│       └── __tests__/        # bun:test unit tests
├── docs/
│   ├── session-persistence-brainstorming.md
│   └── supermemory-governance.md
└── slack/
    └── tmux-bridge/          # Slack ↔ tmux bridge (Node.js)
        └── AGENTS.md
```

---

## Quick Start / 빠른 시작

### Prerequisites / 사전 요구 사항

| Tool / 도구 | Version / 버전 | Notes / 비고 |
| --- | --- | --- |
| `tmux` | ≥ 3.2 | Recommended ≥ 3.3 for `remain-on-exit` and `display-popup` / `remain-on-exit`와 `display-popup` 사용을 위해 3.3 이상 권장 |
| `bash` | ≥ 4.0 | `lib/*.bash` uses associative arrays / 연관 배열 사용 |
| `fzf` | latest | All picker UIs depend on it / 모든 피커 UI의 의존성 |
| `git` | ≥ 2.20 | Used by sessionizer and git-status helpers / 세션나이저 및 git-status 헬퍼에서 사용 |
| `Bun` | ≥ 1.0 | Only required for the TUI sessionizer / TUI 세션나이저에서만 필요 |
| `Node.js` | ≥ 18 | Only required for the Slack bridge / Slack 브리지에서만 필요 |
| `ttyd` | latest | Only for `tmux-web-terminal` / `tmux-web-terminal` 전용 |
| A Nerd Font | any | For sidebar icons and status glyphs / 사이드바 아이콘과 상태 글리프용 |

### Install / 설치

1. **Clone** / **클론**:

   ```bash
   git clone <repo-url> ~/.tmux
   ```

2. **Symlink** so tmux finds `~/.tmux.conf` / tmux가 `~/.tmux.conf`를 찾을 수 있도록 심볼릭 링크:

   ```bash
   ln -sf ~/.tmux/tmux.conf ~/.tmux.conf
   ```

3. **Expose `bin/` on `PATH`** so prefix bindings resolve / 프리픽스 바인딩이 동작하도록 `bin/`을 `PATH`에 노출:

   ```bash
   echo 'export PATH="$HOME/.tmux/bin:$PATH"' >> ~/.bashrc
   ```

4. **Install the TUI deps** (optional) / **TUI 의존성 설치** (선택):

   ```bash
   cd ~/.tmux/tui/sessionizer
   bun install
   ```

5. **Reload tmux** / **tmux 리로드**:

   ```bash
   tmux source-file ~/.tmux.conf
   ```

6. **Auto-attach on login** (optional) / **로그인 시 자동 attach** (선택):

   Add the following to `~/.bash_profile` or `~/.zprofile` / `~/.bash_profile` 또는 `~/.zprofile`에 추가:

   ```bash
   [ -z "$TMUX" ] && command -v tmux-auto-attach >/dev/null && tmux-auto-attach
   ```

---

## Configuration / 설정

### `sessionizer.conf`

Defines project roots and scan rules for `tmux-sessionizer` and the TUI / `tmux-sessionizer`와 TUI가 사용하는 프로젝트 루트 및 스캔 규칙을 정의합니다.

```bash
# Default directory to scan (recursively) for git repos
SCAN_DIR="$HOME/projects"

# Extra directories to include alongside SCAN_DIR
EXTRA_DIRS=(
  "$HOME/work"
  "$HOME/scratch"
)

# Directories to exclude
EXCLUDE_PATTERNS=(
  "*/node_modules/*"
  "*/.venv/*"
  "*/target/*"
)
```

### `tmux.conf` / `conf.d/`

`tmux.conf` is intentionally tiny — it sources files in `conf.d/` in numeric order so layers are easy to reason about / `tmux.conf`는 의도적으로 최소화되어 있으며, 레이어 추론이 용이하도록 `conf.d/`의 파일을 숫자 순서대로 로드합니다.

| File / 파일 | Role / 역할 |
| --- | --- |
| `00-core.conf` | Terminal/perf baseline, environment propagation / 터미널·성능 베이스라인, 환경 변수 전파 |
| `10-theme.conf` | Tokyo Night palette, pane-border status / Tokyo Night 팔레트, 패널 보더 상태 |
| `20-keys.conf` | Keybindings (`prefix = C-a`) / 키 바인딩 (`prefix = C-a`) |
| `25-sidebar.conf` | Sidebar bindings and refresh hooks / 사이드바 바인딩 및 새로 고침 훅 |

### Per-user overrides / 사용자별 재정의

Create `~/.tmux.conf.local` (sourced last by `tmux.conf`) to override anything without touching tracked files / `tmux.conf`가 가장 마지막에 로드하는 `~/.tmux.conf.local`을 만들어 추적되는 파일을 수정하지 않고 재정의할 수 있습니다.

```bash
# Example: change prefix and add a project root
set -g prefix C-b
bind C-b send-prefix
SCAN_DIR="$HOME/code"
```

### Environment variables / 환경 변수

| Variable / 변수 | Default / 기본값 | Purpose / 용도 |
| --- | --- | --- |
| `TMUX_SESSIONIZER_DEPTH` | `5` | Max recursion depth when scanning `SCAN_DIR` / `SCAN_DIR` 스캔 시 최대 재귀 깊이 |
| `TMUX_LONG_CMD_SECONDS` | `15` | Threshold for `tmux-notify-long-command` / `tmux-notify-long-command`의 알림 임계값 |
| `TMUX_SLACK_BRIDGE_MODE` | `socket` | `socket` (direct) or `http` (cloudflared tunnel) / `socket`(다이렉트) 또는 `http`(cloudflared 터널) |
| `TMUX_WEB_TERMINAL_PORT` | `7681` | ttyd port for `tmux-web-terminal` / `tmux-web-terminal`의 ttyd 포트 |

---

## Commands Reference / 명령어 레퍼런스

### Session lifecycle / 세션 수명 주기

| Command / 명령 | Key binding (default) / 키 바인딩 (기본) | Description / 설명 |
| --- | --- | --- |
| `tmux-sessionizer` | `prefix + s` | fzf session picker with creation wizard / 생성 마법사가 포함된 fzf 세션 선택기 |
| `tmux-sessionizer-tui` | `prefix + S` | Launch Bun/React TUI sessionizer / Bun/React TUI 세션나이저 실행 |
| `tmux-session-jump` | `prefix + j` | MRU session picker / MRU 세션 선택기 |
| `tmux-session-cycle` | `prefix + Left` / `prefix + Right` | Rotate through sessions (excludes `opencode`) / 세션 순환 (`opencode` 제외) |
| `tmux-session-kill` | `prefix + X` | Confirm-and-kill current session / 현재 세션 확인 후 종료 |
| `tmux-session-rename` | `prefix + r` | Rename session with validation / 검증과 함께 세션 이름 변경 |
| `tmux-session-icon` | n/a | Map session name → Nerd Font icon / 세션 이름 → Nerd Font 아이콘 매핑 |
| `tmux-session-export` | n/a | Serialize current session to a YAML layout / 현재 세션을 YAML 레이아웃으로 내보내기 |
| `tmux-session-branch-log` | on switch | Log `session → branch` mapping / `session → branch` 매핑 기록 |
| `tmux-session-dashboard` | `prefix + D` | Popup with formatted session table / 포맷된 세션 테이블 팝업 |
| `tmux-session-order` | n/a | Reorder sessions by MRU / MRU 기준으로 세션 재정렬 |
| `tmux-session-sync` | n/a | Reconcile tmux sessions with Slack channels / tmux 세션과 Slack 채널 동기화 |

### Layouts and templates / 레이아웃 및 템플릿

| Command / 명령 | Description / 설명 |
| --- | --- |
| `tmux-template-create` | Scaffold a new YAML layout from a preset / 프리셋에서 새 YAML 레이아웃 생성 |
| `tmux-layout-apply <file.yml>` | Apply a layout to the current session / 현재 세션에 레이아웃 적용 |

### Sidebar / 사이드바

| Command / 명령 | Key binding / 키 바인딩 | Description / 설명 |
| --- | --- | --- |
| `tmux-sidebar` | n/a (renderer) | Render the sidebar tree / 사이드바 트리 렌더링 |
| `tmux-sidebar-init` | on session create | Initialize sidebar state on new sessions / 새 세션에 사이드바 상태 초기화 |
| `tmux-sidebar-toggle` | `prefix + Tab` | Toggle sidebar visibility / 사이드바 가시성 토글 |

### Pickers and palette / 선택기 및 팔레트

| Command / 명령 | Description / 설명 |
| --- | --- |
| `tmux-command-palette` | fzf action picker for common operations / 일반 작업을 위한 fzf 액션 선택기 |
| `tmux-url-open` | Extract a URL from the current pane via fzf / 현재 패널에서 URL 추출 |
| `tmux-file-open` | Extract a file path from the current pane via fzf / 현재 패널에서 파일 경로 추출 |
| `tmux-ssh-picker` | SSH config host picker via fzf / fzf 기반 SSH 설정 호스트 선택기 |
| `tmux-clipboard-history` | Browse tmux buffer ring via fzf / fzf로 tmux 버퍼 링 탐색 |
| `tmux-cheatsheet` | Categorized keybinding reference popup / 분류된 키 바인딩 참조 팝업 |

### Editing / 편집

| Command / 명령 | Description / 설명 |
| --- | --- |
| `tmux-copy-word` | Smart copy of the word under the cursor / 커서 아래 단어 스마트 복사 |
| `tmux-pane-sync` | Toggle synchronize-panes / 패널 동기화 토글 |
| `tmux-bash-preexec` | Sourceable preexec hook for command timing / 명령 시간 측정용 소스 가능 preexec 훅 |

### Status and notifications / 상태 및 알림

| Command / 명령 | Description / 설명 |
| --- | --- |
| `tmux-responsive` | Width-tiered statusline rendering / 너비 등급별 상태표시줄 렌더링 |
| `tmux-sys-stats` | CPU load + MEM usage / CPU 부하 + 메모리 사용량 |
| `tmux-git-status` | Git branch + dirty/ahead/behind/stash / Git 브랜치 + dirty/ahead/behind/stash |
| `tmux-git-uncommitted` | Track uncommitted changes per session / 세션당 미커밋 변경 추적 |
| `tmux-notify-long-command` | Desktop notification when commands run long / 명령이 오래 실행될 때 데스크톱 알림 |
| `tmux-config-reload` | Reload config with diff view / diff 뷰로 설정 리로드 |

### Integrations / 통합

| Command / 명령 | Description / 설명 |
| --- | --- |
| `tmux-auto-attach` | Login-shell auto-attach flow / 로그인 셸 자동 attach 흐름 |
| `tmux-opencode` | OpenCode session launcher / OpenCode 세션 실행기 |
| `tmux-web-terminal` | ttyd web terminal launcher / ttyd 웹 터미널 실행기 |
| `tmux-slack-bridge-setup` | Interactive Slack app setup wizard / 대화형 Slack 앱 설정 마법사 |
| `tmux-slack-bridge-start` | Start the bridge (socket or http mode) / 브리지 시작 (소켓 또는 http 모드) |

---

## Layouts / 레이아웃

Layouts live in `layouts/*.yml` and are applied with `tmux-layout-apply`. Each file declares a list of windows, their working directories, panes, and pre-run commands. / 레이아웃은 `layouts/*.yml`에 있으며 `tmux-layout-apply`로 적용됩니다. 각 파일은 윈도우 목록, 작업 디렉터리, 패널, 사전 실행 명령을 선언합니다.

### Built-in layouts / 내장 레이아웃

| File / 파일 | Purpose / 용도 |
| --- | --- |
| `default.yml` | Generic dev layout (editor + shell + REPL) / 일반 개발 레이아웃 (에디터 + 셸 + REPL) |
| `resume.yml` | Resume-oriented layout for CV/job searches / 이력서/구직용 레이아웃 |
| `safework.yml` | Safe work scratch space / 안전한 작업 스크래치 공간 |
| `safework2.yml` | Variant of `safework.yml` / `safework.yml` 변형 |
| `blacklist.yml` | Single-pane sandbox for "do not disturb" / "방해 금지"용 단일 패널 샌드박스 |
| `proxmox.yml` | Proxmox admin panes / Proxmox 관리 패널 |
| `splunk.yml` | Splunk search + dashboards / Splunk 검색 + 대시보드 |

### Format / 형식

```yaml
name: my-project
root: ~/projects/my-project
windows:
  - name: code
    root: .
    panes:
      - cmd: nvim
      - cmd: ""
  - name: services
    panes:
      - cmd: docker compose logs -f
      - cmd: htop
```

Apply with / 적용:

```bash
tmux-layout-apply ~/.tmux/layouts/default.yml
```

Scaffold a new one with / 새 레이아웃 생성:

```bash
tmux-template-create default > ~/.tmux/layouts/my-project.yml
```

---

## TUI Sessionizer / 터미널 UI 세션나이저

A modern, keyboard-first alternative to the fzf picker, implemented with Bun + React (Ink-style architecture). / fzf 선택기의 현대적인 대안으로, Bun + React (Ink 스타일 아키텍처)로 구현되었습니다.

### Features / 기능

- Live preview pane showing the candidate directory tree / 후보 디렉터리 트리를 보여주는 실시간 미리보기 패널
- Fuzzy filter with debounced re-scan / 디바운스된 재스캔이 있는 퍼지 필터
- Multi-step creation wizard: pick directory → pick layout → pick name / 다단계 생성 마법사: 디렉터리 선택 → 레이아웃 선택 → 이름 선택
- Rename dialog and kill-confirm dialog (keyboard only) / 이름 변경 다이얼로그 및 종료 확인 다이얼로그 (키보드 전용)
- Theming via `src/lib/theme.ts` / `src/lib/theme.ts`를 통한 테마 적용

### Run / 실행

```bash
tmux-sessionizer-tui
```

### Develop / 개발

```bash
cd tui/sessionizer
bun install
bun run dev        # hot reload
bun test           # bun:test suite
bun run build      # production bundle
```

See `tui/sessionizer/AGENTS.md` for component-level architecture notes / 컴포넌트 수준 아키텍처 노트는 `tui/sessionizer/AGENTS.md` 참조.

---

## Slack Bridge / 슬랙 브리지

Bidirectional bridge between tmux sessions and Slack channels, located at `slack/tmux-bridge/`. Use it to share a session with a remote collaborator, or to drive tmux from a phone. / tmux 세션과 Slack 채널 간 양방향 브리지 (`slack/tmux-bridge/`에 위치). 원격 협업자와 세션을 공유하거나 폰에서 tmux를 제어하는 데 사용됩니다.

### Modes / 모드

- **`socket` (default)**: The bridge talks to the tmux server over its local control socket. Use this when Slack bots run on the same host. / 브리지가 로컬 제어 소켓을 통해 tmux 서버와 통신합니다. Slack 봇이 동일 호스트에서 실행될 때 사용합니다.
- **`http`**: The bridge speaks HTTP and is fronted by `cloudflared`. Use this when Slack bots run on a different machine from the tmux server. / 브리지가 HTTP로 동작하며 `cloudflared` 앞에 배치됩니다. Slack 봇이 tmux 서버와 다른 시스템에서 실행될 때 사용합니다.

Set the mode with / 모드 설정:

```bash
export TMUX_SLACK_BRIDGE_MODE=http
```

### Setup / 설정

```bash
tmux-slack-bridge-setup    # Interactive: creates Slack app, sets bot scopes, writes tokens
```

### Start / 시작

```bash
tmux-slack-bridge-start
```

See `slack/tmux-bridge/AGENTS.md` for protocol details and deployment notes / 프로토콜 세부 사항 및 배포 노트는 `slack/tmux-bridge/AGENTS.md` 참조.

---

## Local Development / 로컬 개발

### Editing the bash tooling / bash 도구 편집

- Helpers are plain bash; lint with `shellcheck bin/ lib/` / 헬퍼는 순수 bash이며 `shellcheck bin/ lib/`로 린트
- Source modules directly with `source lib/tmux-sessionizer-common` to unit-test functions / 모듈을 직접 `source lib/tmux-sessionizer-common`로 가져와 함수 단위 테스트
- After edits, run `tmux-config-reload` to reload `tmux.conf` and see a diff of changed options / 편집 후 `tmux-config-reload`를 실행해 `tmux.conf`를 리로드하고 변경된 옵션의 diff 확인

### Editing layouts / 레이아웃 편집

```bash
tmux-session-export > /tmp/my-session.yml     # snapshot a working session
$EDITOR /tmp/my-session.yml                    # tweak
tmux-layout-apply /tmp/my-session.yml          # iterate
```

### Editing the TUI / TUI 편집

```bash
cd tui/sessionizer
bun install
bun run dev                # hot reload into a tmux popup
bun test                   # bun:test
```

### Editing the Slack bridge / Slack 브리지 편집

```bash
cd slack/tmux-bridge
npm install
npm run dev                # tsx watch mode
npm test
```

### Style / 스타일

- Bash: `shellcheck` clean, `set -euo pipefail`, prefer `printf` over `echo` / `shellcheck` 통과, `set -euo pipefail`, `echo`보다 `printf` 권장
- TypeScript: ESLint + Prettier (defaults from `package.json`) / ESLint + Prettier (`package.json` 기본값)
- YAML: 2-space indent, lower-case keys, comment the purpose of each window / 2-space 들여쓰기, 소문자 키, 각 윈도우의 용도를 주석으로 명시

---

## Testing / 테스트

### Bash helpers / bash 헬퍼

The repository does not ship a hardcoded bash unit test runner, but every helper is designed to be sourceable for quick smoke tests. / 저장소에는 하드코딩된 bash 단위 테스트 러너가 포함되어 있지 않지만, 모든 헬퍼는 빠른 스모크 테스트를 위해 소스 가능하도록 설계되었습니다.

```bash
# Smoke-test sessionizer functions
bash -c 'source lib/tmux-sessionizer-common; session_name_valid "demo-01" && echo OK'
```

CI may invoke helpers against a throwaway tmux server (`tmux -L test new-session -d`) to validate behavior / CI는 임시 tmux 서버 (`tmux -L test new-session -d`)에 대해 헬퍼를 호출하여 동작을 검증할 수 있습니다.

### TUI / TUI

```bash
cd tui/sessionizer
bun test
```

Tests live in `tui/sessionizer/__tests__/` and exercise `src/lib/*.ts` (config, tmux wrappers, etc.). / 테스트는 `tui/sessionizer/__tests__/`에 있으며 `src/lib/*.ts`(config, tmux wrapper 등)를 검증합니다.

### Slack bridge / Slack 브리지

```bash
cd slack/tmux-bridge
npm test
```

A `.gitlab-ci.yml` (if present) runs the Slack bridge suite on tagged merge requests / `.gitlab-ci.yml`이 있는 경우 태그된 머지 리퀘스트에서 Slack 브리지 스위트를 실행합니다.

---

## Contributing / 기여

Contributions are welcome. Please read `CONTRIBUTING.md` first — it covers the workflow, commit conventions, and review process for this repository. / 기여를 환영합니다. 먼저 `CONTRIBUTING.md`를 읽어주세요. 이 문서에는 워크플로, 커밋 규칙, 리뷰 프로세스가 설명되어 있습니다.

### High-level rules / 상위 규칙

1. Keep new helpers small and single-purpose. / 새 헬퍼는 작고 단일 책임이어야 합니다.
2. Add or update a layout in `layouts/` if your change introduces a new window pattern. / 변경 사항이 새 윈도우 패턴을 도입하는 경우 `layouts/`에 레이아웃을 추가하거나 업데이트하세요.
3. Update the keybinding table in this README when adding `bind` lines. / `bind` 줄을 추가할 때 이 README의 키 바인딩 표를 업데이트하세요.
4. Run `shellcheck` on touched bash files. / 변경된 bash 파일에 `shellcheck`를 실행하세요.
5. Run `bun test` in `tui/sessionizer/` if you touched the TUI. / TUI를 변경한 경우 `tui/sessionizer/`에서 `bun test`를 실행하세요.

### Maintainers / 메인테이너

See `OWNERS` for the current list of reviewers. / 현재 리뷰어 목록은 `OWNERS`를 참조하세요.

---

## License / 라이선스

See `LICENSE` in the repository root for full license text. / 전체 라이선스 전문은 저장소 루트의 `LICENSE`를 참조하세요.
