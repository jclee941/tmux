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

async function inviteUsersToChannel(channelId: string, channelName: string): Promise<void> {
  const users = config.slack.inviteUsers;
  if (!users.length) return;
  for (const userId of users) {
    try {
      await web.conversations.invite({ channel: channelId, users: userId });
      console.log(`[channels] Invited ${userId} to #${channelName}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("already_in_channel") && !msg.includes("cant_invite_self")) {
        console.error(`[channels] Failed to invite ${userId} to #${channelName}: ${msg}`);
      }
    }
  }
}

async function ensureChannel(
  sessionName: string,
  existing: Map<string, { id: string; name: string }>,
): Promise<string> {
  const channelName = sanitize(sessionName);

  const found = existing.get(channelName);
  if (found) {
    registry.set(sessionName, found.id);
    return found.id;
  }

  try {
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
    await inviteUsersToChannel(id, channelName);
    return id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("name_taken")) {
      // Archived channel holds this name — can't create or unarchive via bot token.
      // Unarchive it manually in Slack UI, then restart the bridge.
      console.warn(
        `[channels] #${channelName} name taken (likely archived). Unarchive via Slack UI.`,
      );
      const fallback = registry.get("__fallback__");
      if (fallback) {
        registry.set(sessionName, fallback);
        return fallback;
      }
      throw new Error(`Channel #${channelName} name taken and no fallback configured`);
    }
    throw err;
  }
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
      const channelName = sanitize(name);
      const found = existing.get(channelName);
      if (found) {
        registry.set(name, found.id);
        await inviteUsersToChannel(found.id, channelName);
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

  // 5. Log stale tmux-* channels (no matching dir or session) — do NOT auto-archive
  const stale: string[] = [];
  for (const [chName] of existing) {
    if (chName === "opencode" || chName === "tmux") continue;
    // Only consider tmux-* prefixed channels as bridge-managed
    if (!chName.startsWith("tmux-")) continue;

    // Strip prefix for matching against session/dir names
    const sessionName = chName.slice(5); // "tmux-foo" → "foo"
    if (desiredSessions.has(chName) || desiredSessions.has(sessionName)) continue;

    // Also check sanitized: a dir might sanitize differently
    let matchFound = false;
    for (const name of desiredSessions) {
      if (sanitize(name) === chName || `tmux-${sanitize(name)}` === chName) {
        matchFound = true;
        break;
      }
    }
    if (matchFound) continue;

    stale.push(chName);
  }
  if (stale.length > 0) {
    console.log(
      `[channels] ${stale.length} stale channel(s) detected (not archived): ${stale.join(", ")}`,
    );
  }

  console.log(
    `[channels] Registry ready: ${registry.size} entries (${created} created, ${stale.length} stale)`,
  );

  // 6. Invite configured users to override channels (opencode, tmux)
  if (channels.opencode) await inviteUsersToChannel(channels.opencode, "opencode");
  if (channels.tmux) await inviteUsersToChannel(channels.tmux, "tmux");
}

/** Get current registry snapshot for debugging */
export function getChannelRegistry(): ReadonlyMap<string, string> {
  return registry;
}
