# tmux 세션 관리 툴킷

![tmux](https://img.shields.io/badge/tmux-required-1f6feb)
![Bash](https://img.shields.io/badge/Bash-first-4eaa25)
![Bun](https://img.shields.io/badge/Bun-TUI_optional-f9f1e1)
![License](https://img.shields.io/badge/license-see_LICENSE-blue)

한국어: 이 저장소는 `tmux`를 더 빠르게 쓰기 위한 Bash 중심 설정과
세션 관리 도구 모음입니다. 세션 검색, 생성, 전환, 레이아웃 적용,
사이드바, 상태바, Git 상태, 클립보드/URL/파일 선택, 선택형 TUI를 제공합니다.

English: A Bash-first `tmux` configuration and session-management toolkit with
session discovery, layout helpers, sidebar/status utilities, Git-aware helpers,
clipboard/URL/file pickers, and an optional Bun-based TUI.

| 항목 / Item | 상태 / Status |
|---|---|
| 제품 / Product | 개인·팀 터미널 워크플로용 tmux toolkit |
| 주 실행면 / Main entry points | `tmux.conf`, `bin/tmux-sessionizer`, `bin/tmux-sessionizer-tui` |
| 운영자 다음 동작 / Operator next step | `~/.tmux`로 배치 후 `tmux source-file ~/.tmux/tmux.conf` |
| 설정 파일 / Config | `sessionizer.conf`, `layouts/*.yml`, `tmux.conf` |
| 준비도 / Readiness | 실사용 가능한 로컬 tmux 설정; 환경별 검증 필요 |
| 소유 / Ownership | [`OWNERS`](OWNERS) 참고 |

## 빠른 흐름 / Quick Flow

1. 사용자는 이 저장소를 `~/.tmux`로 두거나 심볼릭 링크합니다.  
   English: Place or symlink this repository as `~/.tmux`.
2. `tmux.conf`가 기본 tmux 설정과 키 바인딩을 로드합니다.  
   English: `tmux.conf` becomes the main tmux configuration.
3. `sessionizer.conf`가 세션 탐색 경로를 정의합니다.  
   English: `sessionizer.conf` defines project discovery paths.
4. 운영자는 `bin/tmux-sessionizer` 또는 `bin/tmux-sessionizer-tui`로
   세션을 만들고 전환합니다.  
   English: Operators create and switch sessions through the CLI or TUI.
5. 보조 명령은 사이드바, 상태바, 레이아웃, Git, 클립보드,
   URL/파일 선택을 처리합니다.  
   English: Helper commands cover sidebar, status, layouts, Git, clipboard,
   URL, and file workflows.

## 목차 / Table of Contents

- [목적 / Purpose](#목적--purpose)
- [주요 기능 / Features](#주요-기능--features)
- [패키지 구성 / Package Contents](#패키지-구성--package-contents)
- [아키텍처 / Architecture](#아키텍처--architecture)
- [처음 읽을 파일 / First Files to Read](#처음-읽을-파일--first-files-to-read)
- [빠른 시작 / Quick Start](#빠른-시작--quick-start)
- [설정 / Configuration](#설정--configuration)
- [명령어 / Commands](#명령어--commands)
- [TUI 사용 / TUI Usage](#tui-사용--tui-usage)
- [로컬 개발 / Local Development](#로컬-개발--local-development)
- [테스트 / Testing](#테스트--testing)
- [문제 해결 / Troubleshooting](#문제-해결--troubleshooting)
- [기여 / Contributing](#기여--contributing)
- [유지보수 / Maintainers](#유지보수--maintainers)
- [추가 문서 / Further Documentation](#추가-문서--further-documentation)
- [라이선스 / License](#라이선스--license)

## 목적 / Purpose

이 프로젝트는 반복적인 tmux 작업을 짧은 명령과 일관된 키 바인딩으로
정리합니다.

English: This project reduces repetitive tmux work into predictable commands,
configuration, and key-driven workflows.

사용자는 다음을 할 수 있습니다.

- 여러 프로젝트 디렉터리에서 tmux 세션을 빠르게 찾고 생성
- 저장된 YAML 레이아웃을 세션에 적용
- 사이드바와 대시보드로 세션/파일 컨텍스트 확인
- Git 상태, 미커밋 변경, 브랜치 정보를 상태바나 명령으로 확인
- URL, 파일 경로, SSH 호스트, tmux 버퍼를 `fzf`로 선택
- 선택적으로 Bun 기반 TUI에서 세션 생성·이름 변경·삭제 수행

English summary:

- Discover and create sessions from project directories.
- Apply YAML layouts.
- Use sidebar, dashboard, Git, picker, and clipboard helpers.
- Optionally manage sessions through the Bun TUI.

## 주요 기능 / Features

- Bash-first 실행면
  - 대부분의 운영 명령은 `bin/tmux-*` 스크립트입니다.
  - tmux 내부와 일반 셸 양쪽에서 호출하기 쉽습니다.
- 세션 관리
  - `tmux-sessionizer`: `fzf` 기반 세션 선택·생성
  - `tmux-sessionizer-tui`: TUI 세션 관리자 실행
  - `tmux-session-cycle`, `tmux-session-jump`, `tmux-session-kill`,
    `tmux-session-rename`
- 레이아웃 관리
  - `layouts/*.yml` 프리셋
  - `tmux-layout-apply`
  - `tmux-session-export`
- 관측성과 상태 표시
  - `tmux-responsive`
  - `tmux-git-status`
  - `tmux-git-uncommitted`
  - `tmux-sys-stats`
  - `tmux-session-dashboard`
- 탐색 보조
  - `tmux-url-open`
  - `tmux-file-open`
  - `tmux-ssh-picker`
  - `tmux-clipboard-history`
  - `tmux-command-palette`
- 사이드바
  - `tmux-sidebar`
  - `tmux-sidebar-init`
  - `tmux-sidebar-toggle`
  - `bin/lib/sidebar-*`
- 선택형 통합
  - Slack bridge 시작/설정 래퍼
  - `ttyd` 기반 웹 터미널 래퍼
  - OpenCode 세션 런처

## 패키지 구성 / Package Contents

실제 최상위 구조는 다음과 같습니다.

```text
.
├── AGENTS.md
├── CONTRIBUTING.md
├── LICENSE
├── OWNERS
├── README.md
├── sessionizer.conf
├── tmux.conf
├── bin/
├── layouts/
├── tui/
├── docs/
└── slack/
```

주요 디렉터리:

- `bin/`
  - tmux 운영 명령과 Bash 유틸리티
  - `bin/lib/`에 공통 함수와 사이드바 렌더링 코드 포함
- `layouts/`
  - 세션 레이아웃 YAML 프리셋
- `tui/sessionizer/`
  - Bun 기반 React/OpenTUI 스타일 세션 관리 앱
  - `src/`와 `__tests__/` 포함
- `docs/`
  - 설계 메모와 장기 아이디어
- `slack/tmux-bridge/`
  - Slack bridge 관련 작업 공간
- 루트 파일
  - `tmux.conf`: tmux 진입 설정
  - `sessionizer.conf`: 세션 탐색 설정
  - `OWNERS`: 유지보수자 정보
  - `CONTRIBUTING.md`: 기여 규칙
  - `LICENSE`: 라이선스

English: The repository is organized around a root tmux config, executable
Bash commands under `bin/`, YAML layouts, an optional TUI app, and supporting
documentation.

## 아키텍처 / Architecture

### 실행 흐름 / Runtime Flow

1. tmux가 `tmux.conf`를 로드합니다.
2. 사용자는 키 바인딩 또는 셸에서 `bin/tmux-*` 명령을 실행합니다.
3. 세션 관련 명령은 `sessionizer.conf`와 현재 tmux 상태를 읽습니다.
4. 필요하면 `bin/lib/`의 공통 로직을 사용합니다.
5. 레이아웃 명령은 `layouts/*.yml`을 읽어 창과 pane을 구성합니다.
6. TUI 명령은 `tui/sessionizer`의 Bun 앱을 실행합니다.

English: tmux loads the root config, helper commands read repository
configuration and current tmux state, and optional components provide richer
session, layout, and integration workflows.

### 주요 컴포넌트 / Components

| 컴포넌트 | 역할 |
|---|---|
| `tmux.conf` | tmux 설정의 루트 진입점 |
| `sessionizer.conf` | 세션 탐색 디렉터리 설정 |
| `bin/tmux-sessionizer` | CLI/fzf 기반 세션 선택과 생성 |
| `bin/tmux-sessionizer-tui` | Bun TUI 세션 관리자 실행 |
| `bin/lib/tmux-sessionizer-common` | 세션 탐색 공통 함수 |
| `bin/lib/tmux-sessionizer-wizard` | 세션 생성 wizard 로직 |
| `layouts/*.yml` | 재사용 가능한 tmux 레이아웃 |
| `tui/sessionizer/src` | TUI 앱 소스 |
| `tui/sessionizer/__tests__` | TUI 단위 테스트 |

## 처음 읽을 파일 / First Files to Read

새 사용자는 아래 순서로 읽는 것이 좋습니다.

1. [`tmux.conf`](tmux.conf)
   - 어떤 tmux 설정이 로드되는지 확인합니다.
2. [`sessionizer.conf`](sessionizer.conf)
   - 세션 검색 경로를 환경에 맞게 바꿉니다.
3. [`bin/tmux-sessionizer`](bin/tmux-sessionizer)
   - 기본 세션 선택 흐름을 확인합니다.
4. [`bin/tmux-sessionizer-tui`](bin/tmux-sessionizer-tui)
   - TUI 실행 방식과 의존성을 확인합니다.
5. [`layouts/default.yml`](layouts/default.yml)
   - 레이아웃 YAML 형식을 파악합니다.
6. [`CONTRIBUTING.md`](CONTRIBUTING.md)
   - 변경 규칙과 리뷰 기준을 확인합니다.
7. [`OWNERS`](OWNERS)
   - 문의와 리뷰 담당자를 확인합니다.

English: Start with the root tmux config, session discovery config, the main
sessionizer command, a layout example, and ownership/contribution files.

## 빠른 시작 / Quick Start

### 1. 요구 사항 설치 / Install Requirements

필수:

- `tmux`
- `bash`
- `git`
- `fzf`

권장:

- Nerd Font
- `bat`, `tree`, `rg` 또는 유사 CLI 도구
- 시스템 클립보드 도구
  - macOS: `pbcopy`, `pbpaste`
  - Linux: `wl-copy`, `wl-paste`, `xclip`, 또는 `xsel`
- TUI 사용 시 `bun`
- 웹 터미널 사용 시 `ttyd`
- Slack bridge 사용 시 해당 스크립트가 요구하는 Node.js 계열 도구

English: tmux, Bash, Git, and fzf are the core dependencies. Bun is only needed
for the optional TUI.

### 2. 저장소 배치 / Place the Repository

권장 배치:

```bash
git clone <repository-url> ~/.tmux
```

이미 다른 위치에 clone했다면 심볼릭 링크를 사용할 수 있습니다.

```bash
ln -s /path/to/this/repository ~/.tmux
```

### 3. 실행 권한 확인 / Ensure Executables

```bash
chmod +x ~/.tmux/bin/tmux-*
```

### 4. tmux 설정 로드 / Load tmux Config

새 tmux 서버를 시작하거나 현재 서버에서 다시 로드합니다.

```bash
tmux source-file ~/.tmux/tmux.conf
```

### 5. 세션 선택기 실행 / Run the Sessionizer

```bash
~/.tmux/bin/tmux-sessionizer
```

TUI를 사용하려면:

```bash
~/.tmux/bin/tmux-sessionizer-tui
```

## 설정 / Configuration

### `sessionizer.conf`

`sessionizer.conf`는 세션 후보를 찾을 디렉터리를 정의합니다.
환경에 맞게 프로젝트 루트들을 추가하세요.

예시 형식은 실제 파일을 기준으로 수정합니다.

```bash
# sessionizer.conf
SCAN_DIR="$HOME/work"
EXTRA_DIRS="$HOME/dotfiles $HOME/personal"
```

English: Configure project discovery paths in `sessionizer.conf`.

### `tmux.conf`

`tmux.conf`는 이 저장소의 tmux 진입점입니다.

일반적으로 여기에서 다음을 확인합니다.

- prefix 키
- pane/window/session 키 바인딩
- 상태바 설정
- helper script 호출 경로
- 환경 변수 전파 방식

English: `tmux.conf` is the main runtime entry point for tmux settings and
key bindings.

### `layouts/*.yml`

`layouts/`에는 세션 레이아웃 프리셋이 있습니다.

포함된 예시:

- `default.yml`
- `proxmox.yml`
- `resume.yml`
- `safework.yml`
- `safework2.yml`
- `splunk.yml`
- `blacklist.yml`

적용:

```bash
~/.tmux/bin/tmux-layout-apply layouts/default.yml
```

정확한 인자 형식은 스크립트 도움말 또는 소스의 사용부를 확인하세요.

## 명령어 / Commands

### 세션 관리 / Session Commands

- `tmux-sessionizer`
  - `fzf` 기반 세션 검색과 생성
- `tmux-sessionizer-tui`
  - TUI 세션 관리자 실행
- `tmux-session-jump`
  - 최근 사용 세션 중심으로 빠르게 이동
- `tmux-session-cycle`
  - 세션 순환
- `tmux-session-kill`
  - 확인 절차가 있는 세션 종료
- `tmux-session-rename`
  - 세션 이름 변경
- `tmux-session-sync`
  - 세션과 외부 채널 동기화용 helper
- `tmux-session-order`
  - 최근 활성 순서 기반 세션 목록
- `tmux-session-dashboard`
  - 세션 대시보드 표시
- `tmux-session-export`
  - 현재 세션 레이아웃을 YAML로 내보내기
- `tmux-session-icon`
  - 세션 이름에 맞는 아이콘 선택
- `tmux-session-branch-log`
  - 세션과 Git 브랜치 전환 기록

### 레이아웃과 템플릿 / Layout and Template Commands

- `tmux-layout-apply`
  - YAML 레이아웃을 tmux 세션에 적용
- `tmux-template-create`
  - preset 기반 세션 생성

### 사이드바 / Sidebar Commands

- `tmux-sidebar`
  - 사이드바 렌더링
- `tmux-sidebar-init`
  - 세션 생성 시 사이드바 초기화
- `tmux-sidebar-toggle`
  - 사이드바 표시 전환

### 상태와 관측 / Status and Observability

- `tmux-responsive`
  - 터미널 폭에 따른 상태바 출력 조정
- `tmux-git-status`
  - 브랜치, dirty, ahead/behind, stash 상태 출력
- `tmux-git-uncommitted`
  - 세션별 미커밋 변경 추적
- `tmux-sys-stats`
  - CPU load와 메모리 사용량 출력
- `tmux-config-reload`
  - 설정 reload와 변경 확인
- `tmux-notify-long-command`
  - 긴 명령 완료 알림
- `tmux-bash-preexec`
  - 명령 실행 시간 측정용 shell hook

### 선택기와 생산성 / Picker and Productivity Commands

- `tmux-command-palette`
  - 자주 쓰는 작업을 `fzf`로 선택
- `tmux-url-open`
  - pane 내용에서 URL 선택 후 열기
- `tmux-file-open`
  - pane 내용에서 파일 경로 선택 후 열기
- `tmux-ssh-picker`
  - SSH config host 선택
- `tmux-clipboard-history`
  - tmux buffer 기록 선택
- `tmux-copy-word`
  - 커서 아래 단어 복사
- `tmux-pane-sync`
  - synchronize-panes 토글
- `tmux-cheatsheet`
  - 키 바인딩 요약 표시

### 통합 명령 / Integration Commands

- `tmux-auto-attach`
  - 로그인 셸에서 tmux 자동 attach 흐름
- `tmux-opencode`
  - OpenCode 세션 실행
- `tmux-slack-bridge-setup`
  - Slack bridge 설정 wizard
- `tmux-slack-bridge-start`
  - Slack bridge 시작 wrapper
- `tmux-web-terminal`
  - `ttyd` 기반 웹 터미널 실행

## TUI 사용 / TUI Usage

TUI는 `tui/sessionizer`에 있는 Bun 기반 앱입니다.

### 설치 / Install

```bash
cd ~/.tmux/tui/sessionizer
bun install
```

### 실행 / Run

루트 wrapper를 사용하는 방식:

```bash
~/.tmux/bin/tmux-sessionizer-tui
```

직접 실행하는 방식:

```bash
cd ~/.tmux/tui/sessionizer
bun run src/index.tsx
```

`package.json`에 정의된 script가 있다면 그 script를 우선 사용하세요.

```bash
bun run <script-name>
```

### TUI에서 기대되는 작업

- 세션 목록 조회
- 필터 입력
- 세션 생성 wizard
- 세션 이름 변경
- 세션 삭제 확인
- tmux 명령 호출

English: The TUI wraps tmux session actions with a keyboard-driven interface.

## 로컬 개발 / Local Development

### Bash 스크립트 개발

루트에서 작업합니다.

```bash
cd ~/.tmux
```

권장 루프:

```bash
# 문법 확인
bash -n bin/tmux-sessionizer

# 직접 실행
bin/tmux-sessionizer

# tmux 설정 다시 로드
tmux source-file tmux.conf
```

여러 스크립트를 확인하려면:

```bash
for file in bin/tmux-*; do
  [ -f "$file" ] && bash -n "$file"
done
```

`bin/lib/` 파일은 실행 파일이라기보다 source되는 공통 모듈일 수 있습니다.
수정 시 호출하는 상위 스크립트도 함께 확인하세요.

### TUI 개발

```bash
cd tui/sessionizer
bun install
bun test
```

개발 중 확인할 주요 파일:

- `src/App.tsx`
- `src/index.tsx`
- `src/lib/config.ts`
- `src/lib/tmux.ts`
- `src/actions/session-actions.ts`
- `src/components/`
- `__tests__/`

### 레이아웃 개발

새 레이아웃을 추가할 때는 `layouts/default.yml`을 기준으로 시작하세요.

```bash
cp layouts/default.yml layouts/my-layout.yml
bin/tmux-layout-apply layouts/my-layout.yml
```

권장 사항:

- 레이아웃 이름은 사용 목적이 드러나게 지정
- 환경 의존 경로는 최소화
- 개인 경로가 필요하면 placeholder나 설정 파일로 분리
- 적용 전 기존 세션을 백업하거나 테스트 세션에서 검증

## 테스트 / Testing

### Bash

현재 저장소에는 루트 수준의 표준 테스트 러너가 명시되어 있지 않습니다.
기본 검증은 다음으로 시작합니다.

```bash
bash -n bin/tmux-sessionizer
bash -n bin/tmux-layout-apply
bash -n bin/tmux-sidebar
```

전체 `bin/tmux-*` 문법 확인:

```bash
for file in bin/tmux-*; do
  [ -f "$file" ] && bash -n "$file"
done
```

가능하면 `shellcheck`도 사용하세요.

```bash
shellcheck bin/tmux-sessionizer
```

### TUI

```bash
cd tui/sessionizer
bun install
bun test
```

테스트 파일:

- `tui/sessionizer/__tests__/config.test.ts`
- `tui/sessionizer/__tests__/tmux.test.ts`

### 수동 검증 체크리스트

- `tmux source-file tmux.conf`가 오류 없이 완료되는지 확인
- `tmux-sessionizer`가 세션 후보를 표시하는지 확인
- 새 세션 생성 후 이름과 작업 디렉터리가 맞는지 확인
- `tmux-session-kill`이 확인 절차를 거치는지 확인
- `tmux-layout-apply`가 테스트 세션에서 예상 pane을 만드는지 확인
- TUI 실행, 필터, 생성, rename, kill 동작 확인
- 상태바 helper가 느리게 동작하지 않는지 확인

## 문제 해결 / Troubleshooting

### `tmux-sessionizer`에서 후보가 보이지 않음

확인할 것:

- `sessionizer.conf`의 경로가 존재하는지
- `SCAN_DIR`, `EXTRA_DIRS` 값이 현재 사용자 기준으로 올바른지
- `fzf`가 설치되어 있는지
- 스크립트 실행 권한이 있는지

```bash
command -v fzf
ls -la ~/.tmux/sessionizer.conf
```

### tmux에서 명령을 찾지 못함

`~/.tmux/bin` 경로를 확인하세요.

```bash
ls -la ~/.tmux/bin/tmux-sessionizer
```

필요하면 PATH에 추가합니다.

```bash
export PATH="$HOME/.tmux/bin:$PATH"
```

### 설정 reload 후 변화가 없음

tmux 서버가 다른 설정 파일을 읽고 있을 수 있습니다.

```bash
tmux source-file ~/.tmux/tmux.conf
tmux display-message "reloaded ~/.tmux/tmux.conf"
```

### TUI가 실행되지 않음

확인할 것:

- `bun` 설치 여부
- `tui/sessionizer`에서 `bun install` 수행 여부
- 현재 터미널이 TUI 렌더링을 지원하는지
- tmux 내부와 외부에서 각각 실행해 차이가 있는지

```bash
command -v bun
cd ~/.tmux/tui/sessionizer
bun test
```

### 아이콘이 깨져 보임

Nerd Font 또는 호환 폰트를 설치하고 터미널 폰트를 변경하세요.

### 클립보드 명령이 동작하지 않음

플랫폼별 클립보드 도구를 설치하세요.

- macOS: `pbcopy`, `pbpaste`
- Wayland: `wl-copy`, `wl-paste`
- X11: `xclip` 또는 `xsel`

## 보안과 권한 / Security and Permissions

이 저장소는 로컬 tmux 환경에서 실행되는 스크립트 모음입니다.

주의할 점:

- `bin/` 스크립트는 현재 사용자 권한으로 실행됩니다.
- 레이아웃 파일은 명령 실행과 작업 디렉터리에 영향을 줄 수 있습니다.
- 외부 통합 명령은 토큰, socket, 환경 변수를 요구할 수 있습니다.
- 개인 경로, 토큰, 내부 주소는 커밋하지 마세요.
- Slack 또는 웹 터미널 통합을 켤 때는 노출 범위를 확인하세요.

English: Treat helper scripts as local executable code. Keep secrets and
environment-specific endpoints out of commits.

## 기여 / Contributing

기여 전 [`CONTRIBUTING.md`](CONTRIBUTING.md)를 읽어주세요.

권장 기여 흐름:

1. 변경 목적을 작은 단위로 정리합니다.
2. Bash 변경은 `bash -n`과 가능하면 `shellcheck`로 확인합니다.
3. TUI 변경은 `tui/sessionizer`에서 `bun test`를 실행합니다.
4. tmux 설정 변경은 실제 tmux 세션에서 reload 후 확인합니다.
5. 레이아웃 변경은 테스트 세션에서 적용해 봅니다.
6. 사용자에게 보이는 동작이 바뀌면 README나 관련 문서를 갱신합니다.

English: Keep changes small, test both script and tmux behavior, and update
documentation for user-visible changes.

## 유지보수 / Maintainers

유지보수와 리뷰 담당자는 [`OWNERS`](OWNERS)를 기준으로 확인합니다.

문의할 때 포함하면 좋은 정보:

- 사용 중인 OS와 shell
- tmux 버전
- 실행한 명령
- 기대한 결과와 실제 결과
- 관련 `sessionizer.conf` 일부
- 오류 메시지
- TUI 문제라면 Bun 버전

```bash
tmux -V
bash --version
bun --version
```

English: Use `OWNERS` for maintainer routing and include environment details
when asking for help.

## 추가 문서 / Further Documentation

- [`CONTRIBUTING.md`](CONTRIBUTING.md)
  - 기여 규칙과 개발 절차
- [`OWNERS`](OWNERS)
  - 유지보수자와 리뷰 소유권
- [`docs/session-persistence-brainstorming.md`](docs/session-persistence-brainstorming.md)
  - 세션 지속성 아이디어
- [`docs/supermemory-governance.md`](docs/supermemory-governance.md)
  - 관련 governance 메모
- [`tui/sessionizer/package.json`](tui/sessionizer/package.json)
  - TUI script와 의존성
- [`tui/sessionizer/src/`](tui/sessionizer/src/)
  - TUI 구현
- [`layouts/`](layouts/)
  - 레이아웃 프리셋

## 라이선스 / License

라이선스는 [`LICENSE`](LICENSE)를 확인하세요.

English: See [`LICENSE`](LICENSE) for licensing terms.