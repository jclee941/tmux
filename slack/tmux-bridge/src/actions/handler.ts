import type { App } from "@slack/bolt";
import type { KnownBlock } from "@slack/types";
import { ActionId, CallbackId } from "../types.js";
import {
  listSessions,
  createSession,
  killSession,
  renameSession,
  sendKeys,
  capturePane,
  runSessionSync,
  launchOpencode,
} from "../lib/tmux.js";
import {
  formatSessionDashboard,
  formatActionResult,
  formatCapture,
  formatSync,
  formatError,
  backToListBlock,
  buildSendKeysModal,
  buildRenameModal,
  buildNewSessionModal,
} from "../lib/formatter.js";

type Blocks = Record<string, unknown>[];

function cast(blocks: Blocks): KnownBlock[] {
  return blocks as unknown as KnownBlock[];
}

function actionValue(action: unknown): string {
  return String((action as { value?: string })?.value ?? "");
}

async function updateMessage(
  respond: (msg: Record<string, unknown>) => Promise<unknown>,
  view: { text: string; blocks: Blocks },
): Promise<void> {
  await respond({
    response_type: "ephemeral",
    replace_original: true,
    text: view.text,
    blocks: cast(view.blocks),
  });
}

async function refreshDashboard(
  respond: (msg: Record<string, unknown>) => Promise<unknown>,
): Promise<void> {
  const sessions = await listSessions();
  const dash = formatSessionDashboard(sessions);
  await updateMessage(respond, dash);
}

async function postViaResponseUrl(
  url: string,
  text: string,
  blocks: Blocks,
): Promise<void> {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      response_type: "ephemeral",
      replace_original: true,
      text,
      blocks: cast(blocks),
    }),
  });
}

