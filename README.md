# tmux 생산성 도구 모음 / tmux Productivity Suite

> 큐레이션된 tmux 설정과 풍부한 생태계(보조 도구, 공유 라이브러리, 선언적 YAML 레이아웃, Bun/TypeScript 기반 TUI, Slack 브리지)를 한 저장소에 담은, 다수의 프로젝트·브랜치·원격 호스트를 다루는 파워 유저용 환경입니다.
>
> A curated, opinionated tmux configuration plus a complete ecosystem of companion tools, shared libraries, declarative YAML layouts, a Bun/TypeScript TUI, and a Slack bridge — designed for power users who juggle many projects, branches, and remote hosts.

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

### 핵심 흐름 / Core Flow

1. 셸 로그인 시 `tmux-auto-attach` 가 기존 또는 신규 세션을 자동으로 연결합니다.
2. `prefix + s`(세션나이저) 또는 `prefix + S`(TUI 세션나이저)로 세션을 선택하거나 새로 만듭니다.
3. 필요하면 `tmux-layout-apply` 로 YAML 레이아웃 템플릿을 즉시 적용합니다.
4. Slack 브리지를 켜 두면 채널 ↔ 세션이 양방향으로 동기화됩니다.
5. 설정 변경 후 `prefix + r` 로 `tmux-config-reload` 가 안전하게 다시 로드합니다.

---

## 목적 / Purpose

이 저장소는 tmux 의 기본 기능을 넘어 **세션·레이아웃·사이드바·원격 협업** 까지 한 곳에서 다루기 위한 통합 도구 모음입니다. 단일 tmux 설정을 교체하여 다음을 즉시 얻을 수 있습니다.

- **세션 중심 워크플로**: 프로젝트 디렉터리, Git 브랜치, 워크트리, 원격 SSH 호스트를 기준으로 세션을 생성·정렬·순환
- **선언적 레이아웃**: `layouts/*.yml` 로 창·분할·프로그램 구성을 코드로 보관하고 즉시 적용
- **풍부한 보조 도구**: 파일/URL/SSH/클립보드 히스토리/명령 팔레트 등 페어 프로그래밍과 점프에 필요한 입출력
- **TUI 인터페이스**: 터미널에 머무르면서 마우스 없이도 세션을 검색·생성·삭제·미리보기
- **Slack 양방향 동기화**: 채널에서 세션을 열고, 세션 출력은 채널로 스트리밍

This repository extends tmux from a multiplexer into a full **session-centric workstation**. It replaces a stock `.tmux.conf` with a curated setup that covers session lifecycle, declarative layouts, a sidebar, companion utilities, a keyboard-driven TUI, and a bidirectional Slack bridge.

---

## 패키지 구성 / Package Contents

| 경로 / Path | 역할 / Role |
| --- | --- |
| [`tmux.conf`](./tmux.conf) | 루트 로더, 전역 환경/바인딩 진입점 / Root loader and entry point |
| [`sessionizer.conf`](./sessionizer.conf) | 세션나이저 스캔 경로 설정 / SCAN_DIR + EXTRA_DIRS |
| [`bin/`](./bin/) | 38 개의 보조 스크립트 (Bash) / 38 companion scripts (Bash) |
| [`bin/lib/`](./bin/lib/) | 공유 라이브러리 (사이드바 렌더, 세션나이저 공통 모듈) / Shared libraries |
| [`layouts/`](./layouts/) | YAML 레이아웃 템플릿 8 종 / 8 YAML layout templates |
| [`tui/sessionizer/`](./tui/sessionizer/) | Bun + TypeScript + OpenTUI 기반 세션 TUI / Bun/TypeScript session TUI |
| [`docs/`](./docs/) | 설계 노트 및 거버넌스 문서 / Design notes and governance |
| [`slack/tmux-bridge/`](./slack/tmux-bridge/) | Node.js 기반 Slack ↔ tmux 양방향 브리지 / Node.js bidirectional bridge |
| [`AGENTS.md`](./AGENTS.md) | 저장소 구조와 운영 지침 (에이전트용) / Project knowledge base |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | 기여 절차 / Contribution guide |
| [`OWNERS`](./OWNERS) | 책임자 명단 / Maintainer list |
| [`LICENSE`](./LICENSE) | 라이선스 전문 / License text |

---

## 주요 기능 / Features

