# tmux-workspace

![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS-1f6feb)
![Shell](https://img.shields.io/badge/shell-bash%205%2B-4EAA25)
![Runtime](https://img.shields.io/badge/runtime-Bun%20%7C%20Node%2020-000?logo=bun)
![tmux](https://img.shields.io/badge/tmux-3.3%2B-1BB91F)
[![License](https://img.shields.io/badge/license-MIT-blue)](#LICENSE)
[![Tests](https://img.shields.io/badge/tests-bats%20%7C%20vitest-success)](#tests)

## 한 줄 요약

`tmux.conf` 를 단일 진입점으로 삼아 세션·사이드바·상태바를 모듈식으로 관리하는 tmux 워크스페이스. 같은 저장소에 Bun 기반 TUI 세션나이저와 Node.js Slack 브릿지가 함께 들어 있고, systemd 로 상시 실행됩니다.

## 빠른 참조

| 항목 | 값 |
| --- | --- |
| 소유자 | `OWNERS` 파일 참조 |
| 라이선스 | `LICENSE` (MIT) |
| 진입점 (tmux) | `~/.tmux.conf` → `tmux.conf` |
| 진입점 (TUI) | `tui/sessionizer` (`bun run`) |
| 진입점 (Slack) | `slack/tmux-bridge` (`npm start`) |
| 자동 시작 | `systemd/tmux-*.service`, `systemd/tmux-session-watch.path` |
| 테스트 | `tests/*.bats`, `tui/sessionizer/__tests__/*.test.ts` |
| 상태 | 개인 워크스페이스, 안정 운영 중 |

## 실행 흐름 요약

1. 셸 로그인 시 `tmux-auto-attach` 가 기존 서버에 attach 하거나 신규 서버를 띄움.
2. `tmux.conf` 가 `conf.d/*.conf` 를 00 → 90 순서로 소싱해 키 (`prefix = C-a`), 테마, 사이드바, 상태바, 플러그인을 적용.
3. 사용자는 `prefix + s` (세션 점프), `prefix + S` (TUI 세션나이저), `prefix + b` (사이드바 토글)로 탐색.
4. `tmux-session-watch.path` 가 세션 변경을 감지해 `tmux-session-sync` 로 Slack 채널과 동기화하고, `tmux-resurrect-save` 가 정기적으로 상태를 저장.
5. `tui/sessionizer` 는 같은 디렉터리 (`sessionizer.conf`)를 읽어 TUI 에서 세션을 생성·삭제·이름 변경.
6. `slack/tmux-bridge` 는 채널 메시지를 tmux pane 으로 전달하고 pane 출력을 슬랙으로 푸시.

## 목차

- [목적과 사용자](#목적과-사용자)
- [저장소 구성](#저장소-구성)
- [상태와 지원 범위](#상태와-지원-범위)
- [먼저 읽을 파일](#먼저-읽을-파일)
- [API 및 진입점](#api-및-진입점)
- [빠른 시작](#빠른-시작)
- [아키텍처](#아키텍처)
- [설정 참조](#설정-참조)
- [명령어 참조](#명령어-참조)
- [로컬 개발](#로컬-개발)
- [테스트](#테스트)
- [기여 가이드](#기여-가이드)
- [유지보수 및 연락처](#유지보수-및-연락처)
- [추가 문서](#추가-문서)
- [English summary](#english-summary)
- [라이선스](#라이선스)

## 목적과 사용자

- **목적**: 분산된 tmux 설정을 모듈식으로 재구성하고, 세션 검색·생성·동기화·복구를 하나의 워크플로로 묶음.
- **대상 사용자**:
  - 다수의 장기 세션을 tmux 위에서 운영하는 개발자·운영자.
  - 세션 상태를 Slack 이나 외부 채널과 동기화해야 하는 팀.
  - YAML 레이아웃 프리셋 (`layouts/*.yml`) 으로 재현 가능한 작업환경을 만들고 싶은 사용자.
- **비대상**: 일반 사용자를 위한 tmux 튜토리얼, 단일 세션용 미니멀 설정.

## 저장소 구성

| 경로 | 역할 |
| --- | --- |
| `tmux.conf` | 루트 로더. `conf.d/*.conf` 와 `sessionizer.conf` 를 소싱. |
| `sessionizer.conf` | TUI 세션나이저가 읽는 디렉터리·제외 패턴·환경 변수. |
| `conf.d/` | 00 → 90 순서로 로딩되는 모듈식 설정 (core, theme, keys, sidebar, statusbar, plugins). |
| `layouts/` | 세션 템플릿 (`default`, `proxmox`, `splunk`, `safework`, `resume` 등) 과 `blacklist.yml`. |
| `bin/` | 세션·사이드바·상태바·Slack 동기화·URL 열기·SSH 선택 등 30여 개의 bash 스크립트. |
| `bin/lib/` | `tmux-sessionizer-common`, `tmux-sessionizer-wizard`, `sidebar-render` 등 공유 라이브러리. |
| `tui/sessionizer/` | Bun + React + OpenTUI 기반 세션 TUI. `__tests__` 포함. |
| `slack/tmux-bridge/` | Node.js + TypeScript Slack ↔ tmux 브릿지. vitest 설정 포함. |
| `systemd/` | 사용자 단위 서비스: resurrect, slack-bridge, session-watch, web-terminal, server. |
| `tests/` | bats 시나리오 (`git-status`, `session-icon`, `session-order`, `sys-stats`). |
| `docs/` | 세션 영속화 브레인스토밍, supermemory 거버넌스 노트. |
| `data/` | 영속 데이터 (예: `in-memoria.db`). |
| `OWNERS`, `CONTRIBUTING.md`, `LICENSE` | 메타데이터. |

## 상태와 지원 범위

- **운영 단계**: 안정 (stable). 개인 워크스페이스 용도로 일상 운영 중.
- **지원 플랫폼**: Linux (systemd 환경), macOS (systemd 미사용).
- **지원 tmux 버전**: 3.3 이상.
- **테스트 상태**:
  - bats: `tests/*.bats` 4 종.
  - vitest: `slack/tmux-bridge`.
  - bun test: `tui/sessionizer/__tests__/*.test.ts`.
- **보안 알림**: 외부에서 받은 YAML (`layouts/*.yml`) 적용 전 `blacklist.yml` 으로 차단 패턴을 확인.

## 먼저 읽을 파일

1. `AGENTS.md` — 프로젝트 지식 베이스와 구조 요약.
2. `tmux.conf` — 진입점과 모듈 로딩 순서.
3. `conf.d/00-core.conf` — 터미널·성능·환경 변수 베이스라인.
4. `conf.d/20-keys.conf` — `prefix = C-a` 기반 키맵.
5. `sessionizer.conf` — TUI 세션나이저의 스캔 디렉터리.
6. `docs/session-persistence-brainstorming.md` — 영속화 설계 메모.
7. `slack/tmux-bridge/SETUP.md` — Slack 앱 연동 절차.

## API 및 진입점

| 표면 | 진입점 | 호출 예시 |
| --- | --- | --- |
| tmux 환경 | `~/.tmux.conf` → `tmux.conf` | `tmux new-session -A -s main` |
| 세션 점프 | `bin/tmux-session-jump` | `<prefix> s` |
| TUI 세션나이저 | `bin/tmux-sessionizer-tui` | `<prefix> S` |
| 슬랙 동기화 | `bin/tmux-session-sync` | systemd 타이머 또는 수동 실행 |
| 슬랙 브릿지 데몬 | `slack/tmux-bridge/src/index.ts` | `npm start` |
| 웹 터미널 | `systemd/tmux-web-terminal.service` | `ttyd` 기반 |
| 영속화 저장 | `systemd/tmux-resurrect-save.service` | 15 분 주기 |

## 빠른 시작

### 1. 설치 (심볼릭 링크)

```bash
git clone <repository-url> ~/src/tmux-workspace
ln -sfn ~/src/tmux-workspace/tmux.conf ~/.tmux.conf
ln -sfn ~/src/tmux-workspace ~/.tmux   # 일부 스크립트가 ~/.tmux 를 가정
```

### 2. 필수 도구 확인

```bash
tmux -V          # 3.3 이상
bash --version   # 5 이상
fzf --version    # 선택, 점퍼/팔레트 사용
bun --version    # 선택, TUI 사용
node --version   # 20 이상, Slack 브릿지 사용
bats --version   # 선택, 테스트 실행
```

### 3. 첫 실행

```bash
tmux new-session -A -s main
# 또는: bin/tmux-auto-attach
```

기본 prefix 는 `C-a` 입니다. `prefix + ?` 로 `tmux-cheatsheet` 를 띄울 수 있습니다.

### 4. Slack 브릿지 활성화 (선택)

```bash
cd slack/tmux-bridge
npm install
npm run setup    # tmux-slack-bridge-setup 와 동일
npm start        # 또는 systemd 로 등록
```

자세한 절차는 `slack/tmux-bridge/SETUP.md` 를 따르세요.

### 5. systemd 등록 (선택)

```bash
mkdir -p ~/.config/systemd/user
ln -sfn "$PWD/systemd"/* ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now tmux-session-watch.path tmux-resurrect-save.timer
```

## 아키텍처

### 모듈 로딩 순서

| 단계 | 파일 | 책임 |
| --- | --- | --- |
| 1 | `tmux.conf` | 버전 가드, 디렉터리 변수, `conf.d/*.conf` 소싱. |
| 2 | `conf.d/00-core.conf` | 터미널, 마우스, focus events, `SSH_AUTH_SOCK` 등 환경. |
| 3 | `conf.d/10-theme.conf` | Tokyo Night 팔레트, pane border status. |
| 4 | `conf.d/20-keys.conf` | `prefix = C-a`, 모든 사용자 키맵. |
| 5 | `conf.d/25-sidebar.conf` | `tmux-sidebar` 트리 렌더링. |
| 6 | `conf.d/30-statusbar.conf` | `tmux-responsive` 폭 단계형 statusline. |
| 7 | `conf.d/90-plugins.conf` | TPM, tmux-resurrect, yank, continuum 등. |

### 세션 라이프사이클

1. **탐색** — `tmux-sessionizer` (`fzf`) 또는 TUI (`tui/sessionizer`) 가 `SCAN_DIR` / `EXTRA_DIRS` 를 따라 디렉터리 후보를 수집.
2. **생성** — `tmux-sessionizer-wizard` 가 이름·레이아웃을 검증하고 `bin/tmux-template-create` / `tmux-layout-apply` 로 프리셋 적용.
3. **운영** — 사이드바 (`tmux-sidebar`) 가 분 단위로 트리 갱신, 상태바 (`tmux-responsive`) 가 git/sys 통계 노출.
4. **동기화** — `tmux-session-sync` 가 세션 ↔ Slack 채널 매핑 유지. 브릿지는 pane ↔ 채널 메시지 릴레이.
5. **보존** — `tmux-resurrect-save` 가 15 분마다 상태 저장, `tmux-resurrect-restore` 가 재시작 시 복구.
6. **종료** — `tmux-session-kill` 가 의존 세션과 pane 까지 확인 후 종료.

### 데이터 흐름

| 단계 | 발신 | 수신 | 채널 |
| --- | --- | --- | --- |
| 1 | 사용자 키 입력 | tmux server | `~/.tmux/<socket>` |
| 2 | tmux server | `tmux-session-watch.service` | tmux control mode (`-C`) |
| 3 | watcher | `tmux-session-sync` | Slack Web API (chat list, message) |
| 4 | Slack 채널 메시지 | `tmux-bridge` | tmux `send-keys` |
| 5 | tmux pane 출력 | `tmux-bridge` | Slack 메시지 (스레드 reply) |

## 설정 참조

### `tmux.conf` 핵심 변수

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `TMUX_CONF_DIR` | `~/.tmux` | conf.d 와 bin 의 루트. |
| `TMUX_BIN_DIR` | `$TMUX_CONF_DIR/bin` | 스크립트 경로. |
| `SCAN_DIR` | `sessionizer.conf` 참조 | 세션 후보 1차 스캔 루트. |
| `EXTRA_DIRS` | `sessionizer.conf` 참조 | 스캔 보강 디렉터리. |

### `sessionizer.conf`

| 키 | 의미 |
| --- | --- |
| `SCAN_DIR` | 작업 트리 루트 (보통 `~/work`, `~/projects`). |
| `EXTRA_DIRS` | 추가 탐색 디렉터리. |
| `EXCLUDE_PATTERNS` | 점프에서 제외할 glob 패턴. |
| `MAX_DEPTH` | 재귀 깊이 제한. |
| `LAYOUTS_DIR` | `layouts/` 경로 오버라이드. |

### `layouts/*.yml`

| 키 | 의미 |
| --- | --- |
| `name` | 세션 식별자. |
| `root` | 작업 디렉터리. |
| `windows` | 윈도우 정의 배열. |
| `panes` | 윈도우별 pane 트리. |
| `commands` | 시작 시 실행할 명령. |
| `env` | 세션 전용 환경 변수. |

자세한 스키마는 `layouts/default.yml` 을 참고하세요. 위험한 명령은 `blacklist.yml` 에서 차단됩니다.

## 명령어 참조

### 핵심 단축키 (`prefix = C-a`)

| 키 | 동작 | 스크립트 |
| --- | --- | --- |
| `s` | fzf MRU 세션 점프 | `tmux-session-jump` |
| `S` | TUI 세션나이저 | `tmux-sessionizer-tui` |
| `b` | 사이드바 토글 | `tmux-sidebar-toggle` |
| `c` | 신규 윈도우 + 디렉터리 선택 | `tmux-sessionizer` |
| `K` | 세션 종료 (확인) | `tmux-session-kill` |
| `R` | 세션 이름 변경 | `tmux-session-rename` |
| `J` / `K` | 세션 순환 (opencode 제외) | `tmux-session-cycle` |
| `\` | 명령 팔레트 | `tmux-command-palette` |
| `?` | 키바인딩 치트시트 | `tmux-cheatsheet` |
| `r` | 설정 리로드 + diff | `tmux-config-reload` |
| `y` | URL 추출 | `tmux-url-open` |
| `f` | 파일 경로 추출 | `tmux-file-open` |
| `h` | SSH 호스트 선택 | `tmux-ssh-picker` |
| `g` | git 상태 | `tmux-git-status` |
| `G` | uncommitted 변경 트래킹 | `tmux-git-uncommitted` |

### 상태바 토큰

| 토큰 | 출력 | 스크립트 |
| --- | --- | --- |
| `#{sys_stats}` | CPU load + MEM | `tmux-sys-stats` |
| `#{git_status}` | 브랜치 + dirty/ahead/behind | `tmux-git-status` |
| `#{session_icon}` | Nerd Font 아이콘 | `tmux-session-icon` |
| `#{session_order}` | 최근 활동 순 정렬 | `tmux-session-order` |
| `#{branch_log}` | 세션→브랜치 매핑 | `tmux-session-branch-log` |
| `#{responsive}` | 폭 등급별 텍스트 | `tmux-responsive` |

### 운영 명령

| 명령 | 용도 |
| --- | --- |
| `tmux-session-dashboard` | 정렬된 세션 테이블 팝업. |
| `tmux-session-export` | 현재 세션을 `layouts/` 스타일 YAML 로 덤프. |
| `tmux-template-create <name>` | 프리셋으로 신규 세션. |
| `tmux-layout-apply <file.yml>` | YAML 을 세션에 적용. |
| `tmux-opencode` | OpenCode 세션 런처. |
| `tmux-web-terminal` | `ttyd` 기반 웹 터미널. |
| `tmux-slack-bridge-start` | 소켓 직접 / cloudflared 듀얼 모드로 브릿지 기동. |
| `tmux-slack-bridge-setup` | 인터랙티브 Slack 앱 셋업 마법사. |

## 로컬 개발

### 디렉터리 컨벤션

- `bin/` 의 스크립트는 POSIX 호환 bash 로 작성. `set -euo pipefail` 유지.
- `bin/lib/` 의 모듈은 점 소싱. 출력은 하지 않음.
- `conf.d/*.conf` 는 tmux 설정 문법. 숫자 접두사 순서대로 로딩됨.

### 환경 변수

| 변수 | 용도 |
| --- | --- |
| `TMUX_DEBUG=1` | `tmux-sidebar`, `tmux-session-watch` 등의 디버그 로그 활성화. |
| `TMUX_BRIDGE_MODE=socket\|http` | 슬랙 브릿지 모드 강제. |
| `TMUX_AUTOSTART=0` | 로그인 자동 attach 비활성. |

### 새 스크립트 추가 절차

1. `bin/` 에 실행 파일 추가 (`chmod +x`).
2. `bin/lib/` 에 공통 로직 분리.
3. `conf.d/20-keys.conf` 에 키바인딩 등록.
4. `tests/<name>.bats` 시나리오 작성.
5. `docs/` 또는 본 README 의 명령어 표에 한 줄 추가.

### 새 레이아웃 추가 절차

1. `layouts/<name>.yml` 작성.
2. 위험 명령이 있다면 `blacklist.yml` 에 차단 패턴 명시.
3. `tmux-template-create <name>` 으로 적용 검증.
4. README 또는 `docs/` 에 사용 예시 추가.

### TUI (`tui/sessionizer`) 개발

```bash
cd tui/sessionizer
bun install
bun run dev       # 개발 모드
bun test          # __tests__/*.test.ts
```

### Slack 브릿지 개발

```bash
cd slack/tmux-bridge
npm install
npm run dev       # tsx watch
npm test          # vitest
```

## 테스트

```bash
# bats 시나리오
bats tests/git-status.bats
bats tests/session-icon.bats
bats tests/session-order.bats
bats tests/sys-stats.bats

# TUI 단위 테스트
( cd tui/sessionizer && bun test )

# Slack 브릿지 단위 테스트
( cd slack/tmux-bridge && npm test )
```

`tests/test_helper.bash` 가 공통 픽스처를 제공합니다.

## 기여 가이드

- `CONTRIBUTING.md` 의 워크플로 (브랜치 → PR → 리뷰 → 머지) 를 따릅니다.
- 키바인딩 추가 시 `conf.d/20-keys.conf` 와 `tmux-cheatsheet` 양쪽을 갱신.
- 스크립트는 셸체크 (`shellcheck bin/`) 와 `shfmt -d` 를 통과해야 합니다.
- TUI/브릿지 변경 시 단위 테스트와 함께 PR 을 제출하세요.
- 큰 변경 전에는 `docs/session-persistence-brainstorming.md` 또는 별도 ADR 을 작성.

## 유지보수 및 연락처

- **담당자**: `OWNERS` 파일 참조.
- **이슈/PR**: 저장소 이슈 트래커 사용.
- **연락 채널**: 사내 Slack `#tmux-ops` 또는 `OWNERS` 의 이메일.
- **연관 문서**:
  - `docs/session-persistence-brainstorming.md` — 영속화 설계 메모.
  - `docs/supermemory-governance.md` — `data/in-memoria.db` 거버넌스 노트.
  - `slack/tmux-bridge/SETUP.md` — Slack 앱 셋업 절차.

## 추가 문서

| 문서 | 위치 | 설명 |
| --- | --- | --- |
| 지식 베이스 | `AGENTS.md` | 자동 생성된 구조·결정 요약. |
| 영속화 설계 | `docs/session-persistence-brainstorming.md` | resurrect + supermemory 결합 메모. |
| 거버넌스 | `docs/supermemory-governance.md` | 영속 데이터 권한·수명주기. |
| Slack 셋업 | `slack/tmux-bridge/SETUP.md` | OAuth, 토큰, 채널 매핑 절차. |

## English summary

A Bash-first tmux configuration toolkit that turns a single `tmux.conf` into a modular workspace. The repository ships a TUI session picker (`tui/sessionizer`, Bun + OpenTUI), a Slack bridge daemon (`slack/tmux-bridge`, Node.js + TypeScript), a sidebar engine, and a set of systemd user services for session persistence and sync. Operators clone the repo, symlink it as `~/.tmux`, and use `prefix + s` (fzf) or `prefix + S` (TUI) to manage sessions. YAML layouts in `layouts/` provide reproducible presets, and `bin/` exposes around thirty helper commands for sessions, status bar tokens, git/sys stats, SSH, clipboard, and Slack sync. Tested with bats, vitest, and Bun's test runner. See `AGENTS.md`, `docs/`, and `slack/tmux-bridge/SETUP.md` for deeper documentation.

## 라이선스

이 저장소는 `LICENSE` 파일의 조건에 따라 배포됩니다. (MIT)