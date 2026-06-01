# TMUX SESSIONIZER

<!-- Logo Tagline -->
> bash-first tmux configuration and session-management toolkit

## Overview

TMUX SESSIONIZER is a comprehensive tmux configuration system designed for developers who work with multiple projects and sessions. It provides a unified interface for session discovery, creation, and management, with deep integrations for Slack, system services, and terminal UI applications.

The project is structured as a symlinked `~/.tmux` directory with a plugin-style architecture where core behavior lives in `conf.d/*.conf` and `bin/*` scripts. A nested Bun/OpenTUI sessionizer TUI runs at `tui/sessionizer`, and a Node.js Slack bridge operates at `slack/tmux-bridge`.

## Features

### Session Management

- **Intelligent Session Discovery**: Auto-scan configured directories for git repositories and project folders
- **Fuzzy Session Picker**: fzf-based session selection with preview and instant filtering
- **Session Creation Wizard**: Interactive multi-step wizard for new session setup
- **MRU Session Jump**: Quickly access most recently used sessions
- **Session Templates**: Create sessions from predefined layout templates
- **Session Export/Import**: Save and restore session window/pane layouts as YAML

### Terminal UI (TUI) Application

- **OpenTUI-based Interface**: Modern terminal user interface built with Bun and OpenTUI
- **Preview Panel**: Real-time preview of session contents and windows
- **Kill Confirmation**: Safe session termination with confirmation dialogs
- **Rename Support**: Rename existing sessions with validation
- **Layout Selection**: Visual layout picker for new windows

### Slack Integration

- **Bi-directional Slack Bridge**: Sync tmux sessions with Slack channels
- **Session Status Updates**: Automatic posting of session activity to Slack
- **Channel Synchronization**: Keep Slack channels in sync with tmux session states
- **Interactive Slash Commands**: Handle Slack slash commands for session management
- **Modal Support**: Rich modal dialogs for interactive Slack messages
- **Desktop Notifications**: Native OS notifications for session events

### System Integration

- **Systemd Services**: Multiple systemd units for session persistence and monitoring
- **Session Watch**: File system watcher to track session changes
- **Resurrect Support**: Save and restore tmux session state across reboots
- **Web Terminal**: ttyd-based web terminal access to sessions

### Sidebar & Status

- **Tree Sidebar Display**: Hierarchical view of sessions, windows, and panes
- **Responsive Status Bar**: Width-tiered status indicators
- **Git Integration**: Branch, dirty state, ahead/behind tracking per session
- **System Stats**: CPU and memory usage in status bar
- **Session Icons**: Nerd Font icon mapping for visual distinction
- **Clipboard History**: Browse and search tmux buffer history

### Automation & CI/CD

- **Branch-to-PR Workflow**: Automatic PR creation from branches
- **Issue-to-Branch Workflow**: Branch creation from issues
- **Semantic PR Checks**: Validates PR titles and commits follow conventional commits
- **CodeQL Analysis**: Security vulnerability scanning
- **Gitleaks Scanning**: Secrets detection in code
- **Dependency Review**: Automatic dependency security auditing
- **Auto-Merge**: Automatic PR merging based on status checks
- **CI Failure Issues**: Automatic issue creation for failed CI runs
- **Health Check Monitoring**: Downstream service health monitoring

## Architecture

```
tmux-sessionizer/
├── tmux.conf              # Root loader: sources conf.d/*.conf
├── sessionizer.conf       # SCAN_DIR + EXTRA_DIRS for session discovery
│
├── bin/                   # Bash execution surface (40+ scripts)
│   ├── tmux-sessionizer       # Core fzf session picker
│   ├── tmux-sessionizer-tui   # Launch TUI sessionizer
│   ├── tmux-sidebar-*         # Sidebar management scripts
│   ├── tmux-session-*         # Session lifecycle scripts
│   ├── tmux-git-*             # Git integration scripts
│   ├── tmux-slack-bridge-*    # Slack bridge management
│   └── tmux-*-open            # URL/file/path extraction scripts
│
├── conf.d/                # tmux configuration modules
│   ├── 00-core.conf       # Terminal/perf baseline
│   ├── 10-theme.conf      # Tokyo Night palette
│   ├── 20-keys.conf       # Keybindings
│   ├── 25-sidebar.conf    # Sidebar integration
│   ├── 30-plugins.conf    # Plugin loading
│   └── 40-status.conf     # Status bar configuration
│
├── tui/sessionizer/       # Bun/OpenTUI TUI application
│   ├── src/
│   │   ├── App.tsx            # Main TUI component
│   │   ├── lib/               # Core libraries (config, tmux, state)
│   │   ├── components/        # UI components
│   │   ├── hooks/             # Custom React hooks
│   │   └── actions/           # Session action handlers
│   ├── __tests__/             # Unit tests
│   └── bun.lock               # Bun dependency lock
│
├── slack/tmux-bridge/     # Node.js Slack integration
│   ├── src/
│   │   ├── lib/               # Core libraries (tmux, config, formatter)
│   │   ├── actions/           # Action handlers
│   │   ├── commands/          # Command parser and handlers
│   │   └── __tests__/         # Unit tests
│   ├── package-lock.json
│   └── vitest.config.ts       # Test configuration
│
├── systemd/               # Systemd service units
│   ├── tmux-server.service
│   ├── tmux-session-watch.service
│   ├── tmux-resurrect-save.service
│   └── tmux-slack-bridge.service
│
├── wezterm/               # Wezterm terminal config
│   └── wezterm.lua
│
├── .github/
│   └── workflows/         # 32 GitHub Actions workflows
│
└── docs/                  # Documentation
    ├── AGENTS.md          # Project knowledge base
    └── CONTRIBUTING.md    # Contribution guidelines
```

