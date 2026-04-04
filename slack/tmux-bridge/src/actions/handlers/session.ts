import type { App } from "@slack/bolt";
import { ActionId } from "../../types.js";
import { killSession, capturePane, runSessionSync, launchOpencode } from "../../lib/tmux.js";
import {
  formatActionResult,
  formatCapture,
  formatSync,
  formatError,
  backToListBlock,
} from "../../lib/formatter/index.js";
import { actionValue, refreshDashboard, updateMessage } from "../helpers.js";

export function registerSessionActionHandlers(app: App): void {
  app.action(ActionId.SESSION_LIST, async ({ ack, respond }) => {
    await ack();
    await refreshDashboard(respond);
  });

  app.action(ActionId.BACK_TO_LIST, async ({ ack, respond }) => {
    await ack();
    await refreshDashboard(respond);
  });

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

  app.action(ActionId.SESSION_CAPTURE, async ({ ack, respond, action }) => {
    await ack();
    const name = actionValue(action);
    const capture = await capturePane(name);
    const view = formatCapture(capture);
    view.blocks.push(backToListBlock());
    await updateMessage(respond, view);
  });

  app.action(ActionId.SESSION_SYNC, async ({ ack, respond }) => {
    await ack();
    const result = await runSessionSync();
    const view = formatSync(result.created, result.errors);
    view.blocks.push(backToListBlock());
    await updateMessage(respond, view);
  });

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
}
