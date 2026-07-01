# tmux Productivity Suite / tmux 생산성 도구 모음

> 큐레이션된 tmux 설정과 풍부한 생태계(보조 도구, 공유 라이브러리, 선언적 YAML 레이아웃, Bun/React/TypeScript 기반 TUI, Slack 브리지)를 한 저장소에 담은, 다수의 프로젝트·브랜치·원격 호스트를 다루는 파워 유저용 환경입니다.
>
> A curated, opinionated tmux configuration plus a complete ecosystem of companion tools, shared libraries, declarative YAML layouts, a Bun/React/TypeScript TUI, and a Slack bridge — designed for power users who juggle many projects, branches, and remote hosts.

---

## 한눈에 보기 / At a Glance

| 항목 / Item | 값 / Value |
| --- | --- |
| 주 언어 / Primary language | Bash + TypeScript (TUI) |
| 런타임 / Runtime | tmux ≥ 3.2, Bash ≥ 4, Bun ≥ 1.1 (TUI), Node.js ≥ 18 (Slack bridge) |
| 진입점 / Entry point | `tmux.conf` → `conf.d/*.conf`, `bin/tmux-sessionizer`, `tui/sessionizer/`, `slack/tmux-bridge/` |
| 기본 prefix / Default prefix | `C-a` |
| 상태 / Status | 운영 가능 / Production-ready for personal workstations |
| 동시 세션 / Sessions | 수십~수백 개 규모 가벼운 부하 / Scales to dozens of sessions |
| 라이선스 / License | 저장소 `LICENSE` 참조 / See `LICENSE` |

### 핵심 흐름 / Core Flow

1. 셸 로그인 시 `tmux-auto-attach` 가 기존/신규 세션을 연결합니다.
2. `prefix + s` (sessionizer) 또는 `prefix + S` (TUI)로 세션을 고르고 만듭니다.
3. 필요 시 `tmux-layout-apply` 로 YAML 레이아웃을 즉시 적용합니다.
4. Slack 브리지를 켜 두면 채널 ↔ 세션이 양방향 동기화됩니다.
5. 모든 변경 후 `prefix + r` 로 `tmux-config-reload` 가 설정을 안전하게 다시 로드합니다.

---

## 목차 / Table of Contents

