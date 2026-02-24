export interface TmuxSession {
  name: string;
  windows: number;
  created: number;
  attached: boolean;
  path: string;
  activity: number;
}

export interface CaptureResult {
  session: string;
  content: string;
  timestamp: number;
}

export type SubCommand =
  | "list"
  | "ls"
  | "new"
  | "create"
  | "kill"
  | "rm"
  | "send"
  | "type"
  | "capture"
  | "cap"
  | "rename"
  | "mv"
  | "opencode"
  | "oc"
  | "sync"
  | "help";

export interface ParsedCommand {
  subcommand: SubCommand;
  args: string[];
  raw: string;
}

export interface NotifyEvent {
  event:
    | "session-created"
    | "session-closed"
    | "session-renamed"
    | "client-attached"
    | "client-detached";
  session: string;
  timestamp: number | string;
  details?: string;
}


export const ActionId = {
  SESSION_LIST: "tmux_list",
  SESSION_KILL: "tmux_kill",
  SESSION_CAPTURE: "tmux_capture",
  SESSION_SEND_KEYS: "tmux_send",
  SESSION_RENAME: "tmux_rename",
  SESSION_NEW: "tmux_new",
  SESSION_SYNC: "tmux_sync",
  SESSION_OPENCODE: "tmux_opencode",
  BACK_TO_LIST: "tmux_back",
} as const;

export const CallbackId = {
  SEND_KEYS: "tmux_modal_send",
  RENAME: "tmux_modal_rename",
  NEW_SESSION: "tmux_modal_new",
} as const;