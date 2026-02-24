function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  slack: {
    botToken: required("SLACK_BOT_TOKEN"),
    signingSecret: optional("SLACK_SIGNING_SECRET", ""),
    channelId: optional("SLACK_CHANNEL_ID", ""),
    mode: optional("SLACK_MODE", "socket") as "socket" | "http",
    appToken: optional("SLACK_APP_TOKEN", ""),
    httpPort: parseInt(optional("SLACK_HTTP_PORT", "3000"), 10),
    channels: {
      tmux: optional("SLACK_CHANNEL_TMUX", ""),
      opencode: optional("SLACK_CHANNEL_OPENCODE", ""),
    },
    inviteUsers: optional("SLACK_INVITE_USERS", "").split(",").filter(Boolean),
  },
  tmux: {
    socket: optional("TMUX_SOCKET", "default"),
    home: optional("TMUX_HOME", `${process.env.HOME ?? "/home"}/.tmux`),
    scanDir: optional("TMUX_SCAN_DIR", `${process.env.HOME ?? "/home"}/dev`),
  },
  notify: {
    port: parseInt(optional("TMUX_SLACK_NOTIFY_PORT", "9876"), 10),
  },
  supermemory: {
    enabled: optional("SUPERMEMORY_ENABLED", "false") === "true",
    url: optional("SUPERMEMORY_URL", "http://localhost:8050"),
  },
  opencode: {
    url: optional("OPENCODE_URL", "http://localhost:0"),
    directory: optional("OPENCODE_DIRECTORY", process.env.HOME ?? "/home"),
    enabled: optional("OPENCODE_ENABLED", "true") === "true",
  },
} as const;
if (config.slack.mode === "socket" && !config.slack.appToken) {
  throw new Error("SLACK_APP_TOKEN is required in socket mode");
}
