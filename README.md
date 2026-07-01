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

This repository bundles a battle-tested `tmux.conf` (prefix `C-a`, Tokyo Night theme), a `sessionizer.conf` for project discovery, and a curated set of companion binaries under `bin/`. It ships shared shell libraries under `lib/`, project-style window layouts under `layouts/`, a modern Terminal UI (`tui/sessionizer/`) written in Bun + React + TypeScript, and a Slack ↔ tmux bridge (`slack/tmux-bridge/`).

The whole stack is bash-first: every `bin/*` tool is a small, composable shell script backed by `tmux` and `fzf`, so you can read the source, fork a single helper, and integrate it into your own dotfiles.

이 저장소는 실전에서 검증된 `tmux.conf`(`C-a` 프리픽스, Tokyo Night 테마), 프로젝트 검색을 위한 `sessionizer.conf`, 그리고 `bin/` 디렉터리의 큐레이션된 보조 바이너리들을 함께 제공합니다. `lib/`의 공유 셸 라이브러리, `layouts/`의 프로젝트형 윈도우 레이아웃, Bun + React + TypeScript 기반 모던 터미널 UI(`tui/sessionizer/`), 그리고 Slack ↔ tmux 브리지(`slack/tmux-bridge/`)가 한 곳에서 동작합니다.

전체 스택은 bash 우선 구조입니다. 모든 `bin/*` 도구는 작고 조합 가능한 셸 스크립트로 작성되어 있어 소스를 직접 읽고, 단일 헬퍼를 포크하여 자신의 dotfiles에 통합할 수 있습니다.

### Who is this for? / 사용 대상

| Audience / 대상 | Use case / 활용 사례 |
| --- | --- |
| Multi-project developers / 다수 프로젝트 개발자 | Jump between repos, save layouts per project, fast session creation / 저장소 간 빠른 이동, 프로젝트별 레이아웃, 빠른 세션 생성 |
| DevOps / SRE engineers / DevOps · SRE 엔지니어 | SSH host picker, session sync, sidebar overview of remote work / SSH 호스트 picker, 세션 동기화, 원격 작업용 사이드바 |
| Tmux power users / tmux 파워 유저 | Custom prefix, statusbar scripts, fzf-driven workflows / 커스텀 프리픽스, 상태바 스크립트, fzf 기반 워크플로우 |
| Teams that bridge chat & terminal / 채팅·터미널을 연결하는 팀 | Slack ↔ tmux bidirectional bridge / Slack ↔ tmux 양방향 브리지 |

---

## Features / 기능

### Session management / 세션 관리

- `tmux-sessionizer` — fzf-driven session picker and creation wizard for scanned directories.
- `tmux-sessionizer-tui` — launches the React-based TUI sessionizer.
- `tmux-session-cycle` / `tmux-session-order` — PgUp/PgDn session rotation, MRU-first ordering.
- `tmux-session-jump` — quick MRU jump via fzf.
- `tmux-session-kill` / `tmux-session-rename` — safe session termination and rename with validation.
- `tmux-session-dashboard` — formatted session table popup.
- `tmux-session-icon` — Nerd Font icon per session.
- `tmux-session-export` / `tmux-session-branch-log` — export layout to YAML, log session→branch on switch.
- `tmux-session-sync` — sync tmux sessions with Slack channels.
- `tmux-template-create` — quick-create sessions from preset templates.
- `tmux-layout-apply` — apply a YAML layout template to an existing or new session.

### Sidebar / 사이드바

- `tmux-sidebar` — tree sidebar display engine.
- `tmux-sidebar-init` — bootstrap sidebar on session creation.
- `tmux-sidebar-toggle` — toggle sidebar visibility.

### Statusbar / 상태바

- `tmux-responsive` — width-tiered statusbar rendering (adapts to terminal width).
- `tmux-sys-stats` — CPU load and memory usage in the status bar.
- `tmux-git-status` — git branch + dirty/ahead/behind/stash indicators.
- `tmux-git-uncommitted` — track uncommitted changes per session.

### Pane & buffer helpers / 페인 & 버퍼 헬퍼

- `tmux-clipboard-history` — browse tmux paste buffer ring with fzf.
- `tmux-copy-word` — smart word copy under the cursor.
- `tmux-url-open` / `tmux-file-open` — extract URLs/file paths from the pane with fzf and open them.
- `tmux-ssh-picker` — pick a host from `~/.ssh/config` via fzf.
- `tmux-pane-sync` — toggle `synchronize-panes`.

