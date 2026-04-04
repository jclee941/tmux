import type { ParsedCommand } from "../../types.js";
import { launchOpencode } from "../../lib/tmux.js";
import {
  listOpencodeSessions,
  getSessionStatus,
  createOCSession,
  promptSession,
  getSessionTodos,
  getSessionDiff,
  abortSession,
} from "../../lib/opencode.js";
import {
  formatOpencode,
  formatError,
  formatOCSessionList,
  formatOCPromptSent,
  formatOCSessionCreated,
  formatOCTodos,
  formatOCDiff,
  formatOCAborted,
} from "../../lib/formatter/index.js";

type SlackResponse = { text: string; blocks: Record<string, unknown>[] };

export async function handleOpencodeCommand(
  cmd: ParsedCommand,
): Promise<SlackResponse> {
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
      if (!idPrefix) return formatError("Usage: `/tmux oc todos <session-id>`");
      const sessions = await listOpencodeSessions();
      const match = sessions.find((s) => s.id.startsWith(idPrefix));
      if (!match) return formatError(`No session matching "${idPrefix}"`);
      const todos = await getSessionTodos(match.id);
      return formatOCTodos(match.id, todos);
    }

    if (sub === "diff") {
      const idPrefix = cmd.args[1];
      if (!idPrefix) return formatError("Usage: `/tmux oc diff <session-id>`");
      const sessions = await listOpencodeSessions();
      const match = sessions.find((s) => s.id.startsWith(idPrefix));
      if (!match) return formatError(`No session matching "${idPrefix}"`);
      const diffs = await getSessionDiff(match.id);
      return formatOCDiff(match.id, diffs);
    }

    if (sub === "abort") {
      const idPrefix = cmd.args[1];
      if (!idPrefix) return formatError("Usage: `/tmux oc abort <session-id>`");
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
