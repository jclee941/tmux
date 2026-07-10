# tmux — Bash-first tmux 설정 & 세션 툴킷

[![License](LICENSE)](LICENSE) [![Maintainers](OWNERS)](OWNERS) [![Contributing](CONTRIBUTING.md)](CONTRIBUTING.md) [![Docs](docs/)](docs/session-persistence-brainstorming.md)

## 개요 / Overview

`~/.tmux` 로 심볼릭 링크하여 쓰는 Bash 위주의 tmux 환경입니다. fzf 세션 선택기, 트리 사이드바, Tokyo Night 테마, YAML 레이아웃 템플릿, Slack 양방향 브리지, Bun/OpenTUI 세션 TUI 를 한 묶음으로 제공합니다.

Bash-first tmux configuration + session toolkit, designed to be symlinked as `~/.tmux`. Combines fzf session pickers, a tree sidebar, Tokyo Night theming, YAML layout templates, a bidirectional Slack bridge, and a Bun/OpenTUI session TUI in one tree.

## 상태 (Status)

| 항목 | 값 |
| --- | --- |
| 기본 prefix | `C-a` (재바인딩 가능) |
| 셸 런타임 | Bash 4+ (필수 유틸리티: `tmux`, `fzf`, `git`, `sk?`, `bat?`) |
| 세션 선택기 (TUI) | Bun + OpenTUI (`tui/sessionizer/`) |
| 세션 선택기 (CLI) | `tmux-sessionizer` (fzf) |
| 테마 | Tokyo Night 팔레트 |
| 레이아웃 템플릿 | `layouts/*.yml` |
| Slack 브리지 | 듀얼 모드 (소켓 직접 / HTTP cloudflared) — `slack/tmux-bridge/` |
| 자동화 | GitLab CI (`slack-bridge` 잡) |
| 영속 상태 | production-ready 개인 툴킷 |
| 라이선스 | [`LICENSE`](LICENSE) 참조 |
| 기여 절차 | [`CONTRIBUTING.md`](CONTRIBUTING.md) 참조 |
| 책임 운영자 | [`OWNERS`](OWNERS) 참조 |

## 빠른 흐름 (Operator quick path)

1. 저장소를 `~/.tmux/` 로 clone 하거나 심볼릭 링크합니다.
2. 기존 `~/.tmux.conf` 끝에 `source ~/.tmux/tmux.conf` 를 추가합니다.
3. 셸에서 `tmux` 실행 → 자동 attach 또는 첫 세션 생성 위저드.
4. `prefix g` 로 `tmux-sessionizer` (fzf) 또는 `tmux-sessionizer-tui` (OpenTUI)를 호출합니다.
5. `tmux-template-create <name>` 또는 `tmux-layout-apply <name>` 로 `layouts/*.yml` 을 적용합니다.
6. 선택적으로 `tmux-slack-bridge-setup` → `tmux-slack-bridge-start` 로 Slack 양방향 동기화를 시작합니다.

## 목차 (Table of Contents)

