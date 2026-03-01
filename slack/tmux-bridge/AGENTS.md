# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-01 09:11 KST
**Commit:** 068f8fe
**Branch:** master

## OVERVIEW

Node.js + TypeScript Slack bridge service that connects tmux session management to Slack via the `/tmux` slash command, interactive button UIs, and per-session channel routing. Built on `@slack/bolt` with `@opencode-ai/sdk` integration for AI session management. Runs as a systemd user service (`tmux-slack-bridge.service`).

## STRUCTURE

```
slack/tmux-bridge/
├── package.json             # @tmux/slack-bridge v0.1.0, type:module
├── tsconfig.json            # TypeScript config (strict, ESNext)
├── vitest.config.ts         # Vitest test runner config
├── SETUP.md                 # Slack API console setup guide
├── .env.example             # Required env vars template
└── src/
    ├── index.ts             # Bolt app entrypoint + notify HTTP server (194 LOC)
    ├── types.ts             # Shared type definitions (78 LOC)
    ├── lib/
    │   ├── config.ts        # Environment-based configuration (45 LOC)
    │   ├── formatter.ts     # Slack Block Kit message formatting (513 LOC)
    │   ├── channels.ts      # Per-session Slack channel registry (236 LOC)
    │   ├── tmux.ts          # Tmux CLI integration via child_process (183 LOC)
    │   └── opencode.ts      # @opencode-ai/sdk lazy client + wrappers (123 LOC)
    ├── commands/
    │   └── handler.ts       # /tmux slash command parser + dispatcher (252 LOC)
    ├── actions/
    │   └── handler.ts       # Button action + modal submission handlers (272 LOC)
    └── __tests__/
        ├── channels.test.ts   # Channel registry tests (142 LOC)
        ├── formatter.test.ts  # Block Kit formatter tests (184 LOC)
        ├── commands.test.ts   # Command handler tests (188 LOC)
        └── types.test.ts      # Type guard tests (41 LOC)
```

## WHERE TO LOOK

| Task                         | Location              | Notes                                              |
| ---------------------------- | --------------------- | -------------------------------------------------- |
| Add /tmux subcommand         | `src/commands/handler.ts` | Add case to `handleCommand` switch + update `SubCommand` type |
| Add button action            | `src/actions/handler.ts`  | Register in `registerActions` + update `ActionId` in types     |
| Change message formatting    | `src/lib/formatter.ts`    | Block Kit helpers + dashboard/event formatters      |
| Modify channel routing       | `src/lib/channels.ts`     | `resolveSessionChannel` + `initChannelRegistry`     |
| Add OpenCode integration     | `src/lib/opencode.ts`     | Extend SDK wrapper functions + add OC subcommand    |
| Change tmux CLI interaction  | `src/lib/tmux.ts`         | `exec()` wrapper, session CRUD functions            |
| Modify env config            | `src/lib/config.ts`       | Add to config object + update `.env.example`        |
| Add/update type definitions  | `src/types.ts`            | `SubCommand`, `ActionId`, `CallbackId` unions       |
| Slack API console setup      | `SETUP.md`                | Bot scopes, event subscriptions, slash commands     |
| Bridge startup behavior      | `src/index.ts`            | Dual Socket/HTTP mode, /tmux registration, notify server |
| Run tests                    | `npm test`                | Vitest with mocked Slack/tmux dependencies          |

## CODE MAP

