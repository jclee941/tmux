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

The configuration follows Bash-first principles: every helper is a small, composable shell script that can be invoked from inside tmux key bindings, from the command palette, or from a login shell. The TUI sessionizer and the Slack bridge add graphical/remote surfaces without compromising the underlying philosophy.

이 저장소는 실전에서 검증된 `tmux.conf`, 프로젝트 검색을 위한 `sessionizer.conf`, 그리고 `bin/` 디렉터리의 큐레이션된 보조 바이너리들을 함께 제공합니다. `lib/`의 공유 셸 라이브러리, `layouts/`의 프로젝트형 윈도우 레이아웃, 모던 터미널 UI(`tui/sessionizer/`), 그리고 Slack ↔ tmux 브리지(`slack/tmux-bridge/`)가 한 곳에서 동작합니다.

모든 헬퍼는 작고 조합 가능한 셸 스크립트로 작성되어, tmux 키 바인딩·명령 팔레트·로그인 셸 어디서나 호출할 수 있습니다. TUI 세션나이저와 Slack 브리지는 그래픽/원격 인터페이스를 더하지만, 그 아래에 깔린 철학(Bash 우선)은 그대로 유지됩니다.

### Who is this for? / 사용 대상

| Audience / 대상 | Use case / 활용 사례 |
| --- | --- |
| Multi-project developers / 다수 프로젝트 개발자 | Jump between repos, save layouts per project, fast session creation / 저장소 간 빠른 이동, 프로젝트별 레이아웃, 빠른 세션 생성 |
| DevOps / SRE engineers / DevOps · SRE 엔지니어 | SSH picker, layout templates for incident response (splunk, safework, proxmox), long-command notifications / SSH 픽커, 장애 대응용 레이아웃 템플릿, 장시간 명령 알림 |
| Branch-heavy workflows / 브랜치 중심 워크플로우 | Per-session branch tracking, git status in status bar, uncommitted-change awareness / 세션별 브랜치 추적, 상태바의 git 정보, 미커밋 변경 인지 |
| Remote / distributed teams / 원격·분산 팀 | Slack ↔ tmux bridge, web terminal (ttyd), dashboard popups / Slack ↔ tmux 브리지, 웹 터미널(ttyd), 대시보드 팝업 |
| Terminal-native users / 터미널 네이티브 사용자 | fzf-driven picker UIs, sidebar tree, command palette / fzf 기반 픽커 UI, 사이드바 트리, 명령 팔레트 |

---

## Features / 기능

### Core configuration / 핵심 설정

| Feature / 기능 | Description / 설명 |
| --- | --- |
| Opinionated prefix key / 선호 prefix 키 | `C-a` (Ctrl+A) as primary, Vi-style alternatives available / `C-a` 기본, Vi 스타일 보조 키 제공 |
| Tokyo Night theme / Tokyo Night 테마 | Curated palette for panes, status bar, sidebar / 패널·상태바·사이드바용 큐레이션 팔레트 |
| Nerd Font icons / Nerd Font 아이콘 | Session icons, git status glyphs, sidebar tree / 세션 아이콘, git 상태 글리프, 사이드바 트리 |
| Width-tiered statusbar / 폭 적응형 상태바 | `tmux-responsive` collapses elements on narrow terminals / 좁은 터미널에서 요소를 자동 축소 |
| Auto-attach on login / 로그인 시 자동 attach | `tmux-auto-attach` wires shell login to existing/new sessions / 로그인 셸을 기존/신규 세션과 연결 |

### Session orchestration / 세션 오케스트레이션

| Feature / 기능 | Description / 설명 |
| --- | --- |
| fzf session picker / fzf 세션 픽커 | Fuzzy search across project directories / 프로젝트 디렉터리 퍼지 검색 |
| TUI sessionizer / TUI 세션나이저 | Bun + React + TypeScript interactive picker with preview / Bun + React + TypeScript 인터랙티브 픽커(미리보기 포함) |
| Creation wizard / 생성 마법사 | Step-by-step prompts: directory → layout → name / 디렉터리 → 레이아웃 → 이름 단계별 프롬프트 |
| Layout templates / 레이아웃 템플릿 | Declarative YAML describing panes, commands, working dirs / 패널·명령·작업 디렉터리를 선언하는 YAML |
| MRU session jump / MRU 세션 점프 | Most-recently-used ordering for fast switch / 가장 최근 사용 순으로 빠르게 전환 |
| Safe kill with confirmation / 확인 후 안전 종료 | `tmux-session-kill` requires explicit consent / 명시적 동의 후 종료 |
| Session rename / 세션 이름 변경 | Validation + collision check / 유효성 검사 + 이름 충돌 확인 |
| Session sync with Slack / Slack과 세션 동기화 | Mirror channels ↔ sessions / 채널 ↔ 세션 미러링 |
| Export to YAML / YAML로 내보내기 | `tmux-session-export` captures current layout / 현재 레이아웃 캡처 |
| Branch logging / 브랜치 로깅 | `tmux-session-branch-log` records session→branch mapping / 세션→브랜치 매핑 기록 |
| Cycle with exclusions / 제외 항목 순환 | PgUp/PgDn skips OpenCode sessions / OpenCode 세션을 건너뛰며 순환 |
| Dashboard popup / 대시보드 팝업 | Formatted session table on demand / 요청 시 포맷된 세션 테이블 표시 |