| 기능 / Feature | 설명 / Description |
| --- | --- |
| 세션 자동 부착 | 로그인 시 직전 세션 복구 또는 신규 세션 생성 / Auto-attach on shell login |
| 세션나이저 (fzf) | `prefix + s` 로 프로젝트/디렉터리 빠른 점프 / fzf-based session picker |
| TUI 세션나이저 | `prefix + S` 로 OpenTUI 기반 검색·생성·삭제·미리보기 / OpenTUI session browser |
| 세션 사이드바 | 좌측 트리 형태로 세션/창/분할 시각화 / Left-side tree sidebar |
| 선언적 레이아웃 | YAML 로 창·분할·명령을 정의해 한 번에 적용 / Declarative YAML layouts |
| MRU 세션 점프 | 가장 최근 사용한 세션으로 즉시 이동 / Most-recently-used session jump |
| SSH/파일/URL 픽커 | 페인 텍스트에서 호스트·경로·URL 즉시 추출 / Extract SSH hosts, paths, URLs |
| 클립보드 히스토리 | tmux 버퍼 링을 fzf 로 브라우징 / Browse tmux paste buffer ring |
| Git 상태 통합 | 세션/창에 브랜치·unstaged·ahead/behind·stash 표시 / Git status in status bar |
| 슬랙 브리지 | 채널 ↔ 세션 양방향 동기화 (소켓/터널 모드) / Bidirectional Slack bridge |
| 웹 터미널 | ttyd 로 세션을 브라우저로 노출 / Expose session as web terminal |
| 반응형 상태바 | 터미널 폭에 따라 표시 항목 자동 조정 / Width-tiered statusline |
| 명령 팔레트 | 자주 쓰는 작업을 fzf 메뉴로 호출 / fzf command palette |
| 설정 핫리로드 | `prefix + r` 로 안전하게 재로드 및 diff 표시 / Safe config reload |
| 장기 명령 알림 | 임계치 초과 명령에 데스크톱 알림 / Desktop notify on long commands |
| 키 바인딩 치트시트 | 카테고리별 단축키 팝업 / Categorized cheatsheet popup |

---

## 먼저 읽을 파일 / First Files to Read

운영자/기여자가 코드베이스를 빠르게 파악하려면 다음 순서를 권장합니다.

1. [`tmux.conf`](./tmux.conf) — 루트 진입점, 어떤 conf 와 bin 을 소싱하는지 확인
2. [`sessionizer.conf`](./sessionizer.conf) — 세션나이저가 스캔할 경로 정의
3. [`bin/tmux-sessionizer`](./bin/tmux-sessionizer) — 핵심 세션나이저 로직 (fzf + 마법사)
4. [`bin/tmux-sidebar`](./bin/tmux-sidebar) + [`bin/lib/sidebar-render`](./bin/lib/sidebar-render) — 사이드바 렌더링
5. [`layouts/default.yml`](./layouts/default.yml) — 가장 단순한 레이아웃 예시
6. [`tui/sessionizer/src/App.tsx`](./tui/sessionizer/src/App.tsx) — TUI 진입 컴포넌트
7. [`slack/tmux-bridge/`](./slack/tmux-bridge/) 의 `AGENTS.md` — 브리지 구조

---

## 진입점 및 API / Entry Points and API

### 진입 스크립트 / Entrypoint Scripts