### Configuration & UX / 설정 & UX

- `tmux-config-reload` — reload config and diff settings.
- `tmux-auto-attach` — login-shell auto-attach flow.
- `tmux-command-palette` — fzf action picker for common operations.
- `tmux-cheatsheet` — categorized keybinding popup.
- `tmux-notify-long-command` — desktop notification when commands run long.
- `tmux-bash-preexec` — sourceable preexec hook for command timing.

### Integrations / 통합

- `tmux-opencode` — OpenCode session launcher.
- `tmux-web-terminal` — `ttyd`-based web terminal launcher.
- `tmux-slack-bridge-start` / `tmux-slack-bridge-setup` — Slack ↔ tmux bridge startup and interactive setup wizard.

### TUI Sessionizer / 터미널 UI 세션나이저

- Bun + React + TypeScript application under `tui/sessionizer/`.
- Wizard for creating a new session (directory → layout → name).
- Live preview panel, kill confirm dialog, rename dialog, filter input.
- Shared config & state modules, themeable.

---

## Architecture / 아키텍처

The repository is layered: a thin loader at the top, shell tooling in the middle, and a pair of optional subsystems (TUI, Slack bridge) on the side.

이 저장소는 계층적 구조입니다. 최상단에 얇은 로더, 중간에 셸 도구, 측면에 두 개의 선택적 서브시스템(TUI, Slack 브리지)이 있습니다.

### Layers / 계층

| Layer / 계층 | Path / 경로 | Role / 역할 |
| --- | --- | --- |
| Loader / 로더 | `tmux.conf`, `sessionizer.conf` | Single entry point; sources sub-configs, defines prefix/theme / 단일 진입점, 하위 설정 소싱, 프리픽스/테마 정의 |
| Shell tools / 셸 도구 | `bin/` | Small composable bash helpers invoked by keybindings / 키바인딩으로 호출되는 작고 조합 가능한 bash 헬퍼 |
| Shared libs / 공유 라이브러리 | `lib/` | Reused shell modules: sessionizer logic, sidebar render, colors, wizard / 재사용 셸 모듈: 세션나이저 로직, 사이드바 렌더, 색상, 마법사 |
| Layouts / 레이아웃 | `layouts/*.yml` | Declarative window templates per project style / 프로젝트 스타일별 선언적 윈도우 템플릿 |
| TUI / 터미널 UI | `tui/sessionizer/` | Bun + React + TypeScript alternative picker with preview, wizard, dialogs / Bun + React + TypeScript 기반 picker, 미리보기·마법사·다이얼로그 포함 |
| Slack bridge / Slack 브리지 | `slack/tmux-bridge/` | Bidirectional Slack ↔ tmux message sync / Slack ↔ tmux 양방향 메시지 동기화 |
| Docs / 문서 | `docs/` | Brainstorms & governance notes / 브레인스토밍 및 거버넌스 노트 |

### Request flow example: pick or create a session / 세션 선택/생성 흐름

1. User triggers a keybinding (default `prefix + s` or similar in `tmux.conf`).
2. tmux runs `run-shell` invoking `bin/tmux-sessionizer` (or `tmux-sessionizer-tui` for the TUI variant).
3. `tmux-sessionizer` sources `lib/tmux-sessionizer-common` and `lib/tmux-sessionizer-wizard`.
4. `sessionizer.conf` provides `SCAN_DIR` / `EXTRA_DIRS`; the script enumerates candidate directories and pipes them to `fzf`.
5. On selection, the wizard (shell or React) gathers missing fields and creates a session via `tmux new-session`.
6. If a layout file matches the project (e.g. `layouts/proxmox.yml`), `tmux-layout-apply` materialises windows and panes.

### Statusbar flow / 상태바 흐름

1. tmux's `status-interval` triggers `bin/tmux-responsive`.
2. `tmux-responsive` measures terminal width and emits a tiered status string.
3. Segment scripts (`tmux-sys-stats`, `tmux-git-status`, `tmux-git-uncommitted`, `tmux-session-icon`) are inlined or piped in.
4. `tmux-sidebar-init` registers a sidebar pane on session create; `tmux-sidebar-toggle` flips its visibility at runtime.

---

## Repository Layout / 저장소 구조

