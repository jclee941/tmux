import { App, LogLevel } from "@slack/bolt";
import type { KnownBlock } from "@slack/types";
import { config } from "./lib/config.js";
import { parseCommand, handleCommand } from "./commands/handler.js";
import { formatNotifyEvent, formatError } from "./lib/formatter.js";
import type { NotifyEvent } from "./types.js";
import { registerActions } from "./actions/handler.js";

const app = new App({
  token: config.slack.botToken,
  appToken: config.slack.appToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  logLevel: LogLevel.INFO,
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

async function postToChannel(payload: {
  text: string;
  blocks: Record<string, unknown>[];
}): Promise<void> {
  await app.client.chat.postMessage({
    channel: config.slack.channelId,
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
        await postToChannel(payload);

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

  await app.start();
  console.log("[bolt] ⚡ tmux-bridge is running (Socket Mode)");
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