| 명령 / Command | 용도 / Purpose |
| --- | --- |
| `tmux-auto-attach` | 로그인 셸에서 호출 / Called from shell login |
| `tmux-sessionizer` | fzf 기반 세션 선택·생성 (CLI 기본 진입) / Primary CLI entry |
| `tmux-sessionizer-tui` | TUI 세션나이저 실행 (Bun 런타임) / TUI sessionizer runner |
| `tmux-sidebar` / `tmux-sidebar-toggle` / `tmux-sidebar-init` | 사이드바 표시·토글·초기화 / Sidebar display/toggle/init |
| `tmux-session-cycle` | `PgUp`/`PgDn` 으로 세션 순환 / Cycle sessions by recency |
| `tmux-session-jump` | MRU 세션 점프 / MRU session jump |
| `tmux-session-dashboard` | 세션 표 팝업 / Session table popup |
| `tmux-session-kill` / `tmux-session-rename` | 세션 종료·이름 변경 (확인 절차 포함) / Kill / rename |
| `tmux-session-export` | 현재 세션 레이아웃을 YAML 로 내보내기 / Export layout to YAML |
| `tmux-session-sync` | tmux 세션 ↔ Slack 채널 동기화 / Sync sessions to Slack |
| `tmux-session-icon` | 세션에 Nerd Font 아이콘 매핑 / Map Nerd Font icon per session |
| `tmux-session-branch-log` | 세션-브랜치 매핑 로깅 / Log session→branch on switch |
| `tmux-template-create` | 템플릿에서 세션 즉시 생성 / Create session from template |
| `tmux-layout-apply` | YAML 레이아웃 적용 / Apply YAML layout to session |
| `tmux-responsive` | 폭별 상태바 렌더링 / Width-tiered statusline |
| `tmux-opencode` | OpenCode 세션 실행 / Launch OpenCode session |
| `tmux-command-palette` | 동작 fzf 팔레트 / fzf action palette |
| `tmux-url-open` / `tmux-file-open` / `tmux-ssh-picker` | 페인 텍스트에서 URL/경로/SSH 호스트 추출 / Extract from pane |
| `tmux-clipboard-history` | 버퍼 링 브라우저 / Paste buffer ring browser |
| `tmux-copy-word` / `tmux-pane-sync` / `tmux-config-reload` | 단어 복사 / 동기화 분할 토글 / 설정 리로드 / Word copy, sync-panes, reload |
| `tmux-notify-long-command` | 장기 명령 데스크톱 알림 / Long-command desktop notify |
| `tmux-bash-preexec` | 명령 시간 측정 훅 / Sourceable preexec hook |
| `tmux-cheatsheet` | 단축키 치트시트 / Cheatsheet popup |
| `tmux-slack-bridge-setup` / `tmux-slack-bridge-start` | Slack 앱 설정 마법사 / 시작 래퍼 / Slack app setup wizard / start wrapper |
| `tmux-git-status` / `tmux-git-uncommitted` | Git 브랜치·상태·미커밋 표시 / Git branch & uncommitted state |
| `tmux-session-order` | 최근 활성 순 정렬 / Sort sessions by activity |
| `tmux-sys-stats` | CPU·메모리 로드맵 / CPU + MEM load |
| `tmux-web-terminal` | ttyd 기반 웹 터미널 / ttyd web terminal launcher |

### 라이브러리 / Libraries

| 모듈 / Module | 제공 기능 / Provides |
| --- | --- |
| `bin/lib/tmux-sessionizer-common` | 세션나이저 공통 함수 (경로 스캔, fzf 통합) / Shared sessionizer helpers |
| `bin/lib/tmux-sessionizer-wizard` | 생성 마법사 로직 / Creation wizard logic |
| `bin/lib/sidebar-render` | 트리 렌더링 엔진 / Sidebar tree renderer |
| `bin/lib/sidebar-colors` | 사이드바 색상 정의 / Sidebar color palette |

### TUI / Slack 진입점 / TUI & Slack Entrypoints

| 경로 / Path | 설명 / Description |
| --- | --- |
| `tui/sessionizer/src/index.tsx` | TUI 부트스트랩 / TUI bootstrap |
| `tui/sessionizer/src/App.tsx` | 최상위 컴포넌트 / Top-level component |
| `tui/sessionizer/src/lib/tmux.ts` | tmux 호출 어댑터 / tmux invocation adapter |
| `tui/sessionizer/src/lib/create-session.ts` | 세션 생성 파이프라인 / Session creation pipeline |
| `tui/sessionizer/src/components/*` | 세션 목록·필터·미리보기·마법사·대화상자 / List, filter, preview, wizard, dialogs |
| `slack/tmux-bridge/` | Socket Mode 또는 Cloudflare Tunnel 기반 브리지 / Socket mode or cloudflared bridge |

---

## 빠른 시작 / Quickstart

> 일반적인 흐름: 저장소를 `~/.tmux` 로 심볼릭 링크한 뒤 tmux 를 새로 띄웁니다.

```bash
# 1. 저장소 복제
git clone <repo-url> ~/src/tmux-productivity
ln -s ~/src/tmux-productivity ~/.tmux

# 2. (선택) bin/ 을 PATH 에 추가
export PATH="$HOME/.tmux/bin:$PATH"

# 3. 세션 스캔 경로 설정
cp -n ~/.tmux/sessionizer.conf ~/.tmux/sessionizer.conf.local
$EDITOR ~/.tmux/sessionizer.conf.local  # SCAN_DIR, EXTRA_DIRS 지정

# 4. tmux 시작
tmux
```

