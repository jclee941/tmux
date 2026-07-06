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
4. `tmux-slack-bridge-start`로 브리지를 띄우면 세션 이름과 Slack 채널이 양방향으로 동기화됩니다.
5. `tmux-sidebar-toggle`로 트리 사이드바를 켜고, `tmux-responsive`가 폭에 따라 상태바를 3단으로 렌더링합니다.

### English mirror

1. On login, `tmux-auto-attach` reattaches to an existing tmux server or starts a fresh one.
2. Hit `prefix + s` (fzf sessionizer) or `prefix + S` (Bun TUI sessionizer) to pick or create a session.
3. Apply declarative templates with `tmux-layout-apply` against `layouts/*.yml`.
4. Run `tmux-slack-bridge-start` to keep tmux session names and Slack channels in sync.
5. Toggle the tree sidebar via `tmux-sidebar-toggle`; the status bar adapts via `tmux-responsive`.

---

## 목차 / Table of Contents

- [목적 / Purpose](#목적--purpose)
- [주요 기능 / Features](#주요-기능--features)
- [패키지 구성 / Package Contents](#패키지-구성--package-contents)
- [아키텍처 / Architecture](#아키텍처--architecture)
- [빠른 시작 / Quickstart](#빠른-시작--quickstart)
- [설정 / Configuration](#설정--configuration)
- [명령어 참조 / Commands Reference](#명령어-참조--commands-reference)
- [로컬 개발 / Local Development](#로컬-개발--local-development)
- [테스트 / Testing](#테스트--testing)
- [기여 / Contributing](#기여--contributing)
- [관리자 및 문의 / Maintainers & Contact](#관리자-및-문의--maintainers--contact)
- [라이선스 / License](#라이선스--license)
- [추가 문서 / Further Documentation](#추가-문서--further-documentation)

---

## 목적 / Purpose

다수의 프로젝트, Git 브랜치, 원격 호스트를 동시에 다루는 개발자가 tmux 안에서 다음을 빠르게 수행하도록 돕는 개인 워크스테이션용 도구 모음입니다.

- 세션 선택/생성/순환/이름변경/종료를 키바인딩 몇 번으로 처리
- YAML 레이아웃으로 새 세션을 즉시 프로비저닝
- 세션 이름 ↔ Slack 채널을 양방향 동기화해 팀원과 컨텍스트 공유
- 사이드바/상태바/대시보드로 현재 워크스페이스 가시화
- fzf 기반의 검색/선택/URL·파일 열기 통합

### English mirror

A personal-workstation toolkit that lets developers juggling many projects, branches, and remote hosts operate tmux with minimal keystrokes: pick/create/cycle/rename/kill sessions, provision new sessions from YAML templates, sync session names with Slack channels, render tree sidebars and responsive status bars, and integrate fzf-driven pickers for URLs, files, and SSH hosts.

---

## 주요 기능 / Features

| 영역 / Area | 기능 / Capability | 진입점 / Entry point |
| --- | --- | --- |
| 세션 선택 / Session picking | fzf 기반 MRU 선택, 신규 생성 위저드 | `bin/tmux-sessionizer`, `bin/tmux-session-jump` |
| TUI 세션나이저 / TUI sessionizer | Bun + React(OpenTUI), 미리보기, 생성 위저드, 이름변경, 종료 확인 | `tui/sessionizer/`, `bin/tmux-sessionizer-tui` |
| 레이아웃 / Layouts | YAML 템플릿 → 윈도우/패널 자동 생성 | `bin/tmux-layout-apply`, `layouts/*.yml` |
| 템플릿 / Templates | 사전 정의 템플릿으로 빠른 세션 생성 | `bin/tmux-template-create` |
| 사이드바 / Sidebar | 트리형 세션 뷰, Nerd Font 아이콘, 색상 그룹 | `bin/tmux-sidebar`, `bin/tmux-sidebar-toggle`, `bin/lib/sidebar-*` |
| 상태바 / Status bar | 폭 단계별 3단 렌더링, Git/CPU/MEM 표시 | `bin/tmux-responsive`, `bin/tmux-sys-stats`, `bin/tmux-git-status` |
| Slack 동기화 / Slack sync | 세션 이름 ↔ 채널 양방향 동기화, 듀얼 모드(소켓/cloudflared) | `bin/tmux-slack-bridge-start`, `bin/tmux-session-sync`, `slack/tmux-bridge/` |
| Git 추적 / Git tracking | 브랜치/dirty/ahead/behind/stash, 미커밋 변경 추적 | `bin/tmux-git-status`, `bin/tmux-git-uncommitted`, `bin/tmux-session-branch-log` |
| 유틸리티 / Utilities | URL/파일 열기, SSH 선택, 클립보드 히스토리, 단어 복사, 명령 팔레트, 키바인딩 치트시트, 웹 터미널(ttyd), 설정 리로드, 긴 명령 알림 | `bin/tmux-*` |
| 자동 부착 / Auto-attach | 셸 로그인 시 자동 연결/신규 시작 | `bin/tmux-auto-attach` |
| 명령 타이밍 / Command timing | preexec 후킹으로 긴 명령 데스크톱 알림 | `bin/tmux-bash-preexec`, `bin/tmux-notify-long-command` |

---

## 패키지 구성 / Package Contents

| 경로 / Path | 역할 / Role |
| --- | --- |
| `tmux.conf` | 루트 로더. `conf.d/*.conf`(저장소 외부 symlink) 및 `bin/` 키바인딩을 로드 |
| `sessionizer.conf` | `SCAN_DIR` 및 `EXTRA_DIRS`로 세션 검색 대상 경로 정의 |
| `bin/` | 세션/사이드바/상태/유틸리티를 다루는 40개의 Bash 실행 스크립트 |
| `bin/lib/` | `tmux-sessionizer-{common,wizard}`, `sidebar-{colors,render}` 등 공유 라이브러리 |
| `layouts/` | 사전 정의 YAML 레이아웃 (`default`, `proxmox`, `splunk`, `safework`, `safework2`, `resume`, `blacklist`) |
| `tui/sessionizer/` | Bun + React(OpenTUI) 기반 TUI 세션나이저 (TypeScript) |
| `slack/tmux-bridge/` | Node.js Slack ↔ tmux 양방향 동기화 브리지 |
| `docs/` | 설계 노트: `session-persistence-brainstorming.md`, `supermemory-governance.md` |
| `CONTRIBUTING.md` | 기여 절차 및 PR 가이드라인 |
| `OWNERS` | 코드 소유자 목록 |
| `LICENSE` | 라이선스 전문 |

---

## 아키텍처 / Architecture

### 구성 흐름 / Configuration flow

| 단계 / Step | 동작 / Action | 산출물 / Output |
| --- | --- | --- |
| 1. 로드 / Load | `tmux.conf`가 모든 슬라이스 소싱 | 키바인딩, 상태바, 옵션 등록 |
| 2. 로그인 / Login | 셸 `PROMPT_COMMAND` 또는 `tmux-auto-attach` | tmux 서버 attach 또는 신규 |
| 3. 세션 / Session | `tmux-sessionizer[-tui]` 호출 | 기존 세션 선택 또는 신규 생성 |
| 4. 레이아웃 / Layout | 선택적 `tmux-layout-apply <file.yml>` | 윈도우/패널 자동 구성 |
| 5. 동기화 / Sync | `tmux-slack-bridge-start` (백그라운드) | Slack ↔ tmux 채널 매핑 |
| 6. 가시화 / Visibility | `tmux-sidebar-toggle`, `tmux-responsive` | 트리 + 3단 상태바 |

### 레이어 / Layers

| 레이어 / Layer | 책임 / Responsibility | 위치 / Location |
| --- | --- | --- |
| 코어 / Core | tmux 옵션, prefix(`C-a`), 환경 변수 전파 | `tmux.conf` |
| 키바인딩 / Keybindings | 사용자 입력 → 스크립트 디스패치 | `bin/tmux-*` (각 스크립트 트리거) |
| 세션 모델 / Session model | 세션 메타데이터, MRU, 아이콘, 이름 규칙 | `bin/tmux-session-*`, `bin/lib/tmux-sessionizer-common` |
| UI / UI | 사이드바, 상태바, 대시보드, TUI | `bin/tmux-sidebar*`, `bin/tmux-responsive`, `tui/sessionizer/` |
| 통합 / Integration | Slack, Git, SSH, 클립보드, URL/파일 | `slack/tmux-bridge/`, `bin/tmux-git-*`, `bin/tmux-ssh-picker`, ... |
| 데이터 / Data | YAML 레이아웃, 세션 설정 | `layouts/*.yml`, `sessionizer.conf` |

### 요청 흐름 예시 / Example request flow

1. 사용자가 `prefix + s` 입력
2. `tmux.conf` 바인딩이 `bin/tmux-sessionizer` 실행
3. `bin/lib/tmux-sessionizer-common`이 `sessionizer.conf`의 `SCAN_DIR`/`EXTRA_DIRS` 스캔
4. fzf가 후보 표시 → 선택 시 `bin/lib/tmux-sessionizer-wizard`가 필요 시 생성 위저드 수행
5. `tmux switch-client` 또는 `tmux new-session`으로 연결

---

## 빠른 시작 / Quickstart

### 1. 저장소를 `~/.tmux`로 링크 / Link the repo to `~/.tmux`

```sh
git clone <repo-url> ~/src/tmux
ln -sfn ~/src/tmux ~/.tmux
```

### 2. 의존성 설치 / Install dependencies

```sh
# 시스템 도구 / system tools (macOS 예시 / example)
brew install tmux fzf gh jq node bun
# Nerd Font (예: Hack Nerd Font) 설치 후 터미널에 설정
```

### 3. 셸에 tmux 자동 부착 등록 / Enable auto-attach in your shell

```sh
# ~/.bashrc 또는 ~/.zshrc
[ -x ~/.tmux/bin/tmux-auto-attach ] && source ~/.tmux/bin/tmux-auto-attach
```

### 4. 새 셸에서 진입 / Launch from a fresh shell

- 자동 부착이 동작하지 않으면 `tmux` 직접 실행
- `prefix + s` → fzf 세션나이저
- `prefix + S` → Bun TUI 세션나이저
- `prefix + ?` → 치트시트 팝업

### 5. Slack 브리지 (선택) / Slack bridge (optional)

```sh
~/.tmux/bin/tmux-slack-bridge-setup     # 1회만 / once
~/.tmux/bin/tmux-slack-bridge-start &   # 백그라운드 실행
```

자세한 키바인딩 목록은 [`bin/tmux-cheatsheet`](./bin/tmux-cheatsheet) 및 [`CONTRIBUTING.md`](./CONTRIBUTING.md) 참조.

---

## 설정 / Configuration

| 파일 / File | 목적 / Purpose | 주요 키 / Keys |
| --- | --- | --- |
| `tmux.conf` | 루트 로더, prefix, source 경로 | `set -g prefix C-a`, `bind-key` ... |
| `sessionizer.conf` | 세션 검색 경로 | `SCAN_DIR`, `EXTRA_DIRS` |
| `layouts/*.yml` | 선언적 윈도우/패널 템플릿 | `windows:`, `panes:`, `cmd:` |
| `OWNERS` | 코드 리뷰어 / Code owners | — |
| `tui/sessionizer/tsconfig.json` | TUI 컴파일러 옵션 | `jsx`, `target`, `paths` |
| `tui/sessionizer/bunfig.toml` | Bun 테스트/런타임 옵션 | `[test]`, `[install]` |

`layouts/default.yml`을 참고해 자신만의 템플릿을 추가한 뒤 `tmux-layout-apply <file>`로 적용하세요.

---

## 명령어 참조 / Commands Reference

대표 진입점만 정리합니다. 전체 40개 스크립트 목록은 [`bin/`](./bin/)을 확인하세요.

| 명령 / Command | 기능 / Function |
| --- | --- |
| `tmux-auto-attach` | 로그인 셸에서 tmux 자동 attach |
| `tmux-sessionizer` | fzf 기반 세션 선택 + 생성 위저드 |
| `tmux-sessionizer-tui` | Bun TUI 세션나이저 실행 |
| `tmux-session-jump` | MRU 세션 점프 |
| `tmux-session-cycle` | PgUp/PgDn 세션 순환 |
| `tmux-session-rename` | 세션 이름 변경(검증 포함) |
| `tmux-session-kill` | 확인 후 안전 종료 |
| `tmux-session-order` | 최근 활성 순 정렬 |
| `tmux-session-icon` | 세션명 → Nerd Font 아이콘 |
| `tmux-session-export` | 현재 세션을 YAML로 내보내기 |
| `tmux-session-dashboard` | 포맷된 세션 테이블 팝업 |
| `tmux-session-branch-log` | 세션 전환 시 브랜치 로그 |
| `tmux-session-sync` | Slack ↔ tmux 단발 동기화 |
| `tmux-layout-apply` | YAML 레이아웃 적용 |
| `tmux-template-create` | 사전 정의 템플릿으로 빠른 생성 |
| `tmux-sidebar` | 사이드바 렌더링 엔진 |
| `tmux-sidebar-toggle` | 사이드바 표시 토글 |
| `tmux-sidebar-init` | 세션 생성 시 사이드바 초기화 |
| `tmux-responsive` | 폭별 상태바 렌더링 |
| `tmux-sys-stats` | CPU/MEM 상태바 데이터 |
| `tmux-git-status` | Git 브랜치/dirty 상태 |
| `tmux-git-uncommitted` | 미커밋 변경 추적 |
| `tmux-command-palette` | fzf 액션 팔레트 |
| `tmux-url-open` | 패널에서 URL 추출·열기 |
| `tmux-file-open` | 패널에서 파일 경로 추출·열기 |
| `tmux-ssh-picker` | SSH config 호스트 선택 |
| `tmux-clipboard-history` | tmux 버퍼 히스토리 |
| `tmux-copy-word` | 커서 단어 스마트 복사 |
| `tmux-pane-sync` | synchronize-panes 토글 |
| `tmux-config-reload` | 설정 리로드 + 차이 표시 |
| `tmux-notify-long-command` | 긴 명령 데스크톱 알림 |
| `tmux-bash-preexec` | preexec 훅 소스 |
| `tmux-cheatsheet` | 키바인딩 치트시트 팝업 |
| `tmux-opencode` | OpenCode 세션 런처 |
| `tmux-web-terminal` | ttyd 웹 터미널 런처 |
| `tmux-slack-bridge-setup` | Slack 앱 설정 위저드 |
| `tmux-slack-bridge-start` | 브리지 데몬 시작(소켓/HTTP 듀얼 모드) |

---

## 로컬 개발 / Local Development

```sh
# 저장소 클론
git clone <repo-url> ~/src/tmux

# TUI 의존성 설치
cd tui/sessionizer
bun install

# TUI 개발 실행(프로젝트 루트 기준)
cd -
./bin/tmux-sessionizer-tui

# Slack 브리지 의존성
cd slack/tmux-bridge
npm install
```

스크립트는 표준 Bash 4+를 사용합니다. macOS의 경우 `brew install bash`로 GNU bash를 우선 사용하도록 설정하세요.

---

## 테스트 / Testing

| 대상 / Target | 명령 / Command |
| --- | --- |
| TUI 세션나이저 / TUI sessionizer | `cd tui/sessionizer && bun test` |
| TUI 설정 모듈 / TUI config | `bun test __tests__/config.test.ts` |
| TUI tmux 헬퍼 / TUI tmux helper | `bun test __tests__/tmux.test.ts` |
| Slack 브리지 CI / Slack bridge CI | 저장소 루트의 GitLab CI (`.gitlab-ci.yml`) 참조 |

---

## 기여 / 기여 / Contributing

1. [`CONTRIBUTING.md`](./CONTRIBUTING.md) 의 절차와 코드 스타일을 따릅니다.
2. 새 스크립트는 `bin/`에 추가하고, 공유 로직은 `bin/lib/`에 모듈화합니다.
3. 새 레이아웃은 `layouts/<name>.yml`로 PR을 올리고 [`OWNERS`](./OWNERS) 검토를 요청합니다.
4. TUI 변경 시 `tui/sessionizer/__tests__/`에 단위 테스트를 동반합니다.

---

## 관리자 및 문의 / Maintainers & Contact

- 코드 소유자 목록 / Code owners: [`OWNERS`](./OWNERS)
- 기여 절차 / Contribution process: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- 에이전트 운영 지침 / Agent operating instructions: [`AGENTS.md`](./AGENTS.md)

이슈 트래커는 저장소 호스팅(GitHub/GitLab 등)의 이슈 기능을 사용합니다. 운영 환경, 도구 의존성, 키바인딩 충돌 등은 PR 본문 또는 이슈에 환경 정보(tmux -V, bash --version, bun --version, node --version)를 함께 첨부해 주세요.

---

## 라이선스 / License

[`LICENSE`](./LICENSE) 파일의 내용을 따릅니다. 라이선스 종류와 조건은 동 파일을 확인하세요.

---

## 추가 문서 / Further Documentation

| 문서 / Document | 내용 / Contents |
| --- | --- |
| [`docs/session-persistence-brainstorming.md`](./docs/session-persistence-brainstorming.md) | 세션 영속화 설계 아이디어 |
| [`docs/supermemory-governance.md`](./docs/supermemory-governance.md) | 컨텍스트 거버넌스 노트 |
| [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) | TUI 모듈 에이전트 지침 |
| [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) | Slack 브리지 에이전트 지침 |
| [`AGENTS.md`](./AGENTS.md) | 저장소 전역 에이전트 지식 베이스 |
| [`bin/tmux-cheatsheet`](./bin/tmux-cheatsheet) | 카테고리별 키바인딩 빠른 참조 |
```

완전한 README를 생성했습니다. 기존 초안에서 잘려 있던 5단계 흐름을 복원하고, AGENTS.md에서 얻은 실제 스크립트 LOC/역할 정보를 명령어 참조 표에 반영했습니다. 상단 뷰포트에는 한/영 요약, 상태 표, 핵심 흐름을 압축 배치했고, 본문에는 Google 템플릿(목적 / 패키지 구성 / 상태 / 첫 읽기 파일 / 진입점 / 빠른 시작 / 유지보수자 / 추가 문서)을 따라 구성했습니다.