### Sidebar / 사이드바

| Feature / 기능 | Description / 설명 |
| --- | --- |
| Tree display / 트리 표시 | Nested session/window/pane tree / 세션·윈도우·패널 중첩 트리 |
| Color-coded entries / 색상 항목 | `sidebar-colors` module / `sidebar-colors` 모듈 |
| Render engine / 렌더 엔진 | `sidebar-render` (shared library) / `sidebar-render` (공유 라이브러리) |
| Init on session create / 세션 생성 시 초기화 | `tmux-sidebar-init` / `tmux-sidebar-init` |
| Toggle visibility / 표시 토글 | `tmux-sidebar-toggle` / `tmux-sidebar-toggle` |

### Pane utilities / 패널 유틸리티

| Feature / 기능 | Description / 설명 |
| --- | --- |
| URL extraction / URL 추출 | `tmux-url-open` + fzf pick / `tmux-url-open` + fzf 선택 |
| File path extraction / 파일 경로 추출 | `tmux-file-open` + fzf pick / `tmux-file-open` + fzf 선택 |
| Clipboard history / 클립보드 히스토리 | `tmux-clipboard-history` browses tmux buffer ring / `tmux-clipboard-history`가 tmux 버퍼 링 탐색 |
| Word copy / 단어 복사 | `tmux-copy-word` smart copy under cursor / `tmux-copy-word` 커서 아래 단어 스마트 복사 |
| Synchronize panes / 패널 동기화 | `tmux-pane-sync` toggle group sync / `tmux-pane-sync` 그룹 동기화 토글 |

### Notifications & monitoring / 알림·모니터링

| Feature / 기능 | Description / 설명 |
| --- | --- |
| Long-command notifications / 장시간 명령 알림 | `tmux-notify-long-command` desktop ping / `tmux-notify-long-command` 데스크톱 알림 |
| System stats in statusbar / 상태바 시스템 통계 | `tmux-sys-stats` CPU + memory / `tmux-sys-stats` CPU + 메모리 |
| Git status / git 상태 | Branch + dirty + ahead/behind + stash / 브랜치 + 변경 + ahead/behind + stash |
| Uncommitted tracking / 미커밋 추적 | `tmux-git-uncommitted` per-session awareness / `tmux-git-uncommitted` 세션별 인지 |

### Connectivity / 연결

| Feature / 기능 | Description / 설명 |
| --- | --- |
| SSH picker / SSH 픽커 | `tmux-ssh-picker` reads `~/.ssh/config` / `tmux-ssh-config`에서 호스트 읽기 |
| Web terminal / 웹 터미널 | `tmux-web-terminal` launches ttyd / `tmux-web-terminal`이 ttyd 실행 |
| Slack bridge / Slack 브리지 | `slack/tmux-bridge/` two-way channel ↔ session sync / `slack/tmux-bridge/` 양방향 채널 ↔ 세션 동기화 |

### Developer experience / 개발자 경험

| Feature / 기능 | Description / 설명 |
| --- | --- |
| Command palette / 명령 팔레트 | `tmux-command-palette` fzf action picker / `tmux-command-palette` fzf 동작 선택기 |
| Cheatsheet popup / 키바인드 참고 팝업 | `tmux-cheatsheet` categorized reference / `tmux-cheatsheet` 분류별 참고 |
| Config reload with diff / diff와 함께 설정 리로드 | `tmux-config-reload` shows settings change / `tmux-config-reload` 설정 변경 표시 |
| OpenCode launcher / OpenCode 실행 | `tmux-opencode` quick session / `tmux-opencode` 빠른 세션 |
| Template create / 템플릿 생성 | `tmux-template-create` from preset / `tmux-template-create` 프리셋 기반 |
| Layout apply / 레이아웃 적용 | `tmux-layout-apply` consumes `layouts/*.yml` / `tmux-layout-apply`가 `layouts/*.yml` 소비 |

---

## Architecture / 아키텍처

### Layers / 계층