- [목적 / 패키지 구성](#목적--패키지-구성-purpose--package-contents)
- [상태 (Status)](#상태-status)
- [먼저 읽을 파일](#먼저-읽을-파일-first-files-to-read)
- [API 및 진입점](#api-및-진입점-api--entry-points)
- [빠른 시작](#빠른-시작-quickstart)
- [명령어 레퍼런스](#명령어-레퍼런스-commands-reference)
- [로컬 개발](#로컬-개발-local-development)
- [테스트](#testing)
- [컨트리뷰션 / 운영자](#컨트리뷰션--운영자-contributing--maintainers)
- [추가 문서](#추가-문서-further-documentation)

## 목적 / 패키지 구성 (Purpose / Package Contents)

핵심은 셸에서 직접 호출되는 `bin/*` 스크립트와, tmux 가 로드하는 `conf.d/*.conf` 조각들입니다. UI, 상태바, 알림, 자동화 훅이 모두 같은 트리 정렬로 묶여 있습니다.

| 영역 | 위치 | 책임 |
| --- | --- | --- |
| 루트 로더 | [`tmux.conf`](tmux.conf) | `conf.d/*.conf` 를 정해진 순서로 소싱 |
| 세션 스캔 설정 | [`sessionizer.conf`](sessionizer.conf) | `SCAN_DIR`, `EXTRA_DIRS` |
| 핵심 동작 | `conf.d/` (AGENTS.md 기술) | 키, 테마, 사이드바, 성능 베이스라인 |
| 실행 스크립트 | [`bin/`](bin/) | 세션, 사이드바, 상태바, 알림 |
| 공용 라이브러리 | [`bin/lib/`](bin/lib/) | 세션·사이드바 공통 함수 |
| 레이아웃 템플릿 | [`layouts/`](layouts/) | 분할 창 + 시작 명령 프리셋 |
| TUI 앱 | [`tui/sessionizer/`](tui/sessionizer/) | Bun + OpenTUI 세션 선택기 |
| Slack 브리지 | [`slack/tmux-bridge/`](slack/tmux-bridge/) | tmux ↔ Slack 양방향 동기화 |
| 설계 메모 | [`docs/`](docs/) | 영속화, 거버넌스 brainstorm |

## 먼저 읽을 파일 (First Files to Read)

1. [`tmux.conf`](tmux.conf) — 루트 로더. `conf.d/*.conf` 를 어떤 순서로 합치는지 확인합니다.
2. [`sessionizer.conf`](sessionizer.conf) — 세션 선택기가 어디를 스캔하는지 정의합니다 (`SCAN_DIR`, `EXTRA_DIRS`).
3. [`bin/tmux-sessionizer`](bin/tmux-sessionizer) — fzf 기반 메인 진입점, [`bin/lib/tmux-sessionizer-common`](bin/lib/tmux-sessionizer-common) 와 [`tmux-sessionizer-wizard`](bin/lib/tmux-sessionizer-wizard) 를 호출합니다.
4. [`bin/tmux-sidebar`](bin/tmux-sidebar) — 트리 사이드바 엔진. [`bin/lib/sidebar-render`](bin/lib/sidebar-render) 와 [`bin/lib/sidebar-colors`](bin/lib/sidebar-colors) 로 분리되어 있습니다.
5. [`layouts/default.yml`](layouts/default.yml) — 레이아웃 템플릿 최소 예시, `tmux-layout-apply` 의 입력 형식입니다.

## API 및 진입점 (API / Entry Points)

| 진입점 | 종류 | 기본 키 | 책임 |
| --- | --- | --- | --- |
| `tmux-sessionizer` | CLI (fzf) | `prefix g` | 세션 검색 + 생성 위저드 분기 |
| `tmux-sessionizer-tui` | TUI (Bun OpenTUI) | 동일 슬롯 | 키보드 단축 위주 세션 TUI |
| `tmux-sidebar` | tmux display-popup | `prefix Tab` | 창·세션 트리 사이드바 |
| `tmux-session-dashboard` | tmux display-popup | `prefix S` | 모든 세션의 정렬 테이블 |
| `tmux-command-palette` | fzf picker | 사용자 정의 | 세션·레이아웃·액션 팔레트 |
| `tmux-cheatsheet` | tmux display-popup | `prefix ?` | 카테고리별 키바인딩 도움말 |
| `tmux-slack-bridge-start` | 백그라운드 프로세스 | 수동 | 소켓 직접 또는 HTTP cloudflared 모드 |
| `layouts/*.yml` | 데이터 | `tmux-layout-apply <name>` 입력 | 분할 + 시작 명령 프리셋 |
| `sessionizer.conf` | 설정 | — | `SCAN_DIR`, `EXTRA_DIRS` |

## 빠른 시작 (Quickstart)

### 1. 설치

```bash
git clone <repo-url> ~/.tmux
echo 'source ~/.tmux/tmux.conf' >> ~/.tmux.conf
tmux kill-server 2>/dev/null || true
tmux
```

또는 심볼릭 링크 모드:

```bash
ln -s "$(pwd)" ~/.tmux
```

### 2. 첫 세션과 대시보드

1. `tmux` 실행 → 안내에 따라 첫 세션 이름을 입력합니다.
2. `prefix g` 로 fzf 또는 OpenTUI 세션 선택기를 호출합니다.
3. `prefix S` 로 전체 세션 정렬 대시보드를 확인합니다.

### 3. 레이아웃 템플릿

```bash
tmux-template-create proxmox      # layouts/proxmox.yml 적용 후 진입
tmux-layout-apply splunk          # 현재 세션 레이아웃 덮어쓰기
```

번들 템플릿:

| 파일 | 용도 |
| --- | --- |
| [`layouts/default.yml`](layouts/default.yml) | 기본 2~3 페인 분할 |
| [`layouts/proxmox.yml`](layouts/proxmox.yml) | Proxmox 운영 콘솔 |
| [`layouts/splunk.yml`](layouts/splunk.yml) | Splunk 검색·인덱서 페어 |
| [`layouts/safework.yml`](layouts/safework.yml), [`layouts/safework2.yml`](layouts/safework2.yml) | 격리 작업 환경 |
| [`layouts/resume.yml`](layouts/resume.yml) | 창 레이아웃 복원용 |
| [`layouts/blacklist.yml`](layouts/blacklist.yml) | 세션 선택기 제외 규칙 |

### 4. Slack 브리지 (선택)

```bash
tmux-slack-bridge-setup    # Slack 앱 토큰/시크릿 입력 위저드
tmux-slack-bridge-start    # 로컬 소켓 또는 cloudflared HTTP 모드 선택
```

상세 듀얼 모드 진입점은 [`slack/tmux-bridge/AGENTS.md`](slack/tmux-bridge/AGENTS.md) 를 참조하세요.

### 5. TUI (Bun)

```bash
cd tui/sessionizer
bun install
bun run dev                 # 개발 실행
bun test                    # bun test (vitest 호환)
```

## 명령어 레퍼런스 (Commands Reference)

세션 수명주기 (Session lifecycle)

| 명령 | 요약 |
| --- | --- |
| `tmux-sessionizer` | fzf 세션 검색 + 생성 위저드 |
| `tmux-sessionizer-tui` | OpenTUI 세션 검색 + 생성 |
| `tmux-session-cycle` | PgUp/PgDn 회전 (opencode 제외) |
| `tmux-session-kill` | 확인 후 안전 종료 |
| `tmux-session-rename` | 충돌 검증과 함께 이름 변경 |
| `tmux-session-jump` | MRU 기반 fzf 점프 |
| `tmux-session-dashboard` | 정렬 테이블 팝업 |
| `tmux-session-order` | 최근 활성 순 정렬 |
| `tmux-session-export` | 현재 레이아웃을 YAML 로 내보내기 |
| `tmux-session-branch-log` | 세션↔브랜치 전환 로그 |
| `tmux-session-sync` | tmux 세션을 Slack 채널과 동기화 |
| `tmux-session-icon` | Nerd Font 아이콘 매퍼 |
| `tmux-template-create` | 프리셋 세션 빠른 생성 |
| `tmux-layout-apply` | YAML 레이아웃 적용 |
| `tmux-auto-attach` | 로그인 셸 자동 attach |
| `tmux-opencode` | OpenCode 세션 런처 |

사이드바 (Sidebar UI)

| 명령 | 요약 |
| --- | --- |
| `tmux-sidebar` | 트리 표시 |
| `tmux-sidebar-init` | 세션 생성 시 자동 초기화 |
| `tmux-sidebar-toggle` | 가시성 토글 |

상태바 / 위젯 (Status bar widgets)

| 명령 | 요약 |
| --- | --- |
| `tmux-sys-stats` | CPU 부하 + 메모리 |
| `tmux-git-status` | 브랜치, dirty/ahead/behind/stash |
| `tmux-git-uncommitted` | 세션당 미커밋 추적 |
| `tmux-responsive` | 폭 단계별 상태바 렌더링 |

클립보드 / 네비게이션

| 명령 | 요약 |
| --- | --- |
| `tmux-clipboard-history` | tmux 버퍼 링 |
| `tmux-copy-word` | 커서 단어 복사 |
| `tmux-url-open` | fzf URL 추출 |
| `tmux-file-open` | fzf 파일 경로 추출 |
| `tmux-ssh-picker` | `~/.ssh/config` 호스트 피커 |
| `tmux-web-terminal` | ttyd 웹 터미널 런처 |

자동화 / 훅

| 명령 | 요약 |
| --- | --- |
| `tmux-pane-sync` | synchronize-panes 토글 |
| `tmux-config-reload` | 설정 리로드 (diff 표시) |
| `tmux-notify-long-command` | 데스크톱 알림 |
| `tmux-bash-preexec` | 셸 preexec 소싱 훅 |

브리지 / 도움말

| 명령 | 요약 |
| --- | --- |
| `tmux-slack-bridge-start` | 듀얼 모드 시작 (소켓/HTTP) |
| `tmux-slack-bridge-setup` | 셋업 위저드 |
| `tmux-command-palette` | fzf 액션 팔레트 |
| `tmux-cheatsheet` | 키바인딩 도움말 |

## 로컬 개발 (Local Development)

- Bash 4+ 표준 POSIX 유틸리티와 `tmux`, `fzf` 위에 동작합니다. (선택: `sk`, `bat`, `fzf-git`, `nerd-font`).
- 사이드바는 `bin/lib/sidebar-render` 와 `bin/lib/sidebar-colors` 를 `source` 하여 재사용됩니다.
- `conf.d/` 변경 후에는 `prefix r` 또는 `tmux-config-reload` 로 즉시 반영합니다.
- 새 레이아웃은 `layouts/<name>.yml` 추가 후 `tmux-layout-apply <name>` 으로 즉시 검증합니다.
- 슬랙 브리지 작업 시 [`slack/tmux-bridge/AGENTS.md`](slack/tmux-bridge/AGENTS.md) 의 듀얼 모드 진입점을 먼저 확인하세요.

## 테스트 (Testing)

TUI 세션 선택기에는 Bun 테스트가 포함되어 있습니다.

```bash
cd tui/sessionizer
bun install
bun test
```

| 테스트 | 검증 범위 |
| --- | --- |
| [`tui/sessionizer/__tests__/config.test.ts`](tui/sessionizer/__tests__/config.test.ts) | `src/lib/config.ts` 의 디렉터리 규칙 로직 |
| [`tui/sessionizer/__tests__/tmux.test.ts`](tui/sessionizer/__tests__/tmux.test.ts) | `src/lib/tmux.ts` 의 세션 명령 빌더 |

Slack 브리지는 AGENTS.md 가 언급하는 GitLab CI 에서 별도 검증됩니다.

## 컨트리뷰션 / 운영자 (Contributing & Maintainers)

- 기여 절차: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 책임 운영자: [`OWNERS`](OWNERS)
- 이슈/PR 전 [`AGENTS.md`](AGENTS.md) 의 구조·책임 표와 내부 `AGENTS.md` 들을 다시 한 번 확인해 주세요.

## 추가 문서 (Further Documentation)

- [`AGENTS.md`](AGENTS.md) — 프로젝트 지식 베이스, 스크립트 책임·LOC 표
- [`docs/session-persistence-brainstorming.md`](docs/session-persistence-brainstorming.md) — 영속화 설계 메모
- [`docs/supermemory-governance.md`](docs/supermemory-governance.md) — 거버넌스 노트
- [`tui/sessionizer/AGENTS.md`](tui/sessionizer/AGENTS.md) — TUI 내부 책임 구조
- [`slack/tmux-bridge/AGENTS.md`](slack/tmux-bridge/AGENTS.md) — 브리지 듀얼 모드 진입점
- [`LICENSE`](LICENSE) — 라이선스 전문