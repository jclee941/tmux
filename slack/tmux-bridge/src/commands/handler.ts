import type { ParsedCommand } from "../types.js";
import { syncSessions, runSessionSync } from "../lib/tmux.js";
import { formatHelp, formatSync } from "../lib/formatter/index.js";
import {
  handleSessionCommand,
  handleInteractionCommand,
  handleOpencodeCommand,
} from "./handlers/index.js";

type SlackResponse = { text: string; blocks: Record<string, unknown>[] };

export async function handleCommand(
  cmd: ParsedCommand,
): Promise<SlackResponse> {
  switch (cmd.subcommand) {
    case "list":
    case "ls":
    case "new":
    case "create":
    case "kill":
    case "rm":
    case "rename":
    case "mv":
      return handleSessionCommand(cmd);

    case "send":
    case "type":
    case "capture":
    case "cap":
      return handleInteractionCommand(cmd);

    case "sync": {
      const dryRun = cmd.args.includes("--dry-run");
      const result = dryRun ? await syncSessions() : await runSessionSync();
      return formatSync(result.created, result.errors);
    }

    case "opencode":
    case "oc":
      return handleOpencodeCommand(cmd);

    case "help":
    default:
      return formatHelp();
  }
}