```
.
├── AGENTS.md                       # Project knowledge base for agents
├── CONTRIBUTING.md                 # Contribution guide
├── LICENSE                         # License file
├── OWNERS                          # Code ownership
├── README.md                       # This file
├── sessionizer.conf                # SCAN_DIR / EXTRA_DIRS for session discovery
├── tmux.conf                       # Root tmux config loader
├── bin/                            # Bash execution surface (session, sidebar, status)
├── lib/                            # Shared shell library modules
├── layouts/                        # Declarative YAML window templates
├── tui/sessionizer/                # Bun + React + TypeScript TUI
├── slack/tmux-bridge/              # Slack ↔ tmux bridge (Node.js)
└── docs/                           # Brainstorms & governance notes
```

---

## Quick Start / 빠른 시작

### Prerequisites / 사전 요구 사항

| Tool / 도구 | Min version / 최소 버전 | Used for / 용도 |
| --- | --- | --- |
| `tmux` | 3.2+ | Core multiplexer / 멀티플렉서 본체 |
| `bash` | 4+ | All `bin/*` scripts / 모든 `bin/*` 스크립트 |
| `fzf` | 0.40+ | Fuzzy pickers across most tools / 대부분의 picker |
| `git` | 2+ | `tmux-git-status`, `tmux-git-uncommitted` |
| `bun` | 1.1+ | Only for `tui/sessionizer` / TUI 사용 시에만 |
| `node` / `tsx` | 20+ / latest | Only for `slack/tmux-bridge` / 브리지 사용 시에만 |
| `ttyd` | optional | `tmux-web-terminal` only / 웹 터미널 사용 시에만 |
| Nerd Font | optional | `tmux-session-icon` glyphs / 아이콘 글리프 |

### Install / 설치

1. Clone the repo into a stable location (e.g. `~/dotfiles/tmux-suite`).

   ```bash
   git clone <this-repo> ~/dotfiles/tmux-suite
   ```

2. Symlink (or copy) `tmux.conf` to `~/.tmux.conf`. The included `tmux.conf` is a thin loader that sources the bundled `conf.d/*.conf` files in this repository.

   ```bash
   ln -sf ~/dotfiles/tmux-suite/tmux.conf ~/.tmux.conf
   ```

3. Add the tool directories to your `PATH` (or symlink each helper into `~/.local/bin`).

   ```bash
   export PATH="$HOME/dotfiles/tmux-suite/bin:$PATH"
   export PATH="$HOME/dotfiles/tmux-suite/lib:$PATH"
   ```

4. Optionally add `~/dotfiles/tmux-suite/sessionizer.conf` as a sourced file in your shell rc, or copy its `SCAN_DIR` / `EXTRA_DIRS` exports into your existing config.

5. Start tmux. On first launch you should see the Tokyo Night statusbar and the `prefix = C-a` mapping.

   ```bash
   tmux new-session -A -s main
   ```

### First session / 첫 세션 만들기

```text
prefix + s              # open sessionizer (fzf picker)
prefix + S              # open TUI sessionizer (Bun)
prefix + c              # quick-create session from template
```

---

## Configuration / 설정

### `tmux.conf`

The shipped `tmux.conf` is a loader. The behavior you can tweak lives in the referenced sub-config files (e.g. `conf.d/00-core.conf`, `conf.d/10-theme.conf`, `conf.d/20-keys.conf`). Common knobs:

| Setting / 설정 | Default / 기본값 | Notes / 비고 |
| --- | --- | --- |
| Prefix / 프리픽스 | `C-a` | Two-key style: prefix, then command / prefix → 명령의 2단 구조 |
| Status interval / 상태바 갱신 | `5` seconds | Drives `tmux-responsive` and segment scripts / `tmux-responsive` 및 세그먼트 스크립트 트리거 |
| Mouse / 마우스 | enabled | Copy mode + pane resize on / 복사 모드 및 페인 리사이즈 활성 |
| Theme / 테마 | Tokyo Night | Colors defined in `conf.d/10-theme.conf` / 색상은 `conf.d/10-theme.conf`에 정의 |

### `sessionizer.conf`

Used by `tmux-sessionizer` and `tmux-sessionizer-tui` to know what to scan.

| Variable / 변수 | Purpose / 용도 |
| --- | --- |
| `SCAN_DIR` | Primary directory tree to enumerate projects from / 프로젝트가 있는 최상위 디렉터리 |
| `EXTRA_DIRS` | Space-separated additional directories / 공백으로 구분된 추가 디렉터리 목록 |

Example:

