import type { CaptureResult } from "../../types.js";
import { type Block, codeBlock, header, section } from "./blocks.js";

export function formatCapture(result: CaptureResult): {
  text: string;
  blocks: Block[];
} {
  const truncated =
    result.content.length > 2800
      ? result.content.slice(-2800) + "\n…(truncated)"
      : result.content;

  return {
    text: `Capture from ${result.session}`,
    blocks: [header(`📸 ${result.session}`), codeBlock(truncated)],
  };
}

export function formatSendKeys(
  target: string,
  keys: string,
): { text: string; blocks: Block[] } {
  return {
    text: `Sent to ${target}: ${keys}`,
    blocks: [section(`⌨️ Sent to *${target}*: \`${keys}\``)],
  };
}
