# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-01 09:11 KST
**Commit:** 068f8fe
**Branch:** master

## OVERVIEW

Node.js + TypeScript Slack bridge service that connects tmux session management to Slack via the `/tmux` slash command, interactive button UIs, and centralized `#opencode` channel notifications. Built on `@slack/bolt` with `@opencode-ai/sdk` integration for AI session management and idle detection. Runs as a systemd user service (`tmux-slack-bridge.service`).

#VZ|## STRUCTURE
#TX|
#YM|```
#NQ|slack/tmux-bridge/
#KX|├── package.json             # @tmux/slack-bridge v0.1.0, type:module
#TX|├── tsconfig.json            # TypeScript config (strict, ESNext)
#MM|├── vitest.config.ts         # Vitest test runner config
#YS|├── SETUP.md                 # Slack API console setup guide
#TX|├── .env.example             # Required env vars template
#TB|└── src/
#PY|    ├── index.ts             # Bolt app entrypoint + notify HTTP server (194 LOC)
#VN|    ├── types.ts             # Shared type definitions (78 LOC)
#YV|    ├── lib/
#VK|    │   ├── config.ts        # Environment-based configuration (45 LOC)
#ZX|    │   ├── channels.ts      # Single #opencode channel resolver (10 LOC)
#KR|    │   ├── idle-monitor.ts  # Opencode idle detection + Slack notification (55 LOC)
#QB|    │   ├── tmux.ts          # Tmux CLI integration via child_process (183 LOC)
#SW|    │   ├── opencode.ts      # @opencode-ai/sdk lazy client + wrappers (123 LOC)
#FG|    │   └── formatter/
#TD|    │       ├── index.ts      # Barrel export
#GH|    │       ├── blocks.ts     # Block Kit primitives (section, divider, context)
#IJ|    │       ├── time.ts      # timeAgo utility
#JK|    │       ├── session.ts   # Session formatters (dashboard, list, status)
#KL|    │       ├── capture.ts   # Capture formatters
#LM|    │       ├── opencode.ts  # OpenCode formatters
#MN|    │       ├── notify.ts    # Notification formatters
#NO|    │       └── modal.ts     # Modal builders
#SB|    ├── commands/
#NN|    │   ├── index.ts         # Barrel export
#OP|    │   ├── parser.ts       # parseCommand (tokenization + SubCommand parsing)
#PQ|    │   ├── handler.ts      # handleCommand dispatcher (~46 LOC)
#QR|    │   └── handlers/
#RS|    │       ├── index.ts
#ST|    │       ├── session.ts   # Session CRUD subcommands
#TU|    │       ├── interaction.ts # Interaction commands
#UV|    │       └── opencode.ts  # OpenCode subcommands
#VA|    ├── actions/
#WB|    │   ├── index.ts         # Barrel export
#XC|    │   ├── handler.ts      # registerActions (~12 LOC)
#YD|    │   ├── helpers.ts     # Shared utilities
#ZE|    │   └── handlers/
#AF|    │       ├── index.ts
#BG|    │       ├── session.ts   # Session actions
#CH|    │       ├── modal-open.ts # Modal openers
#DI|    │       └── modal-submit.ts # Modal submissions
#EJ|    └── __tests__/
#FK|        ├── channels.test.ts   # Channel resolver tests (31 LOC)
#GL|        ├── formatter.test.ts  # Block Kit formatter tests (184 LOC)
#HM|        ├── commands.test.ts   # Command handler tests (188 LOC)
#IN|        └── types.test.ts      # Type guard tests (41 LOC)
#JQ|```
#ZK|

#ZV|## WHERE TO LOOK
#XN|
#YJ|| Task                         | Location              | Notes                                              |
#ZR|| ---------------------------- | --------------------- | -------------------------------------------------- |
#QV|| Add /tmux subcommand         | `src/commands/handlers/` | Add case to `handleCommand` switch + update `SubCommand` type |
#YR|| Add button action            | `src/actions/handlers/`   | Register in `registerActions` + update `ActionId` in types     |
#XN|| Change message formatting    | `src/lib/formatter/`        | Block Kit helpers in `blocks.ts` + formatters per domain      |
#XV|| Modify channel routing       | `src/lib/channels.ts`     | Single `getNotifyChannel()` → #opencode             |
#VM|| Add OpenCode integration     | `src/lib/opencode.ts`     | Extend SDK wrapper functions + add OC subcommand    |
#YQ|| Change tmux CLI interaction  | `src/lib/tmux.ts`         | `exec()` wrapper, session CRUD functions            |
#YM|| Modify env config            | `src/lib/config.ts`       | Add to config object + update `.env.example`        |
#YK|| Add/update type definitions  | `src/types.ts`            | `SubCommand`, `ActionId`, `CallbackId` unions       |
#ZP|| Slack API console setup      | `SETUP.md`                | Bot scopes, event subscriptions, slash commands     |
#NM|| Bridge startup behavior      | `src/index.ts`            | Dual Socket/HTTP mode, /tmux registration, notify server |
#SR|| Run tests                    | `npm test`                | Vitest with mocked Slack/tmux dependencies          |
#XN|