```bash
export SCAN_DIR="$HOME/src"
export EXTRA_DIRS="$HOME/work $HOME/sandbox"
```

### Environment / 환경 변수

| Variable / 변수 | Used by / 사용처 | Effect / 효과 |
| --- | --- | --- |
| `EDITOR` | `tmux-sessionizer`, `tmux-file-open` | Editor to launch on file open / 파일 열기용 에디터 |
| `BROWSER` | `tmux-url-open` | Browser for URL extraction / URL 열기용 브라우저 |
| `PATH` | All `bin/*` | Must include `bin/` and `lib/` / `bin/`, `lib/` 포함 필요 |
| `SLACK_*` | `tmux-slack-bridge-*` | Tokens captured by setup wizard / 셋업 마법사가 저장 |

---

## Commands Reference / 명령어 레퍼런스

All commands live in `bin/`. Names are prefixed with `tmux-` for discoverability. Most return early with a clear message when invoked outside tmux.

모든 명령은 `bin/`에 있습니다. 검색성을 위해 `tmux-` 접두사를 사용합니다. tmux 외부에서 실행되면 명확한 메시지와 함께 조기 종료됩니다.

### Session lifecycle / 세션 수명주기

| Command / 명령어 | Purpose / 용도 |
| --- | --- |
| `tmux-sessionizer` | fzf session picker + creation wizard |
| `tmux-sessionizer-tui` | launch the Bun/React TUI sessionizer |
| `tmux-session-cycle` | PgUp/PgDn session rotation, excluding special sessions |
| `tmux-session-order` | sort sessions by most recently active |
| `tmux-session-jump` | MRU fzf session picker |
| `tmux-session-kill` | safe session termination with confirmation |
| `tmux-session-rename` | rename with validation |
| `tmux-session-dashboard` | formatted session table popup |
| `tmux-session-icon` | Nerd Font icon mapper for sessions |
| `tmux-session-export` | export current session layout to YAML |
| `tmux-session-branch-log` | log session → git branch on switch |
| `tmux-session-sync` | sync tmux sessions with Slack channels |
| `tmux-auto-attach` | login-shell auto-attach flow |

### Templates & layouts / 템플릿 & 레이아웃

| Command / 명령어 | Purpose / 용도 |
| --- | --- |
| `tmux-template-create` | quick-create session from preset template |
| `tmux-layout-apply` | apply a YAML layout template to a session |

### Sidebar / 사이드바

| Command / 명령어 | Purpose / 용도 |
| --- | --- |
| `tmux-sidebar` | tree sidebar display engine |
| `tmux-sidebar-init` | initialize sidebar on session create |
| `tmux-sidebar-toggle` | toggle sidebar visibility |

### Statusbar / 상태바

| Command / 명령어 | Purpose / 용도 |
| --- | --- |
| `tmux-responsive` | width-tiered statusbar rendering |
| `tmux-sys-stats` | CPU load + memory usage |
| `tmux-git-status` | branch + dirty/ahead/behind/stash |
| `tmux-git-uncommitted` | per-session uncommitted tracker |

### Pane & buffer / 페인 & 버퍼

| Command / 명령어 | Purpose / 용도 |
| --- | --- |
| `tmux-clipboard-history` | browse tmux paste buffers via fzf |
| `tmux-copy-word` | smart word copy under cursor |
| `tmux-url-open` | extract URL from pane via fzf and open |
| `tmux-file-open` | extract file path from pane via fzf and open |
| `tmux-ssh-picker` | pick host from `~/.ssh/config` via fzf |
| `tmux-pane-sync` | toggle `synchronize-panes` |

### Configuration & UX / 설정 & UX

| Command / 명령어 | Purpose / 용도 |
| --- | --- |
| `tmux-config-reload` | reload config with settings diff |
| `tmux-command-palette` | fzf action picker for common operations |
| `tmux-cheatsheet` | categorized keybinding popup |
| `tmux-notify-long-command` | desktop notification for long commands |
| `tmux-bash-preexec` | sourceable shell preexec hook for command timing |

### Integrations / 통합

| Command / 명령어 | Purpose / 용도 |
| --- | --- |
| `tmux-opencode` | OpenCode session launcher |
| `tmux-web-terminal` | `ttyd` web terminal launcher |
| `tmux-slack-bridge-setup` | interactive Slack app setup wizard |
| `tmux-slack-bridge-start` | start the bridge (direct socket / HTTP via cloudflared) |

---

## Layouts / 레이아웃

