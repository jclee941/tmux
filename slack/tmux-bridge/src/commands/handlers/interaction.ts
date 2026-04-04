import type { ParsedCommand } from "../../types.js";
import { sendKeys, capturePane } from "../../lib/tmux.js";
import { formatCapture, formatSendKeys, formatError } from "../../lib/formatter/index.js";

type SlackResponse = { text: string; blocks: Record<string, unknown>[] };

export async function handleInteractionCommand(
  cmd: ParsedCommand,
): Promise<SlackResponse> {
  switch (cmd.subcommand) {
    case "send":
    case "type": {
      const target = cmd.args[0];
      const keys = cmd.args.slice(1).join(" ");
      if (!target || !keys)
        return formatError("Usage: `/tmux send <session> <command>`");
      const result = await sendKeys(target, keys);
      if (!result.ok) return formatError(`Failed to send keys: ${result.error}`);
      return formatSendKeys(target, keys);
    }

    case "capture":
    case "cap": {
      const target = cmd.args[0];
      if (!target) return formatError("Usage: `/tmux capture <session> [lines]`");
      const lines = cmd.args[1] ? parseInt(cmd.args[1], 10) : 50;
      const result = await capturePane(target, lines);
      return formatCapture(result);
    }
  }

  return formatError(`Unsupported interaction command: ${cmd.subcommand}`);
}
