import type { App } from "@slack/bolt";
import { ActionId } from "../../types.js";
import {
  buildSendKeysModal,
  buildRenameModal,
  buildNewSessionModal,
} from "../../lib/formatter/index.js";
import { actionValue } from "../helpers.js";

export function registerModalOpenHandlers(app: App): void {
  app.action(ActionId.SESSION_SEND_KEYS, async ({ ack, body, client, action }) => {
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
  });

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
}