Layouts are declarative YAML files under `layouts/`. They describe named windows, panes, and commands for a project style. `tmux-layout-apply` materialises them into a real tmux session.

레이아웃은 `layouts/` 아래의 선언적 YAML 파일입니다. 프로젝트 스타일별로 명명된 윈도우, 페인, 명령을 기술하며, `tmux-layout-apply`가 이를 실제 tmux 세션으로 구체화합니다.

| File / 파일 | Intent / 용도 |
| --- | --- |
| `default.yml` | Generic baseline window set / 범용 기본 윈도우 구성 |
| `proxmox.yml` | Proxmox host workflow / Proxmox 호스트 워크플로우 |
| `splunk.yml` | Splunk search & dashboard workflow / Splunk 검색 및 대시보드 워크플로우 |
| `resume.yml` | Resume / career doc workspace / 이력서 작성 워크스페이스 |
| `safework.yml` | SafeWork project layout / SafeWork 프로젝트 레이아웃 |
| `safework2.yml` | SafeWork variant layout / SafeWork 변형 레이아웃 |
| `blacklist.yml` | Files/dirs excluded from sessionizer scanning / 세션나이저 스캔 제외 목록 |

Typical YAML structure / 일반적 YAML 구조:

```yaml
name: my-project
root: ~/src/my-project
windows:
  - name: code
    panes:
      - editor
      - shell
  - name: logs
    panes:
      - tail -F var/log/app.log
```

---

## TUI Sessionizer / 터미널 UI 세션나이저

A modern alternative to the fzf picker. Built with Bun + React + TypeScript and OpenTUI primitives.

fzf picker의 모던 대안. Bun + React + TypeScript 및 OpenTUI 프리미티브로 작성되었습니다.

### What's inside / 구성

| Path / 경로 | Purpose / 용도 |
| --- | --- |
| `tui/sessionizer/src/index.tsx` | Entry point / 진입점 |
| `tui/sessionizer/src/App.tsx` | Top-level component / 최상위 컴포넌트 |
| `tui/sessionizer/src/components/` | `session-list`, `preview-panel`, `filter-input`, `create-wizard`, `wizard-step-{dir,layout,name}`, `kill-confirm-dialog`, `rename-dialog` |
| `tui/sessionizer/src/actions/session-actions.ts` | Session mutations (create/kill/rename) / 세션 변경 액션 |
| `tui/sessionizer/src/hooks/use-keyboard-handler.ts` | Keyboard input / 키보드 입력 처리 |
| `tui/sessionizer/src/lib/` | `config`, `create-session`, `dirs`, `state`, `theme`, `tmux` |
| `tui/sessionizer/__tests__/` | Unit tests for `config.ts` and `tmux.ts` |

### Run / 실행

From `tui/sessionizer/`:

```bash
bun install
bun run start          # launches the TUI
```

Or invoke through the shell wrapper:

```bash
tmux-sessionizer-tui
```

### Test / 테스트

```bash
cd tui/sessionizer
bun test
```

---

## Slack Bridge / 슬랙 브리지

`slack/tmux-bridge/` provides bidirectional Slack ↔ tmux sync. Messages posted in a mapped Slack channel appear in a tmux window, and tmux output can be relayed back to Slack.

`slack/tmux-bridge/`는 Slack ↔ tmux 양방향 동기화를 제공합니다. 매핑된 Slack 채널의 메시지가 tmux 윈도우에 표시되고, tmux 출력을 다시 Slack으로 릴레이할 수 있습니다.

### Modes / 모드

| Mode / 모드 | Description / 설명 |
| --- | --- |
| Direct socket / 직접 소켓 | Bridge connects to local tmux socket / 로컬 tmux 소켓에 직접 연결 |
| HTTP via cloudflared / cloudflared HTTP | Bridge reachable through a `cloudflared` tunnel / `cloudflared` 터널을 통한 접근 |

### Setup / 설정

```bash
tmux-slack-bridge-setup    # interactive wizard, captures tokens
tmux-slack-bridge-start    # starts the bridge in chosen mode
```

Tokens and channel mappings are stored locally after the setup wizard completes. See `slack/tmux-bridge/AGENTS.md` for the bridge's own project knowledge.

토큰과 채널 매핑은 셋업 마법사 완료 후 로컬에 저장됩니다. 브리지 자체의 프로젝트 지식은 `slack/tmux-bridge/AGENTS.md`를 참조하세요.

---

