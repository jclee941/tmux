# tmux ↔ Telegram Bot

Stream each tmux **window** to Telegram and drive it from chat. Built on
[grammY](https://grammy.dev). Mirrors the conventions of `slack/tmux-bridge`
(`exec()`-wrapped tmux CLI, env-based config, no hardcoded values).

## How it works

- **Output streaming**: polls `tmux capture-pane -p -S -<N>` per window every
  `STREAM_INTERVAL_MS` and **edits one Telegram message in place**
  (`editMessageText`). Unchanged ticks are skipped (hash compare) so you stay
  under Telegram's 1 msg/sec/chat limit. Body is trimmed to `STREAM_MAX_CHARS`
  (< 4096 hard limit).
- **Input**: `tmux send-keys -l -- <text>` then a separate `Enter` (150ms gap)
  to avoid a TUI treating a rapid Enter as a newline.
- **Per window**: every stream is keyed by `chat + session:index`, so one chat
  can stream several windows simultaneously, each as its own live message.

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather), grab the token.
2. `cp .env.example .env` and fill `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ALLOWED_CHATS`.
   Find your chat id via [@userinfobot](https://t.me/userinfobot).
3. `npm install`
4. `npm start` (or the systemd unit below).

```bash
systemctl --user enable --now tmux-telegram-bot.service
journalctl --user -u tmux-telegram-bot.service -f
```

## Commands

| Command | Action |
| --- | --- |
| `/windows` | List all tmux windows; tap one to start streaming |
| `/stream session:index` | Start a live stream of a window |
| `/stop session:index` | Stop one stream |
| `/stopall` | Stop every stream in this chat |
| `/streams` | List active streams |
| `/send session:index <text>` | Type text + Enter into a window |
| `/key session:index <key>` | Send one key (`Up`, `Escape`, `C-c`, …) |
| `/cap session:index` | One-shot capture (no streaming) |

## Security

`TELEGRAM_ALLOWED_CHATS` gates every update. If empty, the bot warns at startup
and **any** chat can drive your tmux — set it before exposing the bot.

## OpenCode bridge

The same bot process also hosts a second, independent feature set: a native
OpenCode bridge. Where the mirror above scrapes `tmux capture-pane` output,
the bridge talks straight to `opencode serve` over its SSE event stream, so
replies arrive as real streamed messages instead of polled pane snapshots.

### Setup

An `opencode serve` instance must be reachable at `OPENCODE_API_URL` (default
`http://127.0.0.1:4096`). Uncomment the `# --- OpenCode native bridge ---`
block in `.env.example` to override it, along with:

- `STREAM_THROTTLE_MS` (default `1000`) — minimum gap between edits to a
  streaming reply, so a fast-typing session still respects Telegram's rate
  limits.
- `TELEGRAM_DRAFT_STREAMING` (default `false`) — set `true` to stream replies
  as Telegram's DM "draft" bubbles instead of edited messages, in private
  chats only.
- `BINDINGS_PATH` (default `./data/bindings.json`) — where the chat-to-session
  bindings are persisted.

### Binding model

Every conversation the bridge drives is bound through one chain:
`(chat, thread) → tmux session → directory → opencode session`. The thread is
a forum topic id when the chat has topics enabled, or `null` for an ordinary
chat. Binding a tmux session adopts its working directory, and any opencode
session later created for that conversation runs in that directory. Bindings
persist across restarts in `data/bindings.json` (crash-safe: every write goes
temp file → backup rotation → rename).

Once a chat is bound, **plain text sent there is routed to opencode as a
prompt, not sent to the tmux window** — the mirror's "type to send keystrokes"
behavior only applies to unbound chats.

### Commands

| Command | Action |
| --- | --- |
| `/sessions` | List live tmux sessions as buttons; tap one to bind this conversation |
| `/use <name>` | Bind by typing the tmux session name directly |
| `/new` | Start a fresh opencode session in the bound directory |
| `/status` | Show the bound tmux session, directory, opencode session, and server reachability |
| `/abort` | Interrupt the bound conversation's running opencode session |

### Streaming behavior

Opencode message parts arrive over SSE and are rendered through a Markdown-to-
Telegram pipeline (native bold/code/lists where possible, falling back to
plain text on a parse error) and pushed with an edit-loop throttled to
`STREAM_THROTTLE_MS` — the message is sent once, then edited in place as more
text streams in, never one message per token. When `TELEGRAM_DRAFT_STREAMING=true`
and the chat is a private 1:1, replies stream as draft bubbles instead of
edited messages until the turn completes, then are persisted as a normal
message.

### Permission approval

When opencode asks for tool permission, the bridge posts the request with
three inline buttons — **Once**, **Always**, **Reject** — wired to
`permission:once|always|reject:<request id>` callbacks. A button pressed after
the request already expired or was answered elsewhere just reports "This
request is no longer pending" instead of failing.

### Server-down behavior

If the SSE connection to `opencode serve` drops, the bridge reconnects with
exponential backoff and sends a one-time "OpenCode event stream disconnected.
Reconnecting…" notice to every bound chat, followed by a one-time "restored"
notice once the stream reconnects. It never spams a notice per retry.
