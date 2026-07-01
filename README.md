# tmux 생산성 도구 모음 / tmux Productivity Suite

> 큐레이션된 tmux 설정과 풍부한 생태계(보조 도구, 공유 라이브러리, 선언적 YAML 레이아웃, Bun/TypeScript 기반 TUI, Slack 브리지)를 한 저장소에 담은, 다수의 프로젝트·브랜치·원격 호스트를 다루는 파워 유저용 환경입니다.
>
> A curated, opinionated tmux configuration plus a complete ecosystem of companion tools, shared libraries, declarative YAML layouts, a Bun/TypeScript TUI, and a Slack bridge — designed for power users who juggle many projects, branches, and remote hosts.

[![tmux](https://img.shields.io/badge/tmux-%E2%89%A53.2-1bb91f)](https://github.com/tmux/tmux)
[![Bash](https://img.shields.io/badge/Bash-%E2%89%A54-4EAA25)](https://www.gnu.org/software/bash/)
[![Bun](https://img.shields.io/badge/Bun-%E2%89%A51.1-f9f1e1)](https://bun.sh)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-see%20LICENSE-blue)](./LICENSE)
[![AGENTS.md](https://img.shields.io/badge/AGENTS.md-project%20context-blueviolet)](./AGENTS.md)
[![CONTRIBUTING.md](https://img.shields.io/badge/CONTRIBUTING.md-guides-blueviolet)](./CONTRIBUTING.md)

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
| 기여 가이드 / Contribution | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| AI 컨텍스트 / AI context | [`AGENTS.md`](./AGENTS.md) |

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
- [API or Entry Points / 진입점](#api-or-entry-points--진입점)
- [Architecture / 아키텍처](#architecture--아키텍처)
- [Quickstart / 빠른 시작](#quickstart--빠른-시작)
- [Configuration / 설정](#configuration--설정)
- [Commands Reference / 명령어 레퍼런스](#commands-reference--명령어-레퍼런스)
- [Local Development / 로컬 개발](#local-development--로컬-개발)
- [Testing / 테스트](#testing--테스트)
- [Contribution Guide / 기여 가이드](#contribution-guide--기여-가이드)
- [Maintainers / 유지보수](#maintainers--유지보수)
- [Further Documentation / 추가 문서](#further-documentation--추가-문서)
- [License / 라이선스](#license--라이선스)

---

## Purpose / 목적

- **tmux 의 작업 흐름을 프로젝트 단위로 빠르게 전환**할 수 있도록 디렉터리 스캔, MRU 기반 점프, fzf/TUI 픽커를 제공합니다.
- **세션·창·창분할을 코드로 재현 가능한 형태로 관리**하기 위해 선언적 YAML 레이아웃과 템플릿 시스템을 포함합니다.
- **분산 환경(원격 호스트, SSH, 다중 Git 브랜치, Slack 협업)** 과 tmux 세션을 자연스럽게 잇는 어댑터를 제공합니다.
- **단일 머신에서 수십~수백 개의 가벼운 세션**을 안정적으로 운영할 수 있도록 자동 부착·세션 사이클·사이드바·상태바를 함께 제공합니다.

The toolkit turns tmux into a project-aware, template-driven session manager. It bundles Bash entry points, shared libraries, declarative YAML layouts, an OpenTUI sessionizer, and a Slack bridge so that a single workstation can drive many concurrent projects, branches, and remote hosts with consistent shortcuts.

---

## Package Contents / 구성 요소

| 경로 / Path | 역할 / Role |
| --- | --- |
| `tmux.conf` | 루트 로더 — 하위 conf 모듈들을 순서대로 소싱 / Root loader, sources conf fragments |
| `sessionizer.conf` | `SCAN_DIR`, `EXTRA_DIRS` 등 세션 디스커버리 설정 / Session discovery configuration |
| `bin/` | 30+ 개의 보조 스크립트(세션, 사이드바, 상태바, 알림, 슬랙) / 30+ companion scripts |
| `bin/lib/` | 공유 라이브러리(세션나이저 공통, 위저드, 사이드바 렌더링) / Shared libraries |
| `layouts/*.yml` | 사전 정의된 창/분할 템플릿 (`default`, `proxmox`, `resume`, `safework`, `splunk` 등) / Predefined layout templates |
| `tui/sessionizer/` | Bun + TypeScript + OpenTUI 기반 대화형 세션 선택기 / Bun/TS interactive picker |
| `slack/tmux-bridge/` | Node.js 기반 Slack ↔ tmux 양방향 브리지 / Node Slack bridge |
| `docs/` | 설계 메모, 거버넌스 문서 / Design notes & governance |
| `AGENTS.md`, `CONTRIBUTING.md`, `OWNERS`, `LICENSE` | 운영 메타데이터 / Operational metadata |

### bin/ 의 주요 스크립트 / bin/ Highlights

| 카테고리 / Category | 스크립트 / Script | 기능 / Purpose |
| --- | --- | --- |
| 세션 / Session | `tmux-sessionizer`, `tmux-sessionizer-tui`, `tmux-session-jump`, `tmux-session-cycle`, `tmux-session-kill`, `tmux-session-rename`, `tmux-session-dashboard`, `tmux-session-order`, `tmux-session-icon`, `tmux-session-export`, `tmux-session-branch-log` | 선택·생성·순환·삭제·표시·내보내기 |
| 템플릿 / Template | `tmux-template-create`, `tmux-layout-apply` | 프리셋 템플릿으로 세션 생성, YAML 레이아웃 적용 |
| 사이드바 / Sidebar | `tmux-sidebar`, `tmux-sidebar-init`, `tmux-sidebar-toggle` | 트리형 사이드바 표시·초기화·전환 |
| 상태바 / Status | `tmux-responsive`, `tmux-sys-stats`, `tmux-git-status`, `tmux-git-uncommitted` | 폭 적응형 상태바와 시스템·Git 정보 |
| 입력 보조 / Input | `tmux-url-open`, `tmux-file-open`, `tmux-copy-word`, `tmux-clipboard-history`, `tmux-ssh-picker`, `tmux-command-palette`, `tmux-pane-sync` | URL·파일·단어·SSH·명령 팔레트 |
| 운영 / Ops | `tmux-auto-attach`, `tmux-config-reload`, `tmux-notify-long-command`, `tmux-bash-preexec`, `tmux-cheatsheet` | 로그인 자동 부착, 설정 재로드, 알림, 키바인드 치트시트 |
| 통합 / Integration | `tmux-opencode`, `tmux-web-terminal`, `tmux-session-sync`, `tmux-slack-bridge-start`, `tmux-slack-bridge-setup` | OpenCode 런처, ttyd 웹 터미널, Slack 동기화 |

---

## Status / 상태

- **운영 준비도 / Production-readiness:** 개인 워크스테이션에서 즉시 사용 가능. Production-grade SLA 는 제공되지 않습니다.
- **유지보수 모드 / Maintenance:** 활발한 개인 도구 모음(개인 워크플로우 최적화 중심). 외부 사용자는 [`CONTRIBUTING.md`](./CONTRIBUTING.md) 의 가이드에 따라 PR 을 보내 주세요.
- **테스트 / Testing:** TUI 세션나이저는 Bun `bun test` 기반 단위 테스트 포함, 슬랙 브리지는 GitLab CI 에서 빌드/스모크 검증.
- **알려진 제약 / Known limits:** 모바일/원격 tmux 서버는 `tmux-web-terminal` (ttyd) 또는 SSH 로 별도 운영해야 합니다.

---

## First Files to Read / 먼저 읽을 파일

| 순서 / Order | 파일 / File | 왜 읽어야 하는가 / Why read it |
| --- | --- | --- |
| 1 | [`tmux.conf`](./tmux.conf) | 전체 키바인드·옵션 진입점 / Top-level entry point |
| 2 | [`sessionizer.conf`](./sessionizer.conf) | 세션 스캔 디렉터리 정의 / Defines scanned directories |
| 3 | [`AGENTS.md`](./AGENTS.md) | 디렉터리 의도와 라인 수 등 메타 정보 / Directory intent and metadata |
| 4 | [`layouts/default.yml`](./layouts/default.yml) | YAML 레이아웃 스키마를 가장 빠르게 이해 / Easiest schema reference |
| 5 | [`bin/tmux-sessionizer`](./bin/tmux-sessionizer) | 세션 워크플로의 핵심 스크립트 / Core session workflow |
| 6 | [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) | TUI 내부 구조 요약 / TUI internal structure |
| 7 | [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) | 슬랙 브리지 모드·상태 정리 / Bridge modes & state |

---

## API or Entry Points / 진입점

| 진입점 / Entry | 호출 / Invoke | 사용처 / Used by |
| --- | --- | --- |
| tmux 설정 / tmux config | `tmux -f <repo>/tmux.conf` 또는 `~/.tmux` 심볼릭 링크 | 모든 tmux 세션 |
| 세션나이저 (fzf) | `bin/tmux-sessionizer` | `prefix + s` 바인딩 |
| 세션나이저 (TUI) | `bin/tmux-sessionizer-tui` → `tui/sessionizer/` | `prefix + S` 바인딩 |
| 레이아웃 적용 | `bin/tmux-layout-apply <file.yml>` | 수동 또는 템플릿 생성 시 |
| 자동 부착 | `bin/tmux-auto-attach` | 로그인 셸 `.bashrc`/`.zshrc` |
| 슬랙 브리지 | `bin/tmux-slack-bridge-setup` → `bin/tmux-slack-bridge-start` | 선택적 운영 모드 |
| 설정 재로드 | `bin/tmux-config-reload` | `prefix + r` |

---

## Architecture / 아키텍처

### 계층 / Layers

| 계층 / Layer | 책임 / Responsibility | 구현 / Implementation |
| --- | --- | --- |
| 설정 / Config | 키바인드, 옵션, 환경변수 전파 | `tmux.conf` + `sessionizer.conf` |
| 보조 스크립트 / Scripts | 사용자 호출 단위 작업 | `bin/*` (Bash) |
| 공유 라이브러리 / Lib | 상태·렌더링·위저드 공통 로직 | `bin/lib/*` |
| 데이터 / Data | 레이아웃·템플릿 정의 | `layouts/*.yml` |
| TUI / TUI | 대화형 세션 관리 UI | `tui/sessionizer/` (Bun + TypeScript) |
| 외부 통합 / External | Slack, OpenCode, ttyd, SSH, Git | `slack/tmux-bridge/`, 관련 bin 스크립트 |

### 요청 흐름 / Request Flow

1. 사용자가 tmux prefix 키를 누르면 `tmux.conf` 가 정의한 바인딩이 `bin/*` 스크립트를 호출합니다.
2. 스크립트는 필요 시 `bin/lib/*` 의 공통 함수로 위임하고, `layouts/*.yml` 을 읽어 창/분할을 구성합니다.
3. `tmux-sessionizer-tui` 호출 시 Bun 런타임이 `tui/sessionizer/src/index.tsx` 를 실행해 fzf-스타일 UI 를 렌더링합니다.
4. `tmux-slack-bridge-start` 가 클라우드flared 또는 직접 소켓 모드 중 하나로 Node.js 브리지를 띄우고, `tmux-session-sync` 가 양방향 메시지를 중개합니다.
5. 모든 상태 변경은 `tmux` 서버의 단일 진실 공급원(source of truth)을 중심으로 일어나며, 설정 재로드는 `tmux-config-reload` 가 차이를 표시한 뒤 적용합니다.

### 상태 저장 / State

| 영역 / Domain | 위치 / Location | 비고 / Notes |
| --- | --- | --- |
| 세션 메타데이터 | tmux 서버 | `session-options` 에 저장 |
| 세션 → 브랜치 로그 | `tmux-session-branch-log` 가 기록 | 호스트 로컬 파일 |
| Slack ↔ 세션 매핑 | `slack/tmux-bridge/` 영속 저장소 | `AGENTS.md` 참조 |
| 레이아웃 템플릿 | `layouts/*.yml` | Git 으로 버전 관리 |

---

## Quickstart / 빠른 시작

### 1. 설치 / Install

```bash
# 저장소 클론 후 ~/.tmux 로 심볼릭 링크
git clone <repo-url> ~/.tmux
ln -sfn ~/.tmux/tmux.conf ~/.tmux.conf
# 세션 스캔 대상 편집 (예: ~/work, ~/projects)
$EDITOR ~/.tmux/sessionizer.conf
```

### 2. 로그인 자동 부착 / Auto-attach on login

```bash
# ~/.bashrc 또는 ~/.zshrc 끝에 추가
[ -z "$TMUX" ] && ~/.tmux/bin/tmux-auto-attach
```

### 3. 세션 만들기 / Create a session

```bash
# fzf 픽커
~/.tmux/bin/tmux-sessionizer
# TUI 픽커
~/.tmux/bin/tmux-sessionizer-tui
```

### 4. 레이아웃 적용 / Apply a layout

```bash
~/.tmux/bin/tmux-layout-apply ~/.tmux/layouts/proxmox.yml
```

### 5. (선택) 슬랙 브리지 / Optional Slack bridge

```bash
~/.tmux/bin/tmux-slack-bridge-setup   # 1회: Slack 앱 설정
~/.tmux/bin/tmux-slack-bridge-start   # 매 부팅 또는 tmux 시작 시
```

---

## Configuration / 설정

| 파일 / File | 핵심 변수 / Key variables | 설명 / Description |
| --- | --- | --- |
| `sessionizer.conf` | `SCAN_DIR`, `EXTRA_DIRS` | 세션 픽커가 탐색할 최상위 경로 |
| `tmux.conf` | `prefix`, `set -g ...` | prefix 키, 전역 tmux 옵션, 바인딩 로딩 |
| `layouts/*.yml` | `windows`, `panes`, `commands` | 창·분할 구조와 실행 명령 |
| `slack/tmux-bridge/` 환경변수 | `SLACK_*`, `BRIDGE_MODE` | 소켓 직접 / HTTP 터널 모드 전환 |

> 실제 운영 시 호스트 정보(IP, 도메인 등)는 설정 파일에서 환경변수 또는 플레이스홀더(`<HOST>`, `<USER>`, `<PORT>`)로 관리하세요.

---

## Commands Reference / 명령어 레퍼런스

### 핵심 바인딩 / Core bindings (prefix = `C-a`)

| 키 / Key | 동작 / Action | 호출 스크립트 / Script |
| --- | --- | --- |
| `s` | 세션 선택/생성 (fzf) | `tmux-sessionizer` |
| `S` | 세션 선택/생성 (TUI) | `tmux-sessionizer-tui` |
| `r` | 설정 안전 재로드 | `tmux-config-reload` |
| `Tab` | 마지막 창 토글 | tmux 기본 |
| `h/j/k/l` | 창 prefix-mode 네비게이션 | tmux + 스크립트 |
| `H/L` | 세션 사이클 | `tmux-session-cycle` |
| `?` | 키바인드 치트시트 | `tmux-cheatsheet` |
| `:` | 명령 팔레트 | `tmux-command-palette` |
| `prefix + u` | URL 열기 | `tmux-url-open` |
| `prefix + f` | 파일 열기 | `tmux-file-open` |
| `prefix + y` | 단어 복사 | `tmux-copy-word` |
| `prefix + b` | 클립보드 히스토리 | `tmux-clipboard-history` |

### CLI 헬퍼 / CLI helpers

| 명령 / Command | 용도 / Purpose |
| --- | --- |
| `tmux-layout-apply <yml>` | YAML 레이아웃을 현재 세션에 적용 |
| `tmux-template-create <name>` | 프리셋 템플릿으로 새 세션 생성 |
| `tmux-session-export [name]` | 현재 세션을 YAML 로 내보내기 |
| `tmux-session-dashboard` | fzf 미리보기 포함 세션 대시보드 |
| `tmux-session-kill <name>` | 확인 후 세션 종료 |
| `tmux-session-rename <newname>` | 검증 후 이름 변경 |
| `tmux-ssh-picker` | `~/.ssh/config` 호스트 선택 |
| `tmux-pane-sync` | 동기화-패널 토글 |
| `tmux-git-status` | 브랜치/dirty/ahead/behind 표시 |
| `tmux-git-uncommitted` | 세션별 미커밋 추적 |
| `tmux-sys-stats` | CPU·메모리 (상태바용) |
| `tmux-web-terminal [port]` | ttyd 웹 터미널 실행 |
| `tmux-opencode` | OpenCode 세션 런처 |
| `tmux-notify-long-command` | 장기 명령 종료 시 데스크톱 알림 |

### 슬랙 브리지 / Slack bridge

| 명령 / Command | 용도 / Purpose |
| --- | --- |
| `tmux-slack-bridge-setup` | Slack 앱 토큰/스코프 대화형 설정 |
| `tmux-slack-bridge-start` | 듀얼 모드(소켓 / HTTP cloudflared)로 브리지 실행 |
| `tmux-session-sync` | tmux ↔ Slack 메시지 양방향 동기화 |

---

## Local Development / 로컬 개발

### 코드 스타일 / Code style

| 영역 / Area | 도구 / Tool | 명령 / Command |
| --- | --- | --- |
| Bash 스크립트 | `shellcheck` | `shellcheck bin/* bin/lib/*` |
| YAML 레이아웃 | `yamllint` (선택) | `yamllint layouts/` |
| TypeScript / TUI | Bun + tsconfig | `bun run typecheck` (해당 시) |

### 워크플로 / Workflow

1. 변경 후 `tmux-config-reload` 또는 `tmux source-file tmux.conf` 로 즉시 반영 확인.
2. 새 바인딩을 추가할 때는 `tmux-cheatsheet` 의 카테고리에 맞춰 정렬.
3. YAML 레이아웃을 추가/수정할 때는 `layouts/blacklist.yml` 의 무시 규칙을 함께 검토.
4. TUI 변경은 `tui/sessionizer/__tests__/` 의 단위 테스트를 갱신.

### 외부 의존성 / External dependencies

| 의존 / Dependency | 용도 / Purpose |
| --- | --- |
| `fzf` | 픽커, 히스토리, 명령 팔레트 |
| `tmux` ≥ 3.2 | 핵심 런타임 |
| `Bun` ≥ 1.1 | TUI 세션나이저 런타임 |
| `Node.js` ≥ 18 | 슬랙 브리지 |
| `ttyd` (선택) | 웹 터미널 |
| `cloudflared` (선택) | 슬랙 브리지 HTTP 터널 모드 |
| `Slack` 앱 자격증명 | 슬랙 브리지 인증 |

---

## Testing / 테스트

| 영역 / Area | 명령 / Command | 위치 / Location |
| --- | --- | --- |
| TUI 단위 테스트 | `bun test` | `tui/sessionizer/__tests__/` |
| Bash 스크립트 정적 분석 | `shellcheck bin/* bin/lib/*` | 저장소 루트 |
| 슬랙 브리지 CI | GitLab CI | `.gitlab-ci.yml` |
| 수동 회귀 | `prefix + r` 후 핵심 바인딩 점검 | tmux 세션 |

> 새 동작을 추가할 때는 `tui/sessionizer/__tests__/` 의 `config.test.ts`, `tmux.test.ts` 패턴을 따라 테스트를 함께 작성해 주세요.

---

## Contribution Guide / 기여 가이드

- 시작 전 [`CONTRIBUTING.md`](./CONTRIBUTING.md) 를 반드시 읽어 주세요.
- 코드 변경은 [`AGENTS.md`](./AGENTS.md) 의 디렉터리 의도에 맞춰 배치합니다(예: 세션 관련 → `bin/`, 공유 로직 → `bin/lib/`, 레이아웃 → `layouts/`).
- PR 은 단일 책임(스크립트, 레이아웃, TUI, 브리지 중 하나)을 권장하며, 변경 영향이 큰 경우 `tmux-config-reload` 로의 재로드 영향 여부를 명시해 주세요.
- 새 바인딩/스크립트를 추가하면 `tmux-cheatsheet` 와 본 README 의 명령어 표를 함께 갱신해 주세요.

---

## Maintainers / 유지보수

- 코드 소유자 / Code owners: [`OWNERS`](./OWNERS) 파일 참조
- 질의/이슈: 저장소 이슈 트래커 사용
- 내부 거버넌스/메모: [`docs/`](./docs) 디렉터리

---

## Further Documentation / 추가 문서

| 문서 / Document | 위치 / Location | 주제 / Topic |
| --- | --- | --- |
| 프로젝트 지식 베이스 | [`AGENTS.md`](./AGENTS.md) | 디렉터리 의도, 라인 수, 운영 메모 |
| 기여 가이드 | [`CONTRIBUTING.md`](./CONTRIBUTING.md) | PR/리뷰 정책 |
| TUI 내부 구조 | [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) | Bun/OpenTUI 세션나이저 |
| 슬랙 브리지 모드 | [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) | 소켓 vs HTTP 듀얼 모드 |
| 세션 영속화 | [`docs/session-persistence-brainstorming.md`](./docs/session-persistence-brainstorming.md) | 영속화 설계 아이디어 |
| 거버넌스 | [`docs/supermemory-governance.md`](./docs/supermemory-governance.md) | 메모리·정책 거버넌스 |
| YAML 레이아웃 예시 | [`layouts/default.yml`](./layouts/default.yml), [`layouts/proxmox.yml`](./layouts/proxmox.yml), [`layouts/splunk.yml`](./layouts/splunk.yml) 등 | 레이아웃 스키마 학습 |

---

## License / 라이선스

저장소 [`LICENSE`](./LICENSE) 파일의条款에 따릅니다. See the [`LICENSE`](./LICENSE) file in this repository for the full text.