# telegram/tmux-bot

## OVERVIEW
Node + TS grammY bot running two features in one process: a tmux pane mirror (capture-pane poll, edited in place) and an OpenCode bridge (SSE → rendered, streamed messages). Own file: score 15 (60 files, own package, `ResponseStreamer` 45 refs); `render/` and `streaming/` are ported MIT code.

## STRUCTURE
```
src/
├── index.ts       # Bot, allow-list middleware, mirror commands, bridge wiring, shutdown
├── lib/           # config, logger, capability, tmux + stream (mirror), router, opencode/, store/
├── bot/           # bridge commands, callbacks, deps (test seams), stream-coordinator
├── render/        # ported Markdown → Telegram pipeline (11 files)
├── streaming/     # ported ResponseStreamer + grammY transport
└── __tests__/     # vitest mirror of bot/ lib/ render/ streaming/
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Bridge commands | `src/bot/commands.ts` | `registerBridgeCommands`, `promptBoundSession`; claim only verbs the mirror doesn't use |
| Callback buttons | `src/bot/callbacks.ts` | `bind:` / `permission:` payloads; re-parse with the registering regex |
| Chat → session routing | `src/lib/router.ts` | `createRouter`: bind, resolveRoute, isStale, discoverSessions |
| Binding persistence | `src/lib/store/bindings.ts`, `binding-file.ts` | schema v1; temp → `.bak` rotate → rename, `.bak` recovery |
| SSE events | `src/lib/opencode/events.ts` | `subscribeEvents`: global stream, then dir-scoped; backoff 1 s → 15 s |
| Events → messages | `src/bot/stream-coordinator.ts` | part updates, status, permission/question prompts, errors |
| opencode SDK | `src/lib/opencode/client.ts`, `api.ts` | `@opencode-ai/sdk/v2`; `directory` passed on every call |
| Edit loop | `src/streaming/response-streamer.ts` | `ResponseStreamer`; near the 500-LOC ceiling — split before growing |
| Delivery mode | `src/streaming/telegram-transport.ts` | persistent edit vs private-chat draft (`TELEGRAM_DRAFT_STREAMING`) |
| Rendering | `src/render/pipeline.ts` | `toRenderedBlocks` |
| Mirror | `src/lib/tmux.ts`, `src/lib/stream.ts` | independent of the bridge |
| Config | `src/lib/config.ts` + `.env.example` | |

## CONVENTIONS
- ESM + strict TS run by `tsx`, no build; vitest mocks the opencode SDK, tmux CLI, and grammY `Bot.api`.
- `ResponseStreamer` reaches Telegram only via transport callbacks (`sendPart`, `editPart`, `deleteText`, optional `completePart`).
- `router.bind()` keeps `opencodeSessionId` only when the directory is unchanged.
- `src/types.ts` redeclares `Binding` (mutable) instead of re-exporting the store's readonly type — keep both in sync.
- Ported files keep the `// Adapted from opencode-telegram-bot (MIT)` header and a `THIRD_PARTY_NOTICES.md` entry.

## ANTI-PATTERNS
| Never | Why |
|-------|-----|
| tmux calls outside `src/lib/tmux.ts` | loses `TMUX_SOCKET` + error handling |
| Bot API calls mid-stream outside the transport | breaks throttle/degradation |
| `@opencode-ai/sdk*` imports outside `src/lib/opencode/` | SDK surface stays in one place |
| Reading `Binding` without `router.resolveRoute` | skips unbound (`null`) handling |
| Native dependencies | no build step under `tsx` |
| Committing `.env` or `data/bindings.json` | secrets / deploy state (`data/` is ignored only by the repo root) |

## COMMANDS
```bash
npm install && npm test && npm run typecheck
npm run dev                                         # watch; npm start runs once
systemctl --user restart tmux-telegram-bot.service  # PartOf=tmux-server.service, runs tsx src/index.ts
```

## NOTES
- `TELEGRAM_BOT_TOKEN` is required. Empty `TELEGRAM_ALLOWED_CHATS` lets ANY Telegram user drive tmux — always set it.
- `STREAM_INTERVAL_MS` is clamped to ≥ 1000 ms; `BINDINGS_PATH` overrides `data/bindings.json`.
- Private 1:1 chats cannot delete user messages; the bot asks users to move to an admin group.
- SIGINT/SIGTERM stop gracefully with an unref'd 5 s force-exit timer.
