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
} from "../lib/tmux.js";
import {
  listOpencodeSessions,
  getSessionStatus,
  createOCSession,
  promptSession,
  getSessionTodos,
  getSessionDiff,
  abortSession,
} from "../lib/opencode.js";
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
  formatOCSessionList,
  formatOCPromptSent,
  formatOCSessionCreated,
  formatOCTodos,
  formatOCDiff,
  formatOCAborted,
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
      const sub = cmd.args[0]?.toLowerCase();

      try {
        if (!sub || sub === "sessions") {
          const [sessions, statuses] = await Promise.all([
            listOpencodeSessions(),
            getSessionStatus(),
          ]);
          return formatOCSessionList(sessions, statuses);
        }

        if (sub === "ask") {
          const prompt = cmd.args.slice(1).join(" ");
          if (!prompt) return formatError("Usage: `/tmux oc ask <prompt>`");
          const session = await createOCSession();
          const created = formatOCSessionCreated(session);
          await promptSession(session.id, prompt);
          const sent = formatOCPromptSent(session.id, prompt);
          return {
            text: sent.text,
            blocks: [...created.blocks, ...sent.blocks],
          };
        }

        if (sub === "prompt") {
          const idPrefix = cmd.args[1];
          const prompt = cmd.args.slice(2).join(" ");
          if (!idPrefix || !prompt)
            return formatError("Usage: `/tmux oc prompt <session-id> <text>`");
          const sessions = await listOpencodeSessions();
          const match = sessions.find((s) => s.id.startsWith(idPrefix));
          if (!match) return formatError(`No session matching "${idPrefix}"`);
          await promptSession(match.id, prompt);
          return formatOCPromptSent(match.id, prompt);
        }

        if (sub === "status") {
          const [sessions, statuses] = await Promise.all([
            listOpencodeSessions(),
            getSessionStatus(),
          ]);
          return formatOCSessionList(sessions, statuses);
        }

        if (sub === "todos") {
          const idPrefix = cmd.args[1];
          if (!idPrefix)
            return formatError("Usage: `/tmux oc todos <session-id>`");
          const sessions = await listOpencodeSessions();
          const match = sessions.find((s) => s.id.startsWith(idPrefix));
          if (!match) return formatError(`No session matching "${idPrefix}"`);
          const todos = await getSessionTodos(match.id);
          return formatOCTodos(match.id, todos);
        }

        if (sub === "diff") {
          const idPrefix = cmd.args[1];
          if (!idPrefix)
            return formatError("Usage: `/tmux oc diff <session-id>`");
          const sessions = await listOpencodeSessions();
          const match = sessions.find((s) => s.id.startsWith(idPrefix));
          if (!match) return formatError(`No session matching "${idPrefix}"`);
          const diffs = await getSessionDiff(match.id);
          return formatOCDiff(match.id, diffs);
        }

        if (sub === "abort") {
          const idPrefix = cmd.args[1];
          if (!idPrefix)
            return formatError("Usage: `/tmux oc abort <session-id>`");
          const sessions = await listOpencodeSessions();
          const match = sessions.find((s) => s.id.startsWith(idPrefix));
          if (!match) return formatError(`No session matching "${idPrefix}"`);
          await abortSession(match.id);
          return formatOCAborted(match.id);
        }

        if (sub === "launch") {
          const result = await launchOpencode();
          return formatOpencode(result.ok, result.error);
        }

        return formatError(
          `Unknown opencode command: "${sub}". Try: sessions, ask, prompt, status, todos, diff, abort, launch`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
          return formatError(
            "OpenCode server not running. Start with `opencode serve` or use `/tmux oc launch` for terminal mode.",
          );
        }
        return formatError(msg);
      }
    }

    case "help":
    default:
      return formatHelp();
  }
}
