# PROJECT KNOWLEDGE BASE

**Generated:** 2026-08-21
**Branch:** master

## OVERVIEW

Node.js + TypeScript Telegram bot, built on [grammY](https://grammy.dev), that hosts two independent feature sets in one process: a tmux **pane mirror** (`tmux capture-pane` polling, edited into place) and an **OpenCode-native bridge** (SSE event stream from `opencode serve`, rendered and pushed as real streamed messages). Runs as a systemd user service (`tmux-telegram-bot.service`).

## STRUCTURE

```
telegram/tmux-bot/
├── package.json             # @tmux/telegram-bot v0.1.0, type:module
├── tsconfig.json            # TypeScript config
├── vitest.config.ts         # Vitest test runner config
├── .env.example             # Required env vars template (mirror + bridge)
├── THIRD_PARTY_NOTICES.md   # MIT attribution for ported render/streaming code
├── data/                    # BINDINGS_PATH target (bindings.json), gitignored
└── src/
    ├── index.ts             # Bot entrypoint: wires mirror + bridge middleware/commands
    ├── types.ts             # Shared type definitions (TmuxSession, Binding, ...)
    ├── lib/
    │   ├── config.ts        # Env-based configuration (telegram, tmux, stream, opencode, bindingsPath)
    │   ├── logger.ts        # Minimal console logger
    │   ├── capability.ts    # Detects/caches "can delete user messages" per chat
    │   ├── tmux.ts           # Mirror's tmux CLI integration (windows, send-keys, capture)
    │   ├── stream.ts         # Mirror's per-window poll-and-edit stream engine
    │   ├── opencode/
    │   │   ├── client.ts     # Lazy singleton @opencode-ai/sdk client
    │   │   ├── api.ts        # createSession/prompt/abort/sessionStatus/permissionReply wrappers
    │   │   └── events.ts     # subscribeEvents: reconnecting SSE consumer with backoff
    │   ├── router.ts         # createRouter: (chat,thread) -> tmux session -> directory
    │   └── store/
    │       ├── bindings.ts      # createBindingStore: in-memory index + persistence
    │       └── binding-file.ts  # createBindingFile: crash-safe JSON (temp -> backup -> rename)
    ├── bot/
    │   ├── deps.ts               # BridgeDeps/BridgeBot/BridgeApi port interfaces (test seam)
    │   ├── commands.ts           # registerBridgeCommands + promptBoundSession
    │   ├── callbacks.ts          # registerBridgeCallbacks (bind:, permission: buttons)
    │   └── stream-coordinator.ts # createStreamCoordinator: SSE event -> ResponseStreamer
    ├── render/                   # Ported Markdown-to-Telegram rendering pipeline (11 files)
    │   ├── types.ts, limits.ts, markdown-normalizer.ts, block-parser.ts,
    │   │   block-plain-text.ts, rich-blocks.ts, text-splitter.ts, block-splitter.ts,
    │   │   chunker.ts, part-signature.ts, pipeline.ts
    ├── streaming/                 # Ported throttled edit-loop streamer
    │   ├── stream-state.ts        # Shared state/types + payload normalization helpers
    │   ├── response-streamer.ts   # ResponseStreamer: enqueue/complete per (session, message)
    │   └── telegram-transport.ts  # createTransport: grammY Api adapter, plain/draft modes
    └── __tests__/                 # Vitest suite mirroring src/ (bot/, lib/, render/, streaming/)
```

## WHERE TO LOOK

| Task                              | Location                              | Notes                                                        |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| Add/change a bridge command        | `src/bot/commands.ts`                  | Register in `registerBridgeCommands`; claim only verbs `src/index.ts` doesn't use |
| Add/change a bridge callback button| `src/bot/callbacks.ts`                 | Re-parse payload with the same regex used to register it      |
| Change binding logic               | `src/lib/router.ts`                    | `createRouter`: bind/resolveRoute/isStale/discoverSessions     |
| Change binding persistence         | `src/lib/store/bindings.ts` + `binding-file.ts` | In-memory index + crash-safe JSON file (schema v1)     |
| Change SSE event handling          | `src/lib/opencode/events.ts`           | `subscribeEvents`: reconnect/backoff, global-then-scoped stream fallback |
| Change how events become messages  | `src/bot/stream-coordinator.ts`        | `createStreamCoordinator`: dispatches `message.part.updated`, `session.status`, `permission.asked`, `question.asked`, `session.error` |
| Change opencode SDK calls          | `src/lib/opencode/api.ts` + `client.ts` | `createSession`/`prompt`/`abort`/`sessionStatus`/`permissionReply`; `getOpencodeClient()` lazy singleton |
| Change Markdown->Telegram rendering| `src/render/pipeline.ts` + siblings    | Ported from `opencode-telegram-bot`; keep attribution header  |
| Change the throttled edit loop     | `src/streaming/response-streamer.ts`   | `ResponseStreamer`: per-(session,message) state machine, plain-text degradation on parse error |
| Change Telegram delivery mechanics | `src/streaming/telegram-transport.ts`  | `createTransport`: persistent edit vs draft-bubble mode        |
| Change mirror streaming (pane poll)| `src/lib/tmux.ts` + `src/lib/stream.ts`| Unrelated to the bridge; hash-compare poll-and-edit engine     |
| Modify env config                  | `src/lib/config.ts`                    | Add to config object + update `.env.example`                   |
| Add/update type definitions        | `src/types.ts`                         | `TmuxSession`, `Binding`, `ResolvedRoute`, `CallbackData`       |
| Bridge/mirror bot test surfaces    | `src/bot/deps.ts`                      | Narrow `BridgeBot`/`BridgeApi`/`BridgeCommandContext` interfaces the real grammY types satisfy structurally |
| Run tests                          | `npm test`                             | Vitest with mocked opencode SDK, tmux CLI, grammY API           |
| Third-party attribution            | `THIRD_PARTY_NOTICES.md`               | Adapted-files list must match every file carrying the header    |

## CODE MAP

| Symbol                     | Type      | Location                           | Refs   | Role                                                          |
| --------------------------- | --------- | ------------------------------------ | ------ | --------------------------------------------------------------|
| `createRouter`              | Function  | `src/lib/router.ts`                | high   | Resolves/binds (chat,thread) -> tmux session -> directory      |
| `createBindingStore`        | Function  | `src/lib/store/bindings.ts`        | high   | In-memory binding index over the crash-safe binding file       |
| `createBindingFile`         | Function  | `src/lib/store/binding-file.ts`    | high   | temp -> backup rotate -> rename persistence, backup recovery   |
| `registerBridgeCommands`    | Function  | `src/bot/commands.ts`              | high   | Registers `/sessions`, `/use`, `/new`, `/status`, `/abort`     |
| `promptBoundSession`        | Function  | `src/bot/commands.ts`              | high   | Routes plain text to the bound opencode session, opens one on first use |
| `registerBridgeCallbacks`   | Function  | `src/bot/callbacks.ts`             | high   | `bind:` and `permission:once\|always\|reject:` button handlers |
| `createStreamCoordinator`   | Function  | `src/bot/stream-coordinator.ts`    | high   | Subscribes to SSE, dispatches events to `ResponseStreamer` / permission & question prompts |
| `subscribeEvents`           | Function  | `src/lib/opencode/events.ts`       | high   | Reconnecting SSE consumer with exponential backoff              |
| `getOpencodeClient`         | Function  | `src/lib/opencode/client.ts`       | high   | Lazy singleton `@opencode-ai/sdk` client                        |
| `createSession`/`prompt`/`abort`/`sessionStatus`/`permissionReply` | Function | `src/lib/opencode/api.ts` | high | Typed wrappers over the SDK, throw `OpenCodeApiError` on failure |
| `ResponseStreamer`          | Class     | `src/streaming/response-streamer.ts` | high | `enqueue`/`complete` per (session, message); throttled edit-loop, plain-text degradation |
| `createTransport`           | Function  | `src/streaming/telegram-transport.ts` | high | grammY `Api` adapter: persistent edit mode or private-chat draft mode |
| `toRenderedBlocks`          | Function  | `src/render/pipeline.ts`           | high   | Markdown text -> native Telegram blocks + plain-text fallback   |
| `getTelegramRenderedPartSignature` | Function | `src/render/part-signature.ts` | high | Stable signature used to skip unchanged edits                   |
| `listWindows`/`sendKeys`/`capturePane` | Function | `src/lib/tmux.ts`        | high   | Mirror's tmux CLI wrappers (independent of the bridge)           |
| `startStream`/`stopStream`  | Function  | `src/lib/stream.ts`                | high   | Mirror's per-window poll-and-edit engine                        |
| `Binding`                   | Type      | `src/lib/store/bindings.ts`        | high   | `(chatId, threadId) -> tmuxSession, directory, opencodeSessionId` |
| `BridgeDeps`                | Type      | `src/bot/deps.ts`                  | high   | `{ router, api, store }` passed into command/callback registration |

## CONVENTIONS

- TypeScript strict mode, ES modules (`type: "module"`), run via `tsx` (no build step)
- `grammY` for all Telegram API calls; mirror and bridge share one `Bot` instance from `src/index.ts`
- Config is env-based via `src/lib/config.ts` — no hardcoded values; every new env var also goes in `.env.example`
- Every file ported from `opencode-telegram-bot` carries a `// Adapted from opencode-telegram-bot (MIT) — https://github.com/grinev/opencode-telegram-bot` header, and is listed in `THIRD_PARTY_NOTICES.md`
- `ResponseStreamer` callback contract: `sendPart`/`editPart`/`deleteText` (+ optional `completePart`) are the only way it talks to Telegram — it never calls the Bot API directly, so a new transport just implements those four functions
- Binding schema is versioned (`SCHEMA_VERSION = 1` in `binding-file.ts`); a bad entry invalidates the whole file, which then falls back to the `.bak` rotation before raising `BindingStoreCorruptError`
- Opencode calls take `directory` per call, never a global cwd — the bound conversation's directory is passed explicitly on every `prompt`/`permissionReply`
- `router.bind()` only carries an existing `opencodeSessionId` over to a rebind when the directory is unchanged; a rebind to a different project starts opencode fresh
- Bridge command/callback registration deliberately claims only verbs `src/index.ts`'s mirror does not use, and adds no separate auth — the allow-list middleware in `src/index.ts` already gates every update
- Tests mock the opencode SDK, tmux CLI, and grammY `Bot.api` — no real network/process calls
- Keep source files at or below 500 LOC (this package's largest file, `response-streamer.ts`, is already near that ceiling — split before adding to it)

## ANTI-PATTERNS

| Never                                                        | Why                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------|
| Call `tmux` directly without the `lib/tmux.ts` wrappers         | Bypasses `TMUX_SOCKET` support and error handling          |
| Call the Telegram Bot API directly during a stream instead of through `TelegramTransportApi` | Breaks the throttle/degradation contract `ResponseStreamer` relies on |
| Port a file from `opencode-telegram-bot` without an attribution header + `THIRD_PARTY_NOTICES.md` entry | MIT license requires attribution to survive the copy       |
| Add a native (non-JS) dependency                                | Package ships via `tsx`, no build/compile step to support one |
| Commit `.env` or `data/bindings.json`                            | Secret leakage / per-deployment state                        |
| Add env vars without updating `.env.example`                     | New deployments break silently                                |
| Skip `router.resolveRoute` and read `Binding` fields directly in a new handler | Bypasses the `null` (unbound) discrimination the router centralizes |
| Import `@opencode-ai/sdk` outside `src/lib/opencode/`            | Keeps the SDK's type surface centralized                      |

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
systemctl --user enable --now tmux-telegram-bot.service
systemctl --user restart tmux-telegram-bot.service
systemctl --user status tmux-telegram-bot.service
journalctl --user -u tmux-telegram-bot.service -f
```

## NOTES

- One bot process, two feature sets: the pane mirror (`src/lib/tmux.ts`, `src/lib/stream.ts`, mirror handlers in `src/index.ts`) and the OpenCode bridge (`src/lib/opencode/`, `src/lib/router.ts`, `src/lib/store/`, `src/bot/`, `src/render/`, `src/streaming/`) — `src/index.ts` wires both onto the same `Bot` instance and the same allow-list middleware
- The render pipeline (`src/render/`) and the streamer (`src/streaming/`) are ported from the MIT-licensed [opencode-telegram-bot](https://github.com/grinev/opencode-telegram-bot) by Ruslan Grinev; see `THIRD_PARTY_NOTICES.md` for the full adapted-file list, including their ported test suites
- Bindings persist to `data/bindings.json` (path overridable via `BINDINGS_PATH`), written crash-safely: temp file → backup rotation → rename, with automatic recovery from the `.bak` file if the primary is corrupt
- `subscribeEvents` tries a global event stream first and falls back to a directory-scoped stream if the server doesn't support it, reconnecting with exponential backoff (1s → 15s cap) on any drop
- `tmux-telegram-bot.service` is `PartOf=tmux-server.service`, restarts on failure with a 5s delay, and runs `tsx src/index.ts` directly (no build artifact)
- Parent service dependency and env loading mirror `slack/tmux-bridge`'s conventions; see that package's `AGENTS.md` for the sibling bridge's structure
