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
    appToken: required("SLACK_APP_TOKEN"),
    signingSecret: required("SLACK_SIGNING_SECRET"),
    channelId: required("SLACK_CHANNEL_ID"),
  },
  tmux: {
    socket: optional("TMUX_SOCKET", "default"),
    home: optional("TMUX_HOME", `${process.env.HOME ?? "/home"}/.tmux`),
  },
  notify: {
    port: parseInt(optional("TMUX_SLACK_NOTIFY_PORT", "9876"), 10),
  },
  supermemory: {
    enabled: optional("SUPERMEMORY_ENABLED", "false") === "true",
    url: optional("SUPERMEMORY_URL", "http://localhost:8050"),
  },
} as const;