| Layer / 계층 | Path / 경로 | Role / 역할 |
| --- | --- | --- |
| Configuration / 설정 | `tmux.conf`, `sessionizer.conf` | Root loader and project discovery inputs / 루트 로더 및 프로젝트 검색 입력 |
| Companion binaries / 보조 바이너리 | `bin/` | Thin Bash invokables invoked from keys or shell / 키/셸에서 호출되는 얇은 Bash 스크립트 |
| Shared libraries / 공유 라이브러리 | `lib/` | Color, render, wizard, common sessionizer logic / 색상·렌더·마법사·공통 세션나이저 로직 |
| Layout templates / 레이아웃 템플릿 | `layouts/*.yml` | Declarative window/pane definitions / 선언적 윈도우/패널 정의 |
| TUI surface / TUI 인터페이스 | `tui/sessionizer/` | Bun + React + TypeScript interactive picker / Bun + React + TypeScript 인터랙티브 픽커 |
| Remote surface / 원격 인터페이스 | `slack/tmux-bridge/` | Node.js Slack ↔ tmux mirror / Node.js Slack ↔ tmux 미러 |

### Session lifecycle / 세션 생명주기

1. **Discovery / 검색** — `sessionizer.conf` provides `SCAN_DIR` and `EXTRA_DIRS`; `tmux-sessionizer` enumerates project roots.
2. **Selection / 선택** — User picks via fzf (CLI) or the TUI (`tui/sessionizer`).
3. **Wizard / 마법사** — `lib/tmux-sessionizer-wizard` collects directory, layout choice, and session name.
4. **Creation / 생성** — `tmux-sessionizer` (or `tmux-template-create`) creates the tmux session and applies the chosen `layouts/*.yml` via `tmux-layout-apply`.
5. **Post-create hooks / 생성 후 훅** — `tmux-sidebar-init` wires the sidebar; `tmux-session-branch-log` records the active branch.
6. **Runtime / 실행 중** — Statusbar renders git/session/sys-stats; long commands trigger notifications.
7. **Switching / 전환** — `tmux-session-cycle`, `tmux-session-jump`, or `tmux-command-palette` rotate sessions.
8. **Termination / 종료** — `tmux-session-kill` prompts for confirmation, then removes the session.

### Slack bridge request flow / Slack 브리지 요청 흐름

1. Slack user posts a message in a mapped channel.
2. `slack/tmux-bridge` (Node.js) receives the event via Slack socket or HTTP (cloudflared) mode.
3. The bridge resolves the channel → session mapping maintained by `tmux-session-sync`.
4. The bridge writes the message into the session's target pane via `tmux send-keys`.
5. Output from tmux is captured and streamed back to Slack, completing the loop.

### TUI architecture / TUI 아키텍처

| File / 파일 | Role / 역할 |
| --- | --- |
| `tui/sessionizer/src/index.tsx` | Entry point / 진입점 |
| `tui/sessionizer/src/App.tsx` | Top-level React component / 최상위 React 컴포넌트 |
| `tui/sessionizer/src/lib/tmux.ts` | tmux invocation layer / tmux 호출 계층 |
| `tui/sessionizer/src/lib/config.ts` | Configuration parser / 설정 파서 |
| `tui/sessionizer/src/lib/dirs.ts` | Directory discovery / 디렉터리 검색 |
| `tui/sessionizer/src/lib/state.ts` | App state container / 앱 상태 컨테이너 |
| `tui/sessionizer/src/lib/theme.ts` | Theme tokens / 테마 토큰 |
| `tui/sessionizer/src/lib/create-session.ts` | Session creation pipeline / 세션 생성 파이프라인 |
| `tui/sessionizer/src/actions/session-actions.ts` | Action handlers / 동작 핸들러 |
| `tui/sessionizer/src/hooks/use-keyboard-handler.ts` | Keyboard mapping / 키보드 매핑 |
| `tui/sessionizer/src/components/*` | UI widgets (list, preview, dialogs, wizard steps) / UI 위젯 |

---

## Repository Layout / 저장소 구조

