import type { ParsedCommand, SubCommand } from "../types.js";
import {
  listSessions,
  createSession,
  killSession,
  renameSession,
  sendKeys,
  capturePane,
  syncSessions,
  runSessionSync,
  launchOpencode,
  sendToOpencode,
} from "../lib/tmux.js";
import {
  formatSessionDashboard,
  formatCreated,
  formatKilled,
  formatRenamed,
  formatCapture,
  formatSendKeys,
  formatSync,
  formatOpencode,
  formatError,
  formatHelp,
} from "../lib/formatter.js";

const VALID_SUBCOMMANDS: Set<string> = new Set([
  "list",
  "ls",
  "new",
  "create",
  "kill",
  "rm",
  "send",
  "type",
  "capture",
  "cap",
  "rename",
  "mv",
  "opencode",
  "oc",
  "sync",
  "help",
]);

export function parseCommand(text: string): ParsedCommand {
  const trimmed = text.trim();
  if (!trimmed) return { subcommand: "list", args: [], raw: trimmed };

  const parts = trimmed.split(/\s+/);
  const sub = parts[0].toLowerCase();

  if (!VALID_SUBCOMMANDS.has(sub)) {
    return { subcommand: "help", args: [], raw: trimmed };
  }

  return {
    subcommand: sub as SubCommand,
    args: parts.slice(1),
    raw: trimmed,
  };
}

type SlackResponse = { text: string; blocks: Record<string, unknown>[] };

export async function handleCommand(
  cmd: ParsedCommand,
): Promise<SlackResponse> {
  switch (cmd.subcommand) {
    case "list":
    case "ls": {
      const sessions = await listSessions();
      return formatSessionDashboard(sessions);
    }

    case "new":
    case "create": {
      const name = cmd.args[0];
      if (!name) return formatError("Usage: `/tmux new <name> [path]`");
      const path = cmd.args[1];
      const result = await createSession(name, path);
      if (!result.ok)
        return formatError(`Failed to create "${name}": ${result.error}`);
      return formatCreated(name, path);
    }

    case "kill":
    case "rm": {
      const name = cmd.args[0];
      if (!name) return formatError("Usage: `/tmux kill <name>`");
      const result = await killSession(name);
      if (!result.ok)
        return formatError(`Failed to kill "${name}": ${result.error}`);
      return formatKilled(name);
    }

    case "rename":
    case "mv": {
      const oldName = cmd.args[0];
      const newName = cmd.args[1];
      if (!oldName || !newName)
        return formatError("Usage: `/tmux rename <old> <new>`");
      const result = await renameSession(oldName, newName);
      if (!result.ok) return formatError(`Failed to rename: ${result.error}`);
      return formatRenamed(oldName, newName);
    }

    case "send":
    case "type": {
      const target = cmd.args[0];
      const keys = cmd.args.slice(1).join(" ");
      if (!target || !keys)
        return formatError("Usage: `/tmux send <session> <command>`");
      const result = await sendKeys(target, keys);
      if (!result.ok)
        return formatError(`Failed to send keys: ${result.error}`);
      return formatSendKeys(target, keys);
    }

    case "capture":
    case "cap": {
      const target = cmd.args[0];
      if (!target)
        return formatError("Usage: `/tmux capture <session> [lines]`");
      const lines = cmd.args[1] ? parseInt(cmd.args[1], 10) : 50;
      const result = await capturePane(target, lines);
      return formatCapture(result);
    }

    case "sync": {
      const dryRun = cmd.args.includes("--dry-run");
      const result = dryRun ? await syncSessions() : await runSessionSync();
      return formatSync(result.created, result.errors);
    }

    case "opencode":
    case "oc": {
      const prompt = cmd.args.join(" ");
      if (prompt) {
        const result = await sendToOpencode(prompt);
        if (!result.ok)
          return formatError(`Failed to send to opencode: ${result.error}`);
        return formatSendKeys("opencode", prompt);
      }
      const result = await launchOpencode();
      return formatOpencode(result.ok, result.error);
    }

    case "help":
    default:
      return formatHelp();
  }
}