## Local Development / 로컬 개발

### Working on `bin/*` scripts / `bin/*` 스크립트 개발

1. The scripts are pure bash — no build step. Edit and re-source.
2. `lib/` modules are sourced via relative paths from `bin/*`; keep the directory layout intact when moving scripts.
3. After changes, run `tmux-config-reload` inside an active tmux session to apply without restarting.
4. Lint with `shellcheck bin/* lib/*` (recommended; not enforced in CI).

### Working on `tui/sessionizer/` / TUI 개발

1. Install Bun ≥ 1.1.
2. From `tui/sessionizer/`: `bun install`.
3. Use `bun run start` for a hot iteration loop.
4. Type-check: `bun run tsc --noEmit` (configured via `tsconfig.json`).
5. Tests: `bun test`.

### Working on `slack/tmux-bridge/` / Slack 브리지 개발

1. Install Node ≥ 20 and `tsx` (`npm i -g tsx` or `bunx tsx`).
2. See `slack/tmux-bridge/AGENTS.md` for run/test instructions.
3. The startup wrapper (`tmux-slack-bridge-start`) supports both direct socket and HTTP-via-cloudflared modes — pick the one matching your local tunnel.

### Editing layouts / 레이아웃 편집

1. Duplicate an existing YAML in `layouts/` and tweak.
2. Test with: `tmux-layout-apply layouts/your-file.yml`.
3. Iterate until panes and commands match expectations.
4. Optionally add it to `tmux-template-create` presets.

---

## Testing / 테스트

### TUI Sessionizer / TUI 세션나이저

```bash
cd tui/sessionizer
bun test
```

Unit tests cover `src/lib/config.ts` and `src/lib/tmux.ts`. Add new tests under `__tests__/` mirroring the source file name.

`src/lib/config.ts`와 `src/lib/tmux.ts`에 대한 단위 테스트가 포함되어 있습니다. 새 테스트는 소스 파일명과 동일하게 `__tests__/` 아래에 추가하세요.

### Slack bridge / Slack 브리지

```bash
cd slack/tmux-bridge
# follow instructions in slack/tmux-bridge/AGENTS.md
```

GitLab CI configuration under `.gitlab-ci.yml` (root, not shown in detail here) covers bridge tests; see the file for the canonical pipeline.

루트의 `.gitlab-ci.yml`이 브리지 테스트를 다룹니다. 공식 파이프라인은 해당 파일을 참조하세요.

### Shell tooling / 셸 도구

Manual testing is the primary path for `bin/*`:

- Open tmux, exercise each keybinding, watch for failures.
- Run scripts with `bash -x bin/<script>` to trace behavior when debugging.
- Confirm `lib/` modules source cleanly with `bash -n lib/<file>`.

---

## Contributing / 기여

1. Fork and create a feature branch.
2. For new `bin/*` helpers, follow the existing pattern: small, single-purpose, sourced via `lib/` modules where shared logic is needed.
3. For layout additions, drop a YAML in `layouts/` and keep it minimal — only declare what differs from `default.yml`.
4. For TUI changes, run `bun test` and ensure types pass before opening a PR.
5. Update this README if you add a new top-level entry point, sub-tool, or layout.
6. Read `CONTRIBUTING.md` and respect `OWNERS` for review routing.

### Style guide / 스타일 가이드

| Area / 영역 | Convention / 규약 |
| --- | --- |
| Shell scripts / 셸 스크립트 | `set -euo pipefail` at top, two-space indent, functions in `lib/` for reuse / 상단에 `set -euo pipefail`, 2칸 들여쓰기, 재사용 함수는 `lib/`에 |
| Naming / 명명 | All public helpers under `bin/` are prefixed `tmux-` / `bin/`의 모든 공개 헬퍼는 `tmux-` 접두사 |
| Layouts / 레이아웃 | YAML, lowercase filenames, no quoted strings unless needed / YAML, 소문자 파일명, 필요 없으면 따옴표 생략 |
| TUI / TUI | TypeScript strict mode, hooks for side effects, components are pure / TypeScript strict 모드, 부수 효과는 hooks, 컴포넌트는 순수 함수 |

---

## License / 라이선스

See `LICENSE` in the repository root. Unless stated otherwise, the contents of this repository are distributed under that license.

라이선스는 저장소 루트의 `LICENSE` 파일을 참조하세요. 별도 표기가 없는 한, 본 저장소의 내용은 해당 라이선스 하에 배포됩니다.