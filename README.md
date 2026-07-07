# tmux toolkit

[![Shell Script](https://img.shields.io/badge/shell-bash-4EAA25.svg)]()
[![Tmux](https://img.shields.io/badge/tmux-3.0+-1BB91F.svg)]()
[![Bun](https://img.shields.io/badge/bun-runtime-F9F1E1.svg)]()
[![License](https://img.shields.io/badge/license-CHECK%20LICENSE-blue.svg)]()

Bash-first tmux 설정과 세션 관리 툴킷. `bin/`의 39개 헬퍼 스크립트, 공유 라이브러리, YAML 레이아웃 템플릿, Bun/OpenTUI 기반 TUI 세션저니저, 그리고 Node.js Slack 브릿지로 구성됩니다.

English: Bash-first tmux configuration and session-management toolkit. Symlinks into `~/.tmux` and adds a sessionizer, sidebar, responsive status bar, layout templates, and Slack bridge.

---

## 빠른 상태 / Quick Status

| 항목 | 값 |
| --- | --- |
| 주 언어 | Bash, TypeScript/React, Node.js |
| 런타임 | tmux 3.0+, Bash 4+, Bun (TUI), Node.js 18+ (Slack) |
| 설치 방식 | `~/.tmux` 심볼릭 링크 |
| 핵심 진입점 | `bin/tmux-sessionizer`, `bin/tmux-sidebar`, `tmux.conf` |
| 보조 컴포넌트 | `tui/sessionizer/`, `slack/tmux-bridge/` |
| 상태 | 개인 워크스테이션 운영용, 안정 |
| 라이선스 | 저장소 `LICENSE` 참조 |

English one-liner: Symlink the repo to `~/.tmux`, source the root `tmux.conf`, then bind scripts under `bin/` to your keys.

---

## 목차 / Contents

- [Purpose / 패키지 구성](#purpose--패키지-구성)
- [Architecture / 구조](#architecture--구조)
- [Quickstart / 설치와 실행](#quickstart--설치와-실행)
- [Entry Points / 핵심 명령](#entry-points--핵심-명령)
- [Layouts / 레이아웃 템플릿](#layouts--레이아웃-템플릿)
- [TUI Sessionizer](#tui-sessionizer)
- [Slack Bridge](#slack-bridge)
- [Configuration](#configuration)
- [Local Development / 테스트](#local-development--테스트)
- [Maintainers / 연락처](#maintainers--연락처)
- [Further Documentation](#further-documentation)

---

## Purpose / 패키지 구성

이 저장소는 tmux를 "데스크톱 세션 매니저"로 끌어올리는 도구 모음입니다. CLI·TUI 양쪽에서 세션을 검색·생성·순환하고, 사이드바·상태바·레이아웃을 코드로 관리하며, 외부 서비스(Slack)와 통합합니다.

핵심 기능 그룹:

- 세션 관리: 검색(`tmux-sessionizer`), 생성 마법사, 회전, 종료, 이름 변경, MRU 점프, 대시보드, YAML 내보내기
- 사이드바·상태바: 트리 사이드바, 너비 적응형 상태바, 시스템·Git 통계
- 레이아웃: YAML 템플릿 적용, 프리셋 세션 생성
- 입력 보조: 명령 팔레트, 클립보드 히스토리, 단어 복사, URL/파일 열기, SSH 호스트 선택
- 통합: Slack 브릿지, OpenCode 세션, ttyd 웹 터미널

English: A tmux toolkit that turns the multiplexer into a session manager with a sidebar, responsive status bar, layout templates, and Slack bridge integration.

---

## Architecture / 구조

| 계층 | 위치 | 역할 |
| --- | --- | --- |
| 루트 설정 | `tmux.conf`, `sessionizer.conf` | tmux 로더와 세션 검색 경로 |
| 진입점 | `bin/tmux-*` (39개) | 키바인딩에서 호출되는 Bash 헬퍼 |
| 공유 라이브러리 | `bin/lib/` | 세션저니저 공통 함수, 사이드바 렌더링 |
| 레이아웃 | `layouts/*.yml` | 사전 정의된 창/패널 템플릿 |
| TUI | `tui/sessionizer/` | Bun + OpenTUI + React 세션저니저 |
| Slack 브릿지 | `slack/tmux-bridge/` | tmux 세션 ↔ Slack 채널 동기화 |
| 문서 | `docs/`, `AGENTS.md` | 설계 메모, 운영 가이드 |

요청 흐름 예시 (`tmux-sessionizer` 호출 시):

1. tmux 키바인딩이 `bin/tmux-sessionizer`를 호출
2. 스크립트가 `sessionizer.conf`의 `SCAN_DIR`/`EXTRA_DIRS`로 후보 디렉터리 수집
3. `bin/lib/tmux-sessionizer-common`과 `tmux-sessionizer-wizard`로 UI와 마법사 구성
4. fzf 또는 `tmux-sessionizer-tui`로 선택지 표시
5. 선택 후 `tmux new-session`으로 세션 생성, `tmux-sidebar-init` 훅 실행

---

## Quickstart / 설치와 실행

심볼릭 링크 방식의 드롭인 설치:

```bash
git clone <repo-url> ~/projects/tmux-toolkit
cd ~/projects/tmux-toolkit

ln -sfn "$(pwd)" ~/.tmux
echo 'source-file ~/.tmux/tmux.conf' > ~/.tmux.conf

tmux new-session
```

기본 키 프리픽스는 `C-a`입니다. 사이드바 토글, 세션저니저, 명령 팔레트는 `bin/` 안의 스크립트와 `tmux.conf`의 키바인딩을 참고하세요. 키바인딩 요약은 `tmux-cheatsheet`로 팝업 확인할 수 있습니다.

English: Symlink-installable drop-in. Clone, symlink into `~/.tmux`, source the root `tmux.conf`, then start tmux.

---

## Entry Points / 핵심 명령

대표 진입점 그룹:

- 세션: `tmux-sessionizer`, `tmux-sessionizer-tui`, `tmux-session-cycle`, `tmux-session-kill`, `tmux-session-rename`, `tmux-session-jump`, `tmux-session-dashboard`, `tmux-session-export`, `tmux-session-order`, `tmux-session-branch-log`, `tmux-session-icon`
- 사이드바: `tmux-sidebar`, `tmux-sidebar-init`, `tmux-sidebar-toggle` (공유: `bin/lib/sidebar-colors`, `bin/lib/sidebar-render`)
- 레이아웃: `tmux-template-create`, `tmux-layout-apply`
- 상태바: `tmux-responsive`, `tmux-sys-stats`, `tmux-git-status`, `tmux-git-uncommitted`
- 입력 보조: `tmux-command-palette`, `tmux-clipboard-history`, `tmux-copy-word`, `tmux-url-open`, `tmux-file-open`, `tmux-ssh-picker`, `tmux-pane-sync`
- 통합: `tmux-slack-bridge-start`, `tmux-slack-bridge-setup`, `tmux-opencode`, `tmux-web-terminal`, `tmux-auto-attach`, `tmux-config-reload`, `tmux-notify-long-command`

전체 인자 규약과 키바인딩은 각 스크립트 헤더 주석과 `bin/` 디렉터리를 참조하세요.

---

## Layouts / 레이아웃 템플릿

`layouts/` 디렉터리의 YAML 파일은 사전 정의된 창/패널 배치입니다.

- `default.yml` — 기본 작업 레이아웃
- `proxmox.yml` — Proxmox 관리 콘솔용
- `splunk.yml` — Splunk 검색/대시보드용
- `resume.yml` — 이력서/문서 작업용
- `safework.yml`, `safework2.yml` — 안전 작업 절차용
- `blacklist.yml` — 차단 디렉터리 규칙

적용 방법:

```bash
tmux-template-create default        # 프리셋에서 세션 생성
tmux-layout-apply layouts/splunk.yml # 기존 세션에 레이아웃 적용
tmux-session-export > my-layout.yml # 현재 세션을 YAML로 저장
```

---

## TUI Sessionizer

Bun + OpenTUI + React 기반의 그래피컬 세션저니저입니다. `bin/tmux-sessionizer-tui`로 호출되며, fzf 기반 CLI의 시각적 대안입니다.

```bash
cd tui/sessionizer
bun install
bun run dev      # 개발 모드
bun run test     # 테스트 실행
```

소스 구조:

- `src/App.tsx`, `src/index.tsx` — 루트 컴포넌트와 부트스트랩
- `src/components/` — 세션 리스트, 마법사 단계, 미리보기, 다이얼로그
- `src/lib/` — 설정, 세션 생성, 디렉터리, 상태, 테마, tmux 래퍼
- `src/hooks/`, `src/actions/` — 키보드 핸들러와 세션 액션
- `__tests__/` — `config.test.ts`, `tmux.test.ts`
- `AGENTS.md` — 패키지 내부 운영 가이드

---

## Slack Bridge

`slack/tmux-bridge/`는 tmux 세션과 Slack 채널을 양방향으로 동기화하는 Node.js 서비스입니다. `bin/tmux-slack-bridge-setup`으로 1회 설정하고, `bin/tmux-slack-bridge-start`로 소켓 직접 모드 또는 HTTP/cloudflared 모드로 실행합니다.

자세한 구현 노트와 실행 모드는 `slack/tmux-bridge/AGENTS.md`를 참조하세요.

---

## Configuration

핵심 설정 파일:

- `tmux.conf` — 루트 tmux 설정 로더
- `sessionizer.conf` — `SCAN_DIR`, `EXTRA_DIRS` 등 세션저니저 검색 경로
- `layouts/*.yml` — 창/패널 템플릿
- `tui/sessionizer/bunfig.toml` — Bun 런타임 설정
- `tui/sessionizer/package.json` — TUI 의존성과 스크립트

추가 환경 변수와 옵션은 각 스크립트 헤더 주석을 확인하세요.

---

## Local Development / 테스트

- 정적 분석: `shellcheck bin/tmux-*`
- TUI 테스트: `cd tui/sessionizer && bun run test`
- Slack 브릿지: `slack/tmux-bridge/AGENTS.md`의 명령 참조

기여 절차는 `CONTRIBUTING.md`를 확인하세요.

---

## Maintainers / 연락처

| 항목 | 위치 |
| --- | --- |
| 코드 오너십 | `OWNERS` |
| 기여 가이드 | `CONTRIBUTING.md` |
| 에이전트 운영 메모 | `AGENTS.md` |

---

## Further Documentation

- `docs/session-persistence-brainstorming.md` — 영구 세션 설계 메모
- `docs/supermemory-governance.md` — 메모 거버넌스 노트
- `tui/sessionizer/AGENTS.md` — TUI 패키지 내부 가이드
- `slack/tmux-bridge/AGENTS.md` — Slack 브릿지 내부 가이드
- `CONTRIBUTING.md` — 기여 절차
- `LICENSE` — 라이선스 전문