export function registerActions(app: App): void {
  // ── List / Refresh / Back ──────────────────────────────────
  app.action(ActionId.SESSION_LIST, async ({ ack, respond }) => {
    await ack();
    await refreshDashboard(respond);
  });

  app.action(ActionId.BACK_TO_LIST, async ({ ack, respond }) => {
    await ack();
    await refreshDashboard(respond);
  });

  // ── Kill ───────────────────────────────────────────────────
  app.action(ActionId.SESSION_KILL, async ({ ack, respond, action }) => {
    await ack();
    const name = actionValue(action);
    const result = await killSession(name);
    if (!result.ok) {
      await updateMessage(respond, formatError(`Kill failed: ${result.error}`));
      return;
    }
    await updateMessage(
      respond,
      formatActionResult("🗑️", `Session *${name}* killed`),
    );
  });

  // ── Capture ────────────────────────────────────────────────
  app.action(ActionId.SESSION_CAPTURE, async ({ ack, respond, action }) => {
    await ack();
    const name = actionValue(action);
    const capture = await capturePane(name);
    const view = formatCapture(capture);
    view.blocks.push(backToListBlock());
    await updateMessage(respond, view);
  });

  // ── Send Keys → modal ─────────────────────────────────────
  app.action(
    ActionId.SESSION_SEND_KEYS,
    async ({ ack, body, client, action }) => {
      await ack();
      const name = actionValue(action);
      const b = body as unknown as {
        trigger_id: string;
        response_url: string;
      };
      const meta = JSON.stringify({
        session: name,
        response_url: b.response_url,
      });
      await client.views.open({
        trigger_id: b.trigger_id,
        view: buildSendKeysModal(name, meta) as unknown as Parameters<
          typeof client.views.open
        >[0]["view"],
      });
    },
  );

  // ── Rename → modal ────────────────────────────────────────
  app.action(ActionId.SESSION_RENAME, async ({ ack, body, client, action }) => {
    await ack();
    const name = actionValue(action);
    const b = body as unknown as {
      trigger_id: string;
      response_url: string;
    };
    const meta = JSON.stringify({
      session: name,
      response_url: b.response_url,
    });
    await client.views.open({
      trigger_id: b.trigger_id,
      view: buildRenameModal(name, meta) as unknown as Parameters<
        typeof client.views.open
      >[0]["view"],
    });
  });

  // ── New Session → modal ───────────────────────────────────
  app.action(ActionId.SESSION_NEW, async ({ ack, body, client }) => {
    await ack();
    const b = body as unknown as { trigger_id: string; response_url: string };
    const meta = JSON.stringify({ response_url: b.response_url });
    await client.views.open({
      trigger_id: b.trigger_id,
      view: buildNewSessionModal(meta) as unknown as Parameters<
        typeof client.views.open
      >[0]["view"],
    });
  });

  // ── Sync ───────────────────────────────────────────────────
  app.action(ActionId.SESSION_SYNC, async ({ ack, respond }) => {
    await ack();
    const result = await runSessionSync();
    const view = formatSync(result.created, result.errors);
    view.blocks.push(backToListBlock());
    await updateMessage(respond, view);
  });

  // ── Opencode ───────────────────────────────────────────────
  app.action(ActionId.SESSION_OPENCODE, async ({ ack, respond }) => {
    await ack();
    const result = await launchOpencode();
    await updateMessage(
      respond,
      result.ok
        ? formatActionResult("🤖", "*opencode* session is active")
        : formatActionResult("❌", `opencode launch failed: ${result.error}`),
    );
  });

  // ── Modal: Send Keys ──────────────────────────────────────
  app.view(CallbackId.SEND_KEYS, async ({ ack, view }) => {
    const meta = JSON.parse(view.private_metadata);
    const cmd = view.state.values.cmd_block.cmd_input.value ?? "";

    if (!cmd.trim()) {
      await ack({
        response_action: "errors",
        errors: { cmd_block: "Command is required" },
      });
      return;
    }

    await ack();

    const result = await sendKeys(meta.session, cmd);
    const sessions = await listSessions();
    const dash = formatSessionDashboard(sessions);
    const msg = result.ok
      ? `✅ Sent \`${cmd}\` to *${meta.session}*`
      : `❌ Send failed: ${result.error}`;

    await postViaResponseUrl(meta.response_url, msg, [
      { type: "section", text: { type: "mrkdwn", text: msg } },
      ...dash.blocks,
    ]);
  });

  // ── Modal: Rename ─────────────────────────────────────────
  app.view(CallbackId.RENAME, async ({ ack, view }) => {
    const meta = JSON.parse(view.private_metadata);
    const newName = view.state.values.name_block.name_input.value ?? "";

    if (!newName.trim()) {
      await ack({
        response_action: "errors",
        errors: { name_block: "Name is required" },
      });
      return;
    }

    await ack();

    const result = await renameSession(meta.session, newName);
    const sessions = await listSessions();
    const dash = formatSessionDashboard(sessions);
    const msg = result.ok
      ? `✏️ *${meta.session}* → *${newName}*`
      : `❌ Rename failed: ${result.error}`;

    await postViaResponseUrl(meta.response_url, msg, [
      { type: "section", text: { type: "mrkdwn", text: msg } },
      ...dash.blocks,
    ]);
  });

  // ── Modal: New Session ────────────────────────────────────
  app.view(CallbackId.NEW_SESSION, async ({ ack, view }) => {
    const meta = JSON.parse(view.private_metadata);
    const name = view.state.values.name_block.name_input.value ?? "";
    const path = view.state.values.path_block?.path_input?.value || undefined;

    if (!name.trim()) {
      await ack({
        response_action: "errors",
        errors: { name_block: "Name is required" },
      });
      return;
    }

    await ack();

    const result = await createSession(name, path);
    const sessions = await listSessions();
    const dash = formatSessionDashboard(sessions);
    const detail = path ? ` at \`${path}\`` : "";
    const msg = result.ok
      ? `✅ Session *${name}* created${detail}`
      : `❌ Create failed: ${result.error}`;

    await postViaResponseUrl(meta.response_url, msg, [
      { type: "section", text: { type: "mrkdwn", text: msg } },
      ...dash.blocks,
    ]);
  });
}
