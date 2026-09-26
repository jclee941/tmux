import { fileURLToPath } from "node:url";

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  telegram: {
    botToken: required("TELEGRAM_BOT_TOKEN"),
    /** Comma-separated chat IDs allowed to control tmux. Empty = allow all (NOT recommended). */
    allowedChats: optional("TELEGRAM_ALLOWED_CHATS", "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseInt(s, 10)),
    draftStreaming: optional("TELEGRAM_DRAFT_STREAMING", "false") === "true",
  },
  tmux: {
    socket: optional("TMUX_SOCKET", "default"),
    home: optional("TMUX_HOME", `${process.env.HOME ?? "/home"}/.tmux`),
  },
  stream: {
    /** Poll cadence in ms. Stays >=1000 to respect Telegram 1 msg/sec/chat. */
    intervalMs: Math.max(1000, parseInt(optional("STREAM_INTERVAL_MS", "2000"), 10)),
    /** How many scrollback lines to capture per tick. */
    lines: parseInt(optional("STREAM_LINES", "60"), 10),
    /** Telegram message hard limit is 4096; reserve room for the <pre> wrapper + header. */
    maxChars: parseInt(optional("STREAM_MAX_CHARS", "3500"), 10),
    /** Stop auto-streaming a window after this many idle ticks (0 = never stop). */
    idleStopTicks: parseInt(optional("STREAM_IDLE_STOP_TICKS", "0"), 10),
    throttleMs: parseInt(optional("STREAM_THROTTLE_MS", "1000"), 10),
  },
  opencode: {
    apiUrl: optional("OPENCODE_API_URL", "http://127.0.0.1:4096"),
  },
  bindingsPath: optional(
    "BINDINGS_PATH",
    fileURLToPath(new URL("../../data/bindings.json", import.meta.url)),
  ),
} as const;
