import { ActionId } from "../../types.js";

export type Block = Record<string, unknown>;

export function section(text: string): Block {
  return { type: "section", text: { type: "mrkdwn", text } };
}

export function divider(): Block {
  return { type: "divider" };
}

export function header(text: string): Block {
  return { type: "header", text: { type: "plain_text", text, emoji: true } };
}

export function codeBlock(code: string): Block {
  return section(`\`\`\`\n${code}\n\`\`\``);
}

export function buttonEl(
  text: string,
  actionId: string,
  value?: string,
  style?: "primary" | "danger",
): Block {
  const btn: Block = {
    type: "button",
    text: { type: "plain_text", text, emoji: true },
    action_id: actionId,
  };
  if (value !== undefined) btn.value = value;
  if (style) btn.style = style;
  return btn;
}

export function actionsBlock(elements: Block[]): Block {
  return { type: "actions", elements };
}

export function backToListBlock(): Block {
  return actionsBlock([buttonEl("← Sessions", ActionId.BACK_TO_LIST)]);
}
