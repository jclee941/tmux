import type { App } from "@slack/bolt";
import { CallbackId } from "../../types.js";
import {
  listSessions,
  sendKeys,
  renameSession,
  createSession,
} from "../../lib/tmux.js";
import { formatSessionDashboard } from "../../lib/formatter/index.js";
import { postViaResponseUrl } from "../helpers.js";

export function registerModalSubmitHandlers(app: App): void {
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
