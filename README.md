<think>
The user wants me to generate a comprehensive README.md for a repository. Let me analyze the provided structure:

1. It's a tmux configuration project with multiple components:
   - Root level: tmux.conf, sessionizer.conf
   - tui/sessionizer - A Bun/OpenTUI based sessionizer (React-like TUI)
   - slack/tmux-bridge - Node.js Slack integration
   - systemd/ - Various systemd services for tmux automation
   - wezterm/ - Wezterm terminal config
   - bin/ - Many bash scripts for tmux management

2. There are 32 workflow files listed
3. The project has AGENTS.md with detailed knowledge about automation

Let me write a comprehensive bilingual README in Korean and English.

Key information to include:
- The project is a bash-first tmux configuration and session-management toolkit
- It has multiple components: tui/sessionizer (Bun/OpenTUI), slack/tmux-bridge (Node.js)
- 32 GitHub Actions workflows for automation
- Various systemd services for session persistence and monitoring
- Many bin scripts for session management

I'll structure this as:
1. Badges
2. Overview
3. Features
4. Architecture
5. Automation Inventory (workflows + tools)
6. Quick Start
7. Local Development
8. Commands Reference
9. Contribution Guide
10. License

Let me generate this now.

</think>

# TMUX SESSIONIZER

```
 ______ ____    ____    ______ ____   ____    ____  ______   __    __  ____    ____   ________  ___       __    __  ________  ______   ____    ____ 
/      |\   \  /   /  /      |\   \  /   /  /      |      \ |  \  |  ||   \  |   |  /        ||   \     |   \  |  |/        |/      \  |   \  |   |  
|      | \   \/   /  |      | \   \/   /  |      |  ____|| |   | |  ||    \ |   | |  ______ ||    \    |    \ |  ||  ______||  ____| |    \ |   |  
|      |  \      /   |      | |      /   |      | |__   | |   | |  ||     \|   | | |      | |    |    |     \|  || |__   | | |__   | |     \|   |  
|      |   \    /    |      | |    /    |      |  __|  | |   | |  ||  |\        || |  ____|| |    |    |  .        ||  __|  | |  __|  | |  .        |  
|      |    \  /     |      | |   /     |      | |     | |   | |  ||  | \       || |      | |    |    |  |   \    || |     | | |     | |  | \       |  
|  \__/     |__|     |  \__/  |  |__/     |  \__/  |____|  |  \__/  |  |  |__/     |  |  |____|  |  \__/    |__|  |__||__|  |____|  |__|  |__/     |  
```

> **Bash-first tmux configuration and session-management toolkit** — symlinked as `~/.tmux`

---

## Table of Contents / 목차