| Symbol                  | Type     | Location              | Refs   | Role                                                      |
| ----------------------- | -------- | --------------------- | ------ | ---------------------------------------------------------- |
| `handleCommand`         | Function | `src/commands/handler.ts` | high | `/tmux` slash command dispatcher — routes subcommands      |
| `parseCommand`          | Function | `src/commands/handler.ts` | high | Parses raw slash command text into SubCommand + args       |
| `registerActions`       | Function | `src/actions/handler.ts`  | high | Registers Bolt button actions + modal view_submission handlers |
| `resolveSessionChannel` | Function | `src/lib/channels.ts`     | high | Resolves or creates per-session Slack channel              |
| `initChannelRegistry`   | Function | `src/lib/channels.ts`     | high | Startup sync: maps existing tmux sessions to Slack channels |
| `ensureChannel`         | Function | `src/lib/channels.ts`     | medium | Creates Slack channel if not exists, returns channel ID    |
| `inviteUsersToChannel`  | Function | `src/lib/channels.ts`     | medium | Invites configured users to newly created channels         |
| `getChannelRegistry`    | Function | `src/lib/channels.ts`     | medium | Returns current session→channel mapping                   |
| `exec`                  | Function | `src/lib/tmux.ts`         | high | child_process spawn wrapper with tmux socket support       |
| `run`                   | Function | `src/lib/tmux.ts`         | high | Higher-level spawn wrapper returning stdout/stderr         |
| `listSessions`          | Function | `src/lib/tmux.ts`         | high | Enumerates tmux sessions with metadata                     |
| `killSession`           | Function | `src/lib/tmux.ts`         | medium | Terminate a tmux session by name                           |
| `capturePane`           | Function | `src/lib/tmux.ts`         | medium | Capture visible pane content as text                       |
| `createSession`         | Function | `src/lib/tmux.ts`         | medium | Create new tmux session with optional directory            |
| `syncSessions`          | Function | `src/lib/tmux.ts`         | medium | Sync tmux sessions with Slack channels                     |
| `getClient`             | Function | `src/lib/opencode.ts`     | high | Lazy singleton `@opencode-ai/sdk` client                   |
| `listOpencodeSessions`  | Function | `src/lib/opencode.ts`     | medium | List OpenCode sessions via SDK                             |
| `promptSession`         | Function | `src/lib/opencode.ts`     | medium | Send prompt to OpenCode session                            |
| `formatSessionDashboard`| Function | `src/lib/formatter.ts`    | high | Builds Block Kit session dashboard with action buttons     |
| `formatNotifyEvent`     | Function | `src/lib/formatter.ts`    | high | Formats tmux hook events for Slack notification            |
| `formatCapture`         | Function | `src/lib/formatter.ts`    | medium | Formats pane capture output as code block                  |
| `config`                | Object   | `src/lib/config.ts`       | high | Central env-based configuration: slack, tmux, notify, opencode |
| `SubCommand`            | Type     | `src/types.ts`            | high | Union type of all /tmux subcommands                        |
| `OpencodeSubCommand`    | Type     | `src/types.ts`            | medium | Union type of `/tmux oc` subcommands                       |
| `ActionId`              | Const    | `src/types.ts`            | high | String constants for Bolt button action IDs                |
| `CallbackId`            | Const    | `src/types.ts`            | high | String constants for Bolt modal callback IDs               |

## CONVENTIONS

- TypeScript strict mode with `noEmit` (transpiled by `tsx` at runtime)
- ES modules (`type: "module"` in package.json)
- `@slack/bolt` for Slack API — all interactions go through Bolt's app instance
- Block Kit for all Slack message formatting — never raw text messages
- Lazy singleton pattern for expensive clients (`getClient()` in opencode.ts)
- Config is env-based via `src/lib/config.ts` — no hardcoded values
- Dual startup mode: Socket Mode (default, requires `SLACK_APP_TOKEN`) or HTTP mode (requires cloudflared)
- `exec()` always passes `TMUX_SOCKET` when configured — never bypass for direct `tmux` calls
- Tests mock external dependencies (Slack API, tmux CLI, OpenCode SDK) — no real service calls
- Per-session channel naming: `tmux-{sanitized-session-name}` with opencode routing to `#opencode`

## ANTI-PATTERNS

| Never                                                   | Why                                      |
| ------------------------------------------------------- | ---------------------------------------- |
| Call `tmux` directly without `exec()` wrapper            | Bypasses socket support and error handling |
| Hardcode Slack channel IDs                               | Channels are dynamic per-session          |
| Send raw text messages to Slack                          | Must use Block Kit for consistent UI      |
| Import `@slack/bolt` types outside `src/types.ts`        | Keep Bolt type surface centralized        |
| Create SDK client without `getClient()` lazy pattern     | Wastes connections, breaks singleton      |
| Add env vars without updating `.env.example`             | New deployments break silently            |
| Commit `.env`                                            | Secret leakage                           |
| Skip `parseCommand` validation in new subcommands        | Unhandled input causes runtime crashes    |

## COMMANDS

```bash
# Install dependencies
npm install

# Run in development (watch mode)
npm run dev

# Run once
npm start

# Type check
npm run typecheck

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Production via systemd
systemctl --user enable --now tmux-slack-bridge.service
systemctl --user restart tmux-slack-bridge.service
systemctl --user status tmux-slack-bridge.service
journalctl --user -u tmux-slack-bridge.service -f
```

## NOTES

- Entry point (`src/index.ts`) starts both the Bolt app and a separate HTTP notify server on `config.notify.port`
- The notify HTTP server receives POST requests from `bin/tmux-slack-notify` (fire-and-forget from tmux hooks)
- Channel registry (`initChannelRegistry`) runs at startup — scans existing tmux sessions and maps them to Slack channels
- `resolveSessionChannel` creates channels on-demand when a notification arrives for an unknown session
- OpenCode integration (`/tmux oc`) connects to a local `opencode serve` instance — disabled when `OPENCODE_ENABLED=false`
- `SLACK_CHANNELS_ENABLED=false` disables per-session channel routing; all messages go to `SLACK_CHANNEL_ID`
- `SLACK_INVITE_USERS` comma-separated user IDs get auto-invited to newly created per-session channels
- Tests use vitest with full mocking of Slack WebClient, tmux CLI, and OpenCode SDK
- `formatter.ts` is the largest file (513 LOC) — contains all Block Kit message builders; natural split point if it grows further
- Parent service dependency: `tmux-slack-bridge.service` is `PartOf=tmux-server.service`
