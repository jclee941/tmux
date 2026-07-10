# tmux 작업공간 키트 (tmux Workspace Kit)

![Shell](https://img.shields.io/badge/shell-bash-4EAA25.svg)
![tmux](https://img.shields.io/badge/tmux-≥3.2-1BB91F.svg)
[![TUI](https://img.shields.io/badge/tui-bun%2Fopentui-000000.svg)](tui/sessionizer)
[![Bridge](https://img.shields.io/badge/bridge-slack%2Fnode-339933.svg)](slack/tmux-bridge)
[![License](https://img.shields.io/badge/license-Internal-grey.svg)](LICENSE)

> **한국어 요약:** 본 저장소는 모듈식 tmux 구성과 세션 운영 자동화를 묶은 Bash-first 작업공간 키트입니다. 세션 검색·점프·사이클링, 사이드바, 슬랙 양방향 동기화, Bun/OpenTUI 기반 TUI, 그리고 사전 정의된 레이아웃 템플릿을 제공하여 팀·업무별 tmux 환경을 빠르게 띄우고 표준화하도록 돕습니다.
>
> **English summary:** A modular, Bash-first tmux workspace kit bundling session discovery, cycling, sidebar, Slack bridge, Bun/OpenTUI TUI, and YAML layout templates so teams can spin up and standardize per-task tmux environments with one shared configuration.

## 현재 상태 / Current Status

| 영역 / Area | 상태 / Status | 비고 / Notes |
|---|---|---|
| Core loader (`tmux.conf`, `conf.d/`) | 운영 가능 / Production-ready | prefix `C-a`, Tokyo Night 팔레트 |
| Bash 도구 (`bin/`) | 운영 가능 / Production-ready | 30+ 스크립트, 대부분 fzf 의존 |
| TUI (`tui/sessionizer`) | 개발 중 / Active | Bun + OpenTUI, `tsx` 실행 |
| Slack Bridge (`slack/tmux-bridge`) | 운영 가능 / Production-ready | dual mode: socket direct / HTTP via cloudflared |
| 레이아웃 (`layouts/*.yml`) | 운영 가능 / Production-ready | 7종 템플릿 |
| Deprecated / 제거 예정 | 없음 / None | - |

## 운영 한눈 요약 / Operator Quick-glance

| 시점 / Phase | 작업 / Action | 명령 / Command |
|---|---|---|
| 시작 / Boot | 구성 로드 | `tmux` → `tmux.conf` → `conf.d/*.conf` |
| 세션 생성 / Create | 검색/마법사 | `tmux-sessionizer`, `tmux-sessionizer-tui` |
| 운영 / Operate | 점프/사이클 | `tmux-session-jump`, `tmux-session-cycle` |
| 협업 / Collaborate | Slack 동기화 | `tmux-slack-bridge-start` |
| 정리 / Teardown | 종료/리로드 | `tmux-session-kill`, `tmux-config-reload` |

## 목차 / Table of Contents

1. [목적과 구성 / Purpose & Package Contents](#목적과-구성--purpose--package-contents)
2. [상태 / Status (상세)](#상태-상세--status-detail)
3. [먼저 읽을 파일 / First Files to Read](#먼저-읽을-파일--first-files-to-read)
4. [진입점 / Entry Points](#진입점--entry-points)
5. [빠른 시작 / Quickstart](#빠른-시작--quickstart)
6. [아키텍처 / Architecture](#아키텍처--architecture)
7. [설정 / Configuration](#설정--configuration)
8. [명령 참고 / Commands Reference](#명령-참고--commands-reference)
9. [로컬 개발 / Local Development](#로컬-개발--local-development)
10. [테스트 / Testing](#테스트--testing)
11. [기여 / Contributing](#기여--contributing)
12. [유지보수 / Maintainers](#유지보수--maintainers)
13. [라이선스 / License](#라이선스--license)
14. [추가 문서 / Further Documentation](#추가-문서--further-documentation)

---

## 목적과 구성 / Purpose & Package Contents

이 키트는 한 줄짜리 `~/.tmux` 심볼릭 링크로 통째로 가져다 쓰는 형태의 tmux 작업공간입니다. `tmux.conf`가 루트 로더이고, 정책은 `conf.d/*.conf`, 도구는 `bin/*`, 공유 로직은 `bin/lib/`, 템플릿은 `layouts/`, 부속 프로젝트는 `tui/sessionizer`와 `slack/tmux-bridge`에 분리되어 있습니다.

This kit is consumed as a single `~/.tmux` symlink. `tmux.conf` is the root loader; policies live in `conf.d/*.conf`; tools in `bin/*`; shared logic in `bin/lib/`; templates in `layouts/`; companion projects in `tui/sessionizer` (TUI) and `slack/tmux-bridge` (Slack sync).

### 디렉터리 / Directory layout

| 경로 / Path | 역할 / Role |
|---|---|
| `tmux.conf` | 루트 로더 (`conf.d/*.conf` 소스) / Root loader sourcing conf.d |
| `sessionizer.conf` | 세션 검색용 `SCAN_DIR` / `EXTRA_DIRS` 정의 |
| `OWNERS`, `AGENTS.md`, `CONTRIBUTING.md` | 거버넌스 / Governance |
| `bin/` | 실행 도구 30+ 개 / Executable tools |
| `bin/lib/` | 세션 사이즈러·사이드바 공유 라이브러리 |
| `conf.d/` | 코어, 테마, 키, 사이드바, 상태표시줄 정책 |
| `layouts/` | YAML 레이아웃 템플릿 7종 |
| `tui/sessionizer/` | Bun + OpenTUI TUI 서브프로젝트 |
| `slack/tmux-bridge/` | Node.js 슬랙 양방향 브리지 |
| `docs/` | 세션 영속화·거버넌스 노트 |

## 상태 (상세) / Status (detail)

| 컴포넌트 / Component | 파일 / Files | 비고 / Notes |
|---|---|---|
| Core loader | `tmux.conf`, `conf.d/00-core.conf` | 터미널·성능 베이스라인, `prefix C-a` |
| Theme | `conf.d/10-theme.conf` | Tokyo Night 팔레트, pane border status |
| Keys | `conf.d/20-keys.conf` | prefix 재바인딩, 사용자 키 바인딩 |
| Sidebar | `bin/tmux-sidebar*`, `conf.d/25-sidebar.conf` | 트리형 사이드바 + 토글 |
| Statusbar | `bin/tmux-responsive`, `bin/tmux-sys-stats`, `bin/tmux-git-status` | 폭 티어링 대응 |
| Session lifecycle | `bin/tmux-session-*` | 생성, 점프, 사이클, 종료, 이름변경, 익스포트 |
| Layouts | `bin/tmux-template-create`, `bin/tmux-layout-apply`, `layouts/*.yml` | YAML → tmux 윈도우/패널 적용 |
| TUI | `tui/sessionizer/` | Bun + OpenTUI, `tsx` 실행 진입 |
| Slack | `slack/tmux-bridge/`, `bin/tmux-slack-bridge-*` | 듀얼 모드(소켓 직접 / cloudflared HTTP) |

## 먼저 읽을 파일 / First Files to Read

| 순서 / Order | 경로 / Path | 이유 / Why |
|---|---|---|
| 1 | `AGENTS.md` | 저장소 지식 베이스, 스크립트 인벤토리 |
| 2 | `tmux.conf` | 루트 로더, `conf.d` 소스 순서 |
| 3 | `sessionizer.conf` | 세션 자동 검색 범위 |
| 4 | `bin/tmux-sessionizer` | 메인 진입점 (fzf + 마법사) |
| 5 | `layouts/default.yml` | 레이아웃 템플릿 예시 |
| 6 | `tui/sessionizer/AGENTS.md` | TUI 서브프로젝트 규약 |
| 7 | `slack/tmux-bridge/AGENTS.md` | 슬랙 브리지 규약 |
| 8 | `docs/session-persistence-brainstorming.md` | 세션 영속화 설계 노트 |
| 9 | `docs/supermemory-governance.md` | 메모리/거버넌스 정책 |
| 10 | `OWNERS`, `CONTRIBUTING.md` | 책임과 기여 절차 |

## 진입점 / Entry Points

| 진입점 / Entry | 종류 / Kind | 호출 / Invocation |
|---|---|---|
| `tmux-sessionizer` | Bash (fzf) | prefix `C-a` → `s` |
| `tmux-sessionizer-tui` | Bun + OpenTUI | `bun run` 또는 래퍼 |
| `tmux-session-jump` | Bash (fzf MRU) | prefix `C-a` → `'` |
| `tmux-session-cycle` | Bash | `PgUp` / `PgDn` (opencode 제외) |
| `tmux-slack-bridge-start` | Node + tsx | 듀얼 모드(소켓/HTTP) |
| `tmux-layout-apply` | Bash | `tmux-layout-apply <session> <layout>.yml` |
| `tmux-config-reload` | Bash | prefix `C-a` → `r` |

## 빠른 시작 / Quickstart

> 모든 경로에서 `<repo>`는 본 저장소 루트, `~/.tmux`는 사용자 홈 기준 심볼릭 링크 위치를 의미합니다. 호스트/도메인 예시는 `<your-host>` 같은 자리표시자로 표기합니다.
> `<repo>` denotes the repository root, `~/.tmux` the consumer-side symlink. Hosts/domains are placeholders such as `<your-host>`.

| 단계 / Step | 명령 / Command | 설명 / Description |
|---|---|---|
| 1. 가져오기 / Fetch | `ln -sfn <repo> ~/.tmux` | 저장소 전체를 `~/.tmux`로 연결 |
| 2. 의존성 / Deps | `brew install tmux fzf gh jq yq` (macOS 기준) | fzf·jq·yq는 다수 스크립트의 전제 |
| 3. 진입 / Launch | `tmux` | 루트 로더가 `conf.d/*.conf`를 자동 소스 |
| 4. 세션 / Sessions | prefix `C-a` → `s` | `tmux-sessionizer` 실행 |
| 5. TUI | `~/.tmux/bin/tmux-sessionizer-tui` | Bun/OpenTUI 세션 검색 |
| 6. Slack (선택) | `~/.tmux/bin/tmux-slack-bridge-setup` | 첫 1회 토큰/앱 설정 |
| 7. Slack 가동 | `~/.tmux/bin/tmux-slack-bridge-start` | 듀얼 모드 자동 선택 |

### 최소 구성 검증 / Smoke test

```sh
# 1. 로더 검증: conf.d 로드 확인
tmux -f ~/.tmux/tmux.conf new-session -d \; source-file ~/.tmux/conf.d/00-core.conf \; kill-server

# 2. 사이즈러: SCAN_DIR 안의 디렉터리가 후보로 뜨는지
~/.tmux/bin/tmux-sessionizer --dry-run | head

# 3. 템플릿 적용
~/.tmux/bin/tmux-template-create demo default

# 4. 슬랙 브리지 모드 점검
~/.tmux/bin/tmux-slack-bridge-start --check
```

## 아키텍처 / Architecture

| 계층 / Layer | 위치 / Path | 책임 / Responsibility |
|---|---|---|
| Bootstrap | `tmux.conf` → `conf.d/*.conf` | tmux 정책, 키, 테마, statusbar 정의 |
| Shell surface | `bin/*` | 사용자 트리거, 상태, picker, 액션 |
| Shared logic | `bin/lib/*` | 사이즈러 마법사, 사이드바 렌더/색상 |
| Templates | `layouts/*.yml` | 윈도우/패널 레이아웃 정의 |
| TUI | `tui/sessionizer/` | Bun + OpenTUI 기반 세션 UI |
| Bridge | `slack/tmux-bridge/` | tmux ↔ Slack 양방향 동기화 |
| Docs | `docs/`, `AGENTS.md` | 설계 노트, 거버넌스 |

### 요청 흐름 / Request flow

1. 사용자가 prefix `C-a` → `s` 입력.
2. `conf.d/20-keys.conf`가 `tmux-sessionizer` 호출.
3. `tmux-sessionizer`는 `sessionizer.conf`의 `SCAN_DIR`/`EXTRA_DIRS`를 스캔하고 `bin/lib/tmux-sessionizer-common`을 통해 fzf UI 표시.
4. 선택 후 신규 세션이면 `bin/lib/tmux-sessionizer-wizard`로 이름·레이아웃 마법사 진행.
5. 적용 시 `tmux-template-create` 또는 `tmux-layout-apply`가 `layouts/*.yml`을 tmux 명령으로 변환.
6. 슬랙 동기화가 켜져 있으면 `tmux-session-sync` → `slack/tmux-bridge`가 채널을 생성/바인딩.

## 설정 / Configuration

| 파일 / File | 키 / Key | 기본값 / Default | 설명 / Description |
|---|---|---|---|
| `sessionizer.conf` | `SCAN_DIR` | `~/src` | 세션 후보로 스캔할 최상위 디렉터리 |
| `sessionizer.conf` | `EXTRA_DIRS` | (없음) | 추가 스캔 디렉터리 공백 구분 |
| `conf.d/00-core.conf` | `prefix` | `C-a` | 기본 prefix를 `C-a`로 재바인딩 |
| `conf.d/10-theme.conf` | 팔레트 | Tokyo Night | pane border/status 색상 |
| `layouts/*.yml` | `windows` | 템플릿별 상이 | 윈도우/패널 정의 |
| `tui/sessionizer/` `package.json` | `scripts.start` | `bun run src/index.tsx` | TUI 런타임 |

> 환경별 차이는 `conf.d/` 하위 파일에 분리 추가하면 `tmux.conf`의 글로빙 소스가 자동으로 포함합니다. 운영 호스트·토큰 등 비밀값은 저장소 밖(예: `~/.config/tmux-kit/`)에 보관하고 자리표시자(`<your-host>`, `<your-token>`)로만 문서화합니다.
> Per-environment overrides belong in additional files under `conf.d/` (auto-globbed). Secrets and hostnames live outside the repository and are documented only as placeholders.

## 명령 참고 / Commands Reference

| 카테고리 / Category | 명령 / Command | 설명 / Description |
|---|---|---|
| 세션 생성 / Create | `tmux-sessionizer` | fzf 검색 + 마법사 |
|  | `tmux-sessionizer-tui` | Bun/OpenTUI 버전 |
|  | `tmux-template-create <name> <layout>` | 사전 정의 템플릿으로 즉시 생성 |
|  | `tmux-layout-apply <session> <layout>.yml` | YAML을 세션에 적용 |
| 세션 이동 / Move | `tmux-session-jump` | MRU 기반 fzf 점프 |
|  | `tmux-session-cycle` | PgUp/PgDn 회전 (opencode 제외) |
|  | `tmux-session-order` | 최근 활성 순 정렬 |
| 세션 관리 / Manage | `tmux-session-rename` | 이름 변경, 검증 포함 |
|  | `tmux-session-kill` | 확인 후 안전 종료 |
|  | `tmux-session-dashboard` | 포맷된 세션 테이블 팝업 |
|  | `tmux-session-export` | 세션 레이아웃 → YAML |
|  | `tmux-session-icon` | Nerd Font 아이콘 매핑 |
|  | `tmux-session-branch-log` | 세션-브랜치 전환 로그 |
| 사이드바 / Sidebar | `tmux-sidebar` | 트리 표시 엔진 |
|  | `tmux-sidebar-init` | 세션 생성 시 초기화 |
|  | `tmux-sidebar-toggle` | 가시성 토글 |
| 상태표시줄 / Statusbar | `tmux-responsive` | 폭 티어링 렌더 |
|  | `tmux-sys-stats` | CPU/MEM |
|  | `tmux-git-status` | 브랜치/dirty/ahead/behind/stash |
|  | `tmux-git-uncommitted` | 세션별 미커밋 추적 |
| picker / 액션 | `tmux-command-palette` | fzf 액션 선택 |
|  | `tmux-url-open` | 패널에서 URL 추출 |
|  | `tmux-file-open` | 패널에서 파일 경로 추출 |
|  | `tmux-ssh-picker` | SSH config 호스트 선택 |
|  | `tmux-clipboard-history` | tmux buffer ring |
|  | `tmux-copy-word` | 커서 단어 복사 |
| 동기화 / Sync | `tmux-pane-sync` | sync-panes 토글 |
|  | `tmux-session-sync` | tmux ↔ Slack 채널 |
| 자동화 / Automation | `tmux-auto-attach` | 로그인 셸 자동 attach |
|  | `tmux-opencode` | OpenCode 세션 런처 |
|  | `tmux-config-reload` | 설정 리로드 + 차이 |
|  | `tmux-notify-long-command` | 긴 명령 데스크탑 알림 |
|  | `tmux-bash-preexec` | 셸 preexec 훅 |
|  | `tmux-cheatsheet` | 키 바인딩 참고 팝업 |
| 외부 / External | `tmux-web-terminal` | ttyd 웹 터미널 런처 |
|  | `tmux-slack-bridge-start` | 슬랙 브리지 듀얼 모드 가동 |
|  | `tmux-slack-bridge-setup` | 슬랙 앱 1회 설정 마법사 |

## 로컬 개발 / Local Development

| 단계 / Step | 절차 / Procedure |
|---|---|
| 1 | `git clone` 후 `~/.tmux` 심볼릭 링크 갱신 |
| 2 | `conf.d/`에 정책 변경 시 `prefix C-a` → `r` (`tmux-config-reload`) |
| 3 | `bin/` 스크립트 수정 후 `shellcheck bin/<script>` (권장) |
| 4 | 새 레이아웃은 `layouts/<name>.yml`로 추가하고 `tmux-template-create` 인자 검증 |
| 5 | TUI는 `cd tui/sessionizer && bun install && bun run src/index.tsx` |
| 6 | 슬랙 브리지는 `cd slack/tmux-bridge && npm ci && npm run dev` |

> 본 키트는 외부 클라우드를 자동으로 호출하지 않습니다. 슬랙 브리지를 처음 켤 때만 `tmux-slack-bridge-setup`이 사용자 토큰을 입력받고 `<your-workspace>.slack.com` 등 호스트 정보를 자리표시자로 안내합니다.
> The kit makes no cloud calls on its own. Only the first-time Slack setup wizard prompts for tokens and placeholders such as `<your-workspace>.slack.com`.

## 테스트 / Testing

| 범위 / Scope | 도구 / Tool | 위치 / Path |
|---|---|---|
| TUI 단위 | Bun test | `tui/sessionizer/__tests__/` |
| Slack Bridge | GitLab CI | 저장소 루트 CI 정의 |
| Bash 스크립트 | `shellcheck` (권장) | `bin/*`, `bin/lib/*` |
| 레이아웃 스키마 | `yq` 검증 (권장) | `layouts/*.yml` |

```sh
# TUI 테스트
cd tui/sessionizer && bun test

# 셸 정적 검사 (선택)
shellcheck bin/*.sh bin/lib/*

# YAML 스키마 점검 (선택)
yq -e '.windows | type == "!!seq"' layouts/*.yml
```

## 기여 / Contributing

`CONTRIBUTING.md`의 절차와 `OWNERS`의 책임 표를 우선합니다. 새 도구는 `bin/`에 단일 책임 스크립트로 추가하고, 공통 로직은 `bin/lib/`에 분리합니다. 레이아웃은 `layouts/` 하위에 의미 있는 이름으로 추가하고 기본값은 보수적으로 유지합니다. 모든 PR은 `AGENTS.md`의 인벤토리 표에 반영합니다.

Follow `CONTRIBUTING.md` and the ownership table in `OWNERS`. New tools go in `bin/` as single-purpose scripts; shared logic moves to `bin/lib/`. New layouts live under `layouts/` with conservative defaults. PRs must update the inventory table in `AGENTS.md`.

## 유지보수 / Maintainers

`OWNERS` 파일의 책임 표를 1차 창구로 사용합니다. 영역별 1차/2차 담당은 해당 표를 기준으로 갱신합니다. 사소한 문서 오탈자는 PR로 직접 제안하고, 동작 변경은 이슈로 먼저 합의합니다.

Use the ownership table in `OWNERS` as the primary point of contact. Update it whenever ownership shifts. Minor doc fixes go in as direct PRs; behavioral changes require an issue first.

## 라이선스 / License

`LICENSE` 파일을 참조합니다. 외부 배포 시 동일 라이선스 조건을 유지합니다.

See `LICENSE`. Preserve the same terms on redistribution.

## 추가 문서 / Further Documentation

| 문서 / Document | 경로 / Path |
|---|---|
| 프로젝트 지식 베이스 | `AGENTS.md` |
| TUI 서브프로젝트 규약 | `tui/sessionizer/AGENTS.md` |
| 슬랙 브리지 규약 | `slack/tmux-bridge/AGENTS.md` |
| 세션 영속화 설계 노트 | `docs/session-persistence-brainstorming.md` |
| 메모리/거버넌스 정책 | `docs/supermemory-governance.md` |
| 기여 절차 | `CONTRIBUTING.md` |
| 책임 표 | `OWNERS` |
| 루트 로더 | `tmux.conf` |
| 세션 검색 설정 | `sessionizer.conf` |
| 레이아웃 템플릿 | `layouts/default.yml`, `layouts/proxmox.yml`, `layouts/splunk.yml`, `layouts/safework.yml`, `layouts/safework2.yml`, `layouts/resume.yml`, `layouts/blacklist.yml` |