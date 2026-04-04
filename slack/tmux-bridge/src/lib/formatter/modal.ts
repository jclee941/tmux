import { CallbackId } from "../../types.js";
import { type Block, backToListBlock, section } from "./blocks.js";

export function formatActionResult(
  emoji: string,
  message: string,
): { text: string; blocks: Block[] } {
  return {
    text: message.replace(/\*/g, ""),
    blocks: [section(`${emoji} ${message}`), backToListBlock()],
  };
}

export function buildSendKeysModal(
  sessionName: string,
  meta: string,
): Record<string, unknown> {
  return {
    type: "modal",
    callback_id: CallbackId.SEND_KEYS,
    private_metadata: meta,
    title: { type: "plain_text", text: "⌨️ Send Keys" },
    submit: { type: "plain_text", text: "Send" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      section(`Session: *${sessionName}*`),
      {
        type: "input",
        block_id: "cmd_block",
        label: { type: "plain_text", text: "Command" },
        element: {
          type: "plain_text_input",
          action_id: "cmd_input",
          placeholder: { type: "plain_text", text: "e.g. ls -la" },
        },
      },
    ],
  };
}

export function buildRenameModal(
  sessionName: string,
  meta: string,
): Record<string, unknown> {
  return {
    type: "modal",
    callback_id: CallbackId.RENAME,
    private_metadata: meta,
    title: { type: "plain_text", text: "✏️ Rename" },
    submit: { type: "plain_text", text: "Rename" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      section(`Current: *${sessionName}*`),
      {
        type: "input",
        block_id: "name_block",
        label: { type: "plain_text", text: "New name" },
        element: {
          type: "plain_text_input",
          action_id: "name_input",
          placeholder: { type: "plain_text", text: "Enter new session name" },
        },
      },
    ],
  };
}

export function buildNewSessionModal(meta: string): Record<string, unknown> {
  return {
    type: "modal",
    callback_id: CallbackId.NEW_SESSION,
    private_metadata: meta,
    title: { type: "plain_text", text: "🆕 New Session" },
    submit: { type: "plain_text", text: "Create" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "name_block",
        label: { type: "plain_text", text: "Session name" },
        element: {
          type: "plain_text_input",
          action_id: "name_input",
          placeholder: { type: "plain_text", text: "e.g. my-project" },
        },
      },
      {
        type: "input",
        block_id: "path_block",
        optional: true,
        label: { type: "plain_text", text: "Start directory" },
        element: {
          type: "plain_text_input",
          action_id: "path_input",
          placeholder: { type: "plain_text", text: "e.g. ~/dev/my-project" },
        },
      },
    ],
  };
}
