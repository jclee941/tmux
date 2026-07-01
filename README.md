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
- [Entry Points / 진입점](#entry-points--진입점)
- [Quickstart / 빠른 시작](#quickstart--빠른-시작)
- [Configuration / 설정](#configuration--설정)
- [Commands Reference / 명령어 레퍼런스](#commands-reference--명령어-레퍼런스)
- [Layouts / 레이아웃](#layouts--레이아웃)
- [TUI Sessionizer / TUI 세션나이저](#tui-sessionizer--tui-세션나이저)
- [Slack Bridge / 슬랙 브리지](#slack-bridge--슬랙-브리지)
- [Local Development / 로컬 개발](#local-development--로컬-개발)
- [Testing / 테스트](#testing--테스트)
- [Contributing / 기여](#contributing--기여)
- [Maintainers / 유지보수자](#maintainers--유지보수자)
- [License / 라이선스](#license--라이선스)
- [Further Documentation / 추가 문서](#further-documentation--추가-문서)

---

## Purpose / 목적

이 저장소는 tmux를 단순한 터미널 멀티플렉서에서 “프로젝트 단위의 작업 환경 관리자”로 끌어올리기 위해 모은 코드와 설정의 모음입니다. 한 사람이 여러 프로젝트, 여러 브랜치, 여러 원격 호스트를 동시에 다룰 때 발생하는 반복 작업을 자동화하고, 세션을 키·값처럼 다루며, 채널(채팅)과 세션을 양방향으로 묶어 협업 흐름을 끊지 않는 것이 목표입니다.

This repository is a curated bundle of tmux configuration and companion scripts that turn tmux into a project-scoped workspace manager. It automates the repetitive work that comes with juggling many projects, branches, and remote hosts, treats sessions as first-class keys, and keeps chat channels and tmux sessions in two-way sync so collaboration never stalls.

대상 사용자 / Intended users:

- 다수의 Git 작업 트리를 빠르게 오가는 백엔드/플랫폼 엔지니어
- 한 터미널 안에서 여러 원격 서버로 SSH 하는 SRE/DevOps
- 코드 리뷰와 운영 채널을 동시에 보는 팀 리드

---

## Package Contents / 구성 요소

| 경로 / Path | 역할 / Role | 비고 / Notes |
| --- | --- | --- |
| `tmux.conf` | 최상위 로더, prefix = `C-a` | 셸 진입 시 자동 source |
| `sessionizer.conf` | 세션 스캔 디렉터리 설정 | `SCAN_DIR`, `EXTRA_DIRS` |
| `bin/` | 실행 스크립트 모음(40+ 개) | PATH에 추가하여 사용 |
| `lib/` | 공유 라이브러리 모듈 | sidebar 렌더링, 세션나이저 공통 로직 |
| `layouts/` | 선언적 YAML 레이아웃 템플릿 | `default.yml` 외 7 종 |
| `tui/sessionizer/` | Bun + OpenTUI 세션나이저 | React/TypeScript 기반 |
| `slack/tmux-bridge/` | Node.js Slack 통합 | 소켓 직접 또는 cloudflared 터널 |
| `docs/` | 설계 노트, 거버넌스 문서 | brainstorming 및 정책 |

### `bin/` 카테고리별 스크립트 / Scripts by Category

| 카테고리 / Category | 스크립트 / Scripts |
| --- | --- |
| 세션 생명주기 / Session lifecycle | `tmux-sessionizer`, `tmux-sessionizer-tui`, `tmux-session-cycle`, `tmux-session-kill`, `tmux-session-rename`, `tmux-session-jump`, `tmux-session-order`, `tmux-session-dashboard`, `tmux-session-export`, `tmux-session-branch-log`, `tmux-template-create`, `tmux-session-icon` |
| 사이드바 / Sidebar | `tmux-sidebar`, `tmux-sidebar-init`, `tmux-sidebar-toggle` |
| 레이아웃 / Layouts | `tmux-layout-apply` |
| 상태 표시줄 / Status bar | `tmux-responsive`, `tmux-sys-stats`, `tmux-git-status`, `tmux-git-uncommitted` |
| 클립보드·URL·파일 / Clipboard & extraction | `tmux-clipboard-history`, `tmux-copy-word`, `tmux-url-open`, `tmux-file-open` |
| 페인·셸 / Pane & shell | `tmux-pane-sync`, `tmux-auto-attach`, `tmux-bash-preexec`, `tmux-notify-long-command` |
| 검색·명령 팔레트 / Discovery | `tmux-ssh-picker`, `tmux-command-palette`, `tmux-cheatsheet` |
| 설정 관리 / Config | `tmux-config-reload` |
| 통합 / Integrations | `tmux-slack-bridge-start`, `tmux-slack-bridge-setup`, `tmux-session-sync`, `tmux-web-terminal`, `tmux-opencode` |

### `lib/` 공유 모듈 / Shared Modules

| 모듈 / Module | 책임 / Responsibility |
| --- | --- |
| `tmux-sessionizer-common` | 세션 탐색·매칭 공통 함수 |
| `tmux-sessionizer-wizard` | 신규 세션 생성 마법사 단계 로직 |
| `sidebar-colors` | 사이드바 색상 정의 |
| `sidebar-render` | 사이드바 렌더링 엔진 |

---

## Status / 상태

| 측면 / Aspect | 상태 / Status | 비고 / Notes |
| --- | --- | --- |
| tmux 핵심 설정 | 안정 / Stable | prefix `C-a`, Tokyo Night 팔레트 |
| fzf 기반 CLI 도구 | 안정 / Stable | fzf 의존 |
| TUI 세션나이저 | 활발히 개발 중 / Active | Bun ≥ 1.1 필요 |
| Slack 브리지 | 베타 / Beta | 소켓 직접 또는 cloudflared 터널 모드 |
| YAML 레이아웃 | 안정 / Stable | 7 종 템플릿 제공 |
| 자동화된 CI | 부분 / Partial | 슬랙 브리지 테스트는 `.gitlab-ci.yml` 사용 |

---

## First Files to Read / 먼저 읽을 파일

운영자가 우선 검토해야 할 파일은 다음과 같습니다.

| 순서 / Order | 파일 / File | 이유 / Why |
| --- | --- | --- |
| 1 | [`tmux.conf`](./tmux.conf) | 최상위 진입점, prefix와 로드 순서 결정 |
| 2 | [`sessionizer.conf`](./sessionizer.conf) | 세션 스캔 대상 결정 |
| 3 | [`OWNERS`](./OWNERS) | 책임 유지보수자 목록 |
| 4 | [`AGENTS.md`](./AGENTS.md) | 저장소 내부 프로젝트 지식 베이스 |
| 5 | [`bin/tmux-sessionizer`](./bin/tmux-sessionizer) | 핵심 워크플로 진입 도구 |
| 6 | [`layouts/default.yml`](./layouts/default.yml) | 기본 레이아웃 참조 |

---

## Entry Points / 진입점

| 진입점 / Entry Point | 호출 방법 / How it is invoked | 대상 / Audience |
| --- | --- | --- |
| `tmux.conf` | tmux 시작 시 자동 source | tmux 사용자 |
| `bin/tmux-sessionizer` | 키바인딩 `prefix + s` 또는 직접 실행 | CLI 선호 사용자 |
| `bin/tmux-sessionizer-tui` | 키바인딩 `prefix + S` 또는 직접 실행 | TUI 선호 사용자 |
| `bin/tmux-auto-attach` | 로그인 셸 `.bashrc`/`.zshrc` 에서 호출 | 셸 로그인 사용자 |
| `bin/tmux-slack-bridge-start` | `tmux` 외부 데몬으로 실행 | 협업 운영자 |
| `bin/tmux-web-terminal` | `ttyd` 래퍼로 실행 | 웹에서 터미널 공유가 필요한 사용자 |

---

## Quickstart / 빠른 시작

### 1) 설치 / Install

저장소를 `~/.tmux` 로 심볼릭 링크하고 PATH 에 `bin/` 을 추가합니다.

```sh
git clone <repository-url> ~/.tmux
# ~/.tmux 자체를 사용하는 경우(권장)
echo 'export PATH="$HOME/.tmux/bin:$PATH"' >> ~/.bashrc
echo 'source-file ~/.tmux/tmux.conf' >> ~/.tmux.conf
```

### 2) 의존성 / Dependencies

| 의존성 / Dependency | 용도 / Used by | 최소 버전 / Min version |
| --- | --- | --- |
| `tmux` | 멀티플렉서 | 3.2 |
| `bash` | 스크립트 | 4 |
| `fzf` | fuzzy picker | 최신 안정 |
| `git` | git-status, git-uncommitted | 2.x |
| `bun` | TUI 세션나이저 | 1.1 |
| `node` | Slack 브리지 | 18 |
| `tsx` | Slack 브리지 실행 | 최신 |
| `yq` | YAML 레이아웃 파싱 | 4 |
| `cloudflared` (선택) | Slack 브리지 터널 모드 | 최신 |

### 3) 첫 세션 만들기 / Create your first session

```sh
# 로그인 시 자동 attach
tmux-auto-attach

# 또는 수동
tmux new-session -d -s demo
tmux-layout-apply default
tmux-sessionizer
```

### 4) TUI 세션나이저 실행 / Run the TUI sessionizer

```sh
bun --cwd tui/sessionizer install
bun --cwd tui/sessionizer start   # 또는 bin/tmux-sessionizer-tui
```

### 5) Slack 브리지 (선택) / Slack bridge (optional)

```sh
tmux-slack-bridge-setup   # 최초 1회, 앱 토큰 등록
tmux-slack-bridge-start   # 데몬으로 기동
```

---

## Configuration / 설정

### `sessionizer.conf`

세션 스캔 대상을 정의합니다.

| 키 / Key | 의미 / Meaning | 예시 / Example |
| --- | --- | --- |
| `SCAN_DIR` | 1차 스캔 루트 | `~/work` |
| `EXTRA_DIRS` | 추가 스캔 디렉터리 목록 | `~/sandbox ~/forks` |

### `bin/tmux-sessionizer` 동작 플래그

`tmux-sessionizer` 는 내부적으로 다음 변수를 사용합니다(파일 상단에서 조정).

| 변수 / Variable | 기본값 / Default | 설명 / Description |
| --- | --- | --- |
| `SESSIONIZER_FZF_OPTS` | (빈 값) | fzf 공통 옵션 |
| `SESSIONIZER_FILTER` | `.git` | 스캔 시 무시할 패턴 |
| `SESSIONIZER_MAX_DEPTH` | `4` | 디렉터리 탐색 깊이 |

### TUI 환경 변수

| 변수 / Variable | 용도 / Purpose |
| --- | --- |
| `TMUX_SESSIONIZER_CONFIG` | 사용자 정의 설정 경로 |
| `BUN_INSTALL` | Bun 설치 경로 자동 감지 |

---

## Commands Reference / 명령어 레퍼런스

> 모든 스크립트는 `--help` 가 정의되어 있다면 우선 따릅니다. 일부 스크립트는 인자 없이 실행되면 fzf 인터랙티브 모드로 진입합니다.

### 세션 / Sessions

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-sessionizer [dir]` | 디렉터리에서 세션 선택 또는 생성 |
| `tmux-sessionizer-tui` | Bun/OpenTUI 세션나이저 실행 |
| `tmux-session-cycle <next\|prev>` | PgUp/PgDn 식 세션 회전, opencode 세션 제외 |
| `tmux-session-jump` | MRU 기반 fzf 점프 |
| `tmux-session-kill [name]` | 확인 후 안전 종료 |
| `tmux-session-rename [new]` | 세션 이름 변경, 검증 포함 |
| `tmux-session-order` | 최근 활성 순 정렬 출력 |
| `tmux-session-dashboard` | 세션 표 팝업 |
| `tmux-session-export <file>` | 현재 레이아웃을 YAML 로 내보내기 |
| `tmux-session-branch-log` | 세션 전환 시 `branch → session` 로그 기록 |
| `tmux-template-create <name>` | 프리셋 템플릿으로 빠른 생성 |
| `tmux-session-icon <name>` | Nerd Font 아이콘 매핑 |

### 사이드바 / Sidebar

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-sidebar` | 트리 사이드바 표시 엔진 |
| `tmux-sidebar-init` | 세션 생성 시 사이드바 초기화 |
| `tmux-sidebar-toggle` | 표시/숨김 토글 |

### 레이아웃 / Layouts

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-layout-apply <name>` | `layouts/<name>.yml` 을 현재 세션에 적용 |

### 상태 표시줄 / Status bar

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-responsive` | 터미널 너비 등급별 표시줄 렌더링 |
| `tmux-sys-stats` | CPU 부하와 메모리 사용량 |
| `tmux-git-status` | 현재 브랜치, dirty/ahead/behind/stash |
| `tmux-git-uncommitted` | 세션당 미커밋 변경 추적 |

### 클립보드·추출 / Clipboard & extraction

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-clipboard-history` | tmux 버퍼 링 브라우저 |
| `tmux-copy-word` | 커서 위치 단어 복사 |
| `tmux-url-open` | 페인에서 URL 추출 후 열기 |
| `tmux-file-open` | 페인에서 파일 경로 추출 후 열기 |

### 페인·셸 / Pane & shell

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-pane-sync` | `:setw synchronize-panes` 토글 |
| `tmux-auto-attach` | 로그인 셸에서 attach/new 자동 처리 |
| `tmux-bash-preexec` | 소스 가능한 명령 시간 측정 훅 |
| `tmux-notify-long-command` | 장시간 명령 데스크톱 알림 |

### 검색·명령 팔레트 / Discovery

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-ssh-picker` | `~/.ssh/config` 호스트 선택 |
| `tmux-command-palette` | fzf 액션 팔레트 |
| `tmux-cheatsheet` | 카테고리별 키바인딩 참조 팝업 |

### 설정 / Config

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-config-reload` | 설정 diff 표시 후 안전 리로드 |

### 통합 / Integrations

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-slack-bridge-setup` | 대화형 Slack 앱 설정 마법사 |
| `tmux-slack-bridge-start` | 듀얼 모드(소켓 직접 / HTTP cloudflared) 데몬 |
| `tmux-session-sync` | tmux 세션 ↔ Slack 채널 동기화 |
| `tmux-web-terminal` | `ttyd` 기반 웹 터미널 |
| `tmux-opencode` | OpenCode 세션 런처 |

---

## Layouts / 레이아웃

선언적 YAML 로 창 분할, 명령 실행, 작업 디렉터리를 한 번에 적용합니다.

| 파일 / File | 용도 / Purpose |
| --- | --- |
| [`layouts/default.yml`](./layouts/default.yml) | 기본 3-페인 워크스페이스 |
| [`layouts/blacklist.yml`](./layouts/blacklist.yml) | 차단 환경 점검용 |
| [`layouts/proxmox.yml`](./layouts/proxmox.yml) | Proxmox 운영 콘솔 |
| [`layouts/resume.yml`](./layouts/resume.yml) | 이력서/문서 작성용 |
| [`layouts/safework.yml`](./layouts/safework.yml) | 안전 작업 프로필 1 |
| [`layouts/safework2.yml`](./layouts/safework2.yml) | 안전 작업 프로필 2 |
| [`layouts/splunk.yml`](./layouts/splunk.yml) | Splunk 검색 환경 |

예시 / Example:

```sh
tmux-layout-apply default
# 또는
tmux-layout-apply safework
```

---

## TUI Sessionizer / TUI 세션나이저

`tui/sessionizer/` 는 Bun 런타임 위에서 동작하는 OpenTUI + React 애플리케이션입니다.

### 디렉터리 / Directory

```
tui/sessionizer/
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   ├── bun-env.d.ts
│   ├── components/   # create-wizard, filter-input, kill-confirm-dialog,
│   │                 # preview-panel, rename-dialog, session-list,
│   │                 # wizard-step-{dir,layout,name}
│   ├── hooks/        # use-keyboard-handler
│   ├── actions/      # session-actions
│   └── lib/          # config, create-session, dirs, state, theme, tmux
└── __tests__/        # config.test.ts, tmux.test.ts
```

### 기능 / Features

| 기능 / Feature | 설명 / Description |
| --- | --- |
| 필터 입력 | 접두 일치와 fuzzy 매칭 |
| 세션 미리보기 | 마지막 활성 시각, Git 상태, 페인 수 |
| 생성 마법사 | 디렉터리 → 레이아웃 → 이름 3 단계 |
| 이름 변경 | 인라인 다이얼로그 |
| 종료 확인 | 의도하지 않은 종료 방지 |

### 개발 명령 / Dev commands

```sh
bun --cwd tui/sessionizer install
bun --cwd tui/sessionizer start
bun --cwd tui/sessionizer test
bun --cwd tui/sessionizer run typecheck
```

자세한 메모는 [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) 를 참조하세요.

---

## Slack Bridge / 슬랙 브리지

`slack/tmux-bridge/` 는 Node.js Socket Mode 또는 cloudflared 터널 HTTP 모드로 동작하는 Slack 통합 데몬입니다.

| 측면 / Aspect | 값 / Value |
| --- | --- |
| 언어 / Language | TypeScript (Node.js ≥ 18) |
| 실행 / Runtime | `tsx` |
| 모드 / Modes | 소켓 직접 / HTTP(cloudflared 터널) 듀얼 |
| 트리거 / Triggers | 채널 메시지, 멘션, 슬래시 명령 |
| 동기화 / Sync | 채널 ↔ tmux 세션 양방향 |
| CI | `.gitlab-ci.yml` (GitLab) |

### 설치 흐름 / Setup flow

1. `tmux-slack-bridge-setup` 으로 Slack 앱 자격 증명을 등록합니다.
2. `tmux-slack-bridge-start` 로 데몬을 시작합니다(자동 모드 감지).
3. `tmux-session-sync` 가 현재 세션과 채널 상태를 주기적으로 맞춥니다.

자세한 노트는 [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) 를 참조하세요.

---

## Local Development / 로컬 개발

### 디렉터리 레이아웃 / Repository layout

```
.
├── AGENTS.md                 # 프로젝트 지식 베이스
├── CONTRIBUTING.md           # 기여 가이드
├── LICENSE                   # 라이선스
├── OWNERS                    # 책임 소유자
├── README.md                 # 이 문서
├── sessionizer.conf          # 스캔 디렉터리 설정
├── tmux.conf                 # tmux 진입 설정
├── bin/                      # 40+ 실행 스크립트
├── lib/                      # 공유 라이브러리 모듈
├── layouts/                  # YAML 레이아웃 템플릿
├── tui/sessionizer/          # Bun/TS 세션나이저
├── slack/tmux-bridge/        # Node Slack 통합
└── docs/                     # 설계 노트·거버넌스
```

### 개발 워크플로 / Dev workflow

| 단계 / Step | 명령 / Command |
| --- | --- |
| 1. 저장소 클론 | `git clone <repository-url> ~/.tmux` |
| 2. PATH 등록 | `export PATH="$HOME/.tmux/bin:$PATH"` |
| 3. tmux 설정 로드 | `tmux source-file ~/.tmux/tmux.conf` |
| 4. Bash 스크립트 린트 | `shellcheck bin/<script>` |
| 5. TUI 의존성 설치 | `bun --cwd tui/sessionizer install` |
| 6. Slack 브리지 의존성 | `npm --prefix slack/tmux-bridge install` |
| 7. 설정 리로드 | `prefix + r` (또는 `tmux-config-reload`) |

---

## Testing / 테스트

| 영역 / Area | 도구 / Tool | 위치 / Where |
| --- | --- | --- |
| TUI 세션나이저 | `bun test` | `tui/sessionizer/__tests__/` |
| Slack 브리지 | GitLab CI | 저장소 루트 `.gitlab-ci.yml` |
| Bash 스크립트 | `shellcheck` 권장 | `bin/`, `lib/` |

```sh
# TUI
bun --cwd tui/sessionizer test

# Bash
shellcheck bin/*.sh lib/*

# Slack bridge
# (CI 환경 변수 필요)
```

---

## Contributing / 기여

1. 이슈 또는 토론에서 변경 의도를 먼저 공유합니다.
2. [`CONTRIBUTING.md`](./CONTRIBUTING.md) 의 가이드라인을 따릅니다.
3. 새 `bin/` 스크립트는 다음을 만족합니다:
   - `shellcheck` 경고 없음
   - `set -euo pipefail` 사용
   - `tmux-sessionizer-common` 의 공통 함수 우선 활용
4. 새 YAML 레이아웃은 `layouts/` 에 추가하고 본 README 의 표에 등록합니다.
5. PR 본문에 테스트 방법과 영향을 받는 키바인딩을 명시합니다.

기여자 행동 강령은 [`OWNERS`](./OWNERS) 와 [`CONTRIBUTING.md`](./CONTRIBUTING.md) 를 참조하세요.

---

## Maintainers / 유지보수자

책임 소유자 목록은 [`OWNERS`](./OWNERS) 파일을 참조하세요. 도메인별 연락 지점은 [`AGENTS.md`](./AGENTS.md) 의 “Points of Contact” 절을 따릅니다.

| 영역 / Area | 위치 / Where to look |
| --- | --- |
| 코드 오너십 / Code ownership | [`OWNERS`](./OWNERS) |
| 설계 노트 / Design notes | [`AGENTS.md`](./AGENTS.md), [`docs/`](./docs/) |
| TUI 도메인 / TUI domain | [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) |
| Slack 도메인 / Slack domain | [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) |

---

## License / 라이선스

이 저장소는 [`LICENSE`](./LICENSE) 파일에 명시된 조건에 따라 배포됩니다. 사용 전 라이선스 전문을 확인하세요.

This repository is distributed under the terms described in [`LICENSE`](./LICENSE). Please review the full text before use.

---

## Further Documentation / 추가 문서

| 문서 / Document | 경로 / Path | 설명 / Description |
| --- | --- | --- |
| 프로젝트 지식 베이스 | [`AGENTS.md`](./AGENTS.md) | 저장소 구조와 도메인 요약 |
| 기여 가이드 | [`CONTRIBUTING.md`](./CONTRIBUTING.md) | PR, 코딩 스타일 |
| 세션 영속성 브레인스토밍 | [`docs/session-persistence-brainstorming.md`](./docs/session-persistence-brainstorming.md) | 세션 복원 설계 노트 |
| 거버넌스 | [`docs/supermemory-governance.md`](./docs/supermemory-governance.md) | 메모리/정책 거버넌스 |
| TUI 도메인 노트 | [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) | 세션나이저 TUI 세부 사항 |
| Slack 도메인 노트 | [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) | 브리지 세부 사항 |