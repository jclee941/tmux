import { WebClient } from "@slack/web-api";
import { config } from "./config.js";
import { listSessions } from "./tmux.js";

const web = new WebClient(config.slack.botToken);


const registry = new Map<string, string>();

function sanitize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function findChannelByName(name: string): Promise<string | null> {
  const channelName = sanitize(name);
  let cursor: string | undefined;
  do {
    const result = await web.conversations.list({
      types: "public_channel",
      limit: 200,
      cursor,
      exclude_archived: true,
    });
    for (const ch of result.channels ?? []) {
      if (ch.name === channelName && ch.id) return ch.id;
    }
    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return null;
}

async function createChannel(
  name: string,
): Promise<{ id: string; created: boolean }> {
  const channelName = sanitize(name);


  const cached = registry.get(name);
  if (cached) return { id: cached, created: false };


  const existing = await findChannelByName(channelName);
  if (existing) {
    registry.set(name, existing);
    return { id: existing, created: false };
  }


  const result = await web.conversations.create({ name: channelName });
  const id = result.channel?.id;
  if (!id) throw new Error(`Failed to create channel #${channelName}`);


  await web.conversations
    .setTopic({
      channel: id,
      topic: `tmux session: ${name}`,
    })
    .catch(() => {
      /* non-critical */
    });

  registry.set(name, id);
  console.log(
    `[channels] Created #${channelName} (${id}) for session "${name}"`,
  );
  return { id, created: true };
}

/** Resolve channel ID for a session — creates if missing */
export async function resolveSessionChannel(session: string): Promise<string> {
  const cached = registry.get(session);
  if (cached) return cached;

  const { id } = await createChannel(session);
  return id;
}

/** Seed registry with hardcoded env channels + all current tmux sessions */
export async function initChannelRegistry(): Promise<void> {

  const { channels, channelId } = config.slack;
  if (channels.opencode) registry.set("opencode", channels.opencode);
  if (channels.tmux) registry.set("tmux", channels.tmux);
  if (channelId) registry.set("__fallback__", channelId);


  console.log("[channels] Scanning existing Slack channels...");
  let cursor: string | undefined;
  const existing = new Map<string, string>();
  do {
    const result = await web.conversations.list({
      types: "public_channel",
      limit: 200,
      cursor,
      exclude_archived: true,
    });
    for (const ch of result.channels ?? []) {
      if (ch.name && ch.id) existing.set(ch.name, ch.id);
    }
    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);
  console.log(`[channels] Found ${existing.size} existing channels`);


  const sessions = await listSessions();
  let created = 0;
  for (const sess of sessions) {
    const channelName = sanitize(sess.name);
    const existingId = existing.get(channelName);
    if (existingId) {
      registry.set(sess.name, existingId);
      console.log(
        `[channels] Mapped session "${sess.name}" → #${channelName} (${existingId})`,
      );
    } else {
      try {
        const result = await web.conversations.create({ name: channelName });
        const id = result.channel?.id;
        if (id) {
          registry.set(sess.name, id);
          await web.conversations
            .setTopic({
              channel: id,
              topic: `tmux session: ${sess.name}`,
            })
            .catch(() => {});
          console.log(
            `[channels] Created #${channelName} (${id}) for session "${sess.name}"`,
          );
          created++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[channels] Failed to create #${channelName}: ${msg}`);
      }
    }
  }
  console.log(
    `[channels] Registry ready: ${registry.size} entries (${created} new channels created)`,
  );
}

/** Get current registry snapshot for debugging */
export function getChannelRegistry(): ReadonlyMap<string, string> {
  return registry;
}
