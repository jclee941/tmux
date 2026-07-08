# tmux 워크스페이스 — 세션·사이드바·레이아웃 툴킷

`~/.tmux` 심볼릭 링크로 설치하는 bash-first tmux 설정 저장소입니다. 세션
검색·사이클·사이드바·레이아웃 템플릿·Slack 브리지·상태바 위젯을 하나의
일관된 키바인딩(`prefix = C-a`)과 `bin/` 스크립트 모음으로 제공합니다.

## 빠른 상태

| 항목 | 값 |
| --- | --- |
| 설치 방식 | 저장소를 `~/.tmux`로 심볼릭 링크 |
| 셸 진입점 | `tmux.conf` → `conf.d/*.conf` (모듈식 로더) |
| 런타임 | bash 4+, tmux 3.2+, fzf, git |
| 보조 런타임 | Bun + OpenTUI (`tui/sessionizer`), Node.js + tsx (`slack/tmux-bridge`) |
| 핵심 키 접두사 | `C-a` |
| 프로덕션 상태 | 개인 워크스페이스 — 활발히 유지보수, 안정 인터페이스 |
| 라이선스 | 저장소 `LICENSE` 참조 |
| 유지보수 | `OWNERS` 참조 |

## 동작 흐름 요약

1. `tmux` 실행 → `tmux.conf` 로더가 `conf.d/*.conf`를 숫자 접두사 순으로 소싱.
2. `sessionizer.conf`의 `SCAN_DIR` / `EXTRA_DIRS`로 세션 후보 디렉토리 인덱싱.
3. `bin/tmux-sessionizer`(fzf) 또는 `bin/tmux-sessionizer-tui`(OpenTUI)로 세션 선택·생성.
4. 세션 생성 시 `bin/tmux-sidebar-init`이 첫 윈도우에서 사이드바 트리를 부트스트랩.
5. `bin/tmux-session-sync`가 활성 세션을 Slack 채널과 동기화.
6. 상태바는 `bin/tmux-git-status`, `bin/tmux-sys-stats`, `bin/tmux-session-icon`로 채움.
7. `bin/tmux-config-reload`로 설정 변경을 즉시 반영(변경점 diff 표시).

## 디렉토리 구조

```
.
├── AGENTS.md              # 프로젝트 지식 베이스
├── CONTRIBUTING.md        # 기여 절차
├── LICENSE                # 라이선스
├── OWNERS                 # 책임자 목록
├── README.md              # 본 문서
├── tmux.conf              # 루트 로더 (conf.d 소싱)
├── sessionizer.conf       # 세션 스캔 디렉토리 정의
├── bin/                   # 실행 스크립트 (세션·사이드바·도우미)
│   ├── tmux-sessionizer   # fzf 세션 피커 + 생성 위저드
│   ├── tmux-sessionizer-tui
│   ├── tmux-sidebar*      # 사이드바 엔진 / 토글 / 초기화
│   ├── tmux-session-*     # 사이클·점프·킬·리네임·익스포트·동기화
│   ├── tmux-template-create
│   ├── tmux-layout-apply
│   ├── tmux-git-status / tmux-sys-stats / tmux-session-icon
│   └── tmux-slack-bridge-*
├── lib/                   # 공유 라이브러리 모듈
│   ├── sidebar-colors
│   ├── sidebar-render
│   ├── tmux-sessionizer-common
│   └── tmux-sessionizer-wizard
├── layouts/               # YAML 레이아웃 프리셋
│   ├── default.yml
│   ├── proxmox.yml
│   ├── splunk.yml
│   ├── safework.yml
│   ├── safework2.yml
│   ├── resume.yml
│   └── blacklist.yml
├── tui/sessionizer/       # Bun + OpenTUI 풀스크린 세션라이저 (React)
├── slack/tmux-bridge/     # Node.js Slack 브리지
└── docs/                  # 설계 노트
```

## 목차