TUI 세션나이저를 사용하려면:

```bash
cd ~/.tmux/tui/sessionizer
bun install
# TUI 실행
~/.tmux/bin/tmux-sessionizer-tui
```

Slack 브리지를 사용하려면:

```bash
~/.tmux/bin/tmux-slack-bridge-setup     # 1회: Slack 앱 자격증명 설정
~/.tmux/bin/tmux-slack-bridge-start     # tmux 세션 내에서 실행
```

자세한 키 바인딩은 tmux 안에서 `prefix + ?` 또는 `prefix + C-h` (치트시트) 로 확인하세요.

---

## 설정 / Configuration

| 파일 / File | 책임 / Responsibility |
| --- | --- |
| `tmux.conf` | 루트 로더, 환경 변수 전파, prefix / Root loader, env, prefix |
| `sessionizer.conf` | 세션나이저가 스캔할 최상위 디렉터리 / Sessionizer scan roots |
| `layouts/*.yml` | 창/분할/명령 템플릿 / Window/pane/command templates |
| `tui/sessionizer/tsconfig.json`, `bunfig.toml` | TUI 빌드/런타임 옵션 / TUI build/runtime options |
| `slack/tmux-bridge/` 내부 설정 | 토큰, 채널 매핑, 터널 모드 / Tokens, channel mapping, tunnel mode |

> 환경별 시크릿은 저장소 외부(예: `~/.tmux/sessionizer.conf.local`, Slack 자격증명)에 보관하세요.

---

## 명령어 레퍼런스 / Commands Reference

| 카테고리 / Category | 명령 / Command | 단축키 / Shortcut (대표) |
| --- | --- | --- |
| 세션 / Sessions | `tmux-sessionizer`, `tmux-sessionizer-tui` | `prefix + s`, `prefix + S` |
| 세션 / Sessions | `tmux-session-jump`, `tmux-session-cycle` | MRU 점프, `PgUp`/`PgDn` |
| 세션 / Sessions | `tmux-session-dashboard`, `tmux-session-kill`, `tmux-session-rename` | 대시보드, 종료, 이름 변경 |
| 레이아웃 / Layouts | `tmux-template-create`, `tmux-layout-apply`, `tmux-session-export` | 템플릿/적용/내보내기 |
| 사이드바 / Sidebar | `tmux-sidebar`, `tmux-sidebar-toggle`, `tmux-sidebar-init` | 표시, 토글, 초기화 |
| 입출력 / I/O | `tmux-url-open`, `tmux-file-open`, `tmux-ssh-picker`, `tmux-clipboard-history`, `tmux-copy-word` | URL, 경로, SSH, 버퍼, 단어 |
| 협업 / Collaboration | `tmux-session-sync`, `tmux-slack-bridge-start` | Slack 양방향 |
| 상태 / Status | `tmux-git-status`, `tmux-git-uncommitted`, `tmux-sys-stats`, `tmux-responsive` | Git, 시스템, 반응형 |
| 메타 / Meta | `tmux-config-reload`, `tmux-command-palette`, `tmux-cheatsheet` | 리로드, 팔레트, 치트시트 |
| 알림 / Notify | `tmux-notify-long-command`, `tmux-bash-preexec` | 데스크톱 알림, 시간 측정 |
| 부가 / Extra | `tmux-opencode`, `tmux-web-terminal`, `tmux-auto-attach` | OpenCode, ttyd, 자동 부착 |

> 정확한 키 매핑은 `tmux.conf` 및 `bin/tmux-cheatsheet` 의 카테고리 정의를 참조하세요.

---

## 로컬 개발 / Local Development

| 단계 / Step | 명령 / Command |
| --- | --- |
| 저장소 준비 | `git clone … && ln -s … ~/.tmux` |
| Bash 스크립트 검사 | `bash -n bin/<script>` (구문 검사) / `shellcheck bin/<script>` (권장) |
| TUI 의존성 설치 | `cd tui/sessionizer && bun install` |
| TUI 타입 검사 | `cd tui/sessionizer && bun run tsc --noEmit` |
| TUI 단위 테스트 | `cd tui/sessionizer && bun test` |
| Slack 브리지 의존성 | `cd slack/tmux-bridge && npm install` |
| Slack 브리지 테스트 | 저장소 내 GitLab CI `.gitlab-ci.yml` 참조 |
| 설정 리로드 | tmux 안에서 `prefix + r` |

