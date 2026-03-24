import { config } from "./config.js";

/** Returns the single notification channel ID (#opencode) */
export function getNotifyChannel(): string {
  const channel = config.slack.channels.opencode;
  if (!channel) {
    throw new Error("SLACK_CHANNEL_OPENCODE is required but not configured");
  }
  return channel;
}
