# slack/tmux-bridge

## OVERVIEW
Node + TS `@slack/bolt` service: `/tmux` slash command, button/modal UI, `#opencode` notifications, opencode idle monitor. Own file: score 15 (44 files, own package, `config` 68 refs). Inactive since OmO replaced opencode.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Startup, modes | `src/index.ts` | Bolt app + HTTP `/notify` server + idle monitor |
| Env config | `src/lib/config.ts` + `.env.example` | `config` object |
| `/tmux` parsing | `src/commands/parser.ts` | `parseCommand`; add new verbs to `SubCommand` (`src/types.ts`) |
| `/tmux` dispatch | `src/commands/handler.ts` + `handlers/` | `handleCommand` |
| Buttons, modals | `src/actions/handler.ts` + `handlers/` | `registerActions`; ids in `ActionId` / `CallbackId` |
| Block Kit output | `src/lib/formatter/` | per domain: session, capture, opencode, notify, modal; primitives in `blocks.ts` |
| tmux CLI | `src/lib/tmux.ts` | exported ops (`listSessions`, `capturePane`, …); spawn helpers are private |
| Channel routing | `src/lib/channels.ts` | `getNotifyChannel()` → the single `#opencode` channel |
| opencode SDK | `src/lib/opencode.ts` | lazy `getClient()`; backs `/tmux oc` |
| Idle alerts | `src/lib/idle-monitor.ts` | `startIdleMonitor`: 30 s poll, notifies only on busy/retry → idle |
| Slack app setup | `SETUP.md`, `bin/tmux-slack-bridge-setup` | scopes, slash command, socket mode |
| Tests | `src/__tests__/` | channels, commands, config, formatter, parser, types (vitest) |

## CONVENTIONS
- ESM + strict TS run by `tsx`, no build.
- Every Slack reply is Block Kit from the formatter modules, never raw text.
- All notifications use `getNotifyChannel()`; no per-session channels.
- tmux calls add `-L <socket>` when `TMUX_SOCKET` ≠ `default`.
- Tests mock the Slack WebClient, tmux CLI, and opencode SDK.

## ANTI-PATTERNS
| Never | Why |
|-------|-----|
| Spawn `tmux` outside `src/lib/tmux.ts` | loses socket handling + error mapping |
| Hardcode channel IDs | `SLACK_CHANNEL_OPENCODE` via config |
| Env var without an `.env.example` entry | silent deploy breakage |
| New verb without `parseCommand` + `SubCommand` | unvalidated input |
| opencode client outside `getClient()` | breaks the singleton |

## COMMANDS
```bash
npm install && npm test && npm run typecheck
npm run dev                                          # watch; npm start runs once
systemctl --user restart tmux-slack-bridge.service   # PartOf=tmux-server.service
journalctl --user -u tmux-slack-bridge.service -f
```

## NOTES
- Required: `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_OPENCODE`; `SLACK_APP_TOKEN` when `SLACK_MODE=socket` (default; missing → throws at config load).
- Without `SLACK_SIGNING_SECRET` the Bolt app and `/tmux` stay off, but the notify server (`TMUX_SLACK_NOTIFY_PORT`, default 9876, path `/notify`) and idle monitor still run.
- Shells out to `$TMUX_HOME/bin/tmux-session-sync` (`syncSessions` = `--dry-run` preview) and `$TMUX_HOME/bin/tmux-opencode`.
- `/tmux oc` needs `opencode serve` (`OPENCODE_URL`); `OPENCODE_ENABLED=false` disables it.
- Both `bun.lock` and `package-lock.json` are tracked; scripts and the unit use npm/tsx.
