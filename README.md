# tmux 워크스페이스

[![tmux](https://img.shields.io/badge/tmux-%E2%9D%96-1BB91A)](https://github.com/tmux/tmux)
[![Bun](https://img.shields.io/badge/Bun-runtime-f9f1e1)](https://bun.sh)
[![License](https://img.shields.io/badge/license-OWNERS-lightgrey)](./OWNERS)
[![AGENTS.md](https://img.shields.io/badge/AI-AGENTS.md-blue)](./AGENTS.md)

## 한국어 요약

Bash-first tmux 설정과 세션 관리 도구 모음입니다. 핵심 진입점은 루트의 `tmux.conf`와 `sessionizer.conf`이며, `bin/` 디렉터리의 30여 개 셸 스크립트가 세션·사이드바·레이아웃·상태 표시·Git·Slack 기능을 제공합니다. 부가 워크스페이스로 Bun/OpenTUI 기반 TUI 세션라이저(`tui/sessionizer`)와 Node.js 슬랙 브리지(`slack/tmux-bridge`)가 포함됩니다. 모든 설정은 일반적으로 `~/.tmux`로 심볼릭 링크되어 즉시 사용할 수 있습니다.

## English Summary

A bash-first tmux configuration and session-management toolkit. The root `tmux.conf` and `sessionizer.conf` load a layered config, while `bin/` provides ~30 shell helpers for session, sidebar, layout, status, Git and Slack workflows. Two nested workspaces extend the toolkit: a Bun/OpenTUI TUI sessionizer and a Node.js Slack bridge. The repo is typically symlinked to `~/.tmux` for immediate use.

---

## 빠른 상태 표 / Quick Status

| 항목 | 값 |
| --- | --- |
| 제품 성격 | tmux 설정 + 보조 스크립트 모음 (워크스페이스) |
| 설정 진입점 | `tmux.conf`, `sessionizer.conf` |
| 핵심 스크립트 | `bin/tmux-sessionizer`, `bin/tmux-sidebar`, `bin/tmux-layout-apply` |
| 보조 워크스페이스 | `tui/sessionizer` (Bun + OpenTUI), `slack/tmux-bridge` (Node.js) |
| 레이아웃 템플릿 | `layouts/*.yml` (default, proxmox, resume, safework, splunk 등) |
| 핵심 라이브러리 | `bin/lib/sidebar-render`, `bin/lib/tmux-sessionizer-common` |
| 권장 설치 방식 | `ln -s "$PWD" ~/.tmux` 후 `~/.tmux.conf` → `~/.tmux/tmux.conf` |
| 문서 | `docs/session-persistence-brainstorming.md`, `docs/supermemory-governance.md` |
| CI/테스트 | `tui/sessionizer/__tests__/*.test.ts` (bun test) |
| 유지보수자 | `OWNERS` 파일 참조 |

---

## 흐름 요약 / Flow at a Glance

1. 셸 시작 → `~/.tmux/tmux.conf` 소스 → `sessionizer.conf` 로드 → tmux 서버 기동
2. 새 세션 → `bin/tmux-sessionizer` 또는 `bin/tmux-sessionizer-tui` 실행
3. 템플릿 기반 생성 → `bin/tmux-template-create` → `bin/tmux-layout-apply`로 레이아웃 적용
4. 세션 사이클 → `tmux-session-cycle`(PgUp/PgDn), 점프 → `tmux-session-jump`(fzf MRU)
5. 종료 시 정리 → `tmux-session-branch-log`, `tmux-session-export`로 상태 기록

---

## 목차 / Table of Contents

- [목적 / Purpose](#목적--purpose)
- [패키지 구성 / Package Contents](#패키지-구성--package-contents)
- [상태 / Status](#상태--status)
- [첫 번째로 읽을 파일 / First Files to Read](#첫-번째로-읽을-파일--first-files-to-read)
- [진입점 / Entry Points](#진입점--entry-points)
- [빠른 시작 / Quickstart](#빠른-시작--quickstart)
- [명령어 레퍼런스 / Commands Reference](#명령어-레퍼런스--commands-reference)
- [레이아웃 / Layout Templates](#레이아웃--layout-templates)
- [로컬 개발 / Local Development](#로컬-개발--local-development)
- [테스트 / Testing](#테스트--testing)
- [유지보수자 / Maintainers](#유지보수자--maintainers)
- [추가 문서 / Further Documentation](#추가-문서--further-documentation)

---

## 목적 / Purpose

이 저장소는 tmux를 “단순 멀티플렉서”가 아닌 **세션 단위 작업 환경**으로 다루기 위한 설정·스크립트 모음입니다. 다음과 같은 일을 합니다.

- **세션을 1급 객체로 관리**: 검색, 점프, 순환, 이름 변경, 종료, 레이아웃 적용, 내보내기
- **사이드바/상태표시줄 자동 렌더링**: 세션·Git·시스템 통계 통합 표시
- **템플릿 기반 워크스페이스**: Proxmox, Splunk, Safework 등 환경별 YAML 레이아웃
- **외부 시스템 연동**: Slack 채널 ↔ tmux 세션 동기화, OpenCode 런처, SSH 호스트 픽커
- **개발자 워크플로 보조**: Git 상태, 미커밋 추적, URL/파일 추출, 클립보드 히스토리

### 대상 사용자

- 여러 프로젝트/클라이언트 세션을 동시에 다루는 SRE·플랫폼·보안 엔지니어
- tmux를 “원격 작업 환경”으로 매일 운영하는 사용자
- 세션·창·패인 정렬을 코드로 관리하고 싶은 팀

---

## 패키지 구성 / Package Contents

루트와 주요 디렉터리만 표기합니다. 상세 트리는 [`AGENTS.md`](./AGENTS.md)를 참고하세요.

| 경로 | 역할 |
| --- | --- |
| `tmux.conf` | 루트 로더, `conf.d/*.conf` 소싱 (저장소 트리 외부, 사용 환경에서 관리) |
| `sessionizer.conf` | 세션 검색 경로 (`SCAN_DIR`, `EXTRA_DIRS`) |
| `OWNERS` | 코드 오너십 |
| `AGENTS.md` | AI/자동화 에이전트를 위한 지식 베이스 |
| `CONTRIBUTING.md` | 기여 가이드 |
| `bin/` | 38개 셸 스크립트 (세션, 사이드바, 레이아웃, Git, Slack, 유틸) |
| `bin/lib/` | 공유 라이브러리 (사이드바 렌더링, 세션라이저 공통 로직) |
| `layouts/` | YAML 레이아웃 템플릿 7종 |
| `tui/sessionizer/` | Bun + React(OpenTUI) 기반 TUI 세션라이저 |
| `slack/tmux-bridge/` | Node.js 슬랙 ↔ tmux 브리지 |
| `docs/` | 설계 노트 및 거버넌스 문서 |

---

## 상태 / Status

| 영역 | 상태 | 비고 |
| --- | --- | --- |
| 루트 tmux 설정 | 운영 환경 사용 | 사용자가 `~/.tmux`로 심볼릭 링크 |
| `bin/*` 스크립트 | 안정 | 추가 스크립트 자주 확장 |
| `tui/sessionizer` | 베타 | Bun 런타임 필요, bun test 통과 |
| `slack/tmux-bridge` | 베타 | Cloudflare Tunnel 또는 직접 소켓 모드 |
| 외부 의존성 | `tmux`, `fzf`, `git`, `gh` (선택), `Bun`, `Node.js` | 환경별 가이드 별도 |

> 프로덕션/개발 준비 여부는 사용자의 로컬 설정과 배포 방식에 따라 달라집니다. 본 저장소는 “개인/팀 워크스페이스 템플릿”으로 운영됩니다.

---

## 첫 번째로 읽을 파일 / First Files to Read

순서대로 읽으면 전체 구조가 빠르게 보입니다.

1. [`tmux.conf`](./tmux.conf) — 설정 로더와 키바인딩 베이스라인
2. [`sessionizer.conf`](./sessionizer.conf) — 세션 검색 스코프
3. [`bin/tmux-sessionizer`](./bin/tmux-sessionizer) — 핵심 진입 스크립트
4. [`bin/tmux-sidebar`](./bin/tmux-sidebar) — 사이드바 렌더링 엔진
5. [`layouts/default.yml`](./layouts/default.yml) — 기본 레이아웃 템플릿
6. [`AGENTS.md`](./AGENTS.md) — 저장소 구조와 스크립트 LOC 요약

---

## 진입점 / Entry Points

| 진입점 | 용도 | 호출 예시 |
| --- | --- | --- |
| `bin/tmux-sessionizer` | fzf 기반 세션 선택/생성 | `prefix + s` |
| `bin/tmux-sessionizer-tui` | OpenTUI 기반 세션 관리 | `prefix + S` (대문자) |
| `bin/tmux-sidebar-toggle` | 사이드바 토글 | `prefix + Tab` |
| `bin/tmux-layout-apply` | YAML 레이아웃 적용 | `:layout-apply default` |
| `bin/tmux-session-dashboard` | 세션 대시보드 팝업 | `prefix + D` |
| `bin/tmux-command-palette` | fzf 액션 팔레트 | `prefix + Space` |
| `bin/tmux-template-create` | 템플릿 세션 생성 | `:template-create proxmox` |
| `tui/sessionizer` | GUI 스타일 세션라이저 | `bun run tui/sessionizer` |
| `slack/tmux-bridge` | Slack 동기화 데몬 | `bin/tmux-slack-bridge-start` |

> 키바인딩은 `tmux.conf`의 prefix(`C-a`)에 매핑되어 있습니다.

---

## 빠른 시작 / Quickstart

### 1. 사전 요구사항

- tmux 3.x 이상
- fzf (세션/파일/URL 픽커 전반 사용)
- git
- (선택) Bun — TUI 세션라이저 실행 시
- (선택) Node.js + tsx — 슬랙 브리지 실행 시

### 2. 설치

```bash
# 저장소를 홈 디렉터리로 심볼릭 링크
ln -s "<repo-root>" "$HOME/.tmux"

# tmux이 .tmux.conf를 참조하도록 설정
ln -sf "$HOME/.tmux/tmux.conf" "$HOME/.tmux.conf"

# 환경에 맞게 sessionizer.conf의 SCAN_DIR, EXTRA_DIRS 수정
$EDITOR "$HOME/.tmux/sessionizer.conf"
```

### 3. 첫 세션

```bash
# tmux 서버 시작 (또는 새 셸에서 자동 attach)
tmux

# prefix + s   → 세션 선택/생성 (fzf)
# prefix + Tab → 사이드바 토글
# prefix + d   → 세션 대시보드
```

### 4. 레이아웃 적용

```bash
# 미리 정의된 템플릿으로 세션 생성 + 레이아웃 적용
bin/tmux-template-create proxmox
bin/tmux-layout-apply proxmox
```

### 5. TUI 세션라이저

```bash
cd tui/sessionizer
bun install
bun run start
```

### 6. Slack 브리지 (선택)

```bash
bin/tmux-slack-bridge-setup   # 1회성 인터랙티브 셋업
bin/tmux-slack-bridge-start   # 데몬 시작
```

---

## 명령어 레퍼런스 / Commands Reference

모든 스크립트는 `bin/`에 있으며, `PATH` 또는 절대 경로로 실행합니다.

### 세션 관리

| 스크립트 | 설명 |
| --- | --- |
| `tmux-sessionizer` | fzf 세션 선택 + 생성 마법사 |
| `tmux-sessionizer-tui` | OpenTUI 래퍼 실행 |
| `tmux-session-cycle` | PgUp/PgDn 세션 회전 (opencode 제외) |
| `tmux-session-jump` | MRU 기반 fzf 점프 |
| `tmux-session-kill` | 확인 후 안전 종료 |
| `tmux-session-rename` | 검증 포함 이름 변경 |
| `tmux-session-order` | 최근 활동 순 정렬 |
| `tmux-session-icon` | Nerd Font 아이콘 매핑 |
| `tmux-session-export` | 세션 레이아웃 → YAML |
| `tmux-session-dashboard` | 정렬된 세션 테이블 팝업 |
| `tmux-session-branch-log` | 세션→브랜치 전환 로그 |
| `tmux-session-sync` | tmux ↔ Slack 채널 동기화 |
| `tmux-auto-attach` | 로그인 셸 자동 attach |
| `tmux-opencode` | OpenCode 세션 런처 |

### 사이드바 / Sidebar

| 스크립트 | 설명 |
| --- | --- |
| `tmux-sidebar` | 트리 사이드바 표시 엔진 |
| `tmux-sidebar-init` | 세션 생성 시 초기화 |
| `tmux-sidebar-toggle` | 가시성 토글 |
| `lib/sidebar-render` | 렌더링 코어 |
| `lib/sidebar-colors` | 색상 정의 |

### 레이아웃 / Layout

| 스크립트 | 설명 |
| --- | --- |
| `tmux-layout-apply` | YAML 레이아웃 적용 |
| `tmux-template-create` | 템플릿에서 세션 생성 |
| `tmux-responsive` | 폭 등급별 상태표시줄 |

### 상태 표시 / Status

| 스크립트 | 설명 |
| --- | --- |
| `tmux-sys-stats` | CPU/MEM |
| `tmux-git-status` | 브랜치/dirty/ahead/behind/stash |
| `tmux-git-uncommitted` | 세션별 미커밋 추적 |

### 유틸리티 / Utilities

| 스크립트 | 설명 |
| --- | --- |
| `tmux-command-palette` | fzf 액션 팔레트 |
| `tmux-url-open` | URL 추출 후 열기 |
| `tmux-file-open` | 파일 경로 추출 후 열기 |
| `tmux-ssh-picker` | SSH config 호스트 픽커 |
| `tmux-clipboard-history` | tmux 버퍼 히스토리 |
| `tmux-copy-word` | 커서 단어 복사 |
| `tmux-pane-sync` | synchronize-panes 토글 |
| `tmux-config-reload` | 설정 리로드 + diff |
| `tmux-notify-long-command` | 장기 명령 데스크탑 알림 |
| `tmux-bash-preexec` | sourceable preexec 훅 |
| `tmux-cheatsheet` | 키바인딩 레퍼런스 팝업 |
| `tmux-web-terminal` | ttyd 웹 터미널 런처 |

### Slack 연동

| 스크립트 | 설명 |
| --- | --- |
| `tmux-slack-bridge-start` | 데몬 시작 (직접/Cloudflare 모드) |
| `tmux-slack-bridge-setup` | 1회성 셋업 마법사 |

### 공유 라이브러리

| 라이브러리 | 설명 |
| --- | --- |
| `lib/tmux-sessionizer-common` | 세션라이저 공통 함수 |
| `lib/tmux-sessionizer-wizard` | 생성 마법사 로직 |

---

## 레이아웃 / Layout Templates

`layouts/` 디렉터리의 YAML 템플릿은 `tmux-layout-apply`가 그대로 소비합니다.

| 파일 | 용도 |
| --- | --- |
| `default.yml` | 기본 3-패인 워크스페이스 |
| `blacklist.yml` | 차단/무시 세션 정의 |
| `proxmox.yml` | Proxmox 운영 환경 |
| `resume.yml` | 재개/복원용 경량 레이아웃 |
| `safework.yml` | 보안 작업 환경 (v1) |
| `safework2.yml` | 보안 작업 환경 (v2) |
| `splunk.yml` | Splunk 조회 환경 |

각 YAML의 정확한 스키마는 `bin/tmux-layout-apply`를 참조하세요.

---

## 로컬 개발 / Local Development

### 셸 스크립트

- 스타일: bash, `set -euo pipefail` 권장
- 공통 함수는 `bin/lib/`에 모듈화
- 로컬 검증은 별도 tmux 서버(`tmux -L dev`)에서 진행

### TUI 세션라이저 (`tui/sessionizer`)

- 런타임: Bun
- UI: React + OpenTUI
- 설정/경로: `src/lib/config.ts`, `src/lib/dirs.ts`
- 상태 관리: `src/lib/state.ts`, `src/hooks/use-keyboard-handler.ts`
- 액션: `src/actions/session-actions.ts`
- 컴포넌트: `src/components/*.tsx` (wizard, filter, dialog 등)

```bash
cd tui/sessionizer
bun install
bun run dev        # 개발 모드
bun run start      # 실행
bun test           # 단위 테스트
```

### Slack 브리지 (`slack/tmux-bridge`)

- 런타임: Node.js + tsx
- 실행 진입점: `bin/tmux-slack-bridge-start`
- 모드: Cloudflare Tunnel(클라우드) 또는 직접 소켓(온프레미스)

---

## 테스트 / Testing

| 대상 | 도구 | 위치 |
| --- | --- | --- |
| TUI 세션라이저 | bun test | `tui/sessionizer/__tests__/` |
| 셸 스크립트 | 수동 + 통합 검증 | `bin/tmux-*` (tmux -L dev) |
| Slack 브리지 | 수동 통합 | `slack/tmux-bridge/` |

```bash
cd tui/sessionizer && bun test
```

---

## 유지보수자 / Maintainers

- 코드 오너십은 [`OWNERS`](./OWNERS) 참고
- 기여 절차는 [`CONTRIBUTING.md`](./CONTRIBUTING.md) 참고
- 이슈/PR은 저장소 정책에 따름

---

## 추가 문서 / Further Documentation

- [`docs/session-persistence-brainstorming.md`](./docs/session-persistence-brainstorming.md) — 세션 영속화 설계 노트
- [`docs/supermemory-governance.md`](./docs/supermemory-governance.md) — 지식 거버넌스 문서
- [`AGENTS.md`](./AGENTS.md) — 저장소 구조와 스크립트 LOC 요약
- `tui/sessionizer/AGENTS.md` — TUI 서브워크스페이스 가이드
- `slack/tmux-bridge/AGENTS.md` — 슬랙 브리지 가이드

---

## 라이선스 / License

[`LICENSE`](./LICENSE) 파일을 참고하세요.