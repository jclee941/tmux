import { WebClient } from "@slack/web-api";
import { config } from "./config.js";
import { listSessions } from "./tmux.js";
import { readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const web = new WebClient(config.slack.botToken);

const registry = new Map<string, string>();

const SKIP_DIRS = new Set(["data", "logs", "log", "tmp", ".cache"]);

function sanitize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function scanDevDirs(): string[] {
  const scanDir = config.tmux.scanDir;
  try {
    return readdirSync(scanDir).filter((entry) => {
      if (entry.startsWith(".")) return false;
      if (SKIP_DIRS.has(entry)) return false;
      try {
        return statSync(join(scanDir, entry)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[channels] Failed to scan ${scanDir}: ${msg}`);
    return [];
  }
}

async function listSlackChannels(): Promise<
  Map<string, { id: string; name: string }>
> {
  const channels = new Map<string, { id: string; name: string }>();
  let cursor: string | undefined;
  do {
    const result = await web.conversations.list({
      types: "public_channel",
      limit: 200,
      cursor,
      exclude_archived: true,
    });
    for (const ch of result.channels ?? []) {
      if (ch.name && ch.id) channels.set(ch.name, { id: ch.id, name: ch.name });
    }
    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return channels;
}

async function ensureChannel(
  sessionName: string,
  existing: Map<string, { id: string; name: string }>,
): Promise<string> {
  const channelName = `tmux-${sanitize(sessionName)}`;

  const found = existing.get(channelName);
  if (found) {
    registry.set(sessionName, found.id);
    return found.id;
  }

  const result = await web.conversations.create({ name: channelName });
  const id = result.channel?.id;
  if (!id) throw new Error(`Failed to create channel #${channelName}`);

  await web.conversations
    .setTopic({ channel: id, topic: `tmux session: ${sessionName}` })
    .catch(() => {});

  registry.set(sessionName, id);
  existing.set(channelName, { id, name: channelName });
  console.log(
    `[channels] Created #${channelName} (${id}) for "${sessionName}"`,
  );
  return id;
}

/** Resolve channel ID for a session — creates if missing */
export async function resolveSessionChannel(session: string): Promise<string> {
  const cached = registry.get(session);
  if (cached) return cached;


  const { channels, channelId } = config.slack;
  if (session === "opencode" && channels.opencode) {
    registry.set(session, channels.opencode);
    return channels.opencode;
  }
  if (session === "tmux" && channels.tmux) {
    registry.set(session, channels.tmux);
    return channels.tmux;
  }


  const existing = await listSlackChannels();
  return ensureChannel(session, existing);
}

/** Seed registry from env overrides + tmux sessions + ~/dev dirs, archive stale */
export async function initChannelRegistry(): Promise<void> {
  // 1. Env overrides
  const { channels, channelId } = config.slack;
  if (channels.opencode) registry.set("opencode", channels.opencode);
  if (channels.tmux) registry.set("tmux", channels.tmux);
  if (channelId) registry.set("__fallback__", channelId);

  // 2. Scan existing Slack channels
  console.log("[channels] Scanning existing Slack channels...");
  const existing = await listSlackChannels();
  console.log(`[channels] Found ${existing.size} existing channels`);

  // 3. Collect all desired session names: tmux sessions + ~/dev dirs
  const desiredSessions = new Set<string>();

  const sessions = await listSessions();
  for (const sess of sessions) desiredSessions.add(sess.name);

  const devDirs = scanDevDirs();
  for (const dir of devDirs) desiredSessions.add(dir);

  console.log(
    `[channels] Desired sessions: ${desiredSessions.size} (${sessions.length} tmux + ${devDirs.length} dirs)`,
  );

  // 4. Create missing channels
  let created = 0;
  for (const name of desiredSessions) {

    if (name === "opencode" || name === "tmux") continue;

    try {
      const channelName = `tmux-${sanitize(name)}`;
      const found = existing.get(channelName);
      if (found) {
        registry.set(name, found.id);
      } else {
        await ensureChannel(name, existing);
        created++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[channels] Failed to create channel for "${name}": ${msg}`,
      );
    }
  }

  // 5. Archive stale tmux-* channels (no matching dir or session)
  let archived = 0;
  for (const [chName, { id }] of existing) {
    if (!chName.startsWith("tmux-")) continue;

    const sessionName = chName.slice(5);
    if (desiredSessions.has(sessionName)) continue;

    // Also check un-sanitized: a dir might sanitize differently
    let matchFound = false;
    for (const name of desiredSessions) {
      if (sanitize(name) === sessionName) {
        matchFound = true;
        break;
      }
    }
    if (matchFound) continue;

    try {
      await web.conversations.archive({ channel: id });
      console.log(`[channels] Archived stale #${chName} (${id})`);
      archived++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // already_archived is fine
      if (!msg.includes("already_archived")) {
        console.error(`[channels] Failed to archive #${chName}: ${msg}`);
      }
    }
  }

  console.log(
    `[channels] Registry ready: ${registry.size} entries (${created} created, ${archived} archived)`,
  );
}

/** Get current registry snapshot for debugging */
export function getChannelRegistry(): ReadonlyMap<string, string> {
  return registry;
}