## Automation Inventory

### GitHub Actions Workflows

| # | Workflow | Purpose |
|---|----------|---------|
| 01 | `branch-to-pr.yml` | Create PR from branch with auto-description |
| 02 | `issue-to-branch.yml` | Create branch from issue |
| 03 | `pr-checks.yml` | PR validation checks |
| 04 | `actionlint.yml` | GitHub Actions YAML linting |
| 05 | `gitleaks.yml` | Secrets detection |
| 06 | `codeql.yml` | Security analysis |
| 07 | `dependency-review.yml` | Dependency vulnerability scanning |
| 08 | `scorecard.yml` | OpenSSF security scorecard |
| 09 | `semantic-pr.yml` | Conventional commits validation |
| 10 | `pr-review.yml` | Auto PR review via AI |
| 12 | `dependabot-auto-merge.yml` | Auto-merge Dependabot PRs |
| 13 | `pr-auto-merge.yml` | Auto-merge qualified PRs |
| 14 | `bot-auto-fix.yml` | Auto-fix PR issues |
| 15 | `merged-pr-cleanup.yml` | Post-merge cleanup |
| 18 | `issue-management.yml` | Issue lifecycle automation |
| 19 | `issue-backfill.yml` | Issue metadata backfill |
| 20 | `readme-gen.yml` | README generation |
| 21 | `docs-sync.yml` | Documentation sync |
| 24 | `release-notes.yml` | Generate release notes |
| 25 | `release-publish.yml` | Publish releases |
| 29 | `downstream-health-check.yml` | External service monitoring |
| 37 | `ci-failure-issues.yml` | Create issues from CI failures |
| 42 | `reusable-docs-sync.yml` | Reusable docs sync workflow |
| 43 | `reusable-issue-management.yml` | Reusable issue workflow |
| 44 | `reusable-pr-checks.yml` | Reusable PR checks |
| 45 | `reusable-gitleaks.yml` | Reusable gitleaks scan |
| 60 | `ci-auto-heal.yml` | Self-healing CI |
| - | `auto-merge.yml` | Generic auto-merge |
| - | `ci.yml` | Primary CI pipeline |
| - | `labeler.yml` | PR label automation |
| - | `welcome.yml` | New contributor welcome |
| - | `security/11_pr-review.yml` | Security-focused PR review |

### Reusable Workflows

| Path | Description |
|------|-------------|
| `.github/workflows/reusable-docs-sync.yml` | Synchronized documentation from upstream |
| `.github/workflows/reusable-issue-management.yml` | Standardized issue management |
| `.github/workflows/reusable-pr-checks.yml` | Standardized PR validation |
| `.github/workflows/reusable-gitleaks.yml` | Secrets scanning reusable module |

### External Tooling

| Tool | Purpose |
|------|---------|
| **fzf** | Fuzzy finder for session selection |
| **tmux** | Terminal multiplexer |
| **OpenTUI** | Bun-based TUI framework |
| **Bun** | JavaScript runtime for TUI app |
| **Node.js** | JavaScript runtime for Slack bridge |
| **tsx** | TypeScript execution for Slack bridge |
| **cloudflared** | Tunnel for remote Slack bridge access |
| **vitest** | Testing framework for Slack bridge |
| **jest** | Testing framework for TUI app |
| **gitleaks** | Secrets detection |
| **actionlint** | GitHub Actions linting |
| **CodeQL** | Security analysis |
| **ttyd** | Web terminal |

