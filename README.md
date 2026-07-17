# tmux 구성 및 세션 관리 툴킷

> bash-first tmux configuration and session-management toolkit, symlinked into `~/.tmux` and extended by a Bun/OpenTUI sessionizer plus a Node.js Slack bridge.

## 한국어 개요

본 저장소는 `~/.tmux`에 심볼릭 링크되어 사용되는 tmux 설정 모음과 세션 관리 도구입니다. 핵심 동작은 `tmux.conf`가 `conf.d/*.conf`를 알파벳 순으로 소싱하여 정의하고, 실행 진입점은 `bin/` 아래 약 40개의 bash 스크립트로 구성됩니다. `tui/sessionizer`는 Bun + OpenTUI로 작성된 그래픽 세션 선택기이고, `slack/tmux-bridge`는 tmux 세션과 Slack 채널을 잇는 Node.js 서버입니다. 다중 프로젝트, 다중 호스트 SSH, Slack 협업, 세션 템플릿, 웹 터미널을 한 번의 prefix 키로 다루는 개인 워크스테이션용 통합 환경을 목표로 합니다.

### English one-liner

A bash-first tmux configuration suite with session orchestration, a tree sidebar, layout templates, a responsive status line, an fzf and TUI sessionizer, a Slack bridge, and a ttyd-backed web terminal — designed to be symlinked into `~/.tmux` and reloaded on demand.

## 상태 한눈에 보기

| 항목 | 값 |
| --- | --- |
| 메인 언어 | Bash, TypeScript (Bun), JavaScript (Node.js) |
| 런타임 | tmux 3.x, Bash 4+, Bun 1.x, Node.js 18+, fzf, (선택) ttyd |
| 진입점 | `tmux.conf`, `bin/tmux-sessionizer`, `bin/tmux-sessionizer-tui`, `bin/tmux-sidebar`, `bin/tmux-slack-bridge-start`, `bin/tmux-web-terminal` |
| 디렉터리 배치 | 저장소 루트를 `~/.tmux`로 심볼릭 링크, `tmux.conf`는 `~/.tmux.conf`로 별도 링크 |
| 라이선스 | `LICENSE` 참조 |
| 유지보수자 | `OWNERS` 참조 |
| 운영 상태 | 개인 워크스테이션 프로덕션 사용 가능 |
| 테스트 | `tui/sessionizer/__tests__/` (Bun test) |
| 문서 | `docs/`, `conf.d/*.conf` 헤더 주석, `AGENTS.md`(AI 작업 컨텍스트) |

## 30초 흐름 요약

1. `tmux.conf`가 `conf.d/*.conf`를 알파벳 순으로 소싱하여 터미널, 테마, 키(prefix = `C-a`), 사이드바, 상태 표시줄을 초기화합니다.
2. `sessionizer.conf`의 `SCAN_DIR` + `EXTRA_DIRS`가 검색 루트를 정의하고, `bin/tmux-sessionizer`가 fzf로 디렉터리·세션을 골라 진입하거나 새로 만듭니다.
3. 세션 내부에서 `bin/tmux-sidebar`가 세션·창·팬 트리를 그리고, `bin/tmux-session-dashboard`가 요약 테이블을 팝업으로 띄웁니다.
4. `bin/tmux-template-create`와 `layouts/*.yml`이 세션·창·팬을 한 번에 구성하고, `bin/tmux-layout-apply`가 기존 세션에 동일 레이아웃을 적용합니다.
5. `bin/tmux-slack-bridge-start`가 tmux 세션과 Slack 채널을 양방향 동기화하고, `bin/tmux-web-terminal`이 ttyd로 세션을 웹에 노출합니다.
6. `bin/tmux-config-reload`로 설정을 다시 읽고, `bin/tmux-cheatsheet`로 단축키 사전을 팝업으로 확인합니다.

## 목차

1. [저장소 구성](#저장소-구성)
2. [아키텍처](#아키텍처)
3. [설치 및 빠른 시작](#설치-및-빠른-시작)
4. [구성 파일](#구성-파일)
5. [명령어 레퍼런스](#명령어-레퍼런스)
6. [레이아웃 템플릿](#레이아웃-템플릿)
7. [로컬 개발과 테스트](#로컬-개발과-테스트)
8. [기여 가이드](#기여-가이드)
9. [라이선스](#라이선스)
10. [추가 문서](#추가-문서)
11. [유지보수자·연락처](#유지보수자연락처)

## 저장소 구성

실제 최상위 디렉터리(있는 그대로):

| 경로 | 책임 |
| --- | --- |
| `tmux.conf` | 루트 로더. `source-file`로 `conf.d/*.conf`를 알파벳 순으로 로딩 |
| `sessionizer.conf` | 세션라이저용 `SCAN_DIR`, `EXTRA_DIRS` |
| `conf.d/*.conf` | 코어(00), 테마(10), 키(20), 사이드바(25), 그 외 상태 표시줄·Git·알림 |
| `bin/` | 약 40개의 bash 실행 진입점 |
| `lib/` | 사이드바·세션라이저 공유 함수 (`sidebar-colors`, `sidebar-render`, `tmux-sessionizer-common`, `tmux-sessionizer-wizard`) |
| `layouts/*.yml` | 창·팬·명령 템플릿 (default, resume, proxmox, safework, safework2, splunk, blacklist) |
| `tui/sessionizer/` | Bun + OpenTUI 그래픽 세션라이저 (소스, 훅, 액션, 컴포넌트, 테스트) |
| `slack/tmux-bridge/` | Node.js Slack ↔ tmux 브리지 |
| `docs/` | 세션 영속화 설계 메모, 거버넌스 노트 |
| `AGENTS.md`, `tui/sessionizer/AGENTS.md`, `slack/tmux-bridge/AGENTS.md` | AI 작업 컨텍스트(사용자 대상 아님) |
| `OWNERS`, `CONTRIBUTING.md`, `LICENSE`, `README