# tmux 세션 워크플로우 툴킷 / tmux Session Workflow Toolkit

`~/.tmux`로 심볼릭 링크되어 사용되는 bash-first tmux 설정과 세션 관리 도구 모음. 37개의 셸 스크립트, Bun 기반 OpenTUI 세션라이저, Node.js Slack 브리지, 7개의 YAML 레이아웃 템플릿을 단일 워크플로우로 묶습니다.

A bash-first tmux configuration and session-management toolkit symlinked as `~/.tmux`. It bundles shell scripts, a Bun/OpenTUI TUI sessionizer, a Node.js Slack bridge, and YAML layout templates into a single operator-facing workflow.

## 한눈에 보기 (At a Glance)

| 항목 | 값 |
| --- | --- |
| 루트 로더 | `tmux.conf` (sources `sessionizer.conf`, `bin/*`) |
| 키바인딩 prefix | `C-a` |
| 셸 스크립트 | `bin/tmux-*` 37개, `bin/lib/` 4개 |
| TUI 세션라이저 | `tui/sessionizer/` (Bun + OpenTUI + React) |
| Slack 브리지 | `slack/tmux-bridge/` (Node.js + tsx) |
| 레이아웃 템플릿 | `layouts/*.yml` 7개 |
| 외부 의존성 | tmux ≥ 3.3, fzf, gh, git, yq, Bun, Node.js |
| 대상 사용자 | 단일 운영자, 5+ 세션 동시 사용 |
| 라이선스 | `LICENSE` 참조 |
| 운영 상태 | 개인 워크플로우용, 단일 사용자 production-ready |

## 운영자 한 줄 흐름

로그인 셸 진입 → `tmux-auto-attach`가 기존 세션 부착 → `prefix + s` 또는 `tmux-sessionizer-tui`로 세션 선택/생성 → `prefix + b`(사이드바 토글)로 트리 확인 → 신규 세션은 `tmux-layout-apply <layouts/*.yml>` 적용 → `tmux-session-sync`가 변경을 Slack 채널과 동기화(옵션).

## 목차