```
.
├── AGENTS.md                  # Project knowledge base / 프로젝트 지식 베이스
├── CONTRIBUTING.md            # Contribution guide / 기여 가이드
├── LICENSE                    # License file / 라이선스 파일
├── OWNERS                     # Code ownership / 코드 소유권
├── README.md                  # This file / 본 문서
├── tmux.conf                  # Root tmux configuration / 루트 tmux 설정
├── sessionizer.conf           # Project discovery config / 프로젝트 검색 설정
├── bin/                       # Companion binaries (Bash) / 보조 바이너리(Bash)
│   ├── tmux-auto-attach
│   ├── tmux-bash-preexec
│   ├── tmux-cheatsheet
│   ├── tmux-clipboard-history
│   ├── tmux-command-palette
│   ├── tmux-config-reload
│   ├── tmux-copy-word
│   ├── tmux-file-open
│   ├── tmux-git-status
│   ├── tmux-git-uncommitted
│   ├── tmux-layout-apply
│   ├── tmux-notify-long-command
│   ├── tmux-opencode
│   ├── tmux-pane-sync
│   ├── tmux-responsive
│   ├── tmux-session-branch-log
│   ├── tmux-session-cycle
│   ├── tmux-session-dashboard
│   ├── tmux-session-export
│   ├── tmux-session-icon
│   ├── tmux-session-jump
│   ├── tmux-session-kill
│   ├── tmux-session-order
│   ├── tmux-session-rename
│   ├── tmux-session-sync
│   ├── tmux-sessionizer
│   ├── tmux-sessionizer-tui
│   ├── tmux-sidebar
│   ├── tmux-sidebar-init
│   ├── tmux-sidebar-toggle
│   ├── tmux-slack-bridge-setup
│   ├── tmux-slack-bridge-start
│   ├── tmux-ssh-picker
│   ├── tmux-sys-stats
│   ├── tmux-template-create
│   ├── tmux-url-open
│   └── tmux-web-terminal
├── lib/                       # Shared Bash libraries / 공유 Bash 라이브러리
│   ├── sidebar-colors
│   ├── sidebar-render
│   ├── tmux-sessionizer-common
│   └── tmux-sessionizer-wizard
├── layouts/                   # Declarative YAML layouts / 선언적 YAML 레이아웃
│   ├── blacklist.yml
│   ├── default.yml
│   ├── proxmox.yml
│   ├── resume.yml
│   ├── safework.yml
│   ├── safework2.yml
│   └── splunk.yml
├── tui/
│   └── sessionizer/           # Bun + React + TypeScript TUI
│       ├── AGENTS.md
│       ├── bun.lock
│       ├── bunfig.toml
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/               # App, hooks, lib, actions, components
│       └── __tests__/         # config.test.ts, tmux.test.ts
├── docs/                      # Long-form design notes / 설계 노트
│   ├── session-persistence-brainstorming.md
│   └── supermemory-governance.md
└── slack/
    └── tmux-bridge/           # Node.js Slack ↔ tmux bridge
        └── AGENTS.md
```

---

## Quick Start / 빠른 시작

### Prerequisites / 사전 요구 사항

| Tool / 도구 | Purpose / 용도 | Notes / 비고 |
| --- | --- | --- |
| tmux ≥ 3.x | Terminal multiplexer / 터미널 멀티플렉서 | Required / 필수 |
| Bash ≥ 4 | Script runtime / 스크립트 런타임 | macOS users: `brew install bash` / macOS 사용자는 Homebrew로 설치 |
| fzf | Fuzzy picker for sessionizer/SSH/clipboard / 퍼지 픽커 | Required / 필수 |
| Nerd Font | Icons in sidebar, sessions, statusbar / 아이콘 표시 | Recommended / 권장 |
| Bun ≥ 1.x | TUI sessionizer runtime / TUI 세션나이저 런타임 | Only for TUI / TUI 사용 시에만 |
| Node.js ≥ 18 | Slack bridge runtime / Slack 브리지 런타임 | Only for bridge / 브리지 사용 시에만 |
| git | Branch tracking, status / 브랜치 추적·상태 | Most helpers assume git / 다수 헬퍼가 git 가정 |
| ttyd | Web terminal / 웹 터미널 | Optional / 선택 |
| `tmuxinator` style YAML parser | Layout application / 레이아웃 적용 | Handled by `tmux-layout-apply` |

### Install / 설치

1. Clone the repository / 저장소 클론:

   ```bash
   git clone <repository-url> ~/src/tmux-suite
   cd ~/src/tmux-suite
   ```

2. Symlink `tmux.conf` and `sessionizer.conf` into your home / 홈 디렉터리로 심볼릭 링크:

   ```bash
   ln -sf ~/src/tmux-suite/tmux.conf ~/.tmux.conf
   ln -sf ~/src/tmux-suite/sessionizer.conf ~/.sessionizer.conf
   ```

