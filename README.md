# tmux — 세션 관리 툴킷

[![Bash](https://img.shields.io/badge/Bash-4EAA25?logo=gnubash&logoColor=white)](#quickstart--usage)
[![tmux](https://img.shields.io/badge/tmux-1BB91F?logo=tmux&logoColor=white)](#quickstart--usage)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)](#tui-sessionizer)
[![License](https://img.shields.io/badge/license-internal-lightgrey)](#license)

`~/.tmux` 자리에 심볼릭 링크되는 bash-first tmux 구성 저장소입니다.
세션 검색·생성·사이드바·레이아웃·Slack 연동까지 한 묶음으로 제공합니다.

Bash-first tmux configuration designed to be symlinked at `~/.tmux`.
Bundles session discovery, sidebar rendering, YAML layouts, and a Slack bridge.

## 빠른 스캔 / Quick Glance

| 구성 요소 / Component | 진입점 / Entry | 주 책임 / Responsibility |
| --- | --- | --- |
| 코어 로더 / Core loader | `tmux.conf` | `conf.d/*.conf` 소싱, prefix `C-a` |
| 세션 검색기 / Sessionizer | `bin/tmux-sessionizer` | fzf 기반 세션 선택·생성 마법사 |
| TUI 세션 검색기 / TUI picker | `tui/sessionizer` | Bun + OpenTUI + React 인터페이스 |
| 사이드바 / Sidebar | `bin/tmux-sidebar` | 트리 형태 윈도우/세션 표시 |
| 상태바 / Statusline | `bin/tmux-responsive` | 너비 등급별 분기 렌더링 |
| 레이아웃 적용 / Layouts | `bin/tmux-layout-apply`, `layouts/*.yml` | YAML 템플릿을 세션에 적용 |
| Slack 연동 / Slack bridge | `slack/tmux-bridge` | 세션 ↔ Slack 채널 동기화 |

### 운영 흐름 요약 / Operator Flow

1. 사용자가 셸을 열면 `bin/tmux-auto-attach`가 tmux 서버를 보장한다.
2. `prefix + s`로 사이드바를 토글하고, `prefix + S`로 세션 검색기를 호출한다.
3. `bin/tmux-sessionizer`는 `sessionizer.conf`의 `SCAN_DIR`/`EXTRA_DIRS`를 스캔해 후보를 제시한다.
4. 새 세션 생성 시 `tmux-sessionizer-wizard`가 이름·디렉터리·레이아웃을 안내한다.
5. 상태바는 git(`tmux-git-status`), 시스템 부하(`tmux-sys-stats`), 응답형 분기를 조합해 표시한다.
6. 선택적으로 `bin/tmux-slack-bridge-start`가 Slack 채널과 세션을 양방향 동기화한다.

## 목차 / Table of Contents

- [Purpose / Package Contents](#purpose--package-contents)
- [Status](#status)
- [First Files to Read](#first-files-to-read)
- [API or Entry Points](#api-or-entry-points)
- [Quickstart / Usage](#quickstart--usage)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Commands Reference](#commands-reference)
- [Local Development](#local-development)
- [Testing](#testing)
- [Maintainers / Points of Contact](#maintainers--points-of-contact)
- [Further Documentation](#further-documentation)
- [License](#license)

## Purpose / Package Contents

이 저장소는 tmux 사용자가 다음을 바로 얻도록 구성되었습니다.

- 단축 키 prefix를 `C-a`로 일관화한 코어 키바인딩 (`conf.d/20-keys.conf`).
- fzf 기반 세션 선택기와 Bun/OpenTUI 기반 대안 선택기.
- Nerd Font 아이콘을 활용한 사이드바와 너비 적응형 상태바.
- YAML 레이아웃 템플릿(`layouts/*.yml`)을 통한 재현 가능한 세션 구성.
- Slack 채널 ↔ tmux 세션 브리지 (`slack/tmux-bridge`).
- git 상태, 시스템 부하, 실행 시간 알림 등 운영에 필요한 보조 스크립트.

대상 사용자는 한 머신에서 여러 프로젝트 디렉터리, 원격 SSH, Slack 협업을 오가는 개발자/운영자입니다.

## Status

운영 가능(production-ready) 상태입니다. `OWNERS`에 등록된 메인테이너가 직접 사용하며, AGENTS.md 기준으로 산출물을 관리합니다.
GitLab CI(`slack/tmux-bridge`)는 브리지 빌드/테스트를 검증합니다.

## First Files to Read

| 순서 / Order | 파일 / File | 설명 / Why read first |
| --- | --- | --- |
| 1 | `tmux.conf` | 진입 로더, 어떤 `conf.d/*.conf`가 로드되는지 파악 |
| 2 | `sessionizer.conf` | `SCAN_DIR`/`EXTRA_DIRS`로 세션 후보 영역 결정 |
| 3 | `conf.d/00-core.conf` | 터미널·성능·환경변수 전파 baseline |
| 4 | `conf.d/20-keys.conf` | 키바인딩 단일 진실 공급원 |
| 5 | `bin/tmux-sessionizer` | 세션 선택/생성의 핵심 흐름 |
| 6 | `tui/sessionizer/AGENTS.md` | TUI 검색기 구조와 결정 기록 |
| 7 | `slack/tmux-bridge/AGENTS.md` | 브리지 책임과 운영 모드 |

## API or Entry Points

- 셸 진입: `bin/tmux-auto-attach` — 로그인 셸에서 호출되어 tmux 서버 부재 시 새 세션을 만든다.
- 세션 선택: `bin/tmux-sessionizer` (fzf) 또는 `bin/tmux-sessionizer-tui` (Bun TUI).
- 세션 관리: `tmux-session-cycle`, `tmux-session-kill`, `tmux-session-rename`, `tmux-session-jump`, `tmux-session-dashboard`.
- 레이아웃: `tmux-layout-apply <name>`, `tmux-template-create`.
- 사이드바: `tmux-sidebar`, `tmux-sidebar-init`, `tmux-sidebar-toggle`.
- Slack: `tmux-slack-bridge-setup` (1회 설정), `tmux-slack-bridge-start` (실행).
- TUI 세션 검색기: `tui/sessionizer` 디렉터리의 Bun 패키지 — `bun run start`.

## Quickstart / Usage

### 설치 / Install

```bash
# 저장소를 ~/.tmux로 심볼릭 링크
git clone <repo-url> ~/.tmux
ln -sfn ~/.tmux/tmux.conf ~/.tmux.conf
ln -sfn ~/.tmux ~/.tmux.real

# 셸에서 source (zsh/bash)
echo 'source ~/.tmux.conf' >> ~/.bashrc
```

### 첫 사용 / First run

```bash
# 1) tmux 서버 보장 후 진입
~/.tmux/bin/tmux-auto-attach

# 2) prefix + S 로 세션 선택/생성
# 3) prefix + s 로 사이드바 토글
# 4) prefix + ? 로 단축키 치트시트
```

### TUI 세션 검색기 / TUI picker

```bash
cd ~/.tmux/tui/sessionizer
bun install
bun run start
```

## Architecture

### 디렉터리 책임 / Directory roles

| 경로 / Path | 책임 / Role |
| --- | --- |
| `tmux.conf` | 진입 로더, `conf.d/` 모듈 소싱 |
| `sessionizer.conf` | 세션 스캔 경로 정의 |
| `conf.d/*.conf` | 코어/테마/키/사이드바 모듈 |
| `bin/` | 실행 스크립트 (세션, 사이드바, 상태, 슬랙) |
| `bin/lib/` | 세션 검색기·사이드바 공용 라이브러리 |
| `layouts/*.yml` | YAML 세션 레이아웃 템플릿 |
| `tui/sessionizer` | Bun + OpenTUI + React 기반 검색기 |
| `slack/tmux-bridge` | Node.js 슬랙 브리지 서비스 |
| `docs/` | 설계 brainstorm, 거버넌스 문서 |

### 세션 생성 흐름 / Session creation flow

1. 운영자가 `prefix + S` 또는 `tmux-sessionizer-tui`를 호출한다.
2. `tmux-sessionizer`가 `sessionizer.conf`의 `SCAN_DIR`/`EXTRA_DIRS`를 스캔한다.
3. 후보가 fzf 또는 TUI로 제시되고, 운영자가 선택하거나 `new`를 입력한다.
4. `tmux-sessionizer-wizard`가 이름·디렉터리·레이아웃을 단계별로 수집한다.
5. `tmux-sessionizer-common`이 tmux 새 세션을 생성하고 hook을 부착한다.
6. `tmux-sidebar-init`이 사이드바 캐시를 채우고 상태바가 메타데이터를 표시한다.
7. `tmux-session-branch-log`가 세션↔브랜치 매핑을 기록한다.

### 상태바 구성 / Statusline composition

- 좌측: `tmux-session-icon` + 세션 이름 + `tmux-git-status`.
- 중앙: 현재 명령어 또는 `tmux-pane-sync` 상태.
- 우측: `tmux-sys-stats` (CPU/MEM) + 시간, `tmux-responsive`로 폭 등급 분기.

## Configuration

| 파일 / File | 변수 / Key | 기본 의도 / Default intent |
| --- | --- | --- |
| `sessionizer.conf` | `SCAN_DIR` | 최상위 스캔 루트 (예: `~/src`) |
| `sessionizer.conf` | `EXTRA_DIRS` | 스캔에 추가할 보조 디렉터리 |
| `conf.d/00-core.conf` | 환경 변수 전파 | `SSH_AUTH_SOCK`, `DISPLAY` 등 셸 동기화 |
| `conf.d/10-theme.conf` | Tokyo Night 팔레트 | pane border status 색상 정의 |
| `layouts/default.yml` | 윈도우·패인 배열 | 일반 작업용 기본 레이아웃 |
| `layouts/proxmox.yml` | 패널 분할 | Proxmox 운영 콘솔 |
| `layouts/safework*.yml` | 단일 패널 안전 모드 | 의도치 않은 동기화 차단 |
| `layouts/splunk.yml` | 검색·결과 분할 | Splunk 검색 UI 모사 |
| `layouts/resume.yml` | 패널 다중화 | 다중 프로젝트 병행 |

## Commands Reference

### 세션 / Sessions

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-sessionizer` | fzf 세션 선택/생성 |
| `tmux-sessionizer-tui` | Bun TUI 세션 선택기 실행 |
| `tmux-session-cycle [up\|down]` | 활성 세션 순환 (`opencode` 제외) |
| `tmux-session-jump` | MRU 기반 빠른 점프 |
| `tmux-session-kill` | 확인 후 세션 종료 |
| `tmux-session-rename` | 유효성 검증 포함 이름 변경 |
| `tmux-session-dashboard` | 포맷팅된 세션 테이블 팝업 |
| `tmux-session-export` | 현재 레이아웃을 YAML로 내보내기 |
| `tmux-session-branch-log` | 세션↔브랜치 전환 기록 |
| `tmux-template-create` | 프리셋 템플릿으로 즉시 생성 |
| `tmux-layout-apply <name>` | YAML 레이아웃 적용 |
| `tmux-session-order` | 최근 활성 순 정렬 |
| `tmux-session-sync` | Slack 채널과 동기화 |
| `tmux-session-icon` | Nerd Font 아이콘 매핑 |

### 사이드바·표시 / Sidebar & UI

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-sidebar` | 트리 사이드바 렌더링 |
| `tmux-sidebar-init` | 세션 생성 시 사이드바 초기화 |
| `tmux-sidebar-toggle` | 가시성 토글 |
| `tmux-responsive` | 너비 등급별 상태바 렌더링 |
| `tmux-sys-stats` | CPU/MEM 상태바 컴포넌트 |
| `tmux-git-status` | 브랜치·dirty·ahead/behind·stash |
| `tmux-git-uncommitted` | 세션별 미커밋 추적 |
| `tmux-command-palette` | fzf 액션 선택기 |
| `tmux-cheatsheet` | 카테고리별 키바인드 도움말 |

### 입력·생산성 / Input & productivity

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-clipboard-history` | tmux 버퍼 링 탐색 |
| `tmux-copy-word` | 커서 단어 스마트 복사 |
| `tmux-url-open` | 패인 내 URL 추출 후 열기 |
| `tmux-file-open` | 패인 내 파일 경로 추출 후 열기 |
| `tmux-ssh-picker` | SSH config 호스트 선택 |
| `tmux-pane-sync` | 동기화-패인 토글 |
| `tmux-config-reload` | 설정 차분과 함께 리로드 |
| `tmux-notify-long-command` | 장기 명령 데스크톱 알림 |
| `tmux-bash-preexec` | 셸 preexec 후크 (명령 타이밍) |

### 운영 / Operations

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-auto-attach` | 로그인 셸 자동 부착 |
| `tmux-opencode` | OpenCode 세션 런처 |
| `tmux-web-terminal` | ttyd 웹 터미널 런처 |
| `tmux-slack-bridge-setup` | Slack 앱 1회성 설정 마법사 |
| `tmux-slack-bridge-start` | 브리지 실행 (소켓/cloudflared 듀얼 모드) |

## Local Development

```bash
# 변경 후 즉시 반영
~/.tmux/bin/tmux-config-reload

# 새 스크립트는 bin/ 하위에 추가하고 직접 chmod +x
chmod +x bin/tmux-<name>

# TUI 검색기 개발
cd tui/sessionizer
bun install
bun run start
bun run test
```

기여 절차는 `CONTRIBUTING.md`를 따르세요. PR 전 `bin/` 하위 셸 스크립트는 `shellcheck` 통과를 권장합니다.

## Testing

- TUI 세션 검색기: `cd tui/sessionizer && bun run test` (`__tests__/config.test.ts`, `tmux.test.ts`).
- Slack 브리지: GitLab CI 파이프라인 (`.gitlab-ci.yml`)이 `slack/tmux-bridge`의 빌드/테스트를 검증.
- 셸 스크립트: 로컬에서 `shellcheck bin/* bin/lib/*` 수행.

## Maintainers / Points of Contact

- 메인테이너 목록: `OWNERS` 파일 참조.
- 운영 정책·결정 기록: `AGENTS.md` 및 `docs/supermemory-governance.md`.
- Slack 브리지 운영: `slack/tmux-bridge/AGENTS.md`.

## Further Documentation

- 설계 brainstorm: `docs/session-persistence-brainstorming.md`.
- 거버넌스: `docs/supermemory-governance.md`.
- 컨트리뷰션 가이드: `CONTRIBUTING.md`.
- 모듈별 결정 기록: 각 하위 디렉터리의 `AGENTS.md` (`tui/sessionizer/AGENTS.md`, `slack/tmux-bridge/AGENTS.md`).

## License

내부 사용을 목적으로 합니다. 자세한 사항은 `LICENSE` 파일을 확인하세요.