- [Purpose / 목적](#purpose--목적)
- [Package Contents / 구성 요소](#package-contents--구성-요소)
- [Status / 상태](#status--상태)
- [First Files to Read / 먼저 읽을 파일](#first-files-to-read--먼저-읽을-파일)
- [Entry Points / 진입점](#entry-points--진입점)
- [Quickstart / 빠른 시작](#quickstart--빠른-시작)
- [Configuration / 설정](#configuration--설정)
- [Commands Reference / 명령어 레퍼런스](#commands-reference--명령어-레퍼런스)
- [Layouts / 레이아웃](#layouts--레이아웃)
- [TUI Sessionizer / 터미널 UI 세션나이저](#tui-sessionizer--터미널-ui-세션나이저)
- [Slack Bridge / 슬랙 브리지](#slack-bridge--슬랙-브리지)
- [Local Development / 로컬 개발](#local-development--로컬-개발)
- [Testing / 테스트](#testing--테스트)
- [Contributing / 기여](#contributing--기여)
- [Maintainers / 유지보수](#maintainers--유지보수)
- [License / 라이선스](#license--라이선스)
- [Further Documentation / 추가 문서](#further-documentation--추가-문서)

---

## Purpose / 목적

이 저장소는 tmux 의 "터미널 멀티플렉서" 본연의 기능 위에 다음을 더한 파워 유저용 환경입니다.

- **세션 중심 워크플로우**: 프로젝트·브랜치·호스트 단위로 세션을 빠르게 만들고, 바꾸고, 죽이고, 복원합니다.
- **선언적 레이아웃**: 창/패널 구성을 YAML 로 정의해 즉시 적용하고 재현합니다.
- **그래픽 보조 도구**: fzf 기반 팔레트와 Bun/React/TypeScript TUI 로 키 바인딩을 외울 필요가 줄어듭니다.
- **원격 협업 표면**: Slack 채널과 tmux 세션을 양방향으로 묶어, 어디서든 동일한 작업 흐름을 유지합니다.
- **자체 복구 셸**: 로그인 시 자동 attach, 설정 reload, 긴 명령 알림, Git dirty 상태 추적까지 기본 제공합니다.

### 누가 쓰나요 / Who Uses It

- 다수의 서비스·호스트를 오가는 플랫폼/SRE 엔지니어.
- 수십 개의 브랜치/저장소를 동시에 다루는 폴리글롯 개발자.
- Proxmox, Splunk, Safework 같은 운영 콘솔을 한 화면에서 다루는 운영자.

---

## Package Contents / 구성 요소

| 경로 / Path | 역할 / Role |
| --- | --- |
| `tmux.conf` | 루트 로더. 모든 키바인딩/테마를 일관되게 소싱합니다. |
| `sessionizer.conf` | 세션 검색용 `SCAN_DIR` / `EXTRA_DIRS` 정의. |
| `bin/` | 40여 개의 셸 스크립트 헬퍼 (세션·사이드바·상태바·Git·Slack). |
| `lib/` | 사이드바 렌더링·세션나이저 공통 함수 등 공유 라이브러리. |
| `layouts/` | 프로젝트/운영 콘솔용 YAML 창 배치 템플릿. |
| `tui/sessionizer/` | Bun + React + TypeScript 기반 TUI 세션 피커. |
| `slack/tmux-bridge/` | Node.js 기반 Slack ↔ tmux 양방향 브리지. |
| `docs/` | 영구 세션·거버넌스 등 설계 메모. |
| `AGENTS.md`, `OWNERS`, `CONTRIBUTING.md`, `LICENSE` | 프로젝트 메타 문서. |

---

## Status / 상태

| 영역 / Area | 상태 / Status |
| --- | --- |
| tmux 설정 / tmux configuration | 안정 / Stable |
| `bin/` 헬퍼 / Helpers | 안정, 활발한 개선 중 / Stable, actively refined |
| TUI Sessionizer | Bun 기반 프로토타입 → 안정화 단계 / Prototype → hardening |
| Slack Bridge | 듀얼 모드(소켓 직접 / 클라우드플레어 터널) 지원 / Dual mode supported |
| YAML 레이아웃 / Layouts | 운영 콘솔 템플릿 포함, 자유롭게 추가 가능 |
| 후방 호환성 / Backward compat | `C-b` 기본값에서 `C-a` 로 마이그레이션 완료 |

---

## First Files to Read / 먼저 읽을 파일

| 우선순위 / Priority | 파일 / File | 이유 / Why |
| --- | --- | --- |
| 1 | `tmux.conf` | 모든 설정의 진입점. 어떤 conf.d 가 로드되는지 확인. |
| 2 | `sessionizer.conf` | 세션 검색 대상 디렉터리 결정. |
| 3 | `bin/tmux-sessionizer` | 세션 선택/생성 UX 의 핵심 동작. |
| 4 | `lib/tmux-sessionizer-common` | 다른 스크립트가 공유하는 함수 모음. |
| 5 | `layouts/default.yml` | 레이아웃 YAML 스키마의 기준. |
| 6 | `tui/sessionizer/src/App.tsx` | TUI 진입 컴포넌트. |
| 7 | `slack/tmux-bridge/AGENTS.md` | 브리지 디렉토리 규약과 운영 메모. |

---

## Entry Points / 진입점

| 표면 / Surface | 진입점 / Entry | 호출 방식 / How to invoke |
| --- | --- | --- |
| tmux 설정 / Config | `tmux.conf` | `tmux -f tmux.conf` 또는 심볼릭 링크 `~/.tmux.conf` |
| 세션 피커 / Session picker | `bin/tmux-sessionizer` | `prefix + s` |
| TUI 세션 피커 / TUI picker | `bin/tmux-sessionizer-tui` | `prefix + S` |
| 레이아웃 적용 / Layout apply | `bin/tmux-layout-apply <name>` | `prefix + L` 등 사용자 바인딩 |
| Slack 브리지 / Slack bridge | `bin/tmux-slack-bridge-start` | `prefix + B` 또는 셸에서 직접 실행 |
| 설정 리로드 / Config reload | `bin/tmux-config-reload` | `prefix + r` |
| 자동 attach / Auto-attach | `bin/tmux-auto-attach` | `.bashrc` 또는 `.zshrc` 에서 source |

---

## Quickstart / 빠른 시작

### 1. 저장소를 받아 심볼릭 링크합니다 / Clone & link

```bash
# 예시 경로. 실제 경로로 바꿔 사용하세요.
git clone <repo-url> ~/projects/tmux-productivity
ln -sfn ~/projects/tmux-productivity/tmux.conf ~/.tmux.conf
```

필요하다면 같은 디렉터리의 `bin/`, `lib/`, `layouts/`, `sessionizer.conf` 를 `~/.tmux/` 아래에 함께 배치하여 `conf.d/` 패턴과 호환되게 둡니다.

### 2. 의존성을 확인합니다 / Verify dependencies

```bash
tmux -V          # ≥ 3.2 권장
bash --version   # ≥ 4 권장
fzf --version    # 팔레트/피커 동작에 필요
git --version    # Git 상태 추적에 필요
bun --version    # TUI 사용 시 필요
node --version   # Slack 브리지 사용 시 필요
```

### 3. 세션을 시작합니다 / Start tmux

```bash
tmux new-session -t main   # 또는 단순히 tmux
```

`tmux-auto-attach` 를 `.bashrc`/`.zshrc` 에서 호출하면 로그인 시 자동으로 가장 최근 세션에 붙습니다.

### 4. 첫 키바인딩을 익힙니다 / Learn the first keys

| 키 / Key | 동작 / Action |
| --- | --- |
| `prefix + s` | 세션 피커 (fzf) |
| `prefix + S` | TUI 세션 피커 |
| `prefix + c` | 새 창 |
| `prefix + ,` | 세션 이름 변경 |
| `prefix + L` | YAML 레이아웃 적용 |
| `prefix + r` | 설정 리로드 |
| `prefix + ?` | 키바인딩 치트시트 |

`prefix` 는 기본 `C-a` 입니다.

---

## Configuration / 설정

### `tmux.conf`

루트 로더는 `conf.d/*.conf` 를 사전순으로 소싱합니다. 키바인딩은 `20-keys.conf`, 테마는 `10-theme.conf`, 사이드바는 `25-sidebar.conf` 패턴을 따릅니다.

### `sessionizer.conf`

세션나이저가 탐색할 디렉터리를 정의합니다.

| 키 / Key | 의미 / Meaning |
| --- | --- |
| `SCAN_DIR` | 1차 탐색 루트 (예: `~/projects`, `~/work`). |
| `EXTRA_DIRS` | 보조 디렉터리 목록. 비어 있어도 동작합니다. |

### 환경 변수 / Environment variables

| 변수 / Var | 기본값 / Default | 용도 / Purpose |
| --- | --- | --- |
| `EDITOR` | 시스템 기본 | rename / template 입력 편집기 |
| `BROWSER` | 시스템 기본 | `tmux-url-open` 열기 동작 |
| `TMUX_BUN_BIN` | `bun` | TUI 실행 바이너리 경로 |
| `TMUX_BRIDGE_MODE` | `auto` | `socket` / `http` / `auto` 중 선택 |

---

## Commands Reference / 명령어 레퍼런스

### 세션 관리 / Session Management

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-sessionizer` | fzf 기반 세션 선택 + 생성 마법사. |
| `tmux-sessionizer-tui` | Bun 기반 TUI 세션 피커. |
| `tmux-session-cycle` | PgUp/PgDn 으로 활성 세션 순환. |
| `tmux-session-jump` | 최근 사용(MRU) 순으로 fzf 점프. |
| `tmux-session-rename` | 검증 포함 세션 이름 변경. |
| `tmux-session-kill` | 확인 절차를 거친 안전한 종료. |
| `tmux-session-sync` | 세션 ↔ Slack 채널 동기화. |
| `tmux-session-export` | 현재 세션 레이아웃을 YAML 로 내보내기. |
| `tmux-session-branch-log` | 세션↔브랜치 전환 로그 기록. |
| `tmux-session-dashboard` | 정렬된 세션 테이블 팝업. |
| `tmux-session-icon` | Nerd Font 아이콘 매핑. |
| `tmux-session-order` | 가장 최근 활성 순 정렬. |
| `tmux-template-create` | 사전 정의 템플릿으로 빠른 생성. |

### 사이드바·레이아웃 / Sidebar & Layout

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-sidebar` | 트리형 사이드바 렌더링. |
| `tmux-sidebar-init` | 세션 생성 시 사이드바 초기화. |
| `tmux-sidebar-toggle` | 사이드바 보임/숨김 토글. |
| `tmux-layout-apply` | YAML 레이아웃 템플릿 적용. |
| `tmux-responsive` | 폭 구간별 상태바 렌더링. |

### 작업 보조 / Workflow Helpers

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-auto-attach` | 로그인 시 자동 attach. |
| `tmux-opencode` | OpenCode 세션 런처. |
| `tmux-command-palette` | fzf 액션 팔레트. |
| `tmux-url-open` | 패에서 URL 추출 후 열기. |
| `tmux-file-open` | 패에서 파일 경로 추출 후 열기. |
| `tmux-ssh-picker` | SSH config 호스트 피커. |
| `tmux-clipboard-history` | tmux 버퍼 링 탐색. |
| `tmux-copy-word` | 커서 단어 단위 복사. |
| `tmux-pane-sync` | 동기화 패널 토글. |
| `tmux-config-reload` | 설정 diff 와 함께 리로드. |
| `tmux-notify-long-command` | 긴 명령 종료 시 데스크톱 알림. |
| `tmux-bash-preexec` | 셸 preexec 훅 (소싱용). |
| `tmux-cheatsheet` | 카테고리별 키바인딩 치트시트. |
| `tmux-git-status` | 브랜치·dirty·ahead/behind·stash 표시. |
| `tmux-git-uncommitted` | 세션별 미커밋 변경 추적. |
| `tmux-sys-stats` | CPU 부하·메모리 사용량. |
| `tmux-web-terminal` | ttyd 기반 웹 터미널. |

### Slack 브리지 / Slack Bridge

| 명령 / Command | 설명 / Description |
| --- | --- |
| `tmux-slack-bridge-setup` | 인터랙티브 Slack 앱 설정 마법사. |
| `tmux-slack-bridge-start` | 듀얼 모드 런처 (소켓 직접 / HTTP 터널). |

---

## Layouts / 레이아웃

`layouts/*.yml` 은 창/패널의 이름, 명령, 비율을 선언적으로 정의합니다.

| 파일 / File | 용도 / Use case |
| --- | --- |
| `default.yml` | 균형 잡힌 기본 3-pane 배치. |
| `blacklist.yml` | 차단/큐레이션용 단일 패널 템플릿. |
| `proxmox.yml` | Proxmox 운영 콘솔(노드/스토리지/태스크) 배치. |
| `splunk.yml` | Splunk 검색·인덱서 모니터링용 배치. |
| `safework.yml`, `safework2.yml` | Safework 운영 화면 변형. |
| `resume.yml` | 개인 작업/이력서 작성용 단일 창 템플릿. |

### 스키마 예시 / Example schema

```yaml
session: ops
root: ~/work/ops
windows:
  - name: shell
    panes:
      - cmd: htop
      - cmd: tail -F /var/log/syslog
        split: vertical
  - name: git
    panes:
      - cmd: tig
```

`tmux-layout-apply layouts/proxmox.yml` 처럼 호출해 즉시 적용합니다.

---

## TUI Sessionizer / 터미널 UI 세션나이저

`tui/sessionizer/` 는 Bun + React + TypeScript 로 작성된 그래픽 피커입니다.

| 항목 / Item | 값 / Value |
| --- | --- |
| 런타임 / Runtime | Bun ≥ 1.1 |
| UI / UI | React + TypeScript |
| 진입점 / Entry | `src/index.tsx` → `src/App.tsx` |
| 빌드 설정 / Build | `tsconfig.json`, `bunfig.toml` |
| 의존성 잠금 / Lockfile | `bun.lock` |
| 테스트 / Tests | `__tests__/config.test.ts`, `__tests__/tmux.test.ts` |

### 디렉터리 구조 / Directory structure

| 경로 / Path | 역할 / Role |
| --- | --- |
| `src/App.tsx` | 최상위 컴포넌트. |
| `src/index.tsx` | 렌더 부트스트랩. |
| `src/lib/` | 설정, 상태, 테마, tmux 호출 어댑터. |
| `src/hooks/use-keyboard-handler.ts` | 키보드 인터랙션 단일화. |
| `src/actions/session-actions.ts` | 세션 액션 모음. |
| `src/components/` | 리스트·필터·미리보기·마법사·확인 다이얼로그. |
| `__tests__/` | 단위 테스트 (Bun test runner). |

### 마법사 단계 / Wizard steps

1. 디렉터리 선택 (`wizard-step-dir.tsx`).
2. 레이아웃 선택 (`wizard-step-layout.tsx`).
3. 세션 이름 확정 (`wizard-step-name.tsx`).

확인 다이얼로그(`kill-confirm-dialog.tsx`)와 이름 변경 다이얼로그(`rename-dialog.tsx`)는 안전을 위한 사용자 확인을 강제합니다.

---

## Slack Bridge / 슬랙 브리지

`slack/tmux-bridge/` 는 Slack 채널과 tmux 세션을 양방향으로 묶어, 메시지 → 명령, 출력 → 메시지 흐름을 제공합니다.

| 항목 / Item | 값 / Value |
| --- | --- |
| 런타임 / Runtime | Node.js ≥ 18 (tsx) |
| 모드 / Modes | `socket` 직접 / `http` (Cloudflare 터널) |
| 설정 마법사 / Setup | `tmux-slack-bridge-setup` |
| 런처 / Launcher | `tmux-slack-bridge-start` |
| 디렉터리 규약 / Convention | `slack/tmux-bridge/AGENTS.md` 참조 |

### 두 모드 비교 / Modes at a glance

| 모드 / Mode | 장점 / Pros | 적합 / Best for |
| --- | --- | --- |
| `socket` | 저지연, 직접 연결 | 같은 호스트 또는 사설 네트워크 |
| `http` | 방화벽 우회, 원격 액세스 | 노트북·외부망, NAT 뒤 |

---

## Local Development / 로컬 개발

| 작업 / Task | 명령 / Command |
| --- | --- |
| 설정 리로드 / Reload tmux config | `prefix + r` 또는 `tmux source-file tmux.conf` |
| 헬퍼 단독 실행 / Run helper directly | `bash bin/tmux-sessionizer` |
| TUI 개발 서버 / TUI dev | `cd tui/sessionizer && bun install && bun run dev` |
| TUI 빌드 / TUI build | `cd tui/sessionizer && bun run build` |
| Slack 브리지 실행 / Run bridge | `bash bin/tmux-slack-bridge-start` |
| 레이아웃 적용 / Apply layout | `tmux-layout-apply layouts/default.yml` |

심볼릭 링크 환경에서는 실제 경로에서 수정한 뒤 리로드하면 즉시 반영됩니다.

---

## Testing / 테스트

| 영역 / Area | 도구 / Tool | 위치 / Location |
| --- | --- | --- |
| TUI 단위 테스트 / TUI unit tests | Bun test runner | `tui/sessionizer/__tests__/` |
| Slack 브리지 테스트 / Bridge tests | GitLab CI (`.gitlab-ci.yml`) | `slack/tmux-bridge/` |
| 셸 헬퍼 수동 검증 / Manual shell checks | 셸에서 직접 호출 | `bin/` |
| 회귀 검증 / Regression | `tmux-config-reload` 가 diff 표시 | 운영 중 |

자동 테스트를 추가할 때는 TUI 의 경우 `__tests__/*.test.ts` 컨벤션을, 셸 헬퍼의 경우 bats 또는 shunit2 같은 도구를 권장합니다.

---

## Contributing / 기여

기여 절차는 [`CONTRIBUTING.md`](CONTRIBUTING.md) 를 따릅니다.

| 단계 / Step | 내용 / Details |
| --- | --- |
| 1 | 이슈 또는 PR 로 동기화. 큰 변경은 먼저 RFC 메모를 `docs/` 에 추가. |
| 2 | 새 헬퍼는 `bin/tmux-*` 네이밍, 작은 단일 책임, 외부 의존 최소화. |
| 3 | 공용 함수는 `lib/` 에 모듈화하고 `source` 로 로드. |
| 4 | 새 YAML 레이아웃은 `layouts/` 에 의미 있는 파일명으로 추가. |
| 5 | TUI 변경 시 `__tests__/` 갱신 및 Bun 빌드 확인. |
| 6 | PR 설명에 키바인딩 변경·스크린샷·롤아웃 메모 포함. |

`OWNERS` 파일의 오너가 검토합니다.

---

## Maintainers / 유지보수

| 역할 / Role | 위치 / Where |
| --- | --- |
| 오너 목록 / Owners | [`OWNERS`](OWNERS) |
| AI 보조 규약 / Agent conventions | [`AGENTS.md`](AGENTS.md) |
| 기여 절차 / Contribution flow | [`CONTRIBUTING.md`](CONTRIBUTING.md) |

도움이 필요하면 저장소 이슈 트래커를 사용하세요.

---

## License / 라이선스

[`LICENSE`](LICENSE) 파일의 조항을 따릅니다. 배포·수정·재배포 시 해당 라이선스 전문을 확인하세요.

---

## Further Documentation / 추가 문서

| 문서 / Document | 위치 / Location | 주제 / Topic |
| --- | --- | --- |
| Session persistence brainstorming | [`docs/session-persistence-brainstorming.md`](docs/session-persistence-brainstorming.md) | 영구 세션 전략 메모 |
| Supermemory governance | [`docs/supermemory-governance.md`](docs/supermemory-governance.md) | 메모·맥락 거버넌스 |
| TUI AGENTS notes | [`tui/sessionizer/AGENTS.md`](tui/sessionizer/AGENTS.md) | TUI 디렉터리 규약 |
| Slack bridge AGENTS notes | [`slack/tmux-bridge/AGENTS.md`](slack/tmux-bridge/AGENTS.md) | 브리지 디렉터리 규약 |

추가 디자인 메모는 `docs/` 아래 자유롭게 추가할 수 있습니다.