# tmux 워크스페이스 — Bash-first Tmux 세션 툴킷

[![tmux](https://img.shields.io/badge/tmux-3.0%2B-1bb91f)](https://github.com/tmux/tmux)
[![shell](https://img.shields.io/badge/shell-bash%205%2B-4eaa25)](https://www.gnu.org/software/bash/)
[![bun](https://img.shields.io/badge/tui-bun%2FOpenTUI-f9f1e1)](https://bun.sh/)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

## 한국어 요약

`tmux.conf`를 단일 진입점으로 사용하는 Bash-first tmux 워크스페이스입니다. `bin/` 디렉터리의 작은 스크립트들이 세션 생성·전환·사이드바·Git 추적·Slack 브리지·웹 터미널을 담당하고, `layouts/*.yml`이 YAML 기반 레이아웃 템플릿을 제공합니다. `tui/sessionizer/`는 Bun + OpenTUI 기반의 TUI 세션 선택기를, `slack/tmux-bridge/`는 Node.js 기반의 Slack ↔ tmux 브리지를 제공합니다. 운영자는 `~/.tmux`로 심볼릭 링크한 뒤 `tmux` 명령만 실행하면 모든 기능이 로드됩니다.

### 한눈에 보기

| 항목 | 값 |
| --- | --- |
| 주 언어 | Bash 5+, 보조: TypeScript (Bun), Node.js |
| 진입점 | `tmux.conf` (루트 로더) → `bin/*` 실행 스크립트 |
| 세션 선택기 | `tmux-sessionizer` (fzf) / `tmux-sessionizer-tui` (Bun TUI) |
| 레이아웃 | `layouts/*.yml` (default / proxmox / resume / safework / splunk 등) |
| 외부 통합 | Slack 브리지 (`slack/tmux-bridge/`), ttyd 웹 터미널, OpenCode |
| 운영 상태 | 개인 워크스페이스, 운영 환경에서 사용 가능 (테스트: `tui/sessionizer/__tests__/`) |
| 도움말 | 키 바인딩: `<prefix> ?` (`tmux-cheatsheet`) |

### 동작 흐름 요약

1. 셸 시작 → `tmux` 실행 → `tmux.conf`가 `conf.d/*.conf`를 로드 (자료에 의거한 구성, 실제 환경에 맞게 적용).
2. 사용자가 새 세션을 만들면 `tmux-sessionizer` 또는 TUI 위저드(`tmux-sessionizer-tui`)가 디렉터리를 스캔하고 세션을 생성.
3. 세션 생성 시 `tmux-sidebar-init`이 사이드바를 초기화하고, `tmux-sidebar`가 좌측 트리를 렌더링.
4. 세션 전환은 `tmux-session-cycle` (PgUp/PgDn) 또는 `tmux-session-jump` (fzf MRU)로 수행.
5. 변경 작업은 `tmux-session-branch-log`로 세션↔브랜치를 기록하고, `tmux-git-status` / `tmux-git-uncommitted`이 상태를 추적.
6. 선택적으로 `tmux-slack-bridge-start`가 Slack 채널과 tmux 세션을 동기화하고, `tmux-web-terminal`이 ttyd로 브라우저 터미널을 노출.

## English Summary

A Bash-first tmux workspace that uses `tmux.conf` as the single entry point. Small scripts under `bin/` cover session creation, switching, sidebar rendering, Git tracking, Slack bridging, and web terminal access; `layouts/*.yml` provides YAML layout templates; `tui/sessionizer/` ships a Bun + OpenTUI session picker; `slack/tmux-bridge/` exposes a Node.js Slack ↔ tmux bridge. After symlinking the repo to `~/.tmux`, a single `tmux` command loads the full workspace.

---

## 목차 (Table of Contents)

1. [목적 / Purpose](#목적--purpose)
2. [패키지 구성 / Package Contents](#패키지-구성--package-contents)
3. [상태 / Status](#상태--status)
4. [먼저 읽을 파일 / First Files to Read](#먼저-읽을-파일--first-files-to-read)
5. [API 및 진입점 / API and Entry Points](#api-및-진입점--api-and-entry-points)
6. [빠른 시작 / Quickstart](#빠른-시작--quickstart)
7. [구성 / Configuration](#구성--configuration)
8. [명령 참조 / Command Reference](#명령-참조--command-reference)
9. [로컬 개발 / Local Development](#로컬-개발--local-development)
10. [테스트 / Testing](#테스트--testing)
11. [기여 / Contributing](#기여--contributing)
12. [유지보수자 / Maintainers](#유지보수자--maintainers)
13. [추가 문서 / Further Documentation](#추가-문서--further-documentation)
14. [라이선스 / License](#라이선스--license)

---

## 목적 / Purpose

이 저장소는 tmux를 일상 개발 환경의 1등 시민으로 만들기 위한 **개인용 워크스페이스 구성 모음**입니다.

- **대상 사용자**: tmux를 메인 멀티플렉서로 사용하며 세션·창·패인의 자동화된 관리, Git 워크플로 통합, 원격 협업 도구(웹 터미널, Slack 브리지)를 함께 쓰고 싶은 개발자·운영자.
- **무엇을 제공하나**: 단일 진입점(`tmux.conf`)에서 로드되는 35개 이상의 작은 Bash 스크립트(`bin/`), 공유 라이브러리(`lib/`), YAML 레이아웃 템플릿(`layouts/`), Bun/OpenTUI 기반 TUI 세션 선택기(`tui/sessionizer/`), Slack ↔ tmux 양방향 브리지(`slack/tmux-bridge/`).
- **무엇을 할 수 있나**: 디렉터리 스캔 기반 세션 생성, 사이드바/대시보드/명령 팔레트/키 시트 조회, Git 브랜치와 변경 추적, Slack 채널과 세션 동기화, ttyd를 통한 웹 터미널, fzf 기반 SSH 호스트/파일/URL/클립보드 히스토리 검색.
- **왜 유용한가**: “tmux + fzf + 작은 Bash” 조합만으로 IDE에 가깝지만 셸 친화적인 멀티플렉서 환경을 만들 수 있습니다. 별도의 데몬이나 무거운 플러그인 매니저 없이 Git 저장소만 클론해 심볼릭 링크하면 끝납니다.

## 패키지 구성 / Package Contents

| 경로 | 종류 | 역할 |
| --- | --- | --- |
| `tmux.conf` | 설정 | 루트 로더. `conf.d/*.conf`를 순서대로 소싱 (저장소 자료 기준; 현재 저장소에는 미포함, 사용자 환경에서 작성). |
| `sessionizer.conf` | 설정 | `SCAN_DIR` / `EXTRA_DIRS`로 세션 검색 대상 경로 지정. |
| `bin/` | 실행 스크립트 | 36개의 Bash 스크립트. 세션·사이드바·상태바·Git·Slack·웹 터미널 등 모든 사용자 노출 기능. |
| `lib/` | 공유 라이브러리 | `sidebar-colors`, `sidebar-render`, `tmux-sessionizer-common`, `tmux-sessionizer-wizard`. |
| `layouts/` | 데이터 | `default.yml`, `proxmox.yml`, `resume.yml`, `safework.yml`, `safework2.yml`, `splunk.yml`, `blacklist.yml`. |
| `tui/sessionizer/` | TypeScript 앱 | Bun + OpenTUI 기반 TUI 세션 선택기 (`App.tsx`, `components/`, `hooks/`, `actions/`, `lib/`). |
| `slack/tmux-bridge/` | Node.js 앱 | Slack 채널 ↔ tmux 세션 동기화 데몬. |
| `docs/` | 문서 | `session-persistence-brainstorming.md`, `supermemory-governance.md`. |
| `AGENTS.md`, `OWNERS`, `CONTRIBUTING.md`, `LICENSE` | 메타 | 에이전트/기여/소유권/라이선스. |

## 상태 / Status

| 항목 | 상태 |
| --- | --- |
| 운영 준비도 | 개인 워크스페이스로 운영 중. 핵심 경로는 안정화 단계. |
| 지원 플랫폼 | macOS / Linux (Bash 5+, tmux 3+, fzf, Nerd Font). |
| 테스트 | `tui/sessionizer/__tests__/`에 Bun 테스트 존재. Bash 스크립트는 수동 검증. |
| 외부 통합 | Slack (Socket Mode 또는 Cloudflare Tunnel), ttyd, OpenCode, fzf. |
| 알려진 제약 | Bash 스크립트는 POSIX 호환을 보장하지 않음. `bin/` 일부 스크립트는 컨테이너/원격 환경에서 의존 도구 미설치 시 실패 가능. |

## 먼저 읽을 파일 / First Files to Read

운영자/새 기여자가 우선 살펴봐야 할 파일은 다음과 같습니다.

1. `tmux.conf` — 전체 동작의 진입점.
2. `sessionizer.conf` — 세션 검색 대상 디렉터리 정의.
3. `bin/tmux-sessionizer` — 가장 많이 호출되는 세션 선택기.
4. `bin/tmux-sidebar` 및 `lib/sidebar-render` — 사이드바 동작.
5. `layouts/default.yml` — 레이아웃 템플릿의 기본 형식.
6. `tui/sessionizer/src/App.tsx` — TUI 선택기 진입점.
7. `slack/tmux-bridge/` — Slack 통합 진입점.

## API 및 진입점 / API and Entry Points

사용자(키스트로크)와 운영자(CLI)에서 호출되는 주요 진입점은 다음과 같습니다.

| 진입점 | 종류 | 호출 주체 |
| --- | --- | --- |
| `tmux` (셸) | 프로세스 | 루트 로더 `tmux.conf`. |
| `<prefix> s` | 키 바인딩 | `bin/tmux-sessionizer` (fzf 세션 선택기). |
| `<prefix> S` | 키 바인딩 | `bin/tmux-sessionizer-tui` (Bun TUI 세션 선택기). |
| `<prefix> Tab` | 키 바인딩 | `bin/tmux-session-cycle` (이전/다음 세션). |
| `<prefix> g` | 키 바인딩 | `bin/tmux-sidebar-toggle` (사이드바 토글). |
| `<prefix> ?` | 키 바인딩 | `bin/tmux-cheatsheet` (키 시트 팝업). |
| `<prefix> w` | 키 바인딩 | `bin/tmux-command-palette` (명령 팔레트). |
| `tmux-session-dashboard` | CLI | 세션 테이블 팝업. |
| `tmux-layout-apply` | CLI | YAML 레이아웃 적용. |
| `tmux-slack-bridge-start` | CLI | Slack 브리지 데몬 시작. |
| `tmux-web-terminal` | CLI | ttyd 기반 웹 터미널. |

TUI 세션 선택기는 Bun 런타임에서 직접 실행되며, OpenTUI의 키 핸들러(`tui/sessionizer/src/hooks/use-keyboard-handler.ts`)로 입력을 처리합니다.

## 빠른 시작 / Quickstart

### 1. 클론 및 심볼릭 링크

```bash
git clone <repo-url> ~/src/tmux
ln -s ~/src/tmux ~/.tmux
```

### 2. 의존성 설치

```bash
# macOS
brew install tmux fzf jq yq

# Debian/Ubuntu
sudo apt-get install -y tmux fzf jq python3-yq
```

### 3. tmux 시작

```bash
tmux
```

`tmux.conf`가 모든 스크립트를 로드합니다. 새 세션은 `<prefix> s`(fzf) 또는 `<prefix> S`(TUI)로 만들 수 있습니다.

### 4. TUI 세션 선택기 (선택)

```bash
cd tui/sessionizer
bun install
bun run start
```

### 5. Slack 브리지 (선택)

```bash
bin/tmux-slack-bridge-setup   # 최초 1회: Slack 앱 설정
bin/tmux-slack-bridge-start   # 데몬 시작 (Socket Mode 또는 Cloudflare Tunnel)
```

### 6. 웹 터미널 (선택)

```bash
which ttyd || brew install ttyd   # 또는 apt-get install -y ttyd
bin/tmux-web-terminal             # 기본 포트 7681
```

### 7. 테스트

```bash
cd tui/sessionizer
bun test
```

## 구성 / Configuration

### `sessionizer.conf`

세션 선택기가 스캔할 디렉터리를 정의합니다.

```conf
SCAN_DIR="$HOME/src"
EXTRA_DIRS=(
  "$HOME/work"
  "$HOME/projects"
)
```

### `layouts/*.yml`

YAML 레이아웃은 `tmux-layout-apply`가 읽어 창·패인·명령을 구성합니다.

```yaml
# 예시: layouts/default.yml 구조
name: default
root: ~/src
windows:
  - name: editor
    panes:
      - command: nvim .
  - name: shell
    panes:
      - command: bash
```

`blacklist.yml`은 특정 경로를 세션 생성 후보에서 제외할 때 사용합니다.

### 환경 변수

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `TMUX_SESSIONIZER_SCAN_DIR` | `~/src` | 기본 스캔 디렉터리. |
| `TMUX_TTYD_PORT` | `7681` | `tmux-web-terminal`이 바인딩할 포트. |
| `SLACK_BRIDGE_MODE` | `socket` | `socket` 또는 `tunnel` (Cloudflare). |
| `OPENCODE_BIN` | `opencode` | OpenCode 실행 파일 경로. |

## 명령 참조 / Command Reference

### 세션 관리

| 명령 | 설명 |
| --- | --- |
| `bin/tmux-sessionizer` | fzf 기반 세션 선택/생성. |
| `bin/tmux-sessionizer-tui` | Bun TUI 세션 선택/생성. |
| `bin/tmux-session-cycle` | PgUp/PgDn으로 세션 순환. |
| `bin/tmux-session-jump` | fzf MRU 세션 점퍼. |
| `bin/tmux-session-rename` | 세션 이름 변경. |
| `bin/tmux-session-kill` | 확인 후 세션 종료. |
| `bin/tmux-session-dashboard` | 세션 테이블 팝업. |
| `bin/tmux-session-export` | 현재 세션 레이아웃을 YAML로 내보내기. |
| `bin/tmux-session-icon` | 세션별 Nerd Font 아이콘 매핑. |
| `bin/tmux-session-order` | 최근 활성 순으로 세션 정렬. |
| `bin/tmux-session-branch-log` | 세션↔브랜치 전환 기록. |
| `bin/tmux-session-sync` | tmux 세션을 Slack 채널과 동기화. |

### 사이드바

| 명령 | 설명 |
| --- | --- |
| `bin/tmux-sidebar` | 트리 사이드바 렌더링. |
| `bin/tmux-sidebar-init` | 세션 생성 시 사이드바 초기화. |
| `bin/tmux-sidebar-toggle` | 사이드바 표시/숨김 토글. |

### 레이아웃 & 템플릿

| 명령 | 설명 |
| --- | --- |
| `bin/tmux-layout-apply` | YAML 레이아웃을 현재/지정 세션에 적용. |
| `bin/tmux-template-create` | 프리셋 템플릿으로 빠른 세션 생성. |

### 입력/탐색

| 명령 | 설명 |
| --- | --- |
| `bin/tmux-command-palette` | fzf 동작 팔레트. |
| `bin/tmux-url-open` | 현재 패인에서 URL 추출 후 열기. |
| `bin/tmux-file-open` | 현재 패인에서 파일 경로 추출 후 열기. |
| `bin/tmux-ssh-picker` | `~/.ssh/config` 호스트 선택. |
| `bin/tmux-clipboard-history` | tmux 버퍼 히스토리 브라우저. |
| `bin/tmux-copy-word` | 커서 위치 단어 복사. |
| `bin/tmux-cheatsheet` | 키 바인딩 시트 팝업. |

### Git 통합

| 명령 | 설명 |
| --- | --- |
| `bin/tmux-git-status` | 브랜치/dirty/ahead/behind/stash 상태. |
| `bin/tmux-git-uncommitted` | 세션별 미커밋 변경 추적. |

### 시스템/상태

| 명령 | 설명 |
| --- | --- |
| `bin/tmux-sys-stats` | CPU 부하/메모리 사용량. |
| `bin/tmux-responsive` | 폭 티어 기반 상태바 렌더링. |
| `bin/tmux-notify-long-command` | 장시간 명령 데스크톱 알림. |
| `bin/tmux-pane-sync` | `synchronize-panes` 토글. |
| `bin/tmux-config-reload` | 설정 리로드 + 변경 diff. |

### 외부 통합

| 명령 | 설명 |
| --- | --- |
| `bin/tmux-auto-attach` | 로그인 셸 자동 attach. |
| `bin/tmux-opencode` | OpenCode 세션 실행. |
| `bin/tmux-web-terminal` | ttyd 웹 터미널. |
| `bin/tmux-slack-bridge-setup` | Slack 앱 초기 설정. |
| `bin/tmux-slack-bridge-start` | Slack 브리지 데몬 시작. |
| `bin/tmux-bash-preexec` | 셸 preexec 훅 (명령 타이밍). |

## 로컬 개발 / Local Development

```bash
# 저장소 클론
git clone <repo-url> ~/src/tmux
cd ~/src/tmux

# 개발용 심볼릭 링크
ln -sfn "$(pwd)" ~/.tmux

# TUI 개발 모드
cd tui/sessionizer
bun install
bun run dev   # 또는 bun run start

# Slack 브리지 개발
cd slack/tmux-bridge
npm install
npm run dev
```

스크립트 단위 디버깅은 `-x` 옵션으로 추적합니다.

```bash
bash -x bin/tmux-sessionizer
```

## 테스트 / Testing

| 영역 | 명령 |
| --- | --- |
| TUI 세션 선택기 | `cd tui/sessionizer && bun test` |
| TUI 타입 체크 | `cd tui/sessionizer && bunx tsc --noEmit` |
| Bash 스크립트 | 수동 검증 (`bash -n bin/<script>`로 문법 점검). |
| Slack 브리지 | `slack/tmux-bridge/`의 프로젝트별 테스트 명령. |

## 기여 / Contributing

1. `CONTRIBUTING.md`의 가이드라인을 먼저 읽습니다.
2. 변경 사항은 토픽 브랜치에서 작업하고 PR을 올립니다.
3. 새 `bin/` 스크립트는 다음 규칙을 따릅니다.
   - `#!/usr/bin/env bash`와 `set -euo pipefail` 사용.
   - 사용자 메시지는 영문, 가이드/문서에서는 한국어 우선.
   - 가능한 한 외부 의존성을 줄이고 fzf/jq 등 표준 도구만 사용.
4. TUI 변경 시 `tui/sessionizer/__tests__/`에 단위 테스트를 추가합니다.

## 유지보수자 / Maintainers

- 저장소 소유자: [`OWNERS`](./OWNERS) 파일 참조.
- 에이전트 운영 지침: [`AGENTS.md`](./AGENTS.md).

## 추가 문서 / Further Documentation

| 문서 | 경로 |
| --- | --- |
| 세션 영속화 브레인스토밍 | [docs/session-persistence-brainstorming.md](./docs/session-persistence-brainstorming.md) |
| Supermemory 거버넌스 | [docs/supermemory-governance.md](./docs/supermemory-governance.md) |
| 기여 가이드 | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| 에이전트 지침 | [AGENTS.md](./AGENTS.md) |
| TUI 세션 선택기 메모 | [tui/sessionizer/AGENTS.md](./tui/sessionizer/AGENTS.md) |
| Slack 브리지 메모 | [slack/tmux-bridge/AGENTS.md](./slack/tmux-bridge/AGENTS.md) |

## 라이선스 / License

[`LICENSE`](./LICENSE) 파일 참조. 본 저장소는 개인 워크스페이스로 운영되며, 별도 명시가 없는 경우 저장소 소유자의 정책이 적용됩니다.