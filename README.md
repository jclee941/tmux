# tmux 워크스페이스 툴킷

[![Runtime: bash 4+](https://img.shields.io/badge/runtime-bash%204%2B-4EAA25.svg)](#quickstart)
[![TUI: Bun + OpenTUI](https://img.shields.io/badge/TUI-Bun%20%2B%20OpenTUI-000000.svg)](#tui-세션라이저)
[![Bridge: Node.js](https://img.shields.io/badge/bridge-Node.js%2020%2B-339933.svg)](#slack-브릿지)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> 한국어 요약: 본 저장소는 `~/.tmux`로 심볼릭 링크되어 동작하는 **bash-first tmux 워크스페이스 툴킷**입니다. 세션 검색·생성·사이클링·이름변경·내보내기를 위한 `bin/` 스크립트 모음, Tokyo Night 테마와 폭-단계형 상태바를 포함한 `tmux.conf` 로더, YAML 레이아웃 템플릿 `layouts/`, Bun + OpenTUI 기반의 TUI 세션라이저 `tui/sessionizer/`, 그리고 Slack 채널과 tmux 세션을 동기화하는 `slack/tmux-bridge` 브릿지로 구성됩니다.
>
> English summary: A bash-first tmux configuration and session-management toolkit designed to be symlinked as `~/.tmux`. It ships a curated `bin/` of session, sidebar, status, and picker scripts; a `tmux.conf` loader with Tokyo Night theming; YAML layout templates in `layouts/`; a Bun + OpenTUI TUI sessionizer in `tui/sessionizer/`; and a Node.js Slack bridge in `slack/tmux-bridge` that mirrors channels as tmux sessions.

## 빠른 상태 / Quick Status

| 항목 / Item | 값 / Value |
| --- | --- |
| 제품 유형 / Product type | tmux 설정 + 세션 관리 툴킷 (셸 + TUI + 브릿지) |
| 주요 언어 / Primary language | Bash 4+, TypeScript (TUI), Node.js (브릿지) |
| 런타임 / Runtime | GNU tmux 3.2+, bash 4+, Bun 1.x (TUI), Node.js 20+ (브릿지) |
| 진입점 / Entry point | `tmux.conf` (로더), `bin/tmux-sessionizer` (CLI), `bin/tmux-sessionizer-tui` (TUI) |
| 설치 방식 / Install | 저장소를 `~/.tmux`에 심볼릭 링크 |
| 테스트 / Testing | `tui/sessionizer/__tests__/` (Bun test), GitLab CI for Slack bridge |
| 상태 / Status | 개인 워크플로우용 안정화 단계, 기능 확장 중 |
| 라이선스 / License | MIT ([LICENSE](LICENSE)) |
| 관리자 / Maintainers | [OWNERS](OWNERS) 참조 |

## 운영 흐름 한눈에 / Operator Flow at a Glance

1. 저장소를 `~/.tmux`로 심볼릭 링크한다. (`ln -s "$PWD" ~/.tmux`)
2. tmux를 시작하면 `tmux.conf`가 `conf.d/*.conf`를 순서대로 소싱한다 (00 → 99).
3. Prefix `C-a`로 명령 팔레트(`bin/tmux-command-palette`) 또는 세션라이저(`bin/tmux-sessionizer` / `bin/tmux-sessionizer-tui`)를 호출한다.
4. 세션은 Git 작업 트리에서 자동 검색되며, YAML 레이아웃은 `bin/tmux-layout-apply`로 적용한다.
5. Slack 연동이 필요하면 `bin/tmux-slack-bridge-setup`으로 앱을 등록하고 `bin/tmux-slack-bridge-start`로 데몬을 띄운다.

## 목차 / Table of Contents

- [목적 및 구성 / Purpose & Package Contents](#목적-및-구성--purpose--package-contents)
- [상태 / Status](#상태--status)
- [먼저 읽을 파일 / First Files to Read](#먼저-읽을-파일--first-files-to-read)
- [진입점 / API or Entry Points](#진입점--api-or-entry-points)
- [빠른 시작 / Quickstart](#빠른-시작--quickstart)
- [아키텍처 / Architecture](#아키텍처--architecture)
- [설정 / Configuration](#설정--configuration)
- [명령 레퍼런스 / Commands Reference](#명령-레퍼런스--commands-reference)
- [로컬 개발 / Local Development](#로컬-개발--local-development)
- [테스트 / Testing](#테스트--testing)
- [기여 / Contributing](#기여--contributing)
- [관리자 및 연락처 / Maintainers & Points of Contact](#관리자-및-연락처--maintainers--points-of-contact)
- [추가 문서 / Further Documentation](#추가-문서--further-documentation)
- [라이선스 / License](#라이선스--license)

## 목적 및 구성 / Purpose & Package Contents

이 저장소는 단일 tmux 설정 파일을 넘어 **세션 단위의 작업 단위(Workspace)**를 관리하기 위한 도구 모음입니다.
세션 검색, 사이드바, 상태바, 레이아웃 적용, 외부 채널과의 동기화까지 CLI/TUI/브릿지 세 계층으로 제공합니다.

| 경로 / Path | 역할 / Role |
| --- | --- |
| `tmux.conf` | 루트 로더, `conf.d/*.conf`를 정렬 순서대로 소싱 |
| `sessionizer.conf` | 세션라이저용 `SCAN_DIR` / `EXTRA_DIRS` 정의 |
| `bin/` | 40여 개의 bash 실행 스크립트 (세션·사이드바·상태·피커) |
| `bin/lib/` | 공유 라이브러리 (사이드바 렌더, 세션라이저 공용 함수) |
| `layouts/` | YAML 세션 레이아웃 템플릿 (default, proxmox, splunk, safework, resume, blacklist) |
| `tui/sessionizer/` | Bun + OpenTUI 기반 TUI 세션라이저 (React + TypeScript) |
| `slack/tmux-bridge/` | Slack 채널 ↔ tmux 세션 동기화 브릿지 (Node.js) |
| `docs/` | 세션 영속화 아이디어, 거버넌스 노트 |
| `AGENTS.md`, `CONTRIBUTING.md`, `OWNERS`, `LICENSE` | 프로젝트 메타 |

## 상태 / Status

- **안정화 영역**: 세션 사이클링, 사이드바 토글, 상태바, YAML 레이아웃 적용, 명령 팔레트.
- **확장 중**: Slack 브릿지의 클라우드 플레어 터널 모드, TUI 세션라이저의 미리보기 패널.
- **운영 환경**: macOS, Linux 데스크톱에서 일상 사용 가정. 헤드리스 서버용이 아니라 **로컬 개발 터미널**에 최적화되어 있습니다.
- **하위 호환**: prefix 키는 `C-a`로 통일되어 있어 기존 `C-b` 사용자는 마이그레이션이 필요합니다.

## 먼저 읽을 파일 / First Files to Read

운영자 또는 신규 기여자가 가장 먼저 살펴보아야 할 파일입니다.

| 우선순위 / Priority | 파일 / File | 이유 / Why |
| --- | --- | --- |
| 1 | `tmux.conf` | 전체 설정 로더와 소싱 순서를 한눈에 파악 |
| 2 | `AGENTS.md` | 디렉터리 구조, 각 스크립트 라인 수, 설계 의도 |
| 3 | `sessionizer.conf` | 세션 검색 범위와 추가 디렉터리 정의 |
| 4 | `bin/tmux-sessionizer` | 가장 자주 호출되는 진입 스크립트 |
| 5 | `layouts/default.yml` | 레이아웃 스키마의 기준선 |
| 6 | `tui/sessionizer/AGENTS.md` | TUI 모듈 내부 규칙과 진입점 |

## 진입점 / API or Entry Points

| 표면 / Surface | 진입점 / Entry | 호출 예시 / Example |
| --- | --- | --- |
| tmux 로더 | `tmux.conf` | `tmux -L default` |
| 세션 피커 (fzf) | `bin/tmux-sessionizer` | `prefix + s` |
| TUI 세션라이저 | `bin/tmux-sessionizer-tui` | `prefix + S` |
| 명령 팔레트 | `bin/tmux-command-palette` | `prefix + :` → palette |
| 레이아웃 적용 | `bin/tmux-layout-apply` | `tmux-layout-apply layouts/proxmox.yml` |
| Slack 브릿지 | `bin/tmux-slack-bridge-start` | `tmux-slack-bridge-start` |

## 빠른 시작 / Quickstart

사전 요구 사항: tmux 3.2+, bash 4+, fzf, git. TUI를 쓸 경우 Bun 1.x, 브릿지를 쓸 경우 Node.js 20+.

```bash
# 1) 클론 후 ~/.tmux로 심볼릭 링크
git clone <repo-url> ~/work/tmux-workspace
ln -s ~/work/tmux-workspace ~/.tmux

# 2) tmux 시작 (tmux.conf가 conf.d/*.conf를 자동 로드)
tmux

# 3) Prefix는 C-a. 명령 팔레트 또는 세션라이저 호출
#    prefix + s → fzf 세션라이저
#    prefix + S → TUI 세션라이저
#    prefix + space → 명령 팔레트
```

Slack 브릿지를 함께 쓰려면 `slack/tmux-bridge/AGENTS.md`를 읽고 `tmux-slack-bridge-setup`을 먼저 실행하세요.

## 아키텍처 / Architecture

### 계층 / Layers

| 계층 / Layer | 기술 / Tech | 책임 / Responsibility |
| --- | --- | --- |
| 설정 | tmux.conf + conf.d/*.conf | 키바인딩, 테마, 상태바, 환경 변수 |
| 셸 도구 | bash (`bin/`, `bin/lib/`) | 세션 CRUD, 사이드바, 상태, 피커 |
| TUI | Bun + OpenTUI + React (`tui/sessionizer`) | 마우스/키보드 통합 세션 관리 UI |
| 브릿지 | Node.js (`slack/tmux-bridge`) | Slack 채널 ↔ tmux 세션 양방향 동기화 |
| 데이터 | YAML (`layouts/`) | 세션 레이아웃 템플릿, 블랙리스트 |

### 요청 흐름 / Request Flow

세션라이저 호출을 예시로 한 동작 순서입니다.

1. 사용자가 `prefix + s` 또는 `prefix + S`로 세션라이저를 호출합니다.
2. `bin/tmux-sessionizer`(fzf) 또는 `bin/tmux-sessionizer-tui`(Bun)가 `sessionizer.conf`의 `SCAN_DIR`을 스캔합니다.
3. 기존 세션은 `tmux list-sessions`로 나열하고, 작업 트리는 `git rev-parse`로 식별합니다.
4. 사용자가 세션을 선택하면 해당 세션으로 `tmux switch-client` 합니다.
5. 새 세션을 만들면 `bin/lib/tmux-sessionizer-wizard`가 이름·디렉터리·레이아웃을 확인하고 `tmux new-session`을 실행합니다.
6. `bin/tmux-sidebar-init`이 사이드바를 즉시 갱신하고, `bin/tmux-session-branch-log`가 분기 매핑을 기록합니다.

### 디렉터리 레이아웃 / Directory Layout

저장소 루트의 실제 최상위 구조는 다음과 같습니다.

```
.
├── AGENTS.md
├── CONTRIBUTING.md
├── LICENSE
├── OWNERS
├── README.md
├── sessionizer.conf
├── tmux.conf
├── bin/                # 40+ 개의 bash 스크립트
├── bin/lib/            # 공유 라이브러리
├── layouts/            # YAML 레이아웃 템플릿
├── tui/sessionizer/    # Bun + OpenTUI 세션라이저
├── docs/               # 설계 노트
└── slack/tmux-bridge/  # Node.js Slack 브릿지
```

## 설정 / Configuration

### `sessionizer.conf`

| 키 / Key | 의미 / Meaning |
| --- | --- |
| `SCAN_DIR` | 세션라이저가 기본으로 탐색할 루트 디렉터리 |
| `EXTRA_DIRS` | 추가로 인덱싱할 보조 경로 목록 |
| `BLACKLIST_FILE` | 제외할 경로 패턴 (기본: `layouts/blacklist.yml`) |

### `layouts/*.yml`

| 템플릿 / Template | 용도 / Use |
| --- | --- |
| `default.yml` | 기본 1-패널 레이아웃 |
| `proxmox.yml` | Proxmox 운영용 다중 패널 |
| `splunk.yml` | Splunk 검색·대시보드 구성 |
| `safework.yml`, `safework2.yml` | 페일오버/세이프워크 시나리오 |
| `resume.yml` | 작업 재개용 경량 레이아웃 |
| `blacklist.yml` | 세션라이저 스캔 제외 패턴 |

## 명령 레퍼런스 / Commands Reference

> 모든 스크립트는 `PATH=$HOME/.tmux/bin:$PATH`로 등록해 사용하는 것을 권장합니다.

### 세션 관리 / Session Management

| 명령 / Command | 기능 / Function |
| --- | --- |
| `tmux-sessionizer` | fzf 세션 피커 + 생성 마법사 |
| `tmux-sessionizer-tui` | Bun TUI 세션라이저 |
| `tmux-session-cycle` | `PgUp`/`PgDn` 세션 순환 (opencode 제외) |
| `tmux-session-jump` | MRU fzf 세션 점프 |
| `tmux-session-kill` | 확인 프롬프트와 함께 세션 종료 |
| `tmux-session-rename` | 검증 포함 세션 이름 변경 |
| `tmux-session-order` | 최근 활성 순으로 세션 정렬 |
| `tmux-session-dashboard` | 포맷팅된 세션 테이블 팝업 |
| `tmux-session-export` | 세션 레이아웃을 YAML로 내보내기 |
| `tmux-session-branch-log` | 세션 ↔ 브랜치 매핑 기록 |
| `tmux-session-icon` | Nerd Font 아이콘 매퍼 |
| `tmux-session-sync` | tmux 세션 ↔ Slack 채널 동기화 |

### 레이아웃 / Layouts

| 명령 / Command | 기능 / Function |
| --- | --- |
| `tmux-layout-apply` | YAML 레이아웃을 세션에 적용 |
| `tmux-template-create` | 프리셋에서 세션 즉시 생성 |

### 사이드바 및 상태 / Sidebar & Status

| 명령 / Command | 기능 / Function |
| --- | --- |
| `tmux-sidebar` | 트리형 사이드바 디스플레이 엔진 |
| `tmux-sidebar-init` | 세션 생성 시 사이드바 초기화 |
| `tmux-sidebar-toggle` | 사이드바 가시성 토글 |
| `tmux-responsive` | 폭 단계별 상태바 렌더링 |
| `tmux-sys-stats` | CPU/메모리 상태바 컴포넌트 |
| `tmux-git-status` | 브랜치·dirty·ahead/behind·stash 표시 |
| `tmux-git-uncommitted` | 세션별 미커밋 변경 추적 |

### 피커 / Pickers

| 명령 / Command | 기능 / Function |
| --- | --- |
| `tmux-command-palette` | fzf 액션 팔레트 |
| `tmux-url-open` | 패널에서 URL 추출 후 열기 |
| `tmux-file-open` | 패널에서 파일 경로 추출 후 열기 |
| `tmux-ssh-picker` | SSH config 호스트 피커 |
| `tmux-clipboard-history` | tmux 버퍼 링 브라우저 |
| `tmux-copy-word` | 커서 위치 단어 스마트 복사 |
| `tmux-cheatsheet` | 카테고리별 키바인드 참조 팝업 |

### 유틸 / Utilities

| 명령 / Command | 기능 / Function |
| --- | --- |
| `tmux-auto-attach` | 로그인 셸 자동 attach |
| `tmux-opencode` | OpenCode 세션 런처 |
| `tmux-pane-sync` | synchronize-panes 토글 |
| `tmux-config-reload` | 설정 리로드 + diff 표시 |
| `tmux-notify-long-command` | 장기 명령 데스크탑 알림 |
| `tmux-bash-preexec` | 명령 타이밍용 preexec 훅 |
| `tmux-web-terminal` | ttyd 웹 터미널 런처 |
| `tmux-slack-bridge-setup` | Slack 앱 등록 마법사 |
| `tmux-slack-bridge-start` | 브릿지 데몬 (소켓 직접 / cloudflared HTTP) |

## 로컬 개발 / Local Development

```bash
# PATH 등록 (zsh/bash 모두 호환)
export PATH="$HOME/.tmux/bin:$PATH"

# 설정 리로드
tmux-config-reload

# 특정 스크립트만 단독 실행해 디버깅
bash -x ~/.tmux/bin/tmux-sessionizer

# TUI 세션라이저 개발
cd tui/sessionizer
bun install
bun run dev
```

## 테스트 / Testing

| 대상 / Target | 명령 / Command |
| --- | --- |
| TUI 세션라이저 유닛 테스트 | `cd tui/sessionizer && bun test` |
| Slack 브릿지 CI | 저장소 루트의 `.gitlab-ci.yml` 참조 |
| 수동 점검 | `tmux-session-dashboard`, `tmux-cheatsheet` |

## 기여 / 기여 안내

기여 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)에 정리되어 있습니다.
새 스크립트를 추가할 때는 다음을 권장합니다.

- `bin/`에 단일 책임 스크립트로 추가하고, 공유 로직은 `bin/lib/`로 분리합니다.
- 스크립트 상단에 `usage()` 함수를 두고 `--help`로 호출 가능하게 합니다.
- tmux 서버에 부수 효과(세션 생성/종료)가 있으면 확인 프롬프트를 둡니다.
- `tui/sessionizer/` 변경 시 Bun 테스트를 함께 갱신합니다.

영문: See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution guide.

## 관리자 및 연락처 / Maintainers & Points of Contact

저장소 관리자 목록은 [OWNERS](OWNERS) 파일을 참조하세요.
각 하위 모듈별 책임자는 다음과 같습니다.

| 모듈 / Module | 책임 영역 / Area |
| --- | --- |
| `tmux.conf`, `bin/` | 핵심 tmux 설정 및 셸 도구 |
| `tui/sessionizer/` | TUI 세션라이저 |
| `slack/tmux-bridge/` | Slack 브릿지 |

도움말이 필요하면 먼저 다음을 확인하세요.

1. [docs/session-persistence-brainstorming.md](docs/session-persistence-brainstorming.md)
2. [docs/supermemory-governance.md](docs/supermemory-governance.md)
3. 각 하위 모듈의 `AGENTS.md` (`tui/sessionizer/AGENTS.md`, `slack/tmux-bridge/AGENTS.md`)

## 추가 문서 / Further Documentation

| 문서 / Document | 내용 / Contents |
| --- | --- |
| [docs/session-persistence-brainstorming.md](docs/session-persistence-brainstorming.md) | 세션 영속화 아이디어 노트 |
| [docs/supermemory-governance.md](docs/supermemory-governance.md) | 메모리/거버넌스 정책 메모 |
| [tui/sessionizer/AGENTS.md](tui/sessionizer/AGENTS.md) | TUI 모듈 내부 규칙 |
| [slack/tmux-bridge/AGENTS.md](slack/tmux-bridge/AGENTS.md) | Slack 브릿지 내부 규칙 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 기여 가이드 |
| [LICENSE](LICENSE) | 라이선스 전문 |

## 라이선스 / License

이 프로젝트는 MIT 라이선스로 배포됩니다. 자세한 내용은 [LICENSE](LICENSE)를 확인하세요.
This project is released under the MIT License. See [LICENSE](LICENSE) for the full text.