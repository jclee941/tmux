# TMUX SESSIONIZER

<!-- jclee-bot-automation-status:start -->
## GitHub Automation Status / GitHub 자동화 현황

Current as of 2026-06-19.

- Primary PR review/checks and issue maintenance run through the `jclee-bot` GitHub App.
- Issue automation includes opened-issue labels, stale-label removal, stale issue sweep/close, and issue-summary upkeep.
- Existing `.github/workflows` files are compatibility GitOps surfaces managed from `jclee941/.github`; do not treat legacy per-repo workflow counts as the production bot rollout path.
- Source of truth: `jclee941/.github` (`config/repos.yaml`, `jclee_bot/`, and central workflows).

<!-- jclee-bot-automation-status:end -->


[![CI Status](https://github.com/jclee941/.github/actions/workflows/ci.yml/badge.svg)](https://github.com/jclee941/.github/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/jclee941/tmux-sessionizer?include_prereleases&label=release)](https://github.com/jclee941/.github/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.x-ff69b4)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org/)

> Bash-first tmux configuration and session-management toolkit

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Automation Inventory](#automation-inventory)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Commands Reference](#commands-reference)
- [Contribution Guide](#contribution-guide)
- [개요](#개요)
- [기능](#기능)
- [아키텍처](#아키텍처)
- [자동화 인벤토리](#자동화-인벤토리)
- [빠른 시작](#빠른-시작)
- [로컬 개발](#로컬-개발)
- [명령어 참고자료](#명령어-참고자료)
- [기여 가이드](#기여-가이드)

---

## Overview

**TMUX SESSIONIZER** is a comprehensive tmux configuration system designed for developers who work with multiple projects and sessions. It provides a unified interface for session discovery, creation, and management, with deep integrations for Slack, system services, and terminal UI applications.

The project is structured as a symlinked `~/.tmux` directory with a plugin-style architecture. Core behavior lives in `conf.d/*.conf` and `bin/*` scripts. A nested Bun/OpenTUI sessionizer TUI runs at `tui/sessionizer`, and a Node.js Slack bridge operates at `slack/tmux-bridge`.

### Key Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Core Config | tmux.conf | Root loader, sources conf.d/*.conf |
| Session Discovery | Bash + fzf | bin/tmux-sessionizer for picker + wizard |
| TUI Application | Bun + React + OpenTUI | Interactive session management |
| Slack Bridge | Node.js + Bun | Real-time session↔Slack sync |
| System Services | systemd | Session persistence and monitoring |

---

## Features

### Session Management

- **fzf-based session picker** with fuzzy search across all projects
- **Creation wizard** with directory selection, naming, and layout presets
- **MRU session jumping** for quick access to recently used sessions
- **Safe session termination** with confirmation dialogs
- **Session naming** with validation and conflict detection

### TUI Application

- **Interactive React-based UI** running on Bun/OpenTUI
- **Live session filtering** with keyboard navigation
- **Preview panel** showing session details and git status
- **Multi-step creation wizard** (directory → name → layout)
- **Kill confirmation** and rename dialogs

### Slack Integration

- **Real-time channel sync** between tmux sessions and Slack channels
- **Modal interactions** for session creation and management
- **Desktop notifications** for long-running commands
- **Idle monitoring** with configurable thresholds
- **Branch-aware notifications** showing current git context

### System Services

- **Session resurrection** via systemd timers
- **Automatic session watch** for persistence
- **Slack bridge service** with dual-mode connectivity (socket/cloudflared)
- **Web terminal** via ttyd integration

### Automation (GitHub Actions)

- **PR workflow automation** (branch creation, checks, review, merge)
- **Issue management** (classification, backfill, health monitoring)
- **Documentation sync** across downstream repos
- **Release publishing** with health checks
- **CI auto-heal** for self-remediating pipelines
- **Security scanning** via CodeQL, Gitleaks, and Dependency Review

---

## Architecture

```mermaid
flowchart TB
    subgraph Repository["GitHub Repository"]
        direction TB
        wf[("Workflows<br/>33 files"]
        docs["docs/"]
        config["conf.d/*.conf"]
        bins["bin/*"]
    end

    subgraph Client["Developer Workstation"]
        direction TB
        tmux["tmux<br/>(conf.d sourced"]
        subgraph BinScripts["bin/ (Bash)"]
            sessionizer["tmux-sessionizer"]
            sidebar["tmux-sidebar-*"]
            slack["tmux-slack-*"]
            extras["tmux-*-jump<br/>tmux-*-export<br/>tmux-*-cheatsheet"]
        end
        subgraph TUI["tui/sessionizer"]
            app["App.tsx<br/>Bun + React + OpenTUI"]
            components["components/"]
            actions["actions/"]
            lib["lib/"]
            hooks["hooks/"]
        end
        subgraph SlackBridge["slack/tmux-bridge"]
            bridge["index.ts<br/>Node.js + Bun"]
            handlers["actions/handlers/"]
            commands["commands/"]
            formatter["lib/formatter/"]
        end
    end

    subgraph Services["systemd Services"]
        resurrect["tmux-resurrect-save.service"]
        watch["tmux-session-watch.service"]
        slackSvc["tmux-slack-bridge.service"]
        web["tmux-web-terminal.service"]
    end

    subgraph External["External Services"]
        slack["Slack API"]
        cf["Cloudflared<br/>&lt;homelab-host&gt;:8317"]
        cliproxy["CLIProxy API<br/>https://cliproxy.jclee.me/v1"]
        elk["&lt;homelab-elk&gt;<br/>Logging"]
    end

    subgraph GitHub["GitHub Actions"]
        pr["10_pr-review.yml<br/>13_pr-auto-merge.yml<br/>14_bot-auto-fix.yml"]
        issue["jclee-bot App issue-management<br/>91_issue-classification.yml"]
        release["24_release-notes.yml<br/>25_release-publish.yml"]
        health["29_downstream-health-check.yml<br/>60_ci-auto-heal.yml"]
        docs["21_docs-sync.yml<br/>42_reusable-docs-sync.yml"]
        scan["04_actionlint.yml<br/>05_gitleaks.yml<br/>06_codeql.yml"]
    end

    tmux --> BinScripts
    tmux --> TUI
    tmux --> Services

    BinScripts --> sessionizer
    BinScripts --> slack
    BinScripts --> extras

    slack --> SlackBridge
    SlackBridge --> slack
    SlackBridge --> cf
    SlackBridge --> cliproxy

    resurrect -.-> tmux
    watch -.-> tmux
    slackSvc --> SlackBridge

    wf --> GitHub
    GitHub --> cliproxy

    style Repository fill:#f9f,stroke:#333,stroke-width:2px
    style Client fill:#bbf,stroke:#333,stroke-width:2px
    style Services fill:#bfb,stroke:#333,stroke-width:2px
    style External fill:#fbb,stroke:#333,stroke-width:2px
    style GitHub fill:#ffa,stroke:#333,stroke-width:2px
```

---

## Automation Inventory

### Workflows

| File | Purpose |
|------|---------|
| `01_branch-to-pr.yml` | Convert feature branches to PRs with auto-review |
| `02_issue-to-branch.yml` | Create branches from issues with task checklist |
| `03_pr-checks.yml` | Run tests, lint, and build on PR changes |
| `04_actionlint.yml` | Lint all workflow files for syntax errors |
| `05_gitleaks.yml` | Scan for secrets and credentials in commits |
| `06_codeql.yml` | GitHub CodeQL security analysis |
| `07_dependency-review.yml` | Dependency vulnerability scanning |
| `08_scorecard.yml` | OpenSSF security scorecard collection |
| `09_semantic-pr.yml` | Enforce conventional commit format |
| `10_pr-review.yml` | AI-powered PR review via qodo-ai/pr-agent |
| `12_dependabot-auto-merge.yml` | Auto-merge Dependabot updates |
| `13_pr-auto-merge.yml` | Auto-merge PRs passing all checks |
| `14_bot-auto-fix.yml` | Auto-fix lint errors in PRs |
| `15_merged-pr-cleanup.yml` | Cleanup branches after merge |
| `jclee-bot App issue-management` | Sync issues with labels and milestones |
| `19_issue-backfill.yml` | Backfill issue metadata and context |
| `20_readme-gen.yml` | Generate README documentation |
| `21_docs-sync.yml` | Sync docs across repositories |
| `24_release-notes.yml` | Generate release notes from changelog |
| `25_release-publish.yml` | Publish releases with artifacts |
| `29_downstream-health-check.yml` | Monitor downstream repo health |
| `37_ci-failure-issues.yml` | Create issues for CI failures |
| `42_reusable-docs-sync.yml` | Reusable workflow for doc synchronization |
| `jclee-bot App issue-management` | Reusable workflow for issue handling |
| `44_reusable-pr-checks.yml` | Reusable workflow for PR validation |
| `45_reusable-gitleaks.yml` | Reusable workflow for secret scanning |
| `60_ci-auto-heal.yml` | Auto-heal failing CI pipelines |
| `91_issue-classification.yml` | Classify and route issues |
| `auto-merge.yml` | Generic auto-merge workflow |
| `ci.yml` | Primary CI workflow |
| `labeler.yml` | Auto-label issues and PRs |
| `welcome.yml` | Welcome new contributors |
| `security/11_pr-review.yml` | Security-focused PR review |

### Tools

| Tool | Purpose |
|------|---------|
| [qodo-ai/pr-agent](https://qodo-ai/pr-agent) | AI-powered PR review and automation |
| [CLIProxy](https://cliproxy.jclee.me/v1) | Local AI proxy for development |
| [Cloudflared](https://github.com/cloudflare/cloudflared) | Tunnel for Slack bridge connectivity |
| [fzf](https://github.com/junegunn/fzf) | Fuzzy finder for session picker |
| [Bun](https://bun.sh) | JavaScript runtime for TUI and Slack bridge |
| [OpenTUI](https://github.com/opl-/opentui) | Terminal UI framework for React |
| [ttyd](https://github.com/tsl0922/ttyd) | Web terminal backend |

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/jclee941/.github ~/.tmux

# Create symlink
ln -sf ~/.tmux ~/.tmux

# Install dependencies
# - tmux (>= 3.0)
# - fzf
# - bun (for TUI and Slack bridge)
# - GitHub CLI (gh)

# Reload tmux configuration
tmux source-file ~/.tmux/tmux.conf
```

### Basic Usage

| Command | Description |
|---------|-------------|
| `Prefix + s` | Open session picker (fzf) |
| `Prefix + c` | Create new session |
| `Prefix + C` | Launch TUI sessionizer |
| `Prefix + @` | Toggle sidebar |
| `Prefix + l` | Show cheatsheet |
| `tmux-session-jump` | MRU session picker |
| `tmux-session-kill` | Kill session with confirmation |
| `tmux-slack-bridge-start` | Start Slack bridge service |

---

## Local Development

### Repository Structure

```
tmux-sessionizer/
├── tmux.conf                    # Root tmux configuration
├── sessionizer.conf             # Session discovery settings
├── AGENTS.md                    # Project knowledge base
├── CONTRIBUTING.md              # Contribution guidelines
├── LICENSE                      # MIT license
├── OWNERS                       # Code ownership
├── bin/                         # Bash scripts (32 files)
│   ├── tmux-sessionizer         # Main session picker
│   ├── tmux-sessionizer-tui     # TUI launcher
│   ├── tmux-sidebar*            # Sidebar utilities
│   ├── tmux-slack*              # Slack integration
│   └── ...
├── conf.d/                      # tmux config snippets
├── tui/
│   └── sessionizer/             # Bun + React TUI app
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   ├── actions/
│       │   ├── hooks/
│       │   └── lib/
│       └── __tests__/
├── slack/
│   └── tmux-bridge/             # Node.js Slack bridge
│       ├── src/
│       │   ├── actions/
│       │   ├── commands/
│       │   └── lib/
│       └── __tests__/
└── systemd/                     # Service files
```

### Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| tmux | >= 3.0 | Terminal multiplexer |
| fzf | >= 0.42 | Fuzzy finder |
| bun | 1.x | JS runtime |
| gh | latest | GitHub CLI |
| git | latest | Version control |

### Running Tests

```bash
# TUI tests (Bun)
cd tui/sessionizer
bun test

# Slack bridge tests (Vitest)
cd slack/tmux-bridge
bun test

# Workflow lint
brew install actionlint
actionlint
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SCAN_DIR` | Directories to scan for projects | `~/projects` |
| `EXTRA_DIRS` | Additional directories | `` |
| `SLACK_BOT_TOKEN` | Slack bot OAuth token | (required) |
| `SLACK_TEAM_ID` | Slack team identifier | (required) |
| `CLIPROXY_URL` | CLIProxy API endpoint | `https://cliproxy.jclee.me/v1` |

---

## Commands Reference

### Core Scripts (bin/)

| Script | Description |
|--------|-------------|
| `tmux-sessionizer` | fzf-based session picker with creation wizard |
| `tmux-sessionizer-tui` | Launch Bun/OpenTUI sessionizer |
| `tmux-sidebar` | Tree sidebar display engine |
| `tmux-sidebar-toggle` | Toggle sidebar visibility |
| `tmux-session-jump` | MRU session picker |
| `tmux-session-kill` | Safe session termination |
| `tmux-session-rename` | Session rename with validation |
| `tmux-session-sync` | Sync sessions with Slack channels |
| `tmux-session-export` | Export session layout to YAML |
| `tmux-session-dashboard` | Formatted session table popup |
| `tmux-slack-bridge-start` | Start Slack bridge (dual mode) |
| `tmux-slack-bridge-setup` | Interactive Slack app setup |
| `tmux-git-status` | Git branch and status |
| `tmux-git-uncommitted` | Track uncommitted changes |
| `tmux-template-create` | Create from preset templates |
| `tmux-layout-apply` | Apply YAML layout templates |
| `tmux-responsive` | Width-tiered statusbar |
| `tmux-cheatsheet` | Categorized keybinding reference |
| `tmux-url-open` | URL extraction via fzf |
| `tmux-file-open` | File path extraction via fzf |
| `tmux-ssh-picker` | SSH config host picker |
| `tmux-clipboard-history` | Buffer ring browser |
| `tmux-command-palette` | fzf action picker |

### Systemd Services (systemd/)

| Service | Description |
|---------|-------------|
| `tmux-resurrect-save.service` | Save sessions for resurrection |
| `tmux-session-watch.path` | Monitor session activity |
| `tmux-session-watch.service` | Trigger save on activity |
| `tmux-slack-bridge.service` | Slack bridge daemon |
| `tmux-web-terminal.service` | ttyd web terminal |

---

## Contribution Guide

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Steps

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/<you>/tmux-sessionizer.git`
3. **Create a branch**: `git checkout -b feat/your-feature`
4. **Make changes** and commit using [conventional commits](https://www.conventionalcommits.org/)
5. **Push**: `git push origin feat/your-feature`
6. **Open a PR** against `master`

### Commit Convention

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting |
| `refactor` | Code restructure |
| `test` | Adding tests |
| `chore` | Maintenance |

### Code Standards

- Bash scripts: ShellCheck compliance, POSIX-compatible
- TypeScript: Strict mode, full type coverage
- Tests: All new features require tests
- Workflows: actionlint validated

---

## 개요

**TMUX SESSIONIZER**는 여러 프로젝트와 세션에서 작업하는 개발자를 위해 설계된 종합적인 tmux 구성 시스템입니다. 세션 검색, 생성 및 관리를 위한 통합 인터페이스를 제공하며, Slack, 시스템 서비스 및 터미널 UI 애플리케이션과 깊은 통합을 제공합니다.

이 프로젝트는 심볼릭 링크된 `~/.tmux` 디렉토리로 구조화된 플러그인 스타일 아키텍처입니다. 핵심 동작은 `conf.d/*.conf`와 `bin/*` 스크립트에 있습니다. 중첩된 Bun/OpenTUI 세션라이저 TUI가 `tui/sessionizer`에서 실행되고, Node.js Slack 브리지가 `slack/tmux-bridge`에서 작동합니다.

### 주요 구성 요소

| 구성 요소 | 기술 | 목적 |
|-----------|------|------|
| 코어 설정 | tmux.conf | 루트 로더, conf.d/*.conf 소싱 |
| 세션 검색 | Bash + fzf | 피커 + 위자드용 bin/tmux-sessionizer |
| TUI 애플리케이션 | Bun + React + OpenTUI | 대화형 세션 관리 |
| Slack 브리지 | Node.js + Bun | 실시간 세션↔Slack 동기화 |
| 시스템 서비스 | systemd | 세션 지속성 및 모니터링 |

---

## 기능

### 세션 관리

- **fzf 기반 세션 피커** 모든 프로젝트의 퍼지 검색
- **생성 위자드** 디렉토리 선택, 이름 지정 및 레이아웃 프리셋
- **MRU 세션 점프** 최근 사용 세션에 빠르게 접근
- **안전한 세션 종료** 확인 대화상자 포함
- **세션 이름 지정** 유효성 검사 및 충돌 감지

### TUI 애플리케이션

- **대화형 React 기반 UI** Bun/OpenTUI에서 실행
- **키보드 내비게이션** 라이브 세션 필터링
- **미리보기 패널** 세션 세부 정보 및 git 상태 표시
- **다단계 생성 위자드** (디렉토리 → 이름 → 레이아웃)
- **종료 확인** 및 이름 변경 대화상자

### Slack 통합

- **실시간 채널 동기화** tmux 세션과 Slack 채널 간
- **모달 상호작용** 세션 생성 및 관리용
- **데스크톱 알림** 장기 실행 명령어용
- **유휴 모니터링** 구성 가능한 임계값
- **브랜치 인식 알림** 현재 git 컨텍스트 표시

### 시스템 서비스

- **세션 resurrect** systemd 타이머를 통한
- **자동 세션 감시** 지속성용
- **Slack 브리지 서비스** 이중 모드 연결 (소켓/cloudflared)
- **웹 터미널** ttyd 통합을 통한

### 자동화 (GitHub Actions)

- **PR 워크플로 자동화** (브랜치 생성, 검사, 리뷰, 병합)
- **이슈 관리** (분류, 백필, 상태 모니터링)
- **문서 동기화** 다운스트림 리포지토리 전반
- **릴리스 게시** 상태 검사와 함께
- **CI 자동 복구** 자체 복구 파이프라인
- **보안 스캔** CodeQL, Gitleaks 및 Dependency Review를 통한

---

## 아키텍처

```mermaid
flowchart TB
    subgraph Repository["GitHub Repository"]
        direction TB
        wf[("Workflows<br/>33 files"]
        docs["docs/"]
        config["conf.d/*.conf"]
        bins["bin/*"]
    end

    subgraph Client["Developer Workstation"]
        direction TB
        tmux["tmux<br/>(conf.d sourced"]
        subgraph BinScripts["bin/ (Bash)"]
            sessionizer["tmux-sessionizer"]
            sidebar["tmux-sidebar-*"]
            slack["tmux-slack-*"]
            extras["tmux-*-jump<br/>tmux-*-export<br/>tmux-*-cheatsheet"]
        end
        subgraph TUI["tui/sessionizer"]
            app["App.tsx<br/>Bun + React + OpenTUI"]
            components["components/"]
            actions["actions/"]
            lib["lib/"]
            hooks["hooks/"]
        end
        subgraph SlackBridge["slack/tmux-bridge"]
            bridge["index.ts<br/>Node.js + Bun"]
            handlers["actions/handlers/"]
            commands["commands/"]
            formatter["lib/formatter/"]
        end
    end

    subgraph Services["systemd Services"]
        resurrect["tmux-resurrect-save.service"]
        watch["tmux-session-watch.service"]
        slackSvc["tmux-slack-bridge.service"]
        web["tmux-web-terminal.service"]
    end

    subgraph External["External Services"]
        slack["Slack API"]
        cf["Cloudflared<br/>&lt;homelab-host&gt;:8317"]
        cliproxy["CLIProxy API<br/>https://cliproxy.jclee.me/v1"]
        elk["&lt;homelab-elk&gt;<br/>Logging"]
    end

    subgraph GitHub["GitHub Actions"]
        pr["10_pr-review.yml<br/>13_pr-auto-merge.yml<br/>14_bot-auto-fix.yml"]
        issue["jclee-bot App issue-management<br/>91_issue-classification.yml"]
        release["24_release-notes.yml<br/>25_release-publish.yml"]
        health["29_downstream-health-check.yml<br/>60_ci-auto-heal.yml"]
        docs["21_docs-sync.yml<br/>42_reusable-docs-sync.yml"]
        scan["04_actionlint.yml<br/>05_gitleaks.yml<br/>06_codeql.yml"]
    end

    tmux --> BinScripts
    tmux --> TUI
    tmux --> Services

    BinScripts --> sessionizer
    BinScripts --> slack
    BinScripts --> extras

    slack --> SlackBridge
    SlackBridge --> slack
    SlackBridge --> cf
    SlackBridge --> cliproxy

    resurrect -.-> tmux
    watch -.-> tmux
    slackSvc --> SlackBridge

    wf --> GitHub
    GitHub --> cliproxy

    style Repository fill:#f9f,stroke:#333,stroke-width:2px
    style Client fill:#bbf,stroke:#333,stroke-width:2px
    style Services fill:#bfb,stroke:#333,stroke-width:2px
    style External fill:#fbb,stroke:#333,stroke-width:2px
    style GitHub fill:#ffa,stroke:#333,stroke-width:2px
```

---

## 자동화 인벤토리

### 워크플로우

| 파일 | 목적 |
|------|------|
| `01_branch-to-pr.yml` | 자동 리뷰와 함께 기능 브랜치를 PR로 변환 |
| `02_issue-to-branch.yml` | 태스크 체크리스트와 함께 이슈에서 브랜치 생성 |
| `03_pr-checks.yml` | PR 변경 시 테스트, 린트, 빌드 실행 |
| `04_actionlint.yml` | 모든 워크플로 파일의 구문 오류 린트 |
| `05_gitleaks.yml` | 커밋에서 비밀번호 및 자격 증명 스캔 |
| `06_codeql.yml` | GitHub CodeQL 보안 분석 |
| `07_dependency-review.yml` | 의존성 취약점 스캔 |
| `08_scorecard.yml` | OpenSSF 보안 점수 카드 수집 |
| `09_semantic-pr.yml` | Conventional Commit 형식 강제 |
| `10_pr-review.yml` | qodo-ai/pr-agent를 통한 AI 기반 PR 리뷰 |
| `12_dependabot-auto-merge.yml` | Dependabot 업데이트 자동 병합 |
| `13_pr-auto-merge.yml` | 모든 검사를 통과한 PR 자동 병합 |
| `14_bot-auto-fix.yml` | PR에서 린트 오류 자동 수정 |
| `15_merged-pr-cleanup.yml` | 병합 후 브랜치 정리 |
| `jclee-bot App issue-management` | 레이블 및 마일스톤과 이슈 동기화 |
| `19_issue-backfill.yml` | 이슈 메타데이터 및 컨텍스트 백필 |
| `20_readme-gen.yml` | README 문서 생성 |
| `21_docs-sync.yml` | 리포지토리 전반 문서 동기화 |
| `24_release-notes.yml` | 체인지로그에서 릴리스 노트 생성 |
| `25_release-publish.yml` | 아티팩트로 릴리스 게시 |
| `29_downstream-health-check.yml` | 다운스트림 리포지토리 상태 모니터링 |
| `37_ci-failure-issues.yml` | CI 실패용 이슈 생성 |
| `42_reusable-docs-sync.yml` | 문서 동기화 재사용 워크플로 |
| `jclee-bot App issue-management` | 이슈 처리 재사용 워크플로 |
| `44_reusable-pr-checks.yml` | PR 검증 재사용 워크플로 |
| `45_reusable-gitleaks.yml` | 비밀번호 스캔 재사용 워크플로 |
| `60_ci-auto-heal.yml` | 실패한 CI 파이프라인 자동 복구 |
| `91_issue-classification.yml` | 이슈 분류 및 라우팅 |
| `auto-merge.yml` | 범용 자동 병합 워크플로 |
| `ci.yml` | 기본 CI 워크플로 |
| `labeler.yml` | 이슈 및 PR 자동 레이블링 |
| `welcome.yml` | 새로운 기여자 환영 |
| `security/11_pr-review.yml` | 보안 중심 PR 리뷰 |

### 도구

| 도구 | 목적 |
|------|------|
| [qodo-ai/pr-agent](https://qodo-ai/pr-agent) | AI 기반 PR 리뷰 및 자동화 |
| [CLIProxy](https://cliproxy.jclee.me/v1) | 개발용 로컬 AI 프록시 |
| [Cloudflared](https://github.com/cloudflare/cloudflared) | Slack 브리지 연결을 위한 터널 |
| [fzf](https://github.com/junegunn/fzf) | 세션 피커용 퍼지 파인더 |
| [Bun](https://bun.sh) | TUI 및 Slack 브리지용 JavaScript 런타임 |
| [OpenTUI](https://github.com/opl-/opentui) | React용 터미널 UI 프레임워크 |
| [ttyd](https://github.com/tsl0922/ttyd) | 웹 터미널 백엔드 |

---

## 빠른 시작

### 설치

```bash
# 리포지토리 클론
git clone https://github.com/jclee941/.github ~/.tmux

# 심볼릭 링크 생성
ln -sf ~/.tmux ~/.tmux

# 의존성 설치
# - tmux (>= 3.0)
# - fzf
# - bun (TUI 및 Slack 브리지용)
# - GitHub CLI (gh)

# tmux 구성 다시 로드
tmux source-file ~/.tmux/tmux.conf
```

### 기본 사용법

| 명령 | 설명 |
|------|------|
| `Prefix + s` | 세션 피커 열기 (fzf) |
| `Prefix + c` | 새 세션 생성 |
| `Prefix + C` | TUI 세션라이저 실행 |
| `Prefix + @` | 사이드바 토글 |
| `Prefix + l` | 치트시트 표시 |
| `tmux-session-jump` | MRU 세션 피커 |
| `tmux-session-kill` | 확인 후 세션 종료 |
| `tmux-slack-bridge-start` | Slack 브리지 서비스 시작 |

---

## 로컬 개발

### 리포지토리 구조

```
tmux-sessionizer/
├── tmux.conf                    # 루트 tmux 구성
├── sessionizer.conf             # 세션 검색 설정
├── AGENTS.md                    # 프로젝트 지식 베이스
├── CONTRIBUTING.md              # 기여 가이드라인
├── LICENSE                      # MIT 라이선스
├── OWNERS                       # 코드 소유권
├── bin/                         # Bash 스크립트 (32개 파일)
│   ├── tmux-sessionizer         # 메인 세션 피커
│   ├── tmux-sessionizer-tui     # TUI 실행기
│   ├── tmux-sidebar*            # 사이드바 유틸리티
│   ├── tmux-slack*              # Slack 통합
│   └── ...
├── conf.d/                      # tmux 설정 스니펫
├── tui/
│   └── sessionizer/             # Bun + React TUI 앱
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   ├── actions/
│       │   ├── hooks/
│       │   └── lib/
│       └── __tests__/
├── slack/
│   └── tmux-bridge/             # Node.js Slack 브리지
│       ├── src/
│       │   ├── actions/
│       │   ├── commands/
│       │   └── lib/
│       └── __tests__/
└── systemd/                     # 서비스 파일
```

### 전제 조건

| 의존성 | 버전 | 목적 |
|--------|------|------|
| tmux | >= 3.0 | 터미널 멀티플렉서 |
| fzf | >= 0.42 | 퍼지 파인더 |
| bun | 1.x | JS 런타임 |
| gh | latest | GitHub CLI |
| git | latest | 버전 관리 |

### 테스트 실행

```bash
# TUI 테스트 (Bun)
cd tui/sessionizer
bun test

# Slack 브리지 테스트 (Vitest)
cd slack/tmux-bridge
bun test

# 워크플로우 린트
brew install actionlint
actionlint
```

### 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `SCAN_DIR` | 프로젝트를 스캔할 디렉토리 | `~/projects` |
| `EXTRA_DIRS` | 추가 디렉토리 | `` |
| `SLACK_BOT_TOKEN` | Slack 봇 OAuth 토큰 | (필수) |
| `SLACK_TEAM_ID` | Slack 팀 식별자 | (필수) |
| `CLIPROXY_URL` | CLIProxy API 엔드포인트 | `https://cliproxy.jclee.me/v1` |

---

## 명령어 참고자료

### 코어 스크립트 (bin/)

| 스크립트 | 설명 |
|----------|------|
| `tmux-sessionizer` | 생성 위자드가 있는 fzf 기반 세션 피커 |
| `tmux-sessionizer-tui` | Bun/OpenTUI 세션라이저 실행 |
| `tmux-sidebar` | 트리 사이드바 디스플레이 엔진 |
| `tmux-sidebar-toggle` | 사이드바 가시성 토글 |
| `tmux-session-jump` | MRU 세션 피커 |
| `tmux-session-kill` | 안전한 세션 종료 |
| `tmux-session-rename` | 유효성 검사가 있는 세션 이름 변경 |
| `tmux-session-sync` | Slack 채널과 세션 동기화 |
| `tmux-session-export` | 세션 레이아웃을 YAML로 내보내기 |
| `tmux-session-dashboard` | 형식화된 세션 테이블 팝업 |
| `tmux-slack-bridge-start` | Slack 브리지 시작 (이중 모드) |
| `tmux-slack-bridge-setup` | 대화형 Slack 앱 설정 |
| `tmux-git-status` | Git 브랜치 및 상태 |
| `tmux-git-uncommitted` | 커밋되지 않은 변경 사항 추적 |
| `tmux-template-create` | 프리셋 템플릿에서 생성 |
| `tmux-layout-apply` | YAML 레이아웃 템플릿 적용 |
| `tmux-responsive` | 너비 계층 상태 표시줄 |
| `tmux-cheatsheet` | 분류된 키바인딩 참조 |
| `tmux-url-open` | fzf를 통한 URL 추출 |
| `tmux-file-open` | fzf를 통한 파일 경로 추출 |
| `tmux-ssh-picker` | SSH config 호스트 피커 |
| `tmux-clipboard-history` | 버퍼 링 브라우저 |
| `tmux-command-palette` | fzf 작업 피커 |

### systemd 서비스 (systemd/)

| 서비스 | 설명 |
|--------|------|
| `tmux-resurrect-save.service` | resurrection을 위한 세션 저장 |
| `tmux-session-watch.path` | 세션 활동 모니터링 |
| `tmux-session-watch.service` | 활동 시 저장 트리거 |
| `tmux-slack-bridge.service` | Slack 브리지 데몬 |
| `tmux-web-terminal.service` | ttyd 웹 터미널 |

---

## 기여 가이드

세부 가이드라인은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

### 빠른 단계

1. 리포지토리 **포크**
2. 포크 **클론**: `git clone https://github.com/<you>/tmux-sessionizer.git`
3. 브랜치 **생성**: `git checkout -b feat/your-feature`
4. 변경 사항 **작성** 및 [conventional commits](https://www.conventionalcommits.org/)로 커밋
5. **푸시**: `git push origin feat/your-feature`
6. `master`に対して**PRを開く**

### 커밋 컨벤션

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

| 유형 | 설명 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서화 |
| `style` | 포맷팅 |
| `refactor` | 코드 구조 재구성 |
| `test` | 테스트 추가 |
| `chore` | 유지보수 |

### 코드 표준

- Bash 스크립트: ShellCheck 준수, POSIX 호환
- TypeScript: 스트릭트 모드, 완전한 타입 커버리지
- 테스트: 모든 새 기능에는 테스트 필요
- 워크플로우: actionlint 검증됨