1. [목적](#목적-purpose)
2. [패키지 구성](#패키지-구성-package-contents)
3. [상태](#상태-status)
4. [먼저 읽을 파일](#먼저-읽을-파일-first-files-to-read)
5. [API · 엔트리 포인트](#api--엔트리-포인트-api--entry-points)
6. [아키텍처](#아키텍처-architecture)
7. [빠른 시작](#빠른-시작-quickstart)
8. [명령어 레퍼런스](#명령어-레퍼런스-commands-reference)
9. [설정](#설정-configuration)
10. [키바인딩](#키바인딩-key-bindings)
11. [로컬 개발](#로컬-개발-local-development)
12. [Testing](#testing)
13. [기여 가이드](#기여-가이드-contributing)
14. [유지보수자](#유지보수자-maintainers)
15. [추가 문서](#추가-문서-further-documentation)
16. [License](#license)

## 목적 (Purpose)

tmux를 일상적으로 다수 세션으로 운영하면서 다음을 원하는 단일 사용자를 위한 도구 모음입니다.

- **빠른 세션 전환** — fzf MRU picker, prefix 순환, 트리 사이드바
- **재현 가능한 레이아웃** — YAML 템플릿을 세션에 일관 적용
- **풍부한 키바인딩** — 파일/URL 추출, SSH picker, 클립보드 히스토리, 명령 팔레트
- **TUI 진입** — 마우스/키보드 모두 지원되는 세션 선택 UI (Bun + OpenTUI)
- **Slack 양방향 동기화** — 세션 변경을 채널 토픽/이름으로 반영
- **상태 통합** — Git 상태, 시스템 통계, 미커밋 추적

**English**: a single-user toolkit for operators running many parallel tmux sessions who want templates, a sidebar, status-line integration, and Slack channel sync.

## 패키지 구성 (Package Contents)

| 경로 | 책임 |
| --- | --- |
| `tmux.conf` | 루트 로더. `sessionizer.conf`와 `bin/*` source |
| `sessionizer.conf` | 세션 스캔 경로 (`SCAN_DIR`, `EXTRA_DIRS`) |
| `bin/` | 사용자 실행 셸 스크립트 (37개) |
| `bin/lib/` | 공유 라이브러리: `tmux-sessionizer-common`, `tmux-sessionizer-wizard`, `sidebar-render`, `sidebar-colors` |
| `layouts/*.yml` | 세션 레이아웃 YAML 템플릿 |
| `tui/sessionizer/` | Bun + OpenTUI + React 기반 TUI 세션라이저 |
| `slack/tmux-bridge/` | Node.js + tsx Slack ↔ tmux 브리지 |
| `docs/` | 설계 노트, 거버넌스 메모 |
| `AGENTS.md`, `CONTRIBUTING.md`, `OWNERS` | 운영/기여 문서 |

## 상태 (Status)

- **용도**: 개인 워크플로우, 단일 사용자.
- **테스트**: `tui/sessionizer/__tests__/`의 Bun 테스트 2건 (`config.test.ts`, `tmux.test.ts`).
- **호환성**: bash 스크립트는 POSIX 호환을 지향. zsh에서는 `BASH_VERSION` 가드로 호환.
- **자동 의존성 설치**: 없음 (수동 설치).
- **deprecated 여부**: 활성, 운영자가 일상적으로 사용 중.
- **production readiness**: 단일 사용자 워크스테이션에서 production-ready. 다중 사용자/공용 환경은 비대상.

## 먼저 읽을 파일 (First Files to Read)

1. `tmux.conf` — 진입점, 키 prefix 정의
2. `sessionizer.conf` — 세션 탐색 경로(`SCAN_DIR`, `EXTRA_DIRS`)
3. `bin/tmux-sessionizer` — 핵심 fzf 진입점
4. `bin/tmux-sidebar` — 트리 렌더 엔진
5. `bin/lib/tmux-sessionizer-common` — 세션 공통 로직
6. `tui/sessionizer/src/App.tsx` — TUI 루트 컴포넌트
7. `layouts/default.yml` — 기본 레이아웃 정의
8. `docs/session-persistence-brainstorming.md` — 세션 영속화 설계 노트

## API · 엔트리 포인트 (API & Entry Points)

### 사용자용 진입 (CLI)

| 명령 | 설명 |
| --- | --- |
| `tmux` | `tmux.conf` 로드 후 부팅 |
| `tmux-sessionizer` | fzf 세션 picker + 생성 위저드 |
| `tmux-sessionizer-tui` | Bun TUI 세션 picker |
| `tmux-session-dashboard` | 세션 테이블 popup |
| `tmux-sidebar-toggle` | 트리 사이드바 토글 |
| `tmux-cheatsheet` | 키바인딩 카테고리 팝업 |
| `tmux-auto-attach` | 로그인 셸 자동 부착 |

### 라이브러리 진입 (Bash)

| 모듈 | 책임 |
| --- | --- |
| `bin/lib/tmux-sessionizer-common` | 세션 검색·필터링, fzf 호출 |
| `bin/lib/tmux-sessionizer-wizard` | 생성 위저드 단계 |
| `bin/lib/sidebar-render` | 트리 그리기 엔진 |
| `bin/lib/sidebar-colors` | 색상 토큰 |

### 프로그래매틱 진입 (TypeScript / Node)

| 경로 | 역할 |
| --- | --- |
| `tui/sessionizer/src/index.tsx` | TUI 엔트리, 부트스트랩 |
| `tui/sessionizer/src/App.tsx` | TUI 루트 컴포넌트 |
| `tui/sessionizer/src/lib/tmux.ts` | tmux CLI 어댑터 |
| `tui/sessionizer/src/lib/dirs.ts` | SCAN_DIR / EXTRA_DIRS 로더 |
| `tui/sessionizer/src/lib/create-session.ts` | 신규 세션 생성 |
| `tui/sessionizer/src/actions/session-actions.ts` | 액션 디스패치 |
| `slack/tmux-bridge` | Slack ↔ tmux IPC 데몬 |

## 아키텍처 (Architecture)

| 계층 | 책임 | 기술 |
| --- | --- | --- |
| 로더 | 키바인딩 prefix 정의, env 노출, source 정책 | tmux config DSL |
| 셸 계층 | 단일 책임 스크립트, 공용 로직은 `bin/lib/`로 분리 | bash |
| TUI 계층 | 마우스 가능 picker, fzf 대체 | Bun + React + OpenTUI |
| 브리지 계층 | Slack 이벤트를 tmux 명령으로 변환 | Node.js + tsx |

### 요청 흐름 (Request Flow)

1. 셸 부팅 → `tmux.conf`가 `sessionizer.conf`와 `bin/*`을 source.
2. `prefix + <key>` → tmux `bind` 라인 → `bin/tmux-*` 단일 실행.
3. 세션 선택: fzf 경로 (`tmux-sessionizer`) 또는 TUI 경로 (`tmux-sessionizer-tui`).
4. 신규 세션은 `layouts/<preset>.yml`을 `tmux-layout-apply`로 적용한 뒤 `tmux-sidebar-init`로 트리 보강.
5. `tmux-session-sync`가 rename/attach 이벤트를 구독해 Slack 채널 토픽·이름을 업데이트.

## 빠른 시작 (Quickstart)

### 1. 클론과 위임

```bash
git clone <repo-url> ~/.tmux
echo 'source-file ~/.tmux/tmux.conf' > ~/.tmux.conf
```

tmux는 사용자 설정 경로에 따라 `~/.tmux.conf` 또는 `~/.config/tmux/tmux.conf`를 자동으로 찾습니다. 다른 위치를 사용한다면 해당 파일에서 `source-file`을 호출하세요.

### 2. 외부 의존성 설치

| 의존성 | 용도 |
| --- | --- |
| tmux ≥ 3.3 | 코어 |
| fzf | picker 백엔드 |
| gh | GitHub CLI (옵션 통합) |
| git | 세션 검색/상태 |
| yq | YAML 파서 (layout) |
| Bun | TUI 런타임 |
| Node.js ≥ 20 | Slack 브리지 |

### 3. 스캔 경로 정의

```bash
$EDITOR ~/.tmux/sessionizer.conf
# 예:
# SCAN_DIR="$HOME/work"
# EXTRA_DIRS=("$HOME/scratch" "$HOME/notes")
```

### 4. tmux 시작

```bash
tmux
# 첫 진입 시 tmux-sessionizer가 빈 세션 picker를 표시합니다
```

### 5. TUI 세션라이저 (옵션)

```bash
cd tui/sessionizer
bun install
bun run dev      # 개발 모드 (HMR)
bun run build    # 프로덕션 빌드
bun test         # Bun 테스트
```

### 6. Slack 브리지 (옵션)

```bash
tmux-slack-bridge-setup     # Slack 앱 설치 위저드
tmux-slack-bridge-start     # 소켓 직접 또는 cloudflared HTTP 모드
tmux-session-sync           # tmux 세션에서 1회 동기화
```

## 명령어 레퍼런스 (Commands Reference)

### 세션 관리

| 스크립트 | 동작 |
| --- | --- |
| `tmux-sessionizer` | fzf 기반 세션 picker + 신규 생성 위저드 |
| `tmux-sessionizer-tui` | Bun TUI 세션 picker |
| `tmux-session-cycle` | PgUp/PgDn 세션 순환 (`opencode` 제외) |
| `tmux-session-jump` | MRU fzf picker |
| `tmux-session-dashboard` | 정렬된 세션 테이블 |
| `tmux-session-kill` | 확인 후 세션 종료 |
| `tmux-session-rename` | 검증 포함 이름 변경 |
| `tmux-session-order` | 최근 활성 순 정렬 |
| `tmux-session-export` | 세션 → YAML 출력 |
| `tmux-session-branch-log` | 세션↔브랜치 전환 로그 |
| `tmux-session-icon` | Nerd Font 아이콘 매핑 |
| `tmux-template-create` | 프리셋 템플릿으로 신규 세션 |

### 사이드바 · 상태바

| 스크립트 | 동작 |
| --- | --- |
| `tmux-sidebar-toggle` | 트리 토글 |
| `tmux-sidebar-init` | 세션 생성 시 트리 보강 |
| `tmux-sidebar` | 트리 렌더링 |
| `tmux-responsive` | 폭 단계별 statusbar |
| `tmux-sys-stats` | CPU/메모리 |
| `tmux-git-status` | 브랜치 + dirty/ahead/behind |
| `tmux-git-uncommitted` | 미커밋 추적 |

### 입력 · 출력 보조

| 스크립트 | 동작 |
| --- | --- |
| `tmux-command-palette` | fzf 액션 팔레트 |
| `tmux-url-open` | 패널에서 URL 추출 |
| `tmux-file-open` | 패널에서 파일 경로 추출 |
| `tmux-ssh-picker` | `~/.ssh/config` 호스트 picker |
| `tmux-clipboard-history` | tmux buffer ring 브라우저 |
| `tmux-copy-word` | 커서 단어 복사 |
| `tmux-pane-sync` | synchronize-panes 토글 |
| `tmux-config-reload` | 설정 리로드 + diff 표시 |
| `tmux-notify-long-command` | 장기 명령 데스크톱 알림 |
| `tmux-bash-preexec` | 셸 preexec hook 소스 |
| `tmux-cheatsheet` | 키바인딩 카테고리 팝업 |
| `tmux-auto-attach` | 로그인 셸 자동 부착 |
| `tmux-opencode` | OpenCode 세션 런처 |
| `tmux-web-terminal` | ttyd 웹 터미널 |
| `tm