- [Overview](#overview--개요)
- [Features](#features--기능)
- [Architecture](#architecture--아키텍처)
- [Automation Inventory](#automation-inventory--자동화-인벤토리)
- [Quick Start](#quick-start--빠른-시작)
- [Local Development](#local-development--로컬-개발)
- [Commands Reference](#commands-reference--명령어-참조)
- [Contribution](#contribution--기여)

---

## Overview / 개요

| Item | Description |
|------|-------------|
| **Project** | jclee941/tmux |
| **Type** | tmux configuration + session management automation |
| **Core** | Bash-first with nested Bun (TUI) and Node.js (Slack) components |
| **Branch** | master |
| **Automation** | 32 GitHub Actions workflows managed by `jclee-bot` |

This project provides a comprehensive tmux configuration system with session discovery, creation wizards, Slack integration, and extensive automation tooling. The root-level `tmux.conf` sources configuration from `conf.d/*.conf`, while `bin/*` scripts serve as the execution surface for all session management operations.

**Components:**
- **tmux.conf** — Root loader, sources `conf.d/*.conf`
- **tui/sessionizer** — Bun/OpenTUI-based interactive session picker
- **slack/tmux-bridge** — Node.js Slack bot for session↔channel synchronization
- **systemd/** — Service files for session persistence and monitoring
- **wezterm/** — Wezterm terminal integration

---

## Features / 기능

### Core tmux Configuration
- Tokyo Night color scheme with pane border status indicators
- Prefix key: `C-a` (emacs-style)
- Comprehensive keybindings for pane/window/session management
- Sidebar tree display with toggle support
- Session resurrection via systemd

### Session Management
| Feature | Description |
|---------|-------------|
| **Session Picker** | fzf-based interactive session selector (`tmux-sessionizer`) |
| **Creation Wizard** | Multi-step TUI wizard for new sessions (`tmux-sessionizer-tui`) |
| **MRU Jump** | Most recently used session picker (`tmux-session-jump`) |
| **Session Kill** | Safe termination with confirmation dialog |
| **Session Rename** | Interactive rename with validation |
| **Layout Apply** | Apply YAML layout templates to sessions |
| **Dashboard** | Formatted session table popup |

### Git Integration
- Branch logging on session switch
- Git status (branch, dirty, ahead/behind, stash)
- Uncommitted change tracking per session

### Slack Integration (tmux-bridge)
- Session ↔ Slack channel synchronization
- Real-time session activity notifications
- Modal-based session create/manage from Slack
- Idle monitoring with auto-reconnect

### System Integration
- **systemd services** — Session persistence, resurrect, watching
- **SSH picker** — fzf-based SSH config host selector
- **Web terminal** — ttyd integration
- **Clipboard history** — tmux buffer ring browser
- **URL/File extraction** — fzf-powered extraction from panes

---

## Architecture / 아키텍처

```
tmux/
├── tmux.conf                  # Root loader: sources conf.d/*.conf
├── sessionizer.conf           # SCAN_DIR + EXTRA_DIRS for session discovery
│
├── bin/                       # Bash execution surface (39 scripts)
│   ├── tmux-sessionizer       # fzf session picker + creation wizard
│   ├── tmux-sessionizer-tui   # Launch TUI sessionizer (Bun OpenTUI)
│   ├── tmux-sidebar-*         # Sidebar management scripts
│   ├── tmux-session-*         # Session lifecycle scripts
│   ├── tmux-slack-bridge-*    # Slack bridge startup/setup
│   └── ...                    # 30+ more scripts
│
├── conf.d/                    # tmux configuration modules
│   ├── 00-core.conf           # Terminal/perf baseline + env propagation
│   ├── 10-theme.conf          # Tokyo Night palette + pane borders
│   ├── 20-keys.conf           # Keybindings (prefix=C-a)
│   └── ...
│
├── tui/sessionizer/           # Bun/OpenTUI React-like TUI
│   ├── src/
│   │   ├── App.tsx            # Main application
│   │   ├── components/        # UI components (wizard, filter, preview, etc.)
│   │   ├── hooks/             # Custom hooks (keyboard handler)
│   │   ├── actions/           # Session actions
│   │   └── lib/               # Config, tmux, state, theme libs
│   └── __tests__/             # Vitest unit tests
│
├── slack/tmux-bridge/         # Node.js Slack integration
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── lib/               # Slack, tmux, formatter libs
│   │   ├── actions/           # Action handlers
│   │   ├── commands/          # Command parser and handlers
│   │   └── __tests__/         # Vitest unit tests
│   └── ...
│
├── systemd/                   # Systemd service files
│   ├── tmux-resurrect-save.service + .sh
│   ├── tmux-session-watch.service + .path
│   └── ...                    # Various services
│
└── wezterm/
    └── wezterm.lua            # Wezterm terminal config
```

---

## Automation Inventory / 자동화 인벤토리

### GitHub Actions Workflows (32 total)

| # | Workflow File | Purpose |
|---|---------------|---------|
| 01 | `01_branch-to-pr.yml` | Branch to PR automation |
| 02 | `02_issue-to-branch.yml` | Issue to branch automation |
| 03 | `03_pr-checks.yml` | PR validation checks |
| 04 | `04_actionlint.yml` | Action workflow linting |
| 05 | `05_gitleaks.yml` | Secrets scanning |
| 06 | `06_codeql.yml` | CodeQL security analysis |
| 07 | `07_dependency-review.yml` | Dependency vulnerability review |
| 08 | `08_scorecard.yml` | OpenSSF scorecard |
| 09 | `09_semantic-pr.yml` | Semantic PR title validation |
| 10 | `10_pr-review.yml` | PR review automation |
| 12 | `12_dependabot-auto-merge.yml` | Dependabot PR auto-merge |
| 13 | `13_pr-auto-merge.yml` | General PR auto-merge |
| 14 | `14_bot-auto-fix.yml` | Bot auto-fix handling |
| 15 | `15_merged-pr-cleanup.yml` | Post-merge cleanup |
| 18 | `18_issue-management.yml` | Issue lifecycle management |
| 19 | `19_issue-backfill.yml` | Issue backfill automation |
| 20 | `20_readme-gen.yml` | README generation |
| 21 | `21_docs-sync.yml` | Documentation sync |
| 24 | `24_release-notes.yml` | Release notes generation |
| 25 | `25_release-publish.yml` | Release publishing |
| 29 | `29_downstream-health-check.yml` | Downstream dependency health |
| 37 | `37_ci-failure-issues.yml` | CI failure issue creation |
| 42 | `42_reusable-docs-sync.yml` | Reusable docs sync workflow |
| 43 | `43_reusable-issue-management.yml` | Reusable issue management |
| 44 | `44_reusable-pr-checks.yml` | Reusable PR checks |
| 45 | `45_reusable-gitleaks.yml` | Reusable gitleaks scan |
| 60 | `60_ci-auto-heal.yml` | CI self-healing automation |
| - | `auto-merge.yml` | Auto-merge handler |
| - | `ci.yml` | Main CI pipeline |
| - | `labeler.yml` | PR label automation |
| - | `welcome.yml` | New contributor welcome |
| - | `security/11_pr-review.yml` | Security PR review |

### Reusable Workflows

| Workflow | Description |
|----------|-------------|
| `42_reusable-docs-sync.yml` | Documentation synchronization |
| `43_reusable-issue-management.yml` | Issue management automation |
| `44_reusable-pr-checks.yml` | PR validation checks |
| `45_reusable-gitleaks.yml` | Secret scanning |

### Automation Agents

- **jclee-bot** — Primary automation bot managing this repository
- **minimax-m2.7** — Primary README generation model (with fallback to gpt-5.5 via CLIProxyAPI)

---

## Quick Start / 빠른 시작

### Installation

```bash
# Clone the repository
git clone https://github.com/jclee941/tmux.git
cd tmux

# Symlink as ~/.tmux
ln -s "$(pwd)" ~/.tmux

# Create symlinks for bin scripts to your PATH
mkdir -p ~/.local/bin
for script in bin/*; do
    ln -sf "$(pwd)/$script" ~/.local/bin/
done

# Or add to PATH in your shell rc
export PATH="$(pwd)/bin:$PATH"
```

### Basic Usage

```bash
# Launch session picker (fzf)
tmux-sessionizer

# Launch TUI sessionizer (Bun)
tmux-sessionizer-tui

# Jump to most recent session
tmux-session-jump

# Create new session with wizard
tmux-sessionizer --create

# Kill session safely
tmux-session-kill

# Toggle sidebar
tmux-sidebar-toggle

# Sync with Slack
tmux-session-sync

# Apply layout template
tmux-layout-apply <template.yaml>
```

### tmux Built-in Commands

```bash
# After sourcing tmux.conf (prefix = C-a)
C-a c        # Create new window
C-a d        # Detach session
C-a n        # Next window
C-a p        # Previous window
C-a |        # Split vertically
C-a -        # Split horizontally
C-a o        # Switch pane
C-a z        # Zoom pane
C-a ,        # Rename window
C-a &        # Kill window
```

---

## Local Development / 로컬 개발

### TUI Sessionizer (Bun/OpenTUI)

```bash
cd tui/sessionizer

# Install dependencies
bun install

# Run development
bun run dev

# Run tests
bun test

# Type check
bun run typecheck
```

**Structure:**
```
tui/sessionizer/
├── src/
│   ├── App.tsx              # Main TUI app
│   ├── components/          # UI components
│   │   ├── create-wizard.tsx
│   │   ├── filter-input.tsx
│   │   ├── kill-confirm-dialog.tsx
│   │   ├── preview-panel.tsx
│   │   ├── rename-dialog.tsx
│   │   ├── session-list.tsx
│   │   └── wizard-step-*.tsx
│   ├── hooks/
│   │   └── use-keyboard-handler.ts
│   ├── actions/
│   │   └── session-actions.ts
│   └── lib/
│       ├── config.ts        # Configuration loader
│       ├── create-session.ts
│       ├── dirs.ts          # Directory utilities
│       ├── state.ts         # State management
│       ├── theme.ts         # Theme definitions
│       └── tmux.ts          # tmux interface
├── __tests__/               # Vitest unit tests
├── bunfig.toml
├── package.json
└── tsconfig.json
```

### Slack Bridge (Node.js)

```bash
cd slack/tmux-bridge

# Install dependencies
npm install

# Run tests
npm test

# Run in development
npm run dev

# Build
npm run build
```

**Structure:**
```
slack/tmux-bridge/
├── src/
│   ├── index.ts             # Entry point
│   ├── types.ts             # Type definitions
│   ├── lib/
│   │   ├── channels.ts      # Slack channel utilities
│   │   ├── config.ts        # Configuration
│   │   ├── idle-monitor.ts  # Idle detection
│   │   ├── opencode.ts      # OpenCode integration
│   │   ├── tmux.ts          # tmux interface
│   │   └── formatter/       # Message formatters
│   │       ├── blocks.ts
│   │       ├── capture.ts
│   │       ├── index.ts
│   │       ├── modal.ts
│   │       ├── notify.ts
│   │       ├── opencode.ts
│   │       ├── session.ts
│   │       └── time.ts
│   ├── actions/
│   │   ├── handler.ts
│   │   ├── helpers.ts
│   │   └── handlers/
│   │       ├── index.ts
│   │       ├── modal-open.ts
│   │       ├── modal-submit.ts
│   │       └── session.ts
│   └── commands/
│       ├── handler.ts
│       ├── index.ts
│       └── parser.ts
├── __tests__/               # Vitest unit tests
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

### Testing

```bash
# TUI tests
cd tui/sessionizer && bun test

# Slack bridge tests
cd slack/tmux-bridge && npm test

# All tests (from root)
bun run test:all  # if configured
```

---

## Commands Reference / 명령어 참조

### Session Management

| Command | Description |
|---------|-------------|
| `tmux-sessionizer` | fzf-based session picker with create option |
| `tmux-sessionizer-tui` | Bun/OpenTUI TUI session picker |
| `tmux-session-jump` | MRU fzf session picker |
| `tmux-session-create` | Create new session (via bin wrapper) |
| `tmux-session-kill` | Safe session termination with confirmation |
| `tmux-session-rename` | Interactive rename with validation |
| `tmux-session-export` | Export session layout to YAML |
| `tmux-session-sync` | Sync tmux sessions with Slack channels |
| `tmux-session-order` | Sort sessions by last activity |
| `tmux-session-branch-log` | Log session→branch on switch |
| `tmux-session-dashboard` | Formatted session table popup |
| `tmux-session-icon` | Nerd Font icon mapper for sessions |

### Sidebar

| Command | Description |
|---------|-------------|
| `tmux-sidebar` | Tree sidebar display engine |
| `tmux-sidebar-init` | Initialize sidebar on session create |
| `tmux-sidebar-toggle` | Toggle sidebar visibility |

### Layout & Templates

| Command | Description |
|---------|-------------|
| `tmux-template-create` | Quick-create session from preset templates |
| `tmux-layout-apply` | Apply YAML layout templates to sessions |

### Git

| Command | Description |
|---------|-------------|
| `tmux-git-status` | Git branch + dirty/ahead/behind/st