3. Add `bin/` to your `PATH` / `bin/`을 `PATH`에 추가:

   ```bash
   echo 'export PATH="$HOME/src/tmux-suite/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

4. (Optional) Source shared libraries from `lib/` in your bashrc / (선택) `lib/` 공유 라이브러리를 bashrc에서 로드:

   ```bash
   echo 'source ~/src/tmux-suite/lib/sidebar-colors' >> ~/.bashrc
   echo 'source ~/src/tmux-suite/lib/sidebar-render' >> ~/.bashrc
   ```

5. Start tmux / tmux 시작:

   ```bash
   tmux
   ```

### First-run check / 첫 실행 점검

| Check / 점검 | Command / 명령 | Expected / 기대 결과 |
| --- | --- | --- |
| tmux version / tmux 버전 | `tmux -V` | ≥ 3.x / 3.x 이상 |
| fzf available / fzf 사용 가능 | `which fzf` | Path printed / 경로 출력 |
| Binaries visible / 바이너리 노출 | `which tmux-sessionizer` | `~/src/tmux-suite/bin/tmux-sessionizer` |
| Sessionizer runs / 세션나이저 실행 | `tmux-sessionizer` | fzf picker opens / fzf 픽커 표시 |
| TUI launches / TUI 실행 | `tmux-sessionizer-tui` | Bun TUI renders / Bun TUI 렌더링 |

---

## Configuration / 설정

### `tmux.conf`

The root configuration loader. Source it from your real `~/.tmux.conf` or symlink it directly. It is intentionally minimal so that all behavior lives in helpers under `bin/` and templates under `layouts/`.

루트 설정 로더입니다. 실제 `~/.tmux.conf`에서 소싱하거나 직접 심볼릭 링크하세요. 모든 동작은 `bin/`의 헬퍼와 `layouts/`의 템플릿에 살도록 의도적으로 최소화되어 있습니다.

### `sessionizer.conf`

Defines project discovery for `tmux-sessionizer` and the TUI.

| Variable / 변수 | Purpose / 용도 | Example / 예시 |
| --- | --- | --- |
| `SCAN_DIR` | Root directory to recursively scan for projects / 프로젝트를 재귀적으로 검색할 루트 디렉터리 | `~/src` |
| `EXTRA_DIRS` | Additional paths appended to results / 결과에 추가될 경로 | `~/work ~/playground` |
| `MAX_DEPTH` | Depth limit for project discovery / 프로젝트 검색 깊이 제한 | `4` |
| `IGNORE_GLOBS` | Patterns to skip during scan / 검색 시 건너뛸 패턴 | `node_modules target .git` |

Adjust these to match your project tree, then re-run `tmux-sessionizer` to see the updated list.

`SCAN_DIR`과 `EXTRA_DIRS`를 본인 프로젝트 트리에 맞게 조정한 뒤 `tmux-sessionizer`를 다시 실행하면 목록이 갱신됩니다.

### Theme / 테마

Tokyo Night palette is used by default. To customize colors, override the variables defined by `lib/sidebar-colors` from your `~/.bashrc`.

Tokyo Night 팔레트가 기본입니다. 색상을 커스터마이즈하려면 `~/.bashrc`에서 `lib/sidebar-colors`가 정의한 변수를 재정의하세요.

### Keybindings / 키바인딩

The configuration uses `C-a` as the prefix by default. Bindings are defined alongside the helper scripts — see `tmux-cheatsheet` from inside tmux for a full categorized reference.

설정은 기본적으로 `C-a`를 prefix로 사용합니다. 바인딩은 헬퍼 스크립트와 함께 정의되어 있습니다. tmux 내부에서 `tmux-cheatsheet`를 실행하면 분류별 전체 참고를 볼 수 있습니다.

---

## Commands Reference / 명령어 레퍼런스

All commands live under `bin/` and follow the `tmux-<verb>-<noun>` naming convention.

모든 명령은 `bin/`에 있으며 `tmux-<동사>-<명사>` 명명 규칙을 따릅니다.

### Session management / 세션 관리

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-sessionizer` | fzf-driven session picker + creation wizard / fzf 세션 픽커 + 생성 마법사 |
| `tmux-sessionizer-tui` | Launch the Bun/React/TypeScript TUI / Bun/React/TypeScript TUI 실행 |
| `tmux-session-cycle` | Cycle sessions with PgUp/PgDn (excludes OpenCode) / PgUp/PgDn으로 세션 순환(OpenCode 제외) |
| `tmux-session-jump` | MRU fzf session picker / MRU fzf 세션 픽커 |
| `tmux-session-kill` | Kill a session with confirmation / 확인 후 세션 종료 |
| `tmux-session-rename` | Rename session with validation / 유효성 검사 후 세션 이름 변경 |
| `tmux-session-order` | Sort sessions by recency / 최근 사용 순으로 세션 정렬 |
| `tmux-session-icon` | Map Nerd Font icon for a session / 세션의 Nerd Font 아이콘 매핑 |
| `tmux-session-dashboard` | Formatted session table popup / 포맷된 세션 테이블 팝업 |
| `tmux-session-branch-log` | Log active branch per session / 세션별 활성 브랜치 기록 |
| `tmux-session-export` | Export current layout to YAML / 현재 레이아웃을 YAML로 내보내기 |
| `tmux-session-sync` | Mirror sessions ↔ Slack channels / 세션 ↔ Slack 채널 미러링 |