## Quick Start

### Prerequisites

- **tmux** (≥ 3.0)
- **fzf** (≥ 0.25)
- **Bun** (for TUI application)
- **Node.js** (for Slack bridge)
- **Git**

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/tmux-sessionizer.git ~/.tmux

# Create symlinks
ln -sf ~/.tmux/tmux.conf ~/.tmux.conf
ln -sf ~/.tmux/bin/* ~/bin/

# Reload tmux config
tmux source ~/.tmux.conf
```

### Configuration

Edit `sessionizer.conf` to set your project directories:

```bash
# Session discovery directories
SCAN_DIR="$HOME/projects"
EXTRA_DIRS="$HOME/work $HOME/personal"

# Slack bridge configuration
SLACK_BOT_TOKEN=xapp-xxxxx
SLACK_TEAM_ID=T0123456789
```

### Basic Usage

| Command | Description |
|---------|-------------|
| `tmux-sessionizer` | Open session picker |
| `tmux-sessionizer-tui` | Launch TUI application |
| `tmux-sidebar-toggle` | Toggle sidebar |
| `tmux-slack-bridge-start` | Start Slack bridge |

## Local Development

### TUI Application

```bash
cd tui/sessionizer

# Install dependencies
bun install

# Run tests
bun test

# Start development
bun run dev
```

### Slack Bridge

```bash
cd slack/tmux-bridge

# Install dependencies
npm install

# Run tests
npm test

# Start in development mode
npm run dev
```

### Systemd Services

```bash
# Install services
cp systemd/*.service ~/.config/systemd/user/
cp systemd/*.path ~/.config/systemd/user/

# Reload systemd
systemctl --user daemon-reload

# Enable services
systemctl --user enable tmux-server.service
systemctl --user enable tmux-session-watch.path

# Start services
systemctl --user start tmux-server.service
```

## Commands Reference

### Session Management

| Command | Description |
|---------|-------------|
| `tmux-sessionizer` | Launch fzf session picker with preview |
| `tmux-sessionizer-tui` | Launch OpenTUI-based sessionizer |
| `tmux-session-jump` | Quick MRU session access |
| `tmux-session-kill` | Kill session with confirmation |
| `tmux-session-rename` | Rename session |
| `tmux-session-sync` | Sync session state with Slack |
| `tmux-session-export` | Export session layout to YAML |
| `tmux-session-dashboard` | Show formatted session table |
| `tmux-template-create` | Create session from template |
| `tmux-layout-apply` | Apply YAML layout to session |

### Sidebar

| Command | Description |
|---------|-------------|
| `tmux-sidebar` | Display tree sidebar |
| `tmux-sidebar-init` | Initialize sidebar on session create |
| `tmux-sidebar-toggle` | Toggle sidebar visibility |

### Git Integration

| Command | Description |
|---------|-------------|
| `tmux-git-status` | Show git branch and status |
| `tmux-git-uncommitted` | Track uncommitted changes |
| `tmux-session-branch-log` | Log branch on session switch |

### Slack Bridge

| Command | Description |
|---------|-------------|
| `tmux-slack-bridge-start` | Start bridge (socket or cloudflared) |
| `tmux-slack-bridge-setup` | Interactive Slack app setup wizard |

### Utility Scripts

| Command | Description |
|---------|-------------|
| `tmux-url-open` | Extract and open URLs from pane |
| `tmux-file-open` | Extract and open file paths |
| `tmux-ssh-picker` | Pick SSH host from config |
| `tmux-clipboard-history` | Browse tmux buffer history |
| `tmux-copy-word` | Copy word under cursor |
| `tmux-pane-sync` | Toggle synchronized panes |
| `tmux-config-reload` | Reload config with diff |
| `tmux-cheatsheet` | Show keybinding reference |
| `tmux-web-terminal` | Launch web terminal |

## Contribution Guide

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Commit Convention

This project follows [Conventional Commits](https://www.convent.org/):

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
```

Examples:

- `feat(sessionizer): add fuzzy preview`
- `fix(sidebar): correct color rendering`
- `docs(slack): update bridge setup`

### Branch Naming

- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation
- `refactor/*` - Code refactoring
- `test/*` - Test additions

### Pull Request Process

1. Fork the repository
2. Create a feature branch from `master`
3. Make your changes
4. Run existing tests
5. Submit a PR with description
6. Await review and address feedback

---

## License

See [LICENSE](./LICENSE) file for details.

---

<!--
Last generated: 2026-04-04 18:00 KST
README-gen models: minimax-m2.7 with fallback gpt-5.5 (via CLIProxyAPI)
-->