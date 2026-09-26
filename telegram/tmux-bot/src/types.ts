export interface TmuxSession {
  name: string;
  windows: number;
  created: number;
  attached: boolean;
  path: string;
  activity: number;
}

export interface TmuxWindow {
  session: string;
  index: number;
  name: string;
  active: boolean;
  panes: number;
  /** Fully qualified target "session:index" for capture-pane / send-keys. */
  target: string;
}

export interface CaptureResult {
  target: string;
  content: string;
  timestamp: number;
}

/** A live stream of one tmux window into one Telegram message, edited in place. */
export interface StreamState {
  /** tmux target "session:index". */
  target: string;
  /** Telegram chat the stream is mirrored to. */
  chatId: number;
  /** Telegram message_id being edited in place. */
  messageId: number;
  /** Last rendered body (used to skip no-op edits). */
  lastBody: string;
  /** SHA-ish hash of last capture (used for idle detection). */
  lastHash: string;
  /** Consecutive unchanged poll ticks. */
  idleTicks: number;
  /** Timer handle for the poll loop. */
  timer: ReturnType<typeof setInterval> | null;
}

export interface Binding {
  chatId: number;
  threadId: number | null;
  tmuxSession: string;
  directory: string;
  opencodeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedRoute {
  binding: Binding;
  directory: string;
}

export type CallbackData =
  | `bind:${string}`
  | `permission:${"once" | "always" | "reject"}:${string}`;
