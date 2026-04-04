import type { KnownBlock } from "@slack/types";
import { listSessions } from "../lib/tmux.js";
import { formatSessionDashboard } from "../lib/formatter/index.js";

export type Blocks = Record<string, unknown>[];

export function cast(blocks: Blocks): KnownBlock[] {
  return blocks as unknown as KnownBlock[];
}

export function actionValue(action: unknown): string {
  return String((action as { value?: string })?.value ?? "");
}

export async function updateMessage(
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

export async function refreshDashboard(
  respond: (msg: Record<string, unknown>) => Promise<unknown>,
): Promise<void> {
  const sessions = await listSessions();
  const dash = formatSessionDashboard(sessions);
  await updateMessage(respond, dash);
}

export async function postViaResponseUrl(
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
