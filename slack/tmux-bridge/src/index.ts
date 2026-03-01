import { App, LogLevel } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import type { KnownBlock } from "@slack/types";
import { config } from "./lib/config.js";
import { parseCommand, handleCommand } from "./commands/handler.js";
import { formatNotifyEvent, formatError } from "./lib/formatter.js";
import type { NotifyEvent } from "./types.js";
import { registerActions } from "./actions/handler.js";
import {
  resolveSessionChannel,
  initChannelRegistry,
} from "./lib/channels.js";

const web = new WebClient(config.slack.botToken);

const boltReady =
  config.slack.signingSecret.length > 0 &&
  (config.slack.channelId.length > 0 || config.slack.channels.tmux.length > 0);
const notifyReady = true;

let app: App | null = null;

if (boltReady) {
  const isSocketMode = config.slack.mode === "socket";

  app = isSocketMode
    ? new App({
        token: config.slack.botToken,
        appToken: config.slack.appToken,
        signingSecret: config.slack.signingSecret,
        socketMode: true,
        logLevel: LogLevel.DEBUG,
      })
    : new App({
        token: config.slack.botToken,
        signingSecret: config.slack.signingSecret,
        logLevel: LogLevel.INFO,
        port: config.slack.httpPort,
      });

  app.command("/tmux", async ({ command, ack, respond }) => {
    console.log(
      `[bolt] /tmux command received from ${command.user_name}: "${command.text}"`,
    );
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
  const channel = session
    ? await resolveSessionChannel(session)
    : config.slack.channelId || config.slack.channels.tmux;
  if (!channel) {
    throw new Error(
      `No channel resolved for session: ${session ?? "(none)"}`,
    );
  }
  await web.chat.postMessage({
    channel,
    text: payload.text,
    blocks: payload.blocks as unknown as KnownBlock[],
  });
}

function startNotifyServer(): void {
  const server = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method not allowed");
        return;
      }

      const url = new URL(
        req.url ?? "/",
        `http://localhost:${config.notify.port}`,
      );
      if (url.pathname !== "/notify") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        }
        const body = Buffer.concat(chunks).toString("utf-8");
        const event = JSON.parse(body) as NotifyEvent;

        if (!event.event || !event.session) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ ok: false, error: "missing event or session" }),
          );
          return;
        }

        const validEvents = new Set([
          "session-created",
          "session-closed",
          "session-renamed",
          "client-attached",
          "client-detached",
        ]);
        if (!validEvents.has(event.event)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              ok: false,
              error: `invalid event type: ${event.event}`,
            }),
          );
          return;
        }

        const payload = formatNotifyEvent(event);
        await postToChannel(payload, event.session);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[notify] Error processing event:", message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: message }));
      }
    },
  );

  server.listen(config.notify.port, () => {
    console.log(`[notify] HTTP server listening on port ${config.notify.port}`);
  });
}

async function main(): Promise<void> {
  await initChannelRegistry();
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
