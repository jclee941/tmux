# tmux 생산성 도구 모음 / tmux Productivity Suite

> 한 저장소에 모은 파워 유저용 tmux 환경 — Bash 기반 구성, 선언적 YAML 레이아웃, Bun/TypeScript TUI 세션나이저, Slack 채널 동기화 브리지를 제공합니다.
>
> A curated tmux workspace — Bash-first configuration, declarative YAML layouts, a Bun/TypeScript TUI, and a Slack bridge — for developers who juggle many projects, branches, and remote hosts.

[![tmux](https://img.shields.io/badge/tmux-%E2%89%A53.2-1bb91f)](https://github.com/tmux/tmux)
[![Bash](https://img.shields.io/badge/Bash-%E2%89%A54-4EAA25)](https://www.gnu.org/software/bash/)
[![Bun](https://img.shields.io/badge/Bun-%E2%89%A51.1-f9f1e1)](https://bun.sh)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-see%20LICENSE-blue)](./LICENSE)
[![Status](https://img.shields.io/badge/status-personal%20workstation-success)](#status)

---

## 한눈에 보기 / At a Glance

| 항목 / Item | 값 / Value |
| --- | --- |
| 주 언어 / Primary language | Bash + TypeScript (TUI), Node.js (Slack bridge) |
| 런타임 / Runtime | tmux ≥ 3.2, Bash ≥ 4, Bun ≥ 1.1 (TUI), Node.js ≥ 18 (Slack bridge) |
| 진입점 / Entry point | `tmux.conf`, `sessionizer.conf`, `bin/tmux-sessionizer`, `tui/sessionizer/`, `slack/tmux-bridge/` |
| 기본 prefix / Default prefix | `C-a` (재바인딩 가능 / rebindable) |
| 상태 / Status | 개인 워크스테이션 운영 가능 / Production-ready for personal workstations |
| 세션 규모 / Sessions | 수십~수백 개 / Scales to dozens of sessions |
| 의존성 / External tools | fzf, git, Nerd Font, ttyd, tmux, slack-sdk |
| 라이선스 / License | [`LICENSE`](./LICENSE) 참조 / See [`LICENSE`](./LICENSE) |
| 소유자 / Owners | [`OWNERS`](./OWNERS) 참조 / See [`OWNERS`](./OWNERS) |
| 기여 가이드 / Contribution | [`CONTRIBUTING.md`](./CONTRIBUTING.md) 참조 / See [`CONTRIBUTING.md`](./CONTRIBUTING.md) |

## 핵심 흐름 / Core Flow

1. 셸 로그인 시 `tmux-auto-attach`가 기존 tmux 서버에 자동 연결하거나 새 서버를 시작합니다.
2. `prefix + s`(fzf 세션나이저) 또는 `prefix + S`(Bun TUI 세션나이저)로 세션을 선택하거나 새로 만듭니다.
3. 필요하면 `tmux-layout-apply`로 `layouts/*.yml` 템플릿을 현재 세션에 즉시 적용합니다.
4. `tmux-session-sync` 또는 `slack/tmux-bridge/`로 tmux 세션 ↔ Slack 채널을 양방향 동기화합니다.
5. `tmux-sidebar`로 프로젝트 트리를, `tmux-responsive`/`tmux-sys-stats`로 폭 적응형 상태바를 봅니다.

## 목차 / Table of Contents

- [목적 / Purpose](#목적--purpose)
- [구성 요소 / Package Contents](#구성-요소--package-contents)
- [상태 / Status](#상태--status)
- [먼저 읽을 파일 / First Files to Read](#먼저-읽을-파일--first-files-to-read)
- [진입점 / Entry Points & Bindings](#진입점--entry-points--bindings)
- [빠른 시작 / Quickstart](#빠른-시작--quickstart)
- [사용법 / Usage](#사용법--usage)
- [설정 / Configuration](#설정--configuration)
- [명령어 레퍼런스 / Commands Reference](#명령어-레퍼런스--commands-reference)
- [아키텍처 / Architecture](#아키텍처--architecture)
- [로컬 개발 / Local Development](#로컬-개발--local-development)
- [테스트 / Testing](#테스트--testing)
- [유지보수자 / Maintainers](#유지보수자--maintainers)
- [기여 / Contributing](#기여--contributing)
- [추가 문서 / Further Documentation](#추가-문서--further-documentation)
- [라이선스 / License](#라이선스--license)

---

## 목적 / Purpose

- **여러 프로젝트를 한 화면에서 다루는 tmux 워크스페이스 제공**
  tmux 세션을 “프로젝트 진입점”으로 다루기 위해 검색·생성·레이아웃·상태 표시·원격 동기화를 한 묶음으로 묶었습니다.

- **Bash-first로 가볍게, 필요할 때만 TUI/Slack 추가**
  핵심은 200~300 LOC 이하의 작은 Bash 스크립트 30여 개로 구성되며, TUI와 Slack 브리지는 옵션 컴포넌트입니다.

- **선언적 레이아웃 + 자동화 친화적 진입점**
  `layouts/*.yml` 한 파일로 창/패널/명령을 정의하고, `bin/*` 스크립트는 단독 실행과 키바인딩 양쪽으로 호출됩니다.

- **개인 워크스테이션 운영 검증**
  macOS/Linux 데스크톱에서 1차 사용, 원격 SSH/Cloudflare Tunnel을 통한 세션 공유는 2차 사용 패턴입니다.

**Useful for:** tmux를 “단순 멀티플렉서”가 아닌 “프로젝트 대시보드”로 쓰고 싶은 개발자, 세션이 수십 개로 늘어난 파워 유저, tmux 세션을 팀 채널과 연동하려는 1인 DevOps/플랫폼 엔지니어.

## 구성 요소 / Package Contents

| 경로 / Path | 역할 / Role | 비고 / Notes |
| --- | --- | --- |
| `tmux.conf` | 루트 로더 / Root tmux config | prefix=`C-a`, 환경 변수 전파, theme/sidebar 로딩 |
| `sessionizer.conf` | 세션 탐색 경로 / Scan dirs | `SCAN_DIR`, `EXTRA_DIRS` |
| `bin/` | 실행 스크립트 모음 / 38 scripts | 세션·사이드바·상태바·명령 팔레트 |
| `bin/lib/` | 공유 라이브러리 / Shared libs | `sidebar-render`, `tmux-sessionizer-common` 등 |
| `layouts/*.yml` | 선언적 창 레이아웃 / Declarative layouts | `default`, `resume`, `proxmox`, `splunk`, `safework*`, `blacklist` |
| `tui/sessionizer/` | Bun + TypeScript TUI | React/Ink 스타일, `bun` 실행 |
| `slack/tmux-bridge/` | Node.js Slack 양방향 브리지 | socket 직접 / cloudflared 듀얼 모드 |
| `docs/` | 설계 노트 / Design notes | `session-persistence-brainstorming.md`, `supermemory-governance.md` |
| `CONTRIBUTING.md`, `OWNERS`, `LICENSE` | 거버넌스 / Governance | 기여 규칙, 책임자, 라이선스 |

## 상태 / Status

| 영역 / Area | 상태 / State |
| --- | --- |
| 개인 워크스테이션 사용 / Personal workstation | 운영 중 / Production-ready |
| 다중 사용자 / Multi-tenant | 비권장 / Not designed for shared use |
| TUI 안정성 / TUI stability | 활발한 개발 / Active |
| Slack 브리지 / Slack bridge | 듀얼 모드 (socket / cloudflared) 검증 / Tested |
| API 호환성 / API stability | Bash 함수 시그니처는 안정, TUI는 변경 가능 |

> 운영 중 이슈는 [`CONTRIBUTING.md`](./CONTRIBUTING.md)와 [`OWNERS`](./OWNERS) 절차로 보고합니다.

## 먼저 읽을 파일 / First Files to Read

| 순서 / Order | 파일 / File | 이유 / Why read it |
| --- | --- | --- |
| 1 | [`tmux.conf`](./tmux.conf) | 전체 키바인딩과 환경 진입점 |
| 2 | [`sessionizer.conf`](./sessionizer.conf) | 세션 검색 대상 결정 |
| 3 | [`bin/tmux-sessionizer`](./bin/tmux-sessionizer) | 메인 진입 스크립트(생성 + fzf) |
| 4 | [`bin/lib/sidebar-render`](./bin/lib/sidebar-render) | 사이드바 렌더링 로직 |
| 5 | [`layouts/default.yml`](./layouts/default.yml) | 레이아웃 YAML 스키마 |
| 6 | [`tui/sessionizer/src/App.tsx`](./tui/sessionizer/src/App.tsx) | TUI 메인 컴포넌트 |
| 7 | [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) | 브리지 운영 메모 |
| 8 | [`AGENTS.md`](./AGENTS.md) | 코드베이스 지식 베이스 |

## 진입점 / Entry Points & Bindings

| 진입점 / Entry | 호출 / Trigger | 역할 / Role |
| --- | --- | --- |
| `tmux.conf` | `tmux` 시작 시 / On tmux start | 환경·테마·키바인딩 로드 |
| `prefix + s` | fzf 세션 선택 | 기존 세션 진입 또는 신규 생성 마법사 |
| `prefix + S` | TUI 세션나이저 | Bun TUI로 동일 작업 (호스트 친화적) |
| `prefix + b` | 사이드바 토글 | `tmux-sidebar-toggle` |
| `prefix + a` | 명령 팔레트 | `tmux-command-palette` |
| `prefix + l` | 레이아웃 적용 | `tmux-layout-apply` (YAML 템플릿 선택) |
| `prefix + C-l` | 설정 리로드 | `tmux-config-reload` (diff 표시) |
| `prefix + T` | 세션 대시보드 | `tmux-session-dashboard` (정렬된 표) |
| `prefix + w` | URL 추출 | `tmux-url-open` (fzf) |
| `prefix + f` | 파일 경로 추출 | `tmux-file-open` (fzf) |
| `prefix + h` | SSH 픽커 | `tmux-ssh-picker` |
| `prefix + y` | 단어 복사 | `tmux-copy-word` |
| `prefix + P` | 패널 동기화 토글 | `tmux-pane-sync` |
| `prefix + W` | 웹 터미널(ttyd) | `tmux-web-terminal` |
| `prefix + O` | OpenCode 세션 | `tmux-opencode` |

> 키 바인딩은 `tmux.conf`에서 재정의할 수 있습니다. 명령 팔레트(`prefix + a`)는 별도 학습 없이 사용 가능한 안전 진입점입니다.

## 빠른 시작 / Quickstart

### 1. 저장소를 `~/.tmux`로 심볼릭 링크 / Symlink the repo as `~/.tmux`

```bash
git clone <repo-url> ~/code/tmux
ln -sfn ~/code/tmux ~/.tmux
```

### 2. 외부 의존성 설치 / Install external tools

| 도구 / Tool | 설치 / Install | 비고 / Notes |
| --- | --- | --- |
| tmux ≥ 3.2 | `brew install tmux` / `apt install tmux` | prefix `C-a`는 `C-b` 충돌 회피 |
| Bash ≥ 4 | 시스템 기본 / System default | macOS는 `brew install bash` |
| fzf | `brew install fzf` | 세션·URL·파일·SSH 픽커 공통 |
| git | 시스템 기본 / System default | `tmux-git-status` 사용 |
| Nerd Font | `brew tap homebrew/cask-fonts && brew install --cask font-<name>` | 사이드바·상태바 아이콘 |
| ttyd (선택 / optional) | `brew install ttyd` | `tmux-web-terminal`용 |
| Bun (선택 / optional) | `curl -fsSL https://bun.sh/install \| bash` | TUI 세션나이저 |
| Node.js ≥ 18 (선택) | `brew install node@18` | Slack 브리지 |

### 3. tmux 시작 / Launch tmux

```bash
tmux
# 또는 / or
~/.tmux/bin/tmux-auto-attach
```

### 4. 첫 세션 만들기 / Create your first session

```bash
prefix + s          # fzf 세션나이저
# 디렉터리 선택 → 이름 입력 → 레이아웃 선택
# Pick a directory → name the session → pick a layout
```

### 5. (선택) TUI 세션나이저 / Optional TUI launcher

```bash
cd tui/sessionizer
bun install
bun run dev
# 또는 / or
~/.tmux/bin/tmux-sessionizer-tui
```

### 6. (선택) Slack 브리지 / Optional Slack bridge

```bash
~/.tmux/bin/tmux-slack-bridge-setup    # Slack 앱 설정 마법사
~/.tmux/bin/tmux-slack-bridge-start    # 브리지 기동 (socket 또는 cloudflared)
```

## 사용법 / Usage

### 세션 관리 / Session management

| 작업 / Task | 명령 / Command | 단축키 / Key |
| --- | --- | --- |
| 세션 선택/생성 (fzf) | `tmux-sessionizer` | `prefix + s` |
| 세션 선택/생성 (TUI) | `tmux-sessionizer-tui` | `prefix + S` |
| MRU 점프 | `tmux-session-jump` | `prefix + s` 내부 |
| 세션 순환 | `tmux-session-cycle` | (스크립트 호출) |
| 이름 변경 | `tmux-session-rename` | `prefix + r` (재바인딩) |
| 안전 종료 | `tmux-session-kill` | `prefix + X` (재바인딩) |
| 템플릿 생성 | `tmux-template-create` | `prefix + t` |
| 대시보드 팝업 | `tmux-session-dashboard` | `prefix + T` |
| 세션 → YAML 내보내기 | `tmux-session-export` | (CLI) |

### 레이아웃 / Layouts

```bash
# 1. 인터랙티브 적용 / Interactive
prefix + l                  # fzf로 layouts/*.yml 선택

# 2. 직접 호출 / Direct
~/.tmux/bin/tmux-layout-apply ~/.tmux/layouts/proxmox.yml my-session

# 3. 내보내기 / Export current session to YAML
~/.tmux/bin/tmux-session-export my-session > my.yml
```

`layouts/default.yml` 스키마:

| 키 / Key | 설명 / Description |
| --- | --- |
| `windows[]` | 창 목록 / Window list |
| `windows[].name` | 창 이름 / Window name |
| `windows[].panes[]` | 패널 목록 / Pane list |
| `windows[].panes[].cmd` | 첫 명령 / Initial command |
| `windows[].panes[].cwd` | 작업 디렉터리 / Working directory |
| `windows[].layout` | `tiled` 등 tmux 레이아웃 |

### 사이드바 / Sidebar

```bash
prefix + b                  # 토글
~/.tmux/bin/tmux-sidebar-init   # 세션 생성 시 1회
```

사이드바는 `bin/lib/sidebar-render`가 디렉터리 트리를 Nerd Font 아이콘과 함께 그리고, `lib/sidebar-colors`가 색상 정책을 제공합니다.

### Slack 양방향 동기화 / Slack two-way sync

| 모드 / Mode | 트리거 / Trigger | 특징 / Notes |
| --- | --- | --- |
| Socket 직접 (LAN/VPN) | `tmux-slack-bridge-start` 기본 | 지연 최소 / Lowest latency |
| HTTP (cloudflared 터널) | `tmux-slack-bridge-start --http` | 원격 공유 / Remote access |
| 세션 → 채널 매핑 | `tmux-session-sync` | 세션 1개 = 채널 1개 |

### 상태바 / Status bar

- `tmux-responsive` — 터미널 폭에 따라 정보 단계(3-tier) 표시
- `tmux-sys-stats` — CPU load + 메모리 사용량
- `tmux-git-status` — 현재 패널의 git 상태(브랜치/dirty/ahead/behind/stash)

## 설정 / Configuration

### `sessionizer.conf`

| 변수 / Variable | 기본 / Default | 의미 / Meaning |
| --- | --- | --- |
| `SCAN_DIR` | `~/code` | 1차 세션 후보 디렉터리 |
| `EXTRA_DIRS` | (빈 값) | 추가 후보 경로 (공백 구분) |
| `EXCLUDE_PATTERNS` | (기본 패턴) | 제외할 디렉터리 glob |

### `tmux.conf` 핵심 옵션 / Key tmux.conf options

| 옵션 / Option | 값 / Value | 비고 / Notes |
| --- | --- | --- |
| `set -g prefix C-a` | `C-a` | `C-b` 회피, `C-a` `C-a`로 전송 가능 |
| `set -ga terminal-overrides` | `*:` | 진짜 컬러 terminfo |
| `set -g mouse on` | on | 마우스 지원 |
| `set -g base-index 1` | 1 | 창 번호 1부터 |
| `setw -g pane-base-index 1` | 1 | 패널 번호 1부터 |
| `bind-key` | (다수) | `bin/` 스크립트 호출 |

### 환경 변수 전파 / Env propagation

`tmux.conf`는 호스트의 `PATH`, `EDITOR`, `LANG`, `SSH_AUTH_SOCK` 등을 tmux 환경으로 가져옵니다. SSH 에이전트 소켓이 끊기면 자동 재바인딩됩니다.

## 명령어 레퍼런스 / Commands Reference

### 세션 / Sessions

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-sessionizer` | fzf 기반 세션 선택/생성 마법사 |
| `tmux-sessionizer-tui` | Bun TUI로 동일한 작업 |
| `tmux-session-jump` | MRU 정렬된 fzf 점퍼 |
| `tmux-session-cycle` | `opencode` 제외 순환 |
| `tmux-session-kill` | 확인 후 안전 종료 |
| `tmux-session-rename` | 이름 검증과 함께 변경 |
| `tmux-session-dashboard` | 정렬된 세션 표 팝업 |
| `tmux-session-export` | 현재 세션을 YAML로 덤프 |
| `tmux-session-branch-log` | 세션↔브랜치 전환 로그 |
| `tmux-session-icon` | Nerd Font 아이콘 매핑 |
| `tmux-session-order` | 최근 활성 순 정렬 |
| `tmux-template-create` | 프리셋에서 빠른 생성 |
| `tmux-session-sync` | tmux ↔ Slack 채널 동기화 |

### 사이드바·상태바 / Sidebar & status

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-sidebar` | 트리 렌더 엔진 |
| `tmux-sidebar-init` | 새 세션에서 초기 표시 |
| `tmux-sidebar-toggle` | 가시성 토글 |
| `tmux-responsive` | 폭 적응형 상태바 |
| `tmux-sys-stats` | CPU/MEM 표시 |
| `tmux-git-status` | git 상태 표시 |
| `tmux-git-uncommitted` | 미커밋 변경 추적 |
| `tmux-cheatsheet` | 키바인드 도움말 팝업 |

### 입력·제어 / Input & control

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-command-palette` | fzf 액션 팔레트 |
| `tmux-config-reload` | 설정 리로드 + diff |
| `tmux-layout-apply` | YAML 레이아웃 적용 |
| `tmux-pane-sync` | synchronize-panes 토글 |
| `tmux-copy-word` | 커서 단어 복사 |
| `tmux-clipboard-history` | tmux 버퍼 링 브라우저 |
| `tmux-url-open` | URL 추출 → 열기 |
| `tmux-file-open` | 파일 경로 추출 → 열기 |
| `tmux-ssh-picker` | `~/.ssh/config` 호스트 픽커 |
| `tmux-notify-long-command` | 긴 명령 데스크탑 알림 |
| `tmux-bash-preexec` | sourceable preexec 훅 |

### 외부 통합 / External integration

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-web-terminal` | ttyd 웹 터미널 |
| `tmux-opencode` | OpenCode 세션 런처 |
| `tmux-auto-attach` | 로그인 셸 자동 attach |
| `tmux-slack-bridge-setup` | Slack 앱 설정 마법사 |
| `tmux-slack-bridge-start` | 듀얼 모드 브리지 시작 |

## 아키텍처 / Architecture

### 계층 / Layers

| 계층 / Layer | 구현 / Implementation | 책임 / Responsibility |
| --- | --- | --- |
| tmux core | `tmux.conf` | 키바인딩, 환경, theme 로드 |
| 세션 서비스 | `bin/tmux-sessionizer*`, `bin/tmux-session-*` | 검색·생성·순환·내보내기 |
| UI 보조 | `bin/tmux-sidebar*`, `bin/tmux-responsive` | 사이드바, 상태바 렌더 |
| 명령 자동화 | `bin/tmux-command-palette`, `bin/tmux-cheatsheet` | 검색형 실행 |
| 외부 통합 | `slack/tmux-bridge/`, `bin/tmux-web-terminal`, `bin/tmux-opencode` | 원격/협업 |
| TUI (선택) | `tui/sessionizer/` | Bun + TypeScript UI |
| 데이터 | `sessionizer.conf`, `layouts/*.yml` | 사용자 설정/템플릿 |

### 요청 흐름 / Request flow

1. **세션 진입 (prefix + s)**: `tmux.conf` → `bind-key s` → `tmux-sessionizer` → `fzf` 후보 표시 → 선택/생성 → `tmux-layout-apply` (옵션) → `tmux-sidebar-init` (옵션).
2. **TUI 진입 (prefix + S)**: `tmux-sessionizer-tui` → Bun 런타임 → `tui/sessionizer/src/App.tsx` → `use-keyboard-handler` → `session-actions` → tmux CLI 호출.
3. **Slack 동기화**: `tmux-session-sync` 또는 `slack/tmux-bridge` → tmux 세션 이벤트 → Slack 채널 매핑 → `@slack/web-api`로 송수신.
4. **레이아웃 적용**: `tmux-layout-apply layouts/<name>.yml` → YAML 파싱 → `tmux new-window` / `split-window` / `send-keys` 시퀀스.
5. **상태 갱신**: tmux `status-interval` → `tmux-responsive` 폭 감지 → `tmux-sys-stats` + `tmux-git-status` 조합 표시.

### 디렉터리 책임 / Directory responsibilities

| 경로 / Path | 변경 빈도 / Change freq | 주의 사항 / Cautions |
| --- | --- | --- |
| `bin/` | 높음 / High | 스크립트 단위 책임, 200 LOC 이하 권장 |
| `bin/lib/` | 중간 / Medium | 공용 함수는 여기서 export |
| `layouts/` | 사용자 정의 / User-defined | YAML 스키마 변경 시 마이그레이션 |
| `tui/sessionizer/` | 중간 / Medium | Bun 버전 고정(`bunfig.toml`) |
| `slack/tmux-bridge/` | 낮음 / Low | 토큰은 환경 변수, 커밋 금지 |

## 로컬 개발 / Local Development

### 작업 흐름 / Workflow

```bash
# 1. 브랜치 생성 / Branch
git checkout -b feat/<topic>

# 2. 변경 / Edit
$EDITOR ~/.tmux/bin/tmux-sessionizer
# 또는 / or
$EDITOR ~/.tmux/tmux.conf

# 3. 즉시 반영 / Live reload
prefix + C-l    # tmux-config-reload (diff 표시)

# 4. 검증 / Verify
prefix + a      # 명령 팔레트로 새 동작 트리거
```

### 스타일 가이드 / Style guide

| 영역 / Area | 규칙 / Rule |
| --- | --- |
| Bash | `set -euo pipefail`, 함수 단위 50 LOC 이내 권장 |
| 명명 | 스크립트는 `tmux-<verb>-<noun>`, kebab-case |
| 에러 | 사용자 가시 오류는 stderr + 비-zero exit |
| 로깅 | 임시 디버그는 `~/.tmux/.log/` 아래 파일 |
| 의존성 | 새 외부 도구 추가는 [`CONTRIBUTING.md`](./CONTRIBUTING.md) 검토 후 |

### TUI 개발 / TUI development

```bash
cd tui/sessionizer
bun install
bun run dev         # watch 모드 / watch mode
bun test            # vitest 호환 테스트
```

### Slack 브리지 개발 / Slack bridge development

```bash
cd slack/tmux-bridge
npm install
npm run dev
# 또는 / or
~/.tmux/bin/tmux-slack-bridge-start --debug
```

## 테스트 / Testing

| 영역 / Area | 명령 / Command | 위치 / Location |
| --- | --- | --- |
| TUI 단위 테스트 | `bun test` | [`tui/sessionizer/__tests__/`](./tui/sessionizer/__tests__/) |
| 설정 파서 | `bun test config.test.ts` | `__tests__/config.test.ts` |
| tmux 헬퍼 | `bun test tmux.test.ts` | `__tests__/tmux.test.ts` |
| Slack 브리지 | GitLab CI | 저장소 내 `.gitlab-ci.yml` |
| 수동 회귀 | `prefix + a` → 명령 팔레트 | tmux 세션 안에서 |

TUI 테스트는 vitest 호환이며, `tmux` 명령은 가짜 스크립트로 모킹합니다. 새 Bash 스크립트는 가능하면 `bats`로 단위 테스트 추가를 권장합니다.

## 유지보수자 / Maintainers

책임자 목록은 [`OWNERS`](./OWNERS)를 참조하세요. 책임 영역:

| 영역 / Area | 책임 / Responsibility |
| --- | --- |
| `bin/`, `lib/`, `tmux.conf` | 코어 tmux 경험 / Core tmux |
| `tui/sessionizer/` | TUI 기능·UX |
| `slack/tmux-bridge/` | Slack 통합 |
| `layouts/` | 템플릿 카탈로그 |
| `docs/` | 설계 문서 |

## 기여 / Contributing

- 이슈/ PR 절차는 [`CONTRIBUTING.md`](./CONTRIBUTING.md)를 따릅니다.
- 새 `bin/` 스크립트는 prefix와의 충돌 여부를 PR 본문에 명시하세요.
- 레이아웃 YAML은 `layouts/default.yml`의 스키마를 따릅니다.
- 큰 변경은 `docs/` 아래 설계 노트와 함께 제출합니다.
- 외부 도구를 새로 요구하는 변경은 [`OWNERS`](./OWNERS) 승인을 받습니다.

## 추가 문서 / Further Documentation

| 문서 / Document | 경로 / Path | 내용 / Content |
| --- | --- | --- |
| 세션 영속화 브레인스토밍 | [`docs/session-persistence-brainstorming.md`](./docs/session-persistence-brainstorming.md) | 세션 복원 아이디어 정리 |
| 메모리 거버넌스 | [`docs/supermemory-governance.md`](./docs/supermemory-governance.md) | 컨텍스트 메모리 운영 규칙 |
| AGENTS 노트 | [`AGENTS.md`](./AGENTS.md) | 코드베이스 지식 베이스 |
| TUI 노트 | [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) | TUI 코딩 컨벤션 |
| Slack 브리지 노트 | [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) | 브리지 운영 메모 |

## 라이선스 / License

자세한 내용은 [`LICENSE`](./LICENSE)를 참조하세요. 외부 패키지(fzf, slack-sdk 등)는 각 라이선스를 따릅니다.
See [`LICENSE`](./LICENSE) for details. Third-party tools (fzf, slack-sdk, etc.) retain their own licenses.