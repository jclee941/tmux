import { App, LogLevel, HTTPReceiver } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import type { KnownBlock } from "@slack/types";
import { config } from "./lib/config.js";
import { parseCommand, handleCommand } from "./commands/handler.js";
import { formatNotifyEvent, formatError } from "./lib/formatter.js";
import type { NotifyEvent } from "./types.js";
import { registerActions } from "./actions/handler.js";

const web = new WebClient(config.slack.botToken);

function resolveChannel(session?: string): string {
  const ch = config.slack.channels;
  if (session === "opencode" && ch.opencode) return ch.opencode;
  if (ch.tmux) return ch.tmux;
  return config.slack.channelId;
}
const boltReady =
  config.slack.signingSecret.length > 0 &&
  (config.slack.channelId.length > 0 || config.slack.channels.tmux.length > 0);
const notifyReady =
  config.slack.channelId.length > 0 || config.slack.channels.tmux.length > 0;

let app: App | null = null;

if (boltReady) {
  const isSocketMode = config.slack.mode === "socket";

  app = isSocketMode
    ? new App({
        token: config.slack.botToken,
        appToken: config.slack.appToken,
        signingSecret: config.slack.signingSecret,
        socketMode: true,
        logLevel: LogLevel.INFO,
      })
    : new App({
        token: config.slack.botToken,
        signingSecret: config.slack.signingSecret,
        logLevel: LogLevel.INFO,
        receiver: new HTTPReceiver({
          signingSecret: config.slack.signingSecret,
          port: config.slack.httpPort,
        }),
      });

  app.command("/tmux", async ({ command, ack, respond }) => {
    await ack();

    try {
      const parsed = parseCommand(command.text);
      const response = await handleCommand(parsed);
      await respond({
        response_type: "ephemeral",
        text: response.text,
        blocks: response.blocks as unknown as KnownBlock[],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const response = formatError(message);
      await respond({
        response_type: "ephemeral",
        text: response.text,
        blocks: response.blocks as unknown as KnownBlock[],
      });
    }
  });

  registerActions(app);
}

async function postToChannel(
  payload: { text: string; blocks: Record<string, unknown>[] },
  session?: string,
): Promise<void> {
  const channel = resolveChannel(session);
  if (!channel) {
    console.warn("[notify] No channel configured for session:", session ?? "(none)");
    return;
  }
  await web.chat.postMessage({
    channel,
    text: payload.text,
    blocks: payload.blocks as unknown as KnownBlock[],
  });
}

function startNotifyServer(): void {
  const server = Bun.serve({
    port: config.notify.port,
    async fetch(req) {
      if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }

      const url = new URL(req.url);
      if (url.pathname !== "/notify") {
        return new Response("Not found", { status: 404 });
      }

      try {
        const event = (await req.json()) as NotifyEvent;

        if (!event.event || !event.session) {
          return new Response("Bad request: missing event or session", {
            status: 400,
          });
        }

        const payload = formatNotifyEvent(event);
        await postToChannel(payload, event.session);

        return Response.json({ ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[notify] Error processing event:", message);
        return Response.json({ ok: false, error: message }, { status: 500 });
      }
    },
  });

  console.log(`[notify] HTTP server listening on port ${server.port}`);
}

async function main(): Promise<void> {
  startNotifyServer();
  if (app) {
    const isSocketMode = config.slack.mode === "socket";
    const mode = isSocketMode
      ? "Socket Mode"
      : `HTTP mode on port ${config.slack.httpPort}`;
    console.log(`[bolt] Starting Bolt app (${mode})...`);
    try {
      await app.start();
      console.log(`[bolt] ⚡ tmux-bridge is running (${mode})`);
    } catch (err) {
      console.error(`[bolt] Failed to start:`, err);
      process.exit(1);
    }
  } else {
    const missing: string[] = [];
    if (!config.slack.signingSecret) missing.push("SLACK_SIGNING_SECRET");
    if (!config.slack.channelId && !config.slack.channels.tmux)
      missing.push("SLACK_CHANNEL_ID or SLACK_CHANNEL_TMUX");
    console.log(
      `[bolt] ⚠ Bolt disabled (missing: ${missing.join(", ")}). Notify-only mode active.`,
    );
  }
}
main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