### 디렉터리 구조 (실제) / Actual Layout

| 경로 / Path | 설명 / Description |
| --- | --- |
| `AGENTS.md`, `CONTRIBUTING.md`, `LICENSE`, `OWNERS`, `README.md` | 메타 문서 / Meta documents |
| `tmux.conf`, `sessionizer.conf` | 루트 설정 / Root configs |
| `bin/`, `bin/lib/` | Bash 도구 및 라이브러리 / Bash tools & libs |
| `layouts/` | YAML 레이아웃 템플릿 / YAML layout templates |
| `tui/sessionizer/` | Bun + TypeScript TUI / Bun + TypeScript TUI |
| `docs/` | 설계 노트 / Design notes |
| `slack/tmux-bridge/` | Node.js Slack 브리지 / Node.js Slack bridge |

---

## 테스트 / Testing

| 영역 / Area | 도구 / Tool | 명령 / Command |
| --- | --- | --- |
| TUI 단위 테스트 | Bun Test | `cd tui/sessionizer && bun test` |
| TUI 타입 검사 | tsc | `cd tui/sessionizer && bun run tsc --noEmit` |
| Slack 브리지 CI | GitLab CI (`.gitlab-ci.yml`) | 저장소 내 정의 참조 / See repo |
| Bash 스크립트 구문 | `bash -n`, `shellcheck` | `bash -n bin/<script>` |

---

## 기여 절차 / Contributing

1. 이슈 또는 변경 의도를 [`CONTRIBUTING.md`](./CONTRIBUTING.md) 에 따라 정리
2. 포크 후 feature 브랜치 생성
3. Bash 스크립트 변경 시 `shellcheck` 와 `bash -n` 통과
4. TUI 변경 시 `bun test` 와 타입 검사 통과
5. PR 제출 시 변경 요약 + 수동 검증 절차 명시
6. [`OWNERS`](./OWNERS) 의 리뷰어에게 승인 요청

---

## 상태 / Status

| 항목 / Item | 상태 / State |
| --- | --- |
| 운영 안정성 / Stability | 개인 워크스테이션에서 안정 운영 중 / Stable on personal workstations |
| 호환성 / Compatibility | tmux ≥ 3.2, Bash ≥ 4, Bun ≥ 1.1, Node.js ≥ 18 |
| 외부 의존 / External deps | fzf, tmux, ttyd (선택), Bun, Node.js, Slack 앱 자격증명 (선택) |
| 보안 / Security | 시크릿은 저장소 외부 보관, Slack 토큰은 setup 마법사 사용 / Keep secrets out of VCS |
| 로드맵 / Roadmap | [`docs/session-persistence-brainstorming.md`](./docs/session-persistence-brainstorming.md) 참조 |
| 거버넌스 / Governance | [`docs/supermemory-governance.md`](./docs/supermemory-governance.md) 참조 |

---

## 소유자 및 연락처 / Maintainers and Points of Contact

- 책임자 명단: [`OWNERS`](./OWNERS)
- 기여 절차: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- 버그/질문: 저장소 이슈 트래커 사용 / Use the repository issue tracker

---

## 추가 문서 / Further Documentation

| 문서 / Document | 내용 / Contents |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | 저장소 지식 베이스, 구조와 운영 노트 / Project knowledge base |
| [`docs/session-persistence-brainstorming.md`](./docs/session-persistence-brainstorming.md) | 세션 영속화 아이디어 정리 / Session persistence brainstorming |
| [`docs/supermemory-governance.md`](./docs/supermemory-governance.md) | 메모리 거버넌스 정책 / Memory governance policy |
| [`tui/sessionizer/AGENTS.md`](./tui/sessionizer/AGENTS.md) | TUI 전용 노트 / TUI-specific notes |
| [`slack/tmux-bridge/AGENTS.md`](./slack/tmux-bridge/AGENTS.md) | Slack 브리지 노트 / Slack bridge notes |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | 기여 가이드 / Contribution guide |
| [`LICENSE`](./LICENSE) | 라이선스 / License |

---

## 라이선스 / License

[`LICENSE`](./LICENSE) 파일을 참조하세요. See [`LICENSE`](./LICENSE).