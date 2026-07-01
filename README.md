# tmux 생산성 도구 모음 / tmux Productivity Suite

> 셸 로그인부터 세션 선택, YAML 레이아웃 적용, Slack 채널 동기화, 상태바/사이드바, Bun/TypeScript TUI 세션나이저까지 한 저장소에 담은 파워 유저용 tmux 환경입니다.
>
> A curated tmux workspace — Bash-first configuration, declarative YAML layouts, a Bun/TypeScript TUI, and a Slack bridge — for developers who juggle many projects, branches, and remote hosts.

[![tmux](https://img.shields.io/badge/tmux-%E2%89%A53.2-1bb91f)](https://github.com/tmux/tmux) [![Bash](https://img.shields.io/badge/Bash-%E2%89%A54-4EAA25)](https://www.gnu.org/software/bash/) [![Bun](https://img.shields.io/badge/Bun-%E2%89%A51.1-f9f1e1)](https://bun.sh) [![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933)](https://nodejs.org) [![License](https://img.shields.io/badge/license-see%20LICENSE-blue)](./LICENSE) [![Status](https://img.shields.io/badge/status-personal%20workstation-success)](#status)

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
| 라이선스 / License | [`LICENSE`](./LICENSE) 참조 / See [`LICENSE`](./LICENSE) |
| 소유자 / Owners | [`OWNERS`](./OWNERS) 참조 / See [`OWNERS`](./OWNERS) |
| 기여 가이드 / Contribution | [`CONTRIBUTING.md`](./CONTRIBUTING.md) 참조 / See [`CONTRIBUTING.md`](./CONTRIBUTING.md) |

## 핵심 흐름 / Core Flow

1. 셸 로그인 시 `tmux-auto-attach`가 기존 tmux 서버에 자동 연결하거나 새 서버를 시작합니다.
2. `prefix + s`(fzf 세션나이저) 또는 `prefix + S`(Bun TUI 세션나이저)로 세션을 선택하거나 새로 만듭니다.
3. 필요하면 `tmux-layout-apply`로 `layouts/*.yml` 템플릿을 현재 세션에 즉시 적용합니다.
4. `tmux-slack-bridge-start`로 브리지를 띄우면 세션 이름과 Slack 채널이 양방향으로 동기화됩니다.
5. `tmux-sidebar-toggle`, `tmux-command-palette`, `tmux-cheatsheet`로 일상 작업을 키스트로크만으로 수행합니다.

---

## 목적 / Purpose

이 저장소는 **여러 프로젝트·브랜치·원격 호스트를 동시에 다루는 tmux 파워 유저**를 위한 환경입니다. 단순한 `tmux.conf` 공유를 넘어, 다음을 한 곳에서 제공합니다.

- **선언적 구성**: 윈도우/패널 템플릿을 YAML로 정의하고 세션에 즉시 적용.
- **세션 워크플로**: 자동 연결, 빠른 선택, MRU 정렬, 순환, 이름 변경, 안전한 종료, 대시보드.
- **세션↔Slack 양방향 동기화**: tmux 세션을 Slack 채널로 미러링해 팀 협업과 개인 작업을 잇는 단일 표면 제공.
- **데스크톱 통합**: Git 상태, 시스템 통계, 알림, URL/파일 추출, SSH 선택, 웹 터미널, OpenCode 런처.
- **TUI 보조 환경**: fzf 기반 미니멀 도구 모음과 Bun/React/OpenTUI 풀스크린 세션나이저를 양다리 지원.

A curated, opinionated tmux workspace that goes beyond a single dotfile: declarative YAML layouts, a session↔Slack bridge, a Bun/TypeScript TUI sessionizer, and 30+ Bash companions designed for power users who juggle many projects, branches, and remote hosts.

---

## 패키지 구성 / Package Contents

| 경로 / Path | 역할 / Role |
| --- | --- |
| [`tmux.conf`](./tmux.conf) | 루트 로더. `bin/`을 PATH에 추가하고 prefix·바인딩·환경 변수를 정의합니다. |
| [`sessionizer.conf`](./sessionizer.conf) | 세션 탐색용 `SCAN_DIR`과 `EXTRA_DIRS`를 정의합니다. |
| [`bin/`](./bin/) | 37개의 보조 도구(Bash 실행 표면): 세션, 사이드바, 상태바, 명령 팔레트, Git, 알림 등. |
| [`bin/lib/`](./bin/) | 공유 라이브러리: 사이드바 색상·렌더링, 세션나이저 공통 로직, 생성 마법사. |
| [`layouts/`](./layouts/) | 사전 정의된 YAML 레이아웃 템플릿 7종(Proxmox, Splunk, SafeWork, resume 등). |
| [`tui/sessionizer/`](./tui/sessionizer/) | Bun + React/OpenTUI 풀스크린 세션 선택기 + 단위 테스트. |
| [`slack/tmux-bridge/`](./slack/tmux-bridge/) | tmux 세션 ↔ Slack 채널 동기화 Node.js 서비스. |
| [`docs/`](./docs/) | 설계 노트: 세션 영속화 브레인스토밍, supermemory 거버넌스. |
| [`AGENTS.md`](./AGENTS.md) | 저장소 구조·규약에 대한 메타 문서. |

---

## 기능 / Features

### 세션 관리 / Session Management
- 자동 연결(`tmux-auto-attach`), fzf 기반 세션 선택(`tmux-sessionizer`), Bun TUI 선택기(`tmux-sessionizer-tui`).
- MRU 정렬, 순환, 점프, 안전한 종료, 이름 변경, 대시보드, 이름 기반 아이콘 매핑.
- YAML 템플릿으로 빠른 시작(`tmux-template-create`), 세션→브랜치 로그(`tmux-session-branch-log`).

### 사이드바 & 상태바 / Sidebar & Status
- 트리형 사이드바(`tmux-sidebar`, `tmux-sidebar-init`, `tmux-sidebar-toggle`).
- 너비 적응형 상태바(`tmux-responsive`), CPU/MEM 통계(`tmux-sys-stats`).

### 창·패널 / Windows & Panes
- YAML 레이아웃 적용(`tmux-layout-apply`), 동기화 토글(`tmux-pane-sync`).
- 스마트 단어 복사(`tmux-copy-word`), 버퍼 히스토리 브라우저(`tmux-clipboard-history`).

### Git 연동 / Git Integration
- 브랜치 + dirty/ahead/behind/stash 상태(`tmux-git-status`).
- 세션별 미커밋 변경 추적(`tmux-git-uncommitted`).

### 명령 팔레트 & 발견성 / Command Palette & Discoverability
- fzf 액션 선택기(`tmux-command-palette`), 카테고리별 키바인딩 치트시트(`tmux-cheatsheet`).
- 설정 리로드 + 변경 사항 diff(`tmux-config-reload`).

### 외부 시스템 연동 / External Integration
- 패널에서 URL/파일 추출(`tmux-url-open`, `tmux-file-open`), SSH 선택기(`tmux-ssh-picker`).
- ttyd 기반 웹 터미널(`tmux-web-terminal`), OpenCode 세션 런처(`tmux-opencode`).
- Slack 브리지(`tmux-slack-bridge-setup`, `tmux-slack-bridge-start`, `bin/tmux-session-sync`).
- 장시간 명령 알림(`tmux-notify-long-command`).

### 셸 통합 / Shell Integration
- `tmux-bash-preexec` 소스로 명령 시작/종료 시각을 tmux 환경 변수로 노출.

---

## 아키텍처 / Architecture

| 계층 / Layer | 구성요소 / Component | 역할 / Role |
| --- | --- | --- |
| 셸 진입 / Shell entry | `tmux-auto-attach` | 로그인 시 기존 tmux 서버에 연결 또는 신규 시작. |
| tmux 로더 / Loader | `tmux.conf` | `bin/`을 PATH에 노출하고 prefix·바인딩·환경 변수 정의. |
| 설정 / Configuration | `sessionizer.conf`, `layouts/*.yml` | 세션 탐색 경로, 창/패널 템플릿 선언. |
| 코어 도구 / Core tools | `bin/tmux-*` (Bash) | 세션·사이드바·상태바·명령 팔레트 등 보조 표면. |
| 공유 라이브러리 / Shared libs | `bin/lib/*` | 색상·렌더링·세션나이저 공통·마법사 로직 재사용. |
| TUI | `tui/sessionizer/` | Bun + React/OpenTUI 풀스크린 세션 선택기. |
| 브리지 / Bridge | `slack/tmux-bridge/` | tmux 세션 ↔ Slack 채널 양방향 동기화 서비스. |
| 외부 호출 / External calls | fzf, gh, git, ssh, ttyd, OpenCode, Slack API | 도구 체인. |

### 요청 흐름 / Request Flow

1. 사용자가 로그인하면 셸이 `tmux-auto-attach`를 통해 tmux 서버에 진입합니다.
2. tmux는 `tmux.conf`를 로드해 prefix 바인딩과 환경 변수를 설정합니다.
3. 사용자가 `prefix + s`를 누르면 `tmux-sessionizer`가 `sessionizer.conf`의 경로를 스캔해 세션 목록을 fzf로 제시합니다.
4. 새 세션을 만들면 `tmux-sidebar-init`가 사이드바를 초기화하고, 필요 시 `tmux-layout-apply`가 `layouts/*.yml`을 적용합니다.
5. `prefix + S`로 진입한 TUI 세션나이저(`tui/sessionizer/`)는 Bun 런타임 위에서 동일한 흐름을 풀스크린 UI로 제공합니다.
6. `tmux-slack-bridge-start`가 떠 있으면 세션 이름 변경·생성·종료 이벤트가 `slack/tmux-bridge/`로 전달되어 Slack 채널에 반영됩니다.

---

## 빠른 시작 / Quick Start

### 1. 의존성 설치 / Install dependencies

```sh
# 필수: tmux, Bash, fzf, git
# macOS
brew install tmux fzf git
# Debian/Ubuntu
sudo apt-get install -y tmux fzf git
```

### 2. 저장소를 `~/.tmux`으로 연결 / Symlink the repo as `~/.tmux`

```sh
git clone <repo-url> ~/.tmux
ln -sfn ~/.tmux/tmux.conf ~/.tmux.conf
```

### 3. `sessionizer.conf` 작성 / Author `sessionizer.conf`

```sh
cat > ~/.tmux/sessionizer.conf <<'EOF'
SCAN_DIR="$HOME/src"
EXTRA_DIRS=("$HOME/work" "$HOME/scratch")
EOF
```

### 4. tmux 진입 / Launch tmux

```sh
tmux
# 또는 새 셸에서 자동으로 기존/신규 세션에 연결
exec ~/.tmux/bin/tmux-auto-attach
```

### 5. (선택) TUI 세션나이저 의존성 설치 / Optional: TUI sessionizer deps

```sh
cd ~/.tmux/tui/sessionizer
bun install
```

### 6. (선택) Slack 브리지 설정 / Optional: Slack bridge setup

```sh
~/.tmux/bin/tmux-slack-bridge-setup   # 인터랙티브 마법사
~/.tmux/bin/tmux-slack-bridge-start   # 브리지 기동
```

---

## 설정 / Configuration

| 파일 / File | 핵심 변수·구조 / Key | 설명 / Description |
| --- | --- | --- |
| [`tmux.conf`](./tmux.conf) | `prefix`, 키 바인딩 | 루트 로더. 환경 변수와 PATH, prefix(`C-a`)를 정의합니다. |
| [`sessionizer.conf`](./sessionizer.conf) | `SCAN_DIR`, `EXTRA_DIRS` | 세션나이저가 스캔할 최상위 경로. |
| [`layouts/default.yml`](./layouts/default.yml) | `windows[].panes[]` | 기본 단일 창 레이아웃. 다른 템플릿의 시작점. |
| [`layouts/proxmox.yml`](./layouts/proxmox.yml) | `windows[].panes[]` | Proxmox 운영 콘솔용 다중 창 템플릿. |
| [`layouts/splunk.yml`](./layouts/splunk.yml) | `windows[].panes[]` | Splunk 검색·로그 워크플로용. |
| [`layouts/safework.yml`](./layouts/safework.yml) / `safework2.yml` | `windows[].panes[]` | 안전 작업 템플릿 두 종류. |
| [`layouts/resume.yml`](./layouts/resume.yml) | `windows[].panes[]` | 이력서/문서 작업용 단일 창. |
| [`layouts/blacklist.yml`](./layouts/blacklist.yml) | `windows[].panes[]` | 차단된 워크플로 또는 테스트용. |

세션나이저는 `sessionizer.conf`의 `SCAN_DIR`을 재귀 스캔하고 `EXTRA_DIRS`를 추가 후보로 사용합니다. 디렉터리명이 곧 세션 이름이 됩니다.

---

## 명령어 레퍼런스 / Commands Reference

### 세션 / Sessions

| 명령 / Command | 단축키 / Key | 설명 / Description |
| --- | --- | --- |
| `tmux-auto-attach` | (login hook) | 로그인 시 tmux 서버에 자동 연결. |
| `tmux-sessionizer` | `prefix + s` | fzf 기반 세션 선택·생성 마법사. |
| `tmux-sessionizer-tui` | `prefix + S` | Bun TUI 풀스크린 세션 선택기. |
| `tmux-session-cycle` | `prefix + PgUp/PgDn` | 최근 활성 세션 순환(OpenCode 세션 제외). |
| `tmux-session-jump` | `prefix + j` | MRU 기반 fzf 세션 점프. |
| `tmux-session-kill` | `prefix + X` | 확인 후 세션 안전 종료. |
| `tmux-session-rename` | `prefix + r` | 세션 이름 변경 + 유효성 검사. |
| `tmux-session-order` | — | 세션을 최근 활성 순으로 정렬. |
| `tmux-session-dashboard` | `prefix + D` | 포맷팅된 세션 테이블 팝업. |
| `tmux-session-export` | — | 현재 세션 레이아웃을 YAML로 내보내기. |
| `tmux-session-icon` | — | Nerd Font 아이콘 매핑. |
| `tmux-session-branch-log` | — | 세션→브랜치 전환 로그 기록. |
| `tmux-session-sync` | — | tmux 세션을 Slack 채널과 동기화. |
| `tmux-template-create` | — | 프리셋 템플릿으로 세션 빠른 생성. |

### 사이드바 / Sidebar

| 명령 / Command | 단축키 / Key | 설명 / Description |
| --- | --- | --- |
| `tmux-sidebar` | — | 트리 사이드바 렌더링 엔진. |
| `tmux-sidebar-init` | — | 세션 생성 시 사이드바 초기화. |
| `tmux-sidebar-toggle` | `prefix + b` | 사이드바 가시성 토글. |

### 레이아웃 / Layouts & Status

| 명령 / Command | 단축키 / Key | 설명 / Description |
| --- | --- | --- |
| `tmux-layout-apply` | `prefix + L` | `layouts/*.yml`을 현재 세션에 적용. |
| `tmux-responsive` | — | 너비 등급별 상태바 렌더링. |
| `tmux-sys-stats` | — | CPU load + MEM 사용량을 상태바에 노출. |

### 창·패널 / Panes

| 명령 / Command | 단축키 / Key | 설명 / Description |
| --- | --- | --- |
| `tmux-pane-sync` | `prefix + y` | 동기화-패널 토글. |
| `tmux-copy-word` | — | 커서 아래 단어 스마트 복사. |
| `tmux-clipboard-history` | `prefix + h` | tmux 버퍼 링 fzf 브라우저. |

### Git / Git

| 명령 / Command | 단축키 / Key | 설명 / Description |
| --- | --- | --- |
| `tmux-git-status` | — | 브랜치 + dirty/ahead/behind/stash 상태. |
| `tmux-git-uncommitted` | — | 세션별 미커밋 변경 추적. |

### 명령 팔레트 / Command Palette

| 명령 / Command | 단축키 / Key | 설명 / Description |
| --- | --- | --- |
| `tmux-command-palette` | `prefix + Space` | fzf 액션 선택기. |
| `tmux-cheatsheet` | `prefix + ?` | 카테고리별 키바인딩 치트시트 팝업. |
| `tmux-config-reload` | `prefix + R` | 설정 리로드 + 변경 diff. |

### 연동 / Integration

| 명령 / Command | 단축키 / Key | 설명 / Description |
| --- | --- | --- |
| `tmux-url-open` | `prefix + u` | 패널에서 URL 추출 후 fzf. |
| `tmux-file-open` | `prefix + f` | 패널에서 파일 경로 추출 후 fzf. |
| `tmux-ssh-picker` | — | `~/.ssh/config` 호스트 선택기. |
| `tmux-web-terminal` | — | ttyd 웹 터미널 런처. |
| `tmux-opencode` | — | OpenCode 세션 런처. |
| `tmux-slack-bridge-setup` | — | Slack 앱 인터랙티브 설정 마법사. |
| `tmux-slack-bridge-start` | — | 브리지 기동(소켓 직접 / cloudflared HTTP 듀얼 모드). |
| `tmux-notify-long-command` | — | 장시간 명령 데스크톱 알림. |

### 셸 / Shell

| 명령 / Command | 단축키 / Key | 설명 / Description |
| --- | --- | --- |
| `tmux-bash-preexec` | — | 셸에서 source. 명령 시작·종료 시각을 tmux 환경 변수로 전달. |

---

## TUI 세션나이저 / TUI Sessionizer

[`tui/sessionizer/`](./tui/sessionizer/)는 Bun + React/OpenTUI 기반의 풀스크린 세션 선택기입니다.

| 항목 / Item | 값 / Value |
| --- | --- |
| 런타임 / Runtime | Bun ≥ 1.1 |
| 진입점 / Entry | `tui/sessionizer/src/index.tsx` |
| 컴포넌트 / Components | `App.tsx`, `session-list.tsx`, `filter-input.tsx`, `preview-panel.tsx`, `create-wizard.tsx`, `rename-dialog.tsx`, `kill-confirm-dialog.tsx` |
| 마법사 단계 / Wizard steps | `wizard-step-dir.tsx`, `wizard-step-name.tsx`, `wizard-step-layout.tsx` |
| 핵심 액션 / Actions | `session-actions.ts` |
| 훅 / Hooks | `use-keyboard-handler.ts` |
| 상태 / State | `state.ts`, `lib/tmux.ts`, `lib/config.ts`, `lib/dirs.ts`, `lib/create-session.ts`, `lib/theme.ts` |
| 테스트 / Tests | [`tui/sessionizer/__tests__/`](./tui/sessionizer/__tests__/) (config, tmux) |

TUI를 띄우려면:

```sh
cd ~/.tmux/tui/sessionizer
bun install
~/.tmux/bin/tmux-sessionizer-tui
```

---

## Slack 브리지 / Slack Bridge

[`slack/tmux-bridge/`](./slack/tmux-bridge/)는 tmux 세션과 Slack 채널을 양방향으로 동기화합니다.

| 항목 / Item | 값 / Value |
| --- | --- |
| 런타임 / Runtime | Node.js ≥ 18 |
| 운영 모드 / Modes | tmux 소켓 직접 모드, cloudflared HTTP 모드 |
| 시작 스크립트 / Launcher | `bin/tmux-slack-bridge-start` |
| 설정 마법사 / Setup wizard | `bin/tmux-slack-bridge-setup` |
| 보조 / Companion | `bin/tmux-session-sync` (이벤트 → Slack 전달) |

기동 절차:

```sh
~/.tmux/bin/tmux-slack-bridge-setup    # Slack 앱 토큰·채널 매핑 구성
~/.tmux/bin/tmux-slack-bridge-start    # 브리지 프로세스 시작
```

세션을 만들거나 이름을 바꾸면 자동으로 Slack 채널이 생성·갱신되며, 반대로 Slack에서 채널을 닫으면 tmux 세션도 정리됩니다.

---

## 로컬 개발 / Local Development

### 일반 워크플로 / General workflow

1. 저장소를 작업 트리에 체크아웃합니다.
2. `tmux.conf`를 로컬 경로 기준으로 검토합니다(필요 시 `~/.tmux.conf` 심볼릭 링크 재지정).
3. 새 도구를 추가할 때는 `bin/<name>` 패턴을 유지하고, 재사용 로직은 `bin/lib/`로 분리합니다.
4. 변경 후 `prefix + R`(`tmux-config-reload`)로 즉시 검증합니다.

### TUI 변경 / TUI changes

```sh
cd tui/sessionizer
bun install
bun run dev   # 로컬 개발 모드(정의된 스크립트가 있다면)
```

### Slack 브리지 변경 / Slack bridge changes

```sh
cd slack/tmux-bridge
npm install
npm test      # 테스트가 정의되어 있다면
```

### 코드 스타일 / Code style

- Bash 스크립트는 `set -euo pipefail`을 사용하고 들여쓰기는 2 스페이스를 기본으로 합니다.
- 신규 도구는 도움말(`-h` 또는 `--help`)과 단일 목적을 갖도록 작성합니다.

---

## 테스트 / Testing

| 대상 / Target | 명령 / Command |
| --- | --- |
| TUI 세션나이저 / TUI sessionizer | `cd tui/sessionizer && bun test` |
| TUI 환경 / TUI env | [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) 참조 |
| Slack 브리지 / Slack bridge | `slack/tmux-bridge/` 내부 CI/스크립트 확인 |
| 셸 도구 / Bash tools | 수동 시나리오 + `shellcheck bin/tmux-*` 권장 |

TUI는 [`tui/sessionizer/__tests__/`](./tui/sessionizer/__tests__/)에 단위 테스트를 포함하며, `config.test.ts`와 `tmux.test.ts`로 세션 데이터 모델과 tmux 상호작용을 검증합니다.

---

## 운영 관측 가능성 / Operations & Observability

| 표면 / Surface | 도구 / Tool | 노출 위치 / Where to look |
| --- | --- | --- |
| 상태바 / Statusbar | `tmux-responsive`, `tmux-sys-stats`, `tmux-git-status` | tmux 상태줄 우측. |
| 사이드바 / Sidebar | `tmux-sidebar`, `tmux-sidebar-toggle` | 세션 좌측 트리. |
| 알림 / Notifications | `tmux-notify-long-command` | 데스크톱 알림 데몬. |
| 세션 감사 / Session audit | `tmux-session-branch-log`, `tmux-session-dashboard` | 로그 파일, 팝업 테이블. |
| 브리지 이벤트 / Bridge events | `slack/tmux-bridge/` 로그 | 브리지 stdout/stderr. |

---

## 기여 / Contributing

기여 절차와 규약은 [`CONTRIBUTING.md`](./CONTRIBUTING.md)를 따릅니다. PR 전 다음을 권장합니다.

- 셸 스크립트는 `shellcheck`로 정적 분석.
- TUI 변경 시 `bun test` 통과 + 단위 테스트 추가.
- Slack 브리지 변경 시 로컬 듀얼 모드(소켓 / HTTP)로 동작 검증.
- 키 바인딩 추가 시 [`bin/tmux-cheatsheet`](./bin/tmux-cheatsheet) 카테고리 갱신.

저장소 구조와 컨벤션의 메타 문서는 [`AGENTS.md`](./AGENTS.md)를 참조하세요.

---

## 유지보수 / Maintainers

담당자와 역할은 [`OWNERS`](./OWNERS) 파일을 참조하세요. 변경 요청이나 권한 관련 문의는 이 문서의 연락처를 우선합니다.

---

## 라이선스 / License

[`LICENSE`](./LICENSE) 파일을 참조하세요. 본문에서 별도 명시가 없는 한 저장소 전체에 적용됩니다.

---

## 추가 문서 / Further Documentation

| 문서 / Document | 설명 / Description |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | 저장소 구조·규약의 메타 문서. |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | 기여 절차와 PR 규약. |
| [`OWNERS`](./OWNERS) | 담당자 목록. |
| [`docs/session-persistence-brainstorming.md`](./docs/session-persistence-brainstorming.md) | 세션 영속화 설계 노트. |
| [`docs/supermemory-governance.md`](./docs/supermemory-governance.md) | supermemory 거버넌스 문서. |
| [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) | TUI 서브프로젝트 규약. |
| [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) | Slack 브리지 서브프로젝트 규약. |

---

## 상태 / Status

본 저장소는 **개인 워크스테이션 환경**을 1차 대상으로 운영됩니다. 기능 추가와 제거가 활발하며, `OWNERS`에 명시되지 않은 외부 환경에 그대로 가져다 쓰기 전 [`AGENTS.md`](./AGENTS.md)와 [`CONTRIBUTING.md`](./CONTRIBUTING.md)를 검토하시기 바랍니다.

This repository is actively maintained for a personal workstation workflow. Expect breaking changes; review [`AGENTS.md`](./AGENTS.md) and [`CONTRIBUTING.md`](./CONTRIBUTING.md) before adopting externally.