import { WebClient } from "@slack/web-api";
import type { KnownBlock } from "@slack/types";
import { config } from "./config.js";
import { getSessionStatus } from "./opencode.js";
import { getNotifyChannel } from "./channels.js";
import { formatIdleNotification } from "./formatter.js";

const web = new WebClient(config.slack.botToken);

const POLL_INTERVAL_MS = 30_000;

/** Last known status type per session ID */
const lastKnownState = new Map<string, string | undefined>();

let timer: ReturnType<typeof setInterval> | null = null;

async function pollOnce(): Promise<void> {
  try {
    const statuses = await getSessionStatus();

    for (const [sessionId, status] of Object.entries(statuses)) {
      const prev = lastKnownState.get(sessionId);
      const current = status.type;

      // Transition: busy/retry → idle (undefined)
      if ((prev === "busy" || prev === "retry") && !current) {
        const payload = formatIdleNotification(sessionId);
        const channel = getNotifyChannel();
        await web.chat.postMessage({
          channel,
          text: payload.text,
          blocks: payload.blocks as unknown as KnownBlock[],
        });
        console.log(
          `[idle-monitor] Session ${sessionId.slice(0, 8)} transitioned to idle`,
        );
      }

      lastKnownState.set(sessionId, current);
    }

    // Clean up sessions that no longer exist
    for (const id of lastKnownState.keys()) {
      if (!(id in statuses)) {
        lastKnownState.delete(id);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[idle-monitor] Poll failed: ${msg}`);
  }
}

export function startIdleMonitor(): void {
  if (!config.opencode.enabled) {
    console.log("[idle-monitor] OpenCode disabled, skipping idle monitor");
    return;
  }

  if (timer) {
    console.warn("[idle-monitor] Already running");
    return;
  }

  console.log(
    `[idle-monitor] Starting (poll every ${POLL_INTERVAL_MS / 1000}s)`,
  );
  timer = setInterval(pollOnce, POLL_INTERVAL_MS);

  // Initial poll
  pollOnce();
}

export function stopIdleMonitor(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log("[idle-monitor] Stopped");
  }
}