#SZ|## CODE MAP
#KR|
#WS|| Symbol                  | Type     | Location              | Refs   | Role                                                      |
#YH|| ----------------------- | -------- | --------------------- | ------ | ---------------------------------------------------------- |
#BT|| `handleCommand`         | Function | `src/commands/handler.ts` | high | `/tmux` slash command dispatcher — routes subcommands      |
#JR|| `parseCommand`          | Function | `src/commands/parser.ts` | high | Parses raw slash command text into SubCommand + args       |
#SP|| `registerActions`       | Function | `src/actions/handler.ts`  | high | Registers Bolt button actions + modal view_submission handlers |
#XY|| `getNotifyChannel`      | Function | `src/lib/channels.ts`     | high   | Returns #opencode channel ID for all notifications         |
#YR|| `startIdleMonitor`      | Function | `src/lib/idle-monitor.ts` | high   | Polls opencode sessions, notifies on busy→idle transition  |
#BN|| `exec`                  | Function | `src/lib/tmux.ts`         | high | child_process spawn wrapper with tmux socket support       |
#KT|| `run`                   | Function | `src/lib/tmux.ts`         | high | Higher-level spawn wrapper returning stdout/stderr         |
#QH|| `listSessions`          | Function | `src/lib/tmux.ts`         | high | Enumerates tmux sessions with metadata                     |
#VV|| `killSession`           | Function | `src/lib/tmux.ts`         | medium | Terminate a tmux session by name                           |
#QZ|| `capturePane`           | Function | `src/lib/tmux.ts`         | medium | Capture visible pane content as text                       |
#SS|| `createSession`         | Function | `src/lib/tmux.ts`         | medium | Create new tmux session with optional directory            |
#HT|| `syncSessions`          | Function | `src/lib/tmux.ts`         | medium | Sync tmux sessions with Slack channels                     |
#SM|| `getClient`             | Function | `src/lib/opencode.ts`     | high | Lazy singleton `@opencode-ai/sdk` client                   |
#XX|| `listOpencodeSessions`  | Function | `src/lib/opencode.ts`     | medium | List OpenCode sessions via SDK                             |
#YW|| `promptSession`         | Function | `src/lib/opencode.ts`     | medium | Send prompt to OpenCode session                            |
#JQ|| `formatSessionDashboard`| Function | `src/lib/formatter/session.ts` | high | Builds Block Kit session dashboard with action buttons     |
#YB|| `formatSessionList`     | Function | `src/lib/formatter/session.ts` | medium | Formats session list for Slack message                     |
#RM|| `formatNotifyEvent`     | Function | `src/lib/formatter/notify.ts` | high | Formats tmux hook events for Slack notification            |
#KX|| `formatCapture`         | Function | `src/lib/formatter/capture.ts` | medium | Formats pane capture output as code block                  |
#PX|| `buildSendKeysModal`    | Function | `src/lib/formatter/modal.ts` | medium | Builds Send Keys modal for pane interaction               |
#KX|| `config`                | Object   | `src/lib/config.ts`       | high | Central env-based configuration: slack, tmux, notify, opencode |
#PX|| `SubCommand`            | Type     | `src/types.ts`            | high | Union type of all /tmux subcommands                        |
#JY|| `OpencodeSubCommand`    | Type     | `src/types.ts`            | medium | Union type of `/tmux oc` subcommands                       |
#VN|| `ActionId`              | Const    | `src/types.ts`            | high | String constants for Bolt button action IDs                |
#NJ|| `CallbackId`            | Const    | `src/types.ts`            | high | String constants for Bolt modal callback IDs               |
#WR|

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
- All notifications route to single `#opencode` channel via `getNotifyChannel()`

## ANTI-PATTERNS

| Never                                                   | Why                                      |
| ------------------------------------------------------- | ---------------------------------------- |
| Call `tmux` directly without `exec()` wrapper            | Bypasses socket support and error handling |
| Hardcode Slack channel IDs                               | Use `getNotifyChannel()` via config      |
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

#XM|## RECENT CHANGES
#XS|
#WT|- **2026-03-24**: Modularized `formatter.ts` (513 LOC) into `src/lib/formatter/` with domain-specific modules:
#BQ|  - `blocks.ts` — Block Kit primitives (section, divider, context, etc.)
#WT|  - `time.ts` — timeAgo utility
#PM|  - `session.ts` — Session formatters (dashboard, list, status)
#YN|  - `capture.ts` — Capture formatters
#OT|  - `opencode.ts` — OpenCode formatters
#PU|  - `notify.ts` — Notification formatters
#QV|  - `modal.ts` — Modal builders
#RK|- **2026-03-24**: Modularized `commands/handler.ts` (252 LOC) into `src/commands/` with `handlers/` subdirectory
#SL|- **2026-03-24**: Modularized `actions/handler.ts` (272 LOC) into `src/actions/` with `handlers/` subdirectory
#MT|
#TK|## NOTES
#XS|
#WT|- Entry point (`src/index.ts`) starts both the Bolt app, a separate HTTP notify server on `config.notify.port`, and the idle monitor
#BQ|- All notifications go to single `#opencode` channel — no per-session channel routing
#WT|- Idle monitor (`startIdleMonitor`) polls opencode session status every 30s; notifies on busy/retry→idle transitions
#PM|- OpenCode integration (`/tmux oc`) connects to a local `opencode serve` instance — disabled when `OPENCODE_ENABLED=false`
#YT|- Tests use vitest with full mocking of Slack WebClient, tmux CLI, and OpenCode SDK
#QN|- Formatter modules are organized by domain: session, capture, opencode, notify, modal
#NM|- Parent service dependency: `tmux-slack-bridge.service` is `PartOf=tmux-server.service`
