import type { ParsedCommand } from "../../types.js";
import {
  listSessions,
  createSession,
  killSession,
  renameSession,
} from "../../lib/tmux.js";
import {
  formatSessionDashboard,
  formatCreated,
  formatKilled,
  formatRenamed,
  formatError,
} from "../../lib/formatter/index.js";

type SlackResponse = { text: string; blocks: Record<string, unknown>[] };

export async function handleSessionCommand(
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
  }

  return formatError(`Unsupported session command: ${cmd.subcommand}`);
}