- [기능](#기능)
- [아키텍처](#아키텍처)
- [빠른 시작](#빠른-시작)
- [설정](#설정)
- [명령어 레퍼런스](#명령어-레퍼런스)
- [로컬 개발](#로컬-개발)
- [테스트](#테스트)
- [기여](#기여)
- [유지보수자](#유지보수자)
- [라이선스](#라이선스)
- [추가 문서](#추가-문서)

## 기능

- 세션 라이프사이클 — 생성, fzf/OpenTUI 검색, MRU 점프, `PgUp/PgDn` 사이클, 안전한 킬, 리네임, YAML 익스포트.
- 트리형 사이드바 — `bin/tmux-sidebar` 엔진과 `lib/sidebar-render` / `lib/sidebar-colors`로 구성된 윈도우·세션 뷰, 세션 생성 시 자동 부트스트랩.
- 듀얼 세션라이저 UI — 빠른 fzf 경로(`tmux-sessionizer`)와 풀스크린 OpenTUI(`tui/sessionizer/`)를 모두 지원.
- YAML 레이아웃 프리셋 — `layouts/*.yml`(default, proxmox, splunk, safework, safework2, resume, blacklist)을 `tmux-layout-apply`로 즉시 적용.
- 상태바 위젯 — 너비 등급별 렌더링(`tmux-responsive`), git 브랜치/상태(`tmux-git-status`, `tmux-git-uncommitted`), 시스템 부하(`tmux-sys-stats`), Nerd Font 아이콘(`tmux-session-icon`).
- Slack 브리지 — `slack/tmux-bridge/`의 Node.js 서버가 세션 ↔ Slack 채널을 양방향 동기화.
- 일상 도우미 — URL/파일 추출, SSH 호스트 피커, 클립보드 히스토리, 단어 복사, 패널 동기화, 설정 리로드, 명령 팔레트, 키 시트, ttyd 웹 터미널, OpenCode 런처.

## 아키텍처

| 레이어 | 위치 | 책임 |
| --- | --- | --- |
| 로더 | `tmux.conf` | `conf.d/*.conf`를 숫자 접두사 순으로 소싱 |
| 설정 | `conf.d/00-core` ... `conf.d/*` | 터미널·테마·키바인딩·사이드바 모듈식 정의 |
| 실행 스크립트 | `bin/tmux-*` | 사용자가 직접 호출하는 단일 기능 명령 |
| 공유 라이브러리 | `lib/*` | 세션라이저·위저드·사이드바 공통 로직 |
| 데이터 | `sessionizer.conf`, `layouts/*.yml` | 스캔 경로, 레이아웃 프리셋 |
| 보조 런타임 | `tui/sessionizer/`, `slack/tmux-bridge/` | 풀스크린 UI, 외부 시스템 연동 |

세션 생성 흐름:

1. 사용자가 `prefix + s` 또는 `bin/tmux-sessionizer` 실행.
2. 위저드가 디렉토리 → 이름 → 레이아웃 순으로 입력을 받음.
3. `lib/tmux-sessionizer-wizard`가 검증 후 `tmux new-session` 호출.
4. `bin/tmux-sidebar-init`이 첫 윈도우에서 사이드바 프로세스를 기동.
5. `bin/tmux-session-sync`가 Slack 채널 매핑을 갱신.
6. 레이아웃이 지정된 경우 `bin/tmux-layout-apply`가 YAML 분할을 적용.

## 빠른 시작

사전 요구 사항: bash 4+, tmux 3.2+, fzf, git. TUI 또는 Slack 브리지를 사용할 경우 Bun과 Node.js도 필요합니다.

```bash
# 1. 저장소를 클론하고 ~/.tmux로 심볼릭 링크
git clone <repository-url> ~/src/tmux-workspace
ln -s ~/src/tmux-workspace ~/.tmux

# 2. tmux 서버 시작 (tmux.conf 자동 로드)
tmux new-session -A -s main

# 3. 주요 단축키
#    prefix + s   세션라이저(fzf)
#    prefix + S   세션 사이클
#    prefix + h   사이드바 토글
#    prefix + :   명령 팔레트
```

문제 해결: 키가 동작하지 않으면 `tmux source-file ~/.tmux/tmux.conf`로 강제 리로드하고, 변경점은 `bin/tmux-config-reload`로 확인하세요.

## 설정

### 스캔 디렉토리

`sessionizer.conf`에서 세션 후보 위치를 정의합니다.

```bash
SCAN_DIR="$HOME/src"
EXTRA_DIRS=("$HOME/work" "$HOME/notes")
```

### 키 접두사 변경

기본은 `C-a`입니다. 변경 시 `conf.d/20-keys.conf`의 `unbind C-b`와 `set -g prefix` 블록을 함께 수정하고, `tmux-cheatsheet`의 표기를 갱신하세요.

### 레이아웃 프리셋 추가

`layouts/default.yml`을 템플릿으로 복제해 새 프리셋을 작성한 뒤, `bin/tmux-template-create`로 대화형 등록을 진행합니다. YAML 스키마는 `layouts/default.yml` 상단의 주석을 참조하세요.

### 환경 변수

`conf.d/` 모듈은 `~/.tmux.env` 또는 셸 rc 파일을 통해 `EDITOR`, `PATH`, 폰트 이름 등을 주입받을 수 있습니다. 자세한 항목은 `conf.d/00-core.conf`를 확인하세요.

## 명령어 레퍼런스

세션 라이프사이클:

- `tmux-sessionizer` — fzf 세션 피커 + 생성 위저드
- `tmux-sessionizer-tui` — OpenTUI 풀스크린 세션라이저
- `tmux-session-cycle` — `PgUp/PgDn`으로 활성 세션 순환
- `tmux-session-jump` — MRU 기반 빠른 점프
- `tmux-session-kill` — 확인 후 세션 종료
- `tmux-session-rename` — 이름 변경 + 검증
- `tmux-session-export` — 현재 세션을 YAML로 추출
- `tmux-session-dashboard` — 세션 테이블 팝업
- `tmux-session-branch-log` — 세션 → 브랜치 전환 로그
- `tmux-session-order` — 최근 활성 순 정렬

사이드바:

- `tmux-sidebar` — 트리형 사이드바 렌더링
- `tmux-sidebar-init` — 세션 생성 시 부트스트랩
- `tmux-sidebar-toggle` — 표시 토글

레이아웃 / 템플릿:

- `tmux-template-create` — 프리셋으로 즉시 생성
- `tmux-layout-apply <file.yml>` — YAML 레이아웃 적용
- 프리셋: `default`, `proxmox`, `splunk`, `safework`, `safework2`, `resume`, `blacklist`

도우미:

- `tmux-url-open` / `tmux-file-open` — 페인에서 URL/경로 추출
- `tmux-ssh-picker` — `~/.ssh/config` 호스트 피커
- `tmux-clipboard-history` — tmux 버퍼 히스토리
- `tmux-copy-word` — 커서 단어 복사
- `tmux-pane-sync` — `synchronize-panes` 토글
- `tmux-command-palette` — fzf 액션 피커
- `tmux-cheatsheet` — 키 시트 팝업
- `tmux-web-terminal` — ttyd 웹 터미널
- `tmux-opencode` — OpenCode 세션 런처
- `tmux-auto-attach` — 로그인 셸 자동 attach

상태바 조각:

- `tmux-git-status` — 브랜치·dirty·ahead/behind·stash
- `tmux-git-uncommitted` — 세션별 미커밋 추적
- `tmux-sys-stats` — CPU load + 메모리 사용량
- `tmux-responsive` — 너비 등급 렌더링
- `tmux-session-icon` — Nerd Font 아이콘 매퍼

연동 / 운영:

- `tmux-config-reload` — 설정 리로드 + 변경점 diff
- `tmux-notify-long-command` — 장시간 명령 데스크톱 알림
- `tmux-slack-bridge-start` — Slack 브리지 데몬 시작 (소켓 직접 / HTTP cloudflared 듀얼 모드)
- `tmux-slack-bridge-setup` — Slack 앱 설정 대화형 위저드

## 로컬 개발

- 스크립트 수정은 다음 세션부터 반영됩니다. 전체 리로드와 변경점 diff는 `bin/tmux-config-reload`를 사용하세요.
- 새 명령은 `bin/tmux-<기능>` 명명 규약을 따르고, 공통 로직은 `lib/`로 분리합니다.
- `conf.d/`에 새 파일을 추가할 때는 두 자리 숫자 접두사(`30-...`, `40-...`)로 정렬 순서를 명시하세요.
- TUI 세션라이저는 `tui/sessionizer/`에서 Bun 워크스페이스로 개발합니다. 진입점은 `src/App.tsx`, `src/index.tsx`입니다.
- Slack 브리지는 `slack/tmux-bridge/`에서 Node.js + tsx로 개발하며 상세는 `slack/tmux-bridge/AGENTS.md`를 따릅니다.

## 테스트

- TUI 단위 테스트: `tui/sessionizer/__tests__/`에서 Bun 테스트 러너로 실행합니다.
  ```bash
  cd tui/sessionizer && bun test
  ```
- 셸 스크립트 정적 검사: `bash -n bin/<script>`로 문법을 확인하고, 가능하면 `shellcheck bin/<script>`를 함께 실행하세요.
- Slack 브리지: 저장소 CI 파이프라인(`.gitlab-ci.yml`)에서 `slack/tmux-bridge/` 통합 테스트가 실행됩니다.

## 기여

기여 절차는 `CONTRIBUTING.md`를 따릅니다. PR 전 다음을 확인하세요.

- `bash -n` 및 `shellcheck` 통과.
- 새 스크립트는 `bin/`에 추가하고 필요 시 `lib/` 모듈로 분리.
- 키바인딩 추가 시 `conf.d/20-keys.conf`와 `tmux-cheatsheet` 갱신.
- 변경 사항은 `AGENTS.md`의 구조/명령 목록과 일치하도록 유지.

## 유지보수자

책임자 목록은 `OWNERS` 파일을 참조하세요. 영역별 연락처는 `AGENTS.md` 상단에도 명시되어 있습니다.

## 라이선스

저장소 루트의 `LICENSE` 파일을 참조하세요. 외부에 재배포할 경우 동일 라이선스를 유지해야 합니다.

## 추가 문서

- [세션 영속화 설계 노트](docs/session-persistence-brainstorming.md)
- [거버넌스](docs/supermemory-governance.md)
- [Slack 브리지 메모](slack/tmux-bridge/AGENTS.md)
- [TUI 세션라이저 가이드](tui/sessionizer/AGENTS.md)
- [기여 규약](CONTRIBUTING.md)
- [프로젝트 지식 베이스](AGENTS.md)

---

## English summary

Bash-first tmux configuration toolkit installed as a `~/.tmux` symlink. It
unifies session discovery, a tree sidebar, YAML layout presets, status-bar
widgets, a Slack bridge, and helper commands under a single keymap
(`prefix = C-a`) and a `bin/` script catalog.

- Loader: `tmux.conf` sources `conf.d/*.conf` in numeric order.
- Entrypoints: `bin/tmux-sessionizer` (fzf) and `bin/tmux-sessionizer-tui` (Bun + OpenTUI).
- Data files: `sessionizer.conf`, `layouts/*.yml`.
- Auxiliary runtimes: `tui/sessionizer/` (Bun + React), `slack/tmux-bridge/` (Node + tsx).
- Reload: `bin/tmux-config-reload` with on-the-fly diff.

See the Korean sections above for the full command catalog, configuration notes, and contribution workflow.