### Templates and layouts / 템플릿·레이아웃

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-template-create` | Create a session from a preset template / 프리셋 템플릿에서 세션 생성 |
| `tmux-layout-apply` | Apply a `layouts/*.yml` to a session / 세션에 `layouts/*.yml` 적용 |
| `tmux-sidebar-init` | Initialize sidebar on session creation / 세션 생성 시 사이드바 초기화 |
| `tmux-sidebar-toggle` | Toggle sidebar visibility / 사이드바 표시 토글 |

### Pane interaction / 패널 상호작용

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-url-open` | Extract and open URLs from pane / 패널에서 URL 추출 후 열기 |
| `tmux-file-open` | Extract and open file paths from pane / 패널에서 파일 경로 추출 후 열기 |
| `tmux-clipboard-history` | Browse tmux buffer ring via fzf / fzf로 tmux 버퍼 링 탐색 |
| `tmux-copy-word` | Smart word copy under cursor / 커서 아래 단어 스마트 복사 |
| `tmux-pane-sync` | Toggle synchronize-panes / synchronize-panes 토글 |
| `tmux-ssh-picker` | Pick SSH host from `~/.ssh/config` / `~/.ssh/config`에서 호스트 선택 |

### Statusbar and monitoring / 상태바·모니터링

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-responsive` | Width-tiered statusbar rendering / 폭 적응형 상태바 렌더링 |
| `tmux-sys-stats` | CPU + memory for status bar / 상태바용 CPU + 메모리 |
| `tmux-git-status` | Branch + dirty + ahead/behind + stash / 브랜치 + 변경 + ahead/behind + stash |
| `tmux-git-uncommitted` | Track uncommitted changes per session / 세션별 미커밋 변경 추적 |
| `tmux-notify-long-command` | Desktop notification for long commands / 장시간 명령 데스크톱 알림 |
| `tmux-bash-preexec` | Sourceable shell preexec for command timing / 명령 시간 측정용 셸 preexec |

### Developer convenience / 개발자 편의

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-command-palette` | fzf action picker / fzf 동작 선택기 |
| `tmux-cheatsheet` | Categorized keybinding popup / 분류별 키바인드 팝업 |
| `tmux-config-reload` | Reload config with settings diff / diff와 함께 설정 리로드 |
| `tmux-auto-attach` | Login-shell auto-attach flow / 로그인 셸 자동 attach |
| `tmux-opencode` | OpenCode session launcher / OpenCode 세션 실행 |
| `tmux-web-terminal` | ttyd web terminal launcher / ttyd 웹 터미널 실행 |

### Slack integration / Slack 연동

| Command / 명령 | Purpose / 용도 |
| --- | --- |
| `tmux-slack-bridge-setup` | Interactive Slack app setup wizard / Slack 앱 대화형 설정 마법사 |
| `tmux-slack-bridge-start` | Start bridge (socket or HTTP via cloudflared) / 브리지 시작(socket 또는 cloudflared HTTP) |

---

## Layouts / 레이아웃

`layouts/` holds declarative YAML files describing window and pane structures. `tmux-layout-apply` consumes them when a session is created or when you trigger a reload.

`layouts/`는 윈도우와 패널 구조를 선언적으로 기술한 YAML 파일을 보관합니다. `tmux-layout-apply`가 세션 생성 시 또는 리로드 시 이를 소비합니다.

| File / 파일 | Intended use / 용도 |
| --- | --- |
| `default.yml` | Generic baseline / 일반 기본값 |
| `resume.yml` | Resume/portfolio context / 이력서·포트폴리오 컨텍스트 |
| `proxmox.yml` | Proxmox operations / Proxmox 운영 |
| `splunk.yml` | Splunk investigation / Splunk 조사 |
| `safework.yml` | Safety-focused workflow / 안전 중심 워크플로우 |
| `safework2.yml` | Variant of safework / safework 변형 |
| `blacklist.yml` | Reference layout for blocked pane content / 차단 패널 참고용 |

### Layout shape / 레이아웃 형태

A layout YAML typically specifies:

- Session name and root directory
- One or more windows
- For each window: panes, working directories, and startup commands

### Custom layouts / 커스텀 레이아웃

1. Copy the closest existing layout under `layouts/`.
2. Edit pane commands, paths, and splits.
3. Reference the file by name when invoking `tmux-layout-apply` or selecting from the wizard.

가장 비슷한 기존 레이아웃을 복사한 뒤 패널 명령·경로·분할을 수정하세요. `tmux-layout-apply` 또는 마법사에서 파일명으로 참조하면 됩니다.

---

## TUI Sessionizer / 터미널 UI 세션나이저

`tui/sessionizer/` is a Bun-powered React/TypeScript terminal UI that mirrors the Bash sessionizer with a richer preview pane, filter input, kill-confirm dialog, rename dialog, and step-by-step creation wizard.

`tui/sessionizer/`는 Bun 기반 React/TypeScript 터미널 UI로, 셸 세션나이저를 더 풍부한 미리보기·필터 입력·종료 확인 다이얼로그·이름 변경 다이얼로그·단계별 생성 마법사와 함께 제공합니다.

### Run / 실행

```bash
cd tui/sessionizer
bun install
bun run start
# or directly:
tmux-sessionizer-tui
```

### Component map / 컴포넌트 맵

| Component / 컴포넌트 | Responsibility / 책임 |
| --- | --- |
| `App.tsx` | Top-level layout and routing / 최상위 레이아웃과 라우팅 |
| `session-list.tsx` | Filterable list of sessions / 필터링 가능한 세션 목록 |
| `filter-input.tsx` | Fuzzy filter input / 퍼지 필터 입력 |
| `preview-panel.tsx` | Live preview of selected session / 선택된 세션의 실시간 미리보기 |
| `kill-confirm-dialog.tsx` | Confirmation before session kill / 세션 종료 전 확인 |
| `rename-dialog.tsx` | Inline rename with validation / 유효성 검사가 포함된 인라인 이름 변경 |
| `create-wizard.tsx` | Multi-step creation flow / 다단계 생성 흐름 |
| `wizard-step-dir.tsx` | Directory selection step / 디렉터리 선택 단계 |
| `wizard-step-layout.tsx` | Layout template selection / 레이아웃 템플릿 선택 |
| `wizard-step-name.tsx` | Final naming step / 최종 이름 지정 단계 |

### Hooks and actions / 훅·액션

- `hooks/use-keyboard-handler.ts` — global key map (enter/esc/j/k/tab/ctrl-c).
- `actions/session-actions.ts` — create, rename, kill, switch actions.
- `lib/state.ts` — central app state.
- `lib/tmux.ts` — thin wrapper around `tmux` CLI calls.
- `lib/theme.ts` — color and style tokens.

---

## Slack Bridge / 슬랙 브리지

`slack/tmux-bridge/` is a Node.js service that mirrors Slack channels and tmux sessions bidirectionally. It enables team members to drive tmux panes from Slack and to follow terminal output in chat.

`slack/tmux-bridge/`는 Slack 채널과 tmux 세션을 양방향으로 미러링하는 Node.js 서비스입니다. 팀원이 Slack에서 tmux 패널을 조작하고, 터미널 출력을 채팅에서 따라갈 수 있도록 합니다.

### Two run modes / 두 가지 실행 모드

| Mode / 모드 | Description / 설명 |
| --- | --- |
| Socket (direct) / Socket 직접 | The bridge connects to Slack via the socket mode; the machine running tmux must be reachable to Slack. / 슬랙 소켓 모드로 직접 연결 |
| HTTP (cloudflared) / HTTP 클라우드플레어 | A `cloudflared` tunnel exposes a local endpoint to Slack's HTTP Events API. / `cloudflared` 터널로 로컬 엔드포인트를 노출 |

Both modes are wrapped by `tmux-slack-bridge-start`, which detects mode from environment variables and `tsx`-executes the bridge entrypoint.

두 모드 모두 `tmux-slack-bridge-start`로 래핑되어 있으며, 환경 변수에서 모드를 감지한 뒤 `tsx`로 브리지 진입점을 실행합니다.

### Setup / 설정

1. Run `tmux-slack-bridge-setup` and follow the interactive wizard to register a Slack app and capture tokens.
2. Choose a mode (socket or HTTP via cloudflared).
3. Invoke `tmux-slack-bridge-start` to begin mirroring.
4. Use `tmux-session-sync` to declare which channels map to which tmux sessions.

1. `tmux-slack-bridge-setup`을 실행해 대화형 마법사에 따라 Slack 앱을 등록하고 토큰을 저장하세요.
2. 모드(socket 또는 cloudflared HTTP)를 선택하세요.
3. `tmux-slack-bridge-start`로 미러링을 시작하세요.
4. `tmux-session-sync`로 채널과 tmux 세션의 매핑을 선언하세요.

### Operations / 운영

| Action / 동작 | How / 방법 |
| --- | --- |
| Inspect mapping / 매핑 확인 | `tmux-session-dashboard` from inside tmux / tmux 내부에서 `tmux-session-dashboard` |
| Re-sync after manual changes / 수동 변경 후 재동기화 | `tmux-session-sync` / `tmux-session-sync` 실행 |
| Stop the bridge / 브리지 중지 | Terminate the process started by `tmux-slack-bridge-start` / `tmux-slack-bridge-start`가 시작한 프로세스 종료 |

---

## Local Development / 로컬 개발

### Bash helpers / Bash 헬퍼

- Edit scripts in `bin/` and `lib/` directly; they are sourced live.
- After editing `tmux.conf`, run `tmux-config-reload` (or `tmux source-file ~/.tmux.conf`) to apply changes and see a settings diff.

`bin/`과 `lib/`의 스크립트는 직접 편집하며 즉시 반영됩니다. `tmux.conf`를 수정한 뒤 `tmux-config-reload`(또는 `tmux source-file ~/.tmux.conf`)를 실행하면 변경 사항이 적용되고 설정 diff가 표시됩니다.

### TUI development / TUI 개발

```bash
cd tui/sessionizer
bun install
bun run dev
```

| Task / 작업 | Command / 명령 |
| --- | --- |
| Install deps / 의존성 설치 | `bun install` |
| Run app / 앱 실행 | `bun run start` |
| Type-check / 타입 검사 | `bun run tsc --noEmit` |
| Build / 빌드 | `bun run build` (per `package.json`) |

### Slack bridge development / Slack 브리지 개발

```bash
cd slack/tmux-bridge
# Per slack/tmux-bridge/AGENTS.md
npm install
npm run dev
```

For end-to-end testing against a real Slack workspace, use `tmux-slack-bridge-setup` to provision credentials and `tmux-slack-bridge-start` for ad-hoc runs.

실제 Slack 워크스페이스로 종단 테스트를 하려면 `tmux-slack-bridge-setup`으로 자격 증명을 준비하고, `tmux-slack-bridge-start`로 임시 실행하세요.

### Adding a new helper / 새 헬퍼 추가

1. Create `bin/tmux-<verb>-<noun>` with a shebang `#!/usr/bin/env bash`.
2. Source shared libraries from `lib/` if needed.
3. Wire a keybinding into your local override (or extend `tmux.conf`).
4. Document it under "Commands Reference / 명령어 레퍼런스".

---

## Testing / 테스트

### TUI tests / TUI 테스트

The TUI ships unit tests under `tui/sessionizer/__tests__/`:

| Test file / 테스트 파일 | Scope / 범위 |
| --- | --- |
| `config.test.ts` | `lib/config.ts` parsing / `lib/config.ts` 파싱 |
| `tmux.test.ts` | `lib/tmux.ts` invocation layer / `lib/tmux.ts` 호출 계층 |

Run with / 실행:

```bash
cd tui/sessionizer
bun test
```

### Slack bridge tests / Slack 브리지 테스트

The Slack bridge pipeline is exercised in CI; see the bridge's `AGENTS.md` for command details and required environment.

Slack 브리지 파이프라인은 CI에서 검증됩니다. 명령과 환경 변수는 브리지의 `AGENTS.md`를 참고하세요.

### Manual checks / 수동 점검

| Area / 영역 | Check / 점검 |
| --- | --- |
| Sessionizer / 세션나이저 | `tmux-sessionizer` returns a sane project list / `tmux-sessionizer`가 적절한 프로젝트 목록 반환 |
| TUI / TUI | `tmux-sessionizer-tui` renders preview pane / `tmux-sessionizer-tui`가 미리보기 패널 렌더링 |
| Sidebar / 사이드바 | New session shows sidebar tree / 새 세션에서 사이드바 트리 표시 |
| Layouts / 레이아웃 | All `layouts/*.yml` parse via `tmux-layout-apply` / 모든 `layouts/*.yml`이 `tmux-layout-apply`로 파싱 |
| Slack / Slack | Channel ↔ session mirror in both directions / 채널 ↔ 세션 양방향 미러링 |
| Notifications / 알림 | Long-running command triggers desktop ping / 장시간 명령 실행 시 데스크톱 알림 발생 |

---

## Contributing / 기여

Contributions are welcome. Please read `CONTRIBUTING.md` first; it covers coding style, commit messages, and review process.

기여를 환영합니다. `CONTRIBUTING.md`를 먼저 읽어 코딩 스타일, 커밋 메시지 규칙, 리뷰 프로세스를 확인하세요.

### Code ownership / 코드 소유권

`OWNERS` lists the maintainers responsible for each path. Use it to find the right reviewer.

`OWNERS`는 경로별 메인테이너를 명시합니다. 적절한 리뷰어를 찾는 데 활용하세요.

### Project knowledge base / 프로젝트 지식 베이스

`AGENTS.md` captures architectural decisions, conventions, and gotchas. Keep it updated when you introduce behavior changes.

`AGENTS.md`는 아키텍처 결정, 컨벤션, 주의 사항을 정리한 문서입니다. 동작 변경을 도입할 때 함께 갱신해 주세요.

### Documentation / 문서

Long-form design notes live under `docs/`. Add new design notes there rather than embedding them in code comments.

장기 설계 노트는 `docs/`에 보관하세요. 코드 주석에 묻지 말고 문서로 분리하는 것을 권장합니다.

---

## License / 라이선스

See the [LICENSE](LICENSE) file for license terms.

라이선스 조건은 [LICENSE](LICENSE) 파일을 참고하세요.