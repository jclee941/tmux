```markdown
# tmux Workspace & Session Manager

> tmux 기반 개발 워크스페이스를 위한 올인원 세션 관리자 및 생산성 도구 모음

## 소개

본 프로젝트는 tmux 세션 생성, 전환, 레이아웃 관리를 중심으로 한 종합 워크스페이스 자동화 환경입니다. YAML 기반 레이아웃 정의, React(TUI) 기반 인터랙티브 세션 관리자, 40여 개의 전용 유틸리티 스크립트, 그리고 WezTerm 연동 설정을 포함하여 터미널 중심 개발 워크플로우를 통합합니다.

## 기능

### 세션 관리
- **TUI 세션 관리자** — Bun + TypeScript 기반 터미널 UI로 세션 필터링, 미리보기, 생성 마법사, 이름 변경, 종료 등을 인터랙티브하게 처리
- **세션 사이클 / 점프 / 동기화** — 빠른 세션 전환 및 다중 세션 상태 동기화
- **세션 아이콘 / 순서 / 대시보드** — 세션 메타데이터 관리 및 시각화
- **레이아웃 자동 적용** — 프로젝트 유형별 YAML 레이아웃(`layouts/`)을 tmux 창/패널에 자동 매핑

### 개발 통합
- **Git 상태 연동** — `git-status`, `git-uncommitted`, `session-branch-log` 등 저장소 상태를 tmux 환경에 노출
- **코드 및 파일 오픈** — `opencode`, `file-open`, `url-open`으로 터미널에서 바로 외부 편집기/브라우저 연동
- **SSH 피커** — 원격 호스트 선택 및 세션 연결 자동화

### 시스템 및 터미널 유틸리티
- **시스템 모니터링** — `sys-stats`를 통한 터미널 내 리소스 현황 출력
- **알림** — 장시간 실행 명령 완료 알림
- **클립보드 기록 / 치트시트 / 커맨드 팔레트** — 터미널 내 생산성 보조 도구
- **반응형 사이드바** — tmux 창 내 사이드바 토글 및 동적 렌더링
- **WezTerm 연동** — `wezterm.lua`를 통한 터미널 에뮬레이터 통합 설정

### 테스트 및 안정성
- **BATS 테스트** — `tests/` 디렉터리에서 Git 상태, 세션 아이콘/순서, 시스템 상태 등 핵심 기능 검증

## 시작하기

### 요구 사항
- [tmux](https://github.com/tmux/tmux) 3.x 이상
- [Bun](https://bun.sh/) (TUI 세션 관리자 실행용)
- (선택) [WezTerm](https://wezfurlong.org/wezterm/) — 터미널 에뮬레이터 연동 시

### 설치

```bash
git clone https://github.com/jclee941/tmux.git
cd tmux

# tmux 설정 적용 (백업 후 연결 또는 내용 복사)
ln -sf "$(pwd)/tmux.conf" ~/.tmux.conf

# TUI 세션 관리자 의존성 설치
cd tui/sessionizer
bun install
```

### 사용법

**세션 관리자 실행**
```bash
# TUI 인터페이스
./bin/tmux-sessionizer-tui

# 빠른 세션 전환
./bin/tmux-sessionizer
```

**레이아웃 적용**
```bash
# 프로젝트별 레이아웃 로드
./bin/tmux-layout-apply default
```

**주요 바인딩 및 스크립트**
- `tmux.conf`에 정의된 단축키를 통해 세션 생성/전환, 사이드바 토글, 클립보드 히스토리 등을 호출할 수 있습니다.
- `bin/` 디렉터리의 개별 스크립트는 PATH에 추가하거나 tmux 키 바인딩에 매핑하여 사용합니다.

## 프로젝트 구조

```
.
├── tmux.conf                  # 메인 tmux 설정
├── sessionizer.conf           # 세션 관리자 설정
├── layouts/                   # YAML 기반 tmux 레이아웃 정의
│   ├── default.yml
│   ├── proxmox.yml
│   └── ...
├── tui/sessionizer/           # React(TUI) 세션 관리자 (Bun/TypeScript)
│   ├── src/
│   │   ├── components/        # UI 컴포넌트 (마법사, 다이얼로그, 목록 등)
│   │   ├── actions/           # 세션 동작 로직
│   │   ├── lib/               # 설정, tmux 래퍼, 상태 관리
│   │   └── hooks/             # 키보드 입력 핸들러
│   └── __tests__/             # 유닛 테스트
├── bin/                       # 유틸리티 스크립트 (40+ 개)
│   ├── tmux-session-*         # 세션 관련 도구
│   ├── tmux-git-*             # Git 연동 도구
│   ├── tmux-sidebar-*         # 사이드바 도구
│   └── lib/                   # 공통 렌더링/색상 라이브러리
├── wezterm/                   # WezTerm 통합 설정
│   └── wezterm.lua
└── tests/                     # BATS 통합 테스트
```

## 기여하기

기여는 언제나 환영합니다!  
코드 기여, 버그 리포트, 기능 제안은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고해 주세요.

## 라이선스

[MIT](LICENSE)

---

> 이 프로젝트는 `jclee-bot`에 의해 자동화되어 관리됩니다.
```