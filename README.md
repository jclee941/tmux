# tmux 생산성 도구 모음 / tmux Productivity Suite

> 큐레이션된 tmux 설정과 풍부한 생태계(보조 도구, 공유 라이브러리, 선언적 YAML 레이아웃, Bun/TypeScript 기반 TUI, Slack 브리지)를 한 저장소에 담은, 다수의 프로젝트·브랜치·원격 호스트를 다루는 파워 유저용 환경입니다.
>
> A curated, opinionated tmux configuration plus a complete ecosystem of companion tools, shared libraries, declarative YAML layouts, a Bun/TypeScript TUI, and a Slack bridge — designed for power users who juggle many projects, branches, and remote hosts.

[![tmux](https://img.shields.io/badge/tmux-%E2%89%A53.2-1bb91f)](https://github.com/tmux/tmux) [![Bash](https://img.shields.io/badge/Bash-%E2%89%A54-4EAA25)](https://www.gnu.org/software/bash/) [![Bun](https://img.shields.io/badge/Bun-%E2%89%A51.1-f9f1e1)](https://bun.sh) [![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933)](https://nodejs.org) [![License](https://img.shields.io/badge/license-see%20LICENSE-blue)](./LICENSE)

---

## 한눈에 보기 / At a Glance

| 항목 / Item | 값 / Value |
| --- | --- |
| 주 언어 / Primary language | Bash + TypeScript (TUI), Node.js (Slack bridge) |
| 런타임 / Runtime | tmux ≥ 3.2, Bash ≥ 4, Bun ≥ 1.1 (TUI), Node.js ≥ 18 (Slack bridge) |
| 진입점 / Entry point | `tmux.conf`, `sessionizer.conf`, `bin/tmux-sessionizer`, `tui/sessionizer/`, `slack/tmux-bridge/` |
| 기본 prefix / Default prefix | `C-a` |
| 상태 / Status | 개인 워크스테이션에서 운영 가능 / Production-ready for personal workstations |
| 세션 규모 / Sessions | 수십~수백 개 가벼운 부하 / Scales to dozens of sessions |
| 라이선스 / License | 저장소 [`LICENSE`](./LICENSE) 참조 / See [`LICENSE`](./LICENSE) |
| 소유자 / Owners | [`OWNERS`](./OWNERS) 참조 / See [`OWNERS`](./OWNERS) |
| 기여 가이드 / Contribution | [`CONTRIBUTING.md`](./CONTRIBUTING.md) 참조 / See [`CONTRIBUTING.md`](./CONTRIBUTING.md) |

### 핵심 흐름 / Core Flow

1. 셸 로그인 시 `tmux-auto-attach` 가 기존 또는 신규 세션을 자동으로 연결합니다.
2. `prefix + s`(세션나이저) 또는 `prefix + S`(TUI 세션나이저)로 세션을 선택하거나 새로 만듭니다.
3. 필요하면 `tmux-layout-apply` 로 YAML 레이아웃 템플릿을 즉시 적용합니다.
4. Slack 브리지를 켜 두면 채널 ↔ 세션이 양방향으로 동기화됩니다.
5. 설정 변경 후 `prefix + r` 로 `tmux-config-reload` 가 안전하게 다시 로드합니다.

---

## 목차 / Table of Contents

- [Purpose / 목적](#purpose--목적)
- [Package Contents / 구성 요소](#package-contents--구성-요소)
- [Status / 상태](#status--상태)
- [First Files to Read / 먼저 읽을 파일](#first-files-to-read--먼저-읽을-파일)
- [Architecture / 구조](#architecture--구조)
- [API or Entry Points / 진입점](#api-or-entry-points--진입점)
- [Quickstart / 빠른 시작](#quickstart--빠른-시작)
- [Configuration / 설정](#configuration--설정)
- [Commands Reference / 명령어 레퍼런스](#commands-reference--명령어-레퍼런스)
- [Local Development / 로컬 개발](#local-development--로컬-개발)
- [Testing / 테스트](#testing--테스트)
- [Contribution Guide / 기여 가이드](#contribution-guide--기여-가이드)
- [Maintainers / Points of Contact / 유지보수자 / 연락처](#maintainers--points-of-contact--유지보수자--연락처)
- [Further Documentation / 추가 문서](#further-documentation--추가-문서)
- [License / 라이선스](#license--라이선스)

---

## Purpose / 목적

### 한국어

이 저장소는 매일 여러 프로젝트, Git 브랜치, 원격 호스트를 동시에 다루는 파워 유저를 위한 tmux 환경입니다. 단일 tmux 설정 파일을 유지하는 대신, 다음과 같은 작업을 하나의 일관된 워크플로우로 묶어 제공합니다.

- **세션 자동 연결 및 빠른 복귀** — 로그인 시점에 세션이 없으면 새로 만들고, 있으면 가장 최근 세션으로 즉시 복귀합니다.
- **세션/창/패널의 선언적 관리** — `layouts/*.yml` 로 분할 비율과 실행 명령을 정의하고 한 번에 적용합니다.
- **키바인딩의 표준화** — prefix `C-a` 와 통일된 보조 도구 호출 규약으로 근육 기억을 재사용할 수 있습니다.
- **TUI 대안** — fzf 기반 텍스트 UI 가 어색한 환경에서는 Bun/TypeScript 기반 세션나이저를 사용합니다.
- **원격 협업** — Slack 채널과 tmux 세션을 양방향으로 동기화하여 다른 팀원의 세션에 즉시 합류할 수 있습니다.

### English

This repository is a tmux environment for power users who juggle many projects, Git branches, and remote hosts every day. Rather than maintaining a single tmux config file, it bundles the following into one consistent workflow.

- **Auto-attach and quick return** — on shell login, create a session if none exists or jump straight to the most recent one.
- **Declarative session/window/pane management** — define split ratios and startup commands in `layouts/*.yml`, then apply them at once.
- **Standardized keybindings** — prefix `C-a` and a unified companion-tool calling convention allow muscle memory to be reused.
- **TUI alternative** — when the fzf-based text UI feels awkward, use the Bun/TypeScript sessionizer.
- **Remote collaboration** — bi-directional sync between Slack channels and tmux sessions lets teammates join sessions instantly.

---

## Package Contents / 구성 요소

### 최상위 디렉터리 / Top-level Layout

| 경로 / Path | 설명 / Description |
| --- | --- |
| `tmux.conf` | tmux 진입 설정. prefix, statusline, 바인딩을 묶어 로드합니다. |
| `sessionizer.conf` | `SCAN_DIR` / `EXTRA_DIRS` 등 세션나이저 디렉터리 정책. |
| `bin/` | tmux 보조 도구 스크립트(Bash). 약 40개의 명령으로 구성됩니다. |
| `bin/lib/` | 보조 도구 간 공유 라이브러리(세션나이저 공통 로직, 사이드바 렌더링 등). |
| `layouts/` | `default`, `proxmox`, `resume`, `safework`, `safework2`, `splunk`, `blacklist` 등 YAML 레이아웃 템플릿. |
| `tui/sessionizer/` | Bun + React(OpenTUI) 기반의 인터랙티브 세션나이저. |
| `slack/tmux-bridge/` | Node.js 기반 Slack ↔ tmux 양방향 브리지. |
| `docs/` | 설계 노트(`session-persistence-brainstorming.md`, `supermemory-governance.md`). |
| `AGENTS.md` | 자동화/문서 생성용 프로젝트 지식 베이스. |
| `CONTRIBUTING.md` | 기여 절차와 규약. |
| `OWNERS` | 코드 오너 목록. |
| `LICENSE` | 라이선스 전문. |

### `bin/` 카테고리별 스크립트 / Scripts by Category

| 카테고리 / Category | 스크립트 / Scripts | 용도 / Purpose |
| --- | --- | --- |
| 세션 선택 / Session picking | `tmux-sessionizer`, `tmux-sessionizer-tui`, `tmux-session-jump`, `tmux-session-cycle`, `tmux-session-order` | fzf 또는 TUI 로 세션 선택, MRU 정렬, 순환. |
| 세션 변경 / Session mutation | `tmux-session-kill`, `tmux-session-rename`, `tmux-session-export`, `tmux-session-branch-log`, `tmux-session-dashboard`, `tmux-template-create` | 안전 종료, 이름 변경, 레이아웃 내보내기, 분기 로그, 대시보드, 템플릿 생성. |
| 세션 아이콘 / Session icon | `tmux-session-icon` | Nerd Font 아이콘 매핑. |
| 사이드바 / Sidebar | `tmux-sidebar`, `tmux-sidebar-init`, `tmux-sidebar-toggle` | 트리형 사이드바 표시, 세션 생성 시 초기화, 표시 토글. |
| 레이아웃 / Layouts | `tmux-layout-apply` | YAML 레이아웃을 세션에 적용. |
| 자동 부착 / Auto-attach | `tmux-auto-attach`, `tmux-opencode`, `tmux-config-reload`, `tmux-notify-long-command`, `tmux-bash-preexec` | 로그인 시 자동 연결, OpenCode 실행, 설정 리로드, 장시간 명령 알림, preexec 훅. |
| 상태바 / Statusbar | `tmux-responsive`, `tmux-sys-stats`, `tmux-git-status`, `tmux-git-uncommitted` | 폭에 따른 적응형 statusbar, CPU/MEM, Git 상태, 미커밋 추적. |
| 유틸리티 / Utilities | `tmux-command-palette`, `tmux-url-open`, `tmux-file-open`, `tmux-ssh-picker`, `tmux-clipboard-history`, `tmux-copy-word`, `tmux-pane-sync`, `tmux-cheatsheet` | fzf 액션 팔레트, URL/파일/SSH 추출, 클립보드 히스토리, 단어 복사, 동기화 토글, 키바인딩 참고. |
| 원격 / Remote | `tmux-web-terminal`, `tmux-slack-bridge-setup`, `tmux-slack-bridge-start` | ttyd 웹 터미널, Slack 앱 설정 마법사, 브리지 기동. |

### `bin/lib/` 공유 라이브러리 / Shared Libraries

| 라이브러리 / Library | 역할 / Role |
| --- | --- |
| `tmux-sessionizer-common` | 세션 디렉터리 스캔, 후보 정규화, 프로젝트 메타데이터 등 세션나이저 공통 로직. |
| `tmux-sessionizer-wizard` | 디렉터리 → 이름 → 레이아웃 순서의 신규 세션 마법사 단계. |
| `sidebar-colors` | 사이드바 색상 팔레트 정의(Tokyo Night 계열). |
| `sidebar-render` | 사이드바 트리 렌더링 엔진. |

### `tui/sessionizer/` TUI 컴포넌트 / TUI Components

| 경로 / Path | 역할 / Role |
| --- | --- |
| `src/index.tsx` | TUI 진입점. |
| `src/App.tsx` | 최상위 컴포넌트, 레이아웃/상태 분배. |
| `src/lib/config.ts` | TUI 설정 로딩. |
| `src/lib/dirs.ts` | 디렉터리 스캔 정책. |
| `src/lib/state.ts` | 세션/필터 상태 관리. |
| `src/lib/tmux.ts` | tmux 명령 호출 어댑터. |
| `src/lib/create-session.ts` | 신규 세션 생성. |
| `src/lib/theme.ts` | 색상/스타일 토큰. |
| `src/hooks/use-keyboard-handler.ts` | 키 입력 라우팅. |
| `src/actions/session-actions.ts` | 세션 액션 정의. |
| `src/components/session-list.tsx` | 세션 목록. |
| `src/components/filter-input.tsx` | 필터 입력. |
| `src/components/preview-panel.tsx` | 미리보기 패널. |
| `src/components/rename-dialog.tsx` | 이름 변경 다이얼로그. |
| `src/components/kill-confirm-dialog.tsx` | 종료 확인. |
| `src/components/create-wizard.tsx` | 신규 세션 마법사 컨테이너. |
| `src/components/wizard-step-dir.tsx` | 마법사 1단계: 디렉터리. |
| `src/components/wizard-step-name.tsx` | 마법사 2단계: 이름. |
| `src/components/wizard-step-layout.tsx` | 마법사 3단계: 레이아웃. |
| `__tests__/config.test.ts`, `__tests__/tmux.test.ts` | 단위 테스트. |

---

## Status / 상태

| 측면 / Aspect | 상태 / Status |
| --- | --- |
| tmux 설정 / tmux config | 안정화, 일일 사용 중 / Stable, in daily use |
| Bash 보조 도구 / Bash companions | 안정화, 일일 사용 중 / Stable, in daily use |
| TUI 세션나이저 / TUI sessionizer | 기능 안정, 인터랙션 개선 진행 중 / Feature-stable, UX iteration ongoing |
| Slack 브리지 / Slack bridge | 동작 확인, 환경별 설정 마법사 필요 / Functional, requires per-environment setup wizard |
| 페어링 자동화 / Pairing automation | 수동(공유 명령) / Manual via shared commands |
| 폐기 예정 / Deprecated | 없음 / None |

---

## First Files to Read / 먼저 읽을 파일

| 순서 / Order | 파일 / File | 이유 / Why |
| --- | --- | --- |
| 1 | [`tmux.conf`](./tmux.conf) | prefix, statusline, 키바인딩, 모든 동작의 토대가 되는 진입점. |
| 2 | [`sessionizer.conf`](./sessionizer.conf) | 세션나이저가 어디를 스캔하는지 정의. |
| 3 | [`bin/tmux-sessionizer`](./bin/tmux-sessionizer) | 세션 선택/생성 UX의 핵심 흐름. |
| 4 | [`bin/lib/tmux-sessionizer-common`](./bin/lib/tmux-sessionizer-common) | 세션나이저 공통 로직. |
| 5 | [`layouts/default.yml`](./layouts/default.yml) | 기본 레이아웃 템플릿. |
| 6 | [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) | TUI 모듈 내부 규약. |
| 7 | [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) | Slack 브리지 모듈 내부 규약. |
| 8 | [`AGENTS.md`](./AGENTS.md) | 저장소 전체 지식 베이스. |
| 9 | [`CONTRIBUTING.md`](./CONTRIBUTING.md) | 기여 절차. |
| 10 | [`docs/session-persistence-brainstorming.md`](./docs/session-persistence-brainstorming.md) | 세션 영속화 설계 노트. |

---

## Architecture / 구조

### 모듈 책임 / Module Responsibilities

| 모듈 / Module | 책임 / Responsibility | 의존 / Depends on |
| --- | --- | --- |
| `tmux.conf` | prefix, statusline, 글로벌 옵션, 바인딩 정의. | `bin/*` 명령 호출. |
| `sessionizer.conf` | 세션나이저의 스캔 정책(소스 디렉터리, 추가 경로). | `bin/tmux-sessionizer*`. |
| `bin/*` (Bash) | tmux 보조 동작 실행. tmux CLI 와 셸 도구 호출. | `bin/lib/*`. |
| `bin/lib/*` (Bash) | 보조 도구 간 공통 로직. | tmux CLI, fzf. |
| `layouts/*.yml` | 분할 비율/실행 명령을 선언적으로 표현. | `bin/tmux-layout-apply`. |
| `tui/sessionizer/` | Bun + React 기반의 인터랙티브 세션나이저. | tmux CLI, `bin/lib/tmux-sessionizer-common` 와 동일한 정책. |
| `slack/tmux-bridge/` | Slack ↔ tmux 메시지 라우팅. | Slack Web API, tmux CLI. |
| `docs/` | 설계 메모, 거버넌스 문서. | 없음. |

### 요청 흐름 예시 / Example Request Flows

#### 1) 세션 선택 / Pick a session

1. 사용자가 `prefix + s` 를 눌러 `tmux-sessionizer` 를 호출합니다.
2. 스크립트가 `sessionizer.conf` 의 `SCAN_DIR` / `EXTRA_DIRS` 를 스캔합니다.
3. `bin/lib/tmux-sessionizer-common` 이 후보 목록을 정규화합니다.
4. fzf 가 후보를 표시하고 사용자가 선택합니다.
5. 기존 세션이면 `tmux switch-client` 로 이동하고, 없으면 마법사가 새 세션을 만듭니다.

#### 2) 레이아웃 적용 / Apply a layout

1. 사용자가 `prefix + L`(또는 명령 팔레트)에서 `tmux-layout-apply` 를 호출합니다.
2. `layouts/` 디렉터리의 YAML 을 선택합니다.
3. YAML 의 창/패널 정의를 읽어 `tmux new-window` / `tmux split-window` / `send-keys` 로 변환·적용합니다.
4. 적용 결과를 statusbar 와 사이드바가 즉시 반영합니다.

#### 3) Slack ↔ tmux 동기화 / Slack ↔ tmux sync

1. `tmux-slack-bridge-setup` 으로 Slack 앱 토큰/채널을 초기화합니다.
2. `tmux-slack-bridge-start` 가 두 가지 모드 중 하나로 기동합니다.
   - **소켓 직접 모드** — 로컬 tmux 서버에 직접 연결.
   - **HTTP / cloudflared 모드** — 외부에서 안전하게 도달.
3. Slack 메시지는 tmux 세션으로, tmux 출력은 채널로 라우팅됩니다.
4. 채널별 ↔ 세션별 매핑이 대시보드(`tmux-session-dashboard`)에 표시됩니다.

---

## API or Entry Points / 진입점

| 진입점 / Entry point | 위치 / Location | 호출 방법 / Invocation |
| --- | --- | --- |
| tmux 시작 | `tmux.conf` | `tmux -f <repo>/tmux.conf` 또는 `~/.tmux` 심볼릭 링크. |
| 세션나이저(텍스트) | `bin/tmux-sessionizer` | `prefix + s` 또는 `tmux-sessionizer` 직접 실행. |
| 세션나이저(TUI) | `bin/tmux-sessionizer-tui` → `tui/sessionizer/` | `prefix + S` 또는 `tmux-sessionizer-tui`. |
| 사이드바 | `bin/tmux-sidebar`, `tmux-sidebar-toggle` | statusbar 에서 자동 렌더, 토글은 `prefix + b`. |
| 레이아웃 적용 | `bin/tmux-layout-apply <layout-name>` | 명령 팔레트 또는 직접 호출. |
| 자동 부착 | `bin/tmux-auto-attach` | 로그인 셸 `.bashrc` / `.zshrc` 에서 source. |
| 설정 리로드 | `bin/tmux-config-reload` | `prefix + r`. |
| Slack 브리지 시작 | `bin/tmux-slack-bridge-start` | 사용자 세션 시작 시 1회 실행. |
| Slack 브리지 설정 | `bin/tmux-slack-bridge-setup` | 최초 1회 인터랙티브 마법사. |

---

## Quickstart / 빠른 시작

### 한국어

1. 저장소를 클론하고 `~/.tmux` 로 심볼릭 링크합니다.
2. `sessionizer.conf` 의 `SCAN_DIR` 을 자신의 프로젝트 루트로 수정합니다.
3. 셸 로그인 시 자동 부착을 위해 `source ~/.tmux/bin/tmux-auto-attach` 를 `.bashrc` / `.zshrc` 에 추가합니다.
4. 새 셸에서 `tmux` 를 실행하면 기본 prefix `C-a` 로 진입합니다.
5. `prefix + s` 로 세션나이저를 호출해 워크플로우를 시작합니다.

### English

1. Clone the repository and symlink it to `~/.tmux`.
2. Edit `SCAN_DIR` in `sessionizer.conf` to point at your project roots.
3. Add `source ~/.tmux/bin/tmux-auto-attach` to your `.bashrc` / `.zshrc` for login-time auto-attach.
4. Run `tmux` in a new shell. The default prefix is `C-a`.
5. Press `prefix + s` to launch the sessionizer and start working.

### 설치 예시 / Install Example

```bash
# 저장소 클론 / Clone
git clone <repo-url> ~/src/tmux-productivity

# ~/.tmux 심볼릭 링크 / Symlink as ~/.tmux
ln -sfn ~/src/tmux-productivity ~/.tmux

# 스캔 정책 확인 / Verify scan policy
$EDITOR ~/.tmux/sessionizer.conf

# 자동 부착 / Auto-attach
echo 'source ~/.tmux/bin/tmux-auto-attach' >> ~/.bashrc
```

---

## Configuration / 설정

### `tmux.conf`

루트 진입 설정입니다. prefix, statusline, 글로벌 옵션, 보조 도구 바인딩을 정의합니다. 변경 후에는 `prefix + r` 로 안전하게 리로드할 수 있습니다.

### `sessionizer.conf`

| 키 / Key | 의미 / Meaning |
| --- | --- |
| `SCAN_DIR` | 세션 후보로 인식할 최상위 디렉터리. |
| `EXTRA_DIRS` | 깊이 스캔 외에 추가로 포함할 경로. |
| `BLACKLIST` | `layouts/blacklist.yml` 패턴 매칭 시 후보 제외. |

### `layouts/*.yml`

| 파일 / File | 용도 / Purpose |
| --- | --- |
| `default.yml` | 표준 2단 분할(좌: 에디터, 우: 셸). |
| `proxmox.yml` | Proxmox 운영 콘솔 템플릿. |
| `resume.yml` | 이력서/문서 작업용. |
| `safework.yml`, `safework2.yml` | 안전 작업/점검 워크플로우. |
| `splunk.yml` | Splunk 검색/대시보드 작업. |
| `blacklist.yml` | 세션나이저 후보 제외 패턴. |

### 환경 변수 / Environment Variables

| 변수 / Variable | 용도 / Purpose |
| --- | --- |
| `TMUX_SESSIONIZER_SCAN_DIR` | `sessionizer.conf` 보다 우선하는 스캔 루트. |
| `TMUX_SLACK_BRIDGE_MODE` | `socket` 또는 `http` (cloudflared). |
| `TMUX_SLACK_TOKENS_PATH` | Slack 앱 토큰 저장 경로. |

---

## Commands Reference / 명령어 레퍼런스

### 주요 바인딩 / Key Bindings (기본값 / Default)

| 키 / Keys | 동작 / Action | 비고 / Notes |
| --- | --- | --- |
| `prefix + s` | `tmux-sessionizer` (fzf) | 텍스트 세션나이저. |
| `prefix + S` | `tmux-sessionizer-tui` | TUI 세션나이저(Bun). |
| `prefix + b` | `tmux-sidebar-toggle` | 사이드바 토글. |
| `prefix + r` | `tmux-config-reload` | 설정 리로드. |
| `prefix + L` | `tmux-layout-apply` | YAML 레이아웃 적용. |
| `prefix + D` | `tmux-session-dashboard` | 세션 대시보드 팝업. |
| `prefix + p` | `tmux-command-palette` | 액션 팔레트. |
| `prefix + ?` | `tmux-cheatsheet` | 키바인딩 참고. |

> 실제 키 조합은 `tmux.conf` 와 보조 도구 스크립트에서 변경할 수 있습니다. / The actual bindings can be adjusted in `tmux.conf` and the helper scripts.

### 보조 도구 전체 목록 / Helper Tools

| 명령 / Command | 요약 / Summary |
| --- | --- |
| `tmux-auto-attach` | 로그인 셸에서 세션 자동 연결. |
| `tmux-bash-preexec` | sourceable preexec 훅(명령 시작/종료 타이밍). |
| `tmux-cheatsheet` | 카테고리별 키바인딩 참고 팝업. |
| `tmux-clipboard-history` | tmux 버퍼 링 브라우저(fzf). |
| `tmux-command-palette` | fzf 액션 팔레트. |
| `tmux-config-reload` | 설정 리로드 + 차이점 표시. |
| `tmux-copy-word` | 커서 위치 단어 스마트 복사. |
| `tmux-file-open` | 패널에서 파일 경로 추출(fzf). |
| `tmux-git-status` | Git 분기 + dirty/ahead/behind/stash. |
| `tmux-git-uncommitted` | 세션별 미커밋 추적. |
| `tmux-layout-apply` | YAML 레이아웃 적용. |
| `tmux-notify-long-command` | 장시간 명령 데스크톱 알림. |
| `tmux-opencode` | OpenCode 세션 런처. |
| `tmux-pane-sync` | synchronize-panes 토글. |
| `tmux-responsive` | 폭 적응형 statusbar. |
| `tmux-session-branch-log` | 세션 → 분기 전환 로그. |
| `tmux-session-cycle` | PgUp/PgDn 세션 순환(opencode 제외). |
| `tmux-session-dashboard` | 포맷팅된 세션 테이블 팝업. |
| `tmux-session-export` | 세션 레이아웃 YAML 내보내기. |
| `tmux-session-icon` | Nerd Font 아이콘 매퍼. |
| `tmux-session-jump` | MRU fzf 세션 피커. |
| `tmux-session-kill` | 안전 종료(확인). |
| `tmux-session-order` | 최근 활성 순 정렬. |
| `tmux-session-rename` | 이름 변경 + 검증. |
| `tmux-session-sync` | tmux ↔ Slack 채널 동기화. |
| `tmux-sessionizer` | fzf 세션 피커 + 생성 마법사. |
| `tmux-sessionizer-tui` | TUI 세션나이저 런처. |
| `tmux-sidebar` | 트리 사이드바 표시 엔진. |
| `tmux-sidebar-init` | 세션 생성 시 사이드바 초기화. |
| `tmux-sidebar-toggle` | 사이드바 표시 토글. |
| `tmux-slack-bridge-setup` | Slack 앱 인터랙티브 설정. |
| `tmux-slack-bridge-start` | Slack 브리지 기동(소켓/HTTP). |
| `tmux-ssh-picker` | SSH config 호스트 피커. |
| `tmux-sys-stats` | CPU/MEM statusbar. |
| `tmux-template-create` | 프리셋 템플릿 빠른 생성. |
| `tmux-url-open` | 패널에서 URL 추출(fzf). |
| `tmux-web-terminal` | ttyd 웹 터미널 런처. |

---

## Local Development / 로컬 개발

### 환경 / Environment

| 도구 / Tool | 버전 / Version | 설치 / Install |
| --- | --- | --- |
| tmux | ≥ 3.2 | 패키지 매니저 |
| Bash | ≥ 4 | 패키지 매니저 |
| fzf | 최신 | 패키지 매니저 또는 brew |
| Bun | ≥ 1.1 | `curl -fsSL https://bun.sh/install \| bash` |
| Node.js | ≥ 18 | 패키지 매니저 또는 nvm |
| ttyd | (선택) | 웹 터미널 사용 시 |

### 디렉터리 워치 / Watch Mode

| 대상 / Target | 명령 / Command |
| --- | --- |
| TUI 세션나이저 | `cd tui/sessionizer && bun --watch src/index.tsx` |
| Slack 브리지 | `cd slack/tmux-bridge && node --watch src/index.js` |

### 코드 스타일 / Code Style

| 영역 / Area | 규약 / Convention |
| --- | --- |
| Bash | `set -euo pipefail`, 함수 단위, `bin/lib/*` 재사용. |
| TypeScript | strict 모드, Bun 런타임 기준, ESM. |
| YAML | `layouts/*.yml` 은 `bin/tmux-layout-apply` 가 파싱하는 스키마를 따름. |
| 커밋 메시지 | 변경 범위(예: `sidebar:`, `sessionizer:`) 접두어 권장. |

---

## Testing / 테스트

| 대상 / Target | 명령 / Command | 산출물 / Output |
| --- | --- | --- |
| TUI 설정 | `cd tui/sessionizer && bun test __tests__/config.test.ts` | 단위 테스트 결과. |
| TUI tmux 어댑터 | `cd tui/sessionizer && bun test __tests__/tmux.test.ts` | 단위 테스트 결과. |
| Slack 브리지 | 저장소 루트의 GitLab CI 파이프라인 | (해당 모듈의 CI 구성 참조) |
| 보조 도구 회귀 | `tmux-config-reload` + `prefix + ?` 로 수동 확인 | 키바인딩/메뉴 동작. |

새 테스트를 추가할 때는 TUI 의 경우 `__tests__/` 아래에 `*.test.ts` 파일을 두고, Bash 스크립트는 가능하면 `bats` 로 검증해 주세요.

---

## Contribution Guide / 기여 가이드

기여 절차는 [`CONTRIBUTING.md`](./CONTRIBUTING.md) 를 따릅니다. 요약하면 다음과 같습니다.

- 작은 단위로 PR 을 만들고 변경 의도를 명확히 기술합니다.
- Bash 변경 시 `set -euo pipefail` 와 `bin/lib/*` 재사용을 우선합니다.
- TUI 변경 시 `bun test` 와 수동 인터랙션 검증을 모두 통과시킵니다.
- YAML 레이아웃 추가 시 `default.yml` 의 키 구조를 따라야 합니다.
- 새 보조 도구는 `bin/` 에 추가하고 본 README 의 명령어 레퍼런스 표에 등록합니다.

PR 단계에서 모듈별 규약은 다음 문서를 따릅니다.

| 모듈 / Module | 가이드 / Guide |
| --- | --- |
| TUI | [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) |
| Slack 브리지 | [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) |
| 저장소 전역 | [`AGENTS.md`](./AGENTS.md) |

---

## Maintainers / Points of Contact / 유지보수자 / 연락처

| 역할 / Role | 위치 / Location |
| --- | --- |
| 코드 오너 / Code owners | [`OWNERS`](./OWNERS) |
| 저장소 지식 베이스 | [`AGENTS.md`](./AGENTS.md) |
| 기여 절차 | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |

---

## Further Documentation / 추가 문서

| 문서 / Document | 위치 / Path |
| --- | --- |
| 세션 영속화 설계 노트 | [`docs/session-persistence-brainstorming.md`](./docs/session-persistence-brainstorming.md) |
| Supermemory 거버넌스 | [`docs/supermemory-governance.md`](./docs/supermemory-governance.md) |
| TUI 모듈 규약 | [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) |
| Slack 브리지 규약 | [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) |
| 저장소 지식 베이스 | [`AGENTS.md`](./AGENTS.md) |

---

## License / 라이선스

이 저장소는 [`LICENSE`](./LICENSE) 파일에 명시된 조건에 따라 배포됩니다. 사용 전 라이선스 전문을 확인해 주세요.

This repository is distributed under the terms described in [`LICENSE`](./LICENSE). Please review the full license text before use.