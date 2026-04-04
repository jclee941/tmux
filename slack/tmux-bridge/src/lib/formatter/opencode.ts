import type { FileDiff, Session, SessionStatus, Todo } from "@opencode-ai/sdk";
import { type Block, header, section } from "./blocks.js";
import { timeAgo } from "./time.js";
export function formatOpencode(ok: boolean, error?: string): { text: string; blocks: Block[] } {
  if (ok) {
    return {
      text: "opencode session active",
      blocks: [section("🤖 *opencode* session is active")],
    };
  }
  return {
    text: "opencode launch failed",
    blocks: [section(`❌ opencode launch failed: ${error}`)],
  };
}
export function formatOCSessionList(
  sessions: Session[],
  statuses: Record<string, SessionStatus>,
): { text: string; blocks: Block[] } {
  if (sessions.length === 0) {
    return {
      text: "No opencode sessions.",
      blocks: [header("🤖 opencode sessions"), section("No sessions found.")],
    };
  }

  const sorted = [...sessions].sort((a, b) => b.time.updated - a.time.updated);
  const lines = sorted.map((session) => {
    const status = statuses[session.id];
    const icon =
      status?.type === "busy" ? "🟡" : status?.type === "retry" ? "🔴" : "🟢";
    const statusLabel =
      status?.type === "retry"
        ? `retry #${status.attempt}: ${status.message}`
        : (status?.type ?? "idle");
    return `${icon} *${session.title || "untitled"}* · \`${session.id.slice(0, 8)}\` · ${statusLabel} · ${timeAgo(session.time.updated)}`;
  });

  return {
    text: `${sessions.length} opencode sessions`,
    blocks: [
      header(`🤖 opencode sessions (${sessions.length})`),
      section(lines.join("\n")),
    ],
  };
}
export function formatOCPromptSent(
  sessionId: string,
  text: string,
): { text: string; blocks: Block[] } {
  const preview = text.length > 160 ? `${text.slice(0, 160)}...` : text;
  return {
    text: `Prompt sent to ${sessionId.slice(0, 8)}`,
    blocks: [
      section(`✅ Prompt sent to *${sessionId.slice(0, 8)}*`),
      section(`> ${preview}`),
    ],
  };
}
export function formatOCSessionCreated(session: Session): { text: string; blocks: Block[] } {
  return {
    text: `Created opencode session ${session.id.slice(0, 8)}`,
    blocks: [
      section(
        `🆕 Created opencode session *${session.title || "untitled"}* (\`${session.id.slice(0, 8)}\`)`,
      ),
    ],
  };
}
export function formatOCTodos(
  sessionId: string,
  todos: Todo[],
): { text: string; blocks: Block[] } {
  if (todos.length === 0) {
    return {
      text: `No todos for ${sessionId.slice(0, 8)}`,
      blocks: [section(`📝 No todos for *${sessionId.slice(0, 8)}*`)],
    };
  }

  const lines = todos.map((todo) => {
    const icon =
      todo.status === "completed"
        ? "✅"
        : todo.status === "in_progress"
          ? "🔄"
          : "⬜";
    return `${icon} ${todo.content} _(priority: ${todo.priority})_`;
  });

  return {
    text: `${todos.length} todos for ${sessionId.slice(0, 8)}`,
    blocks: [
      header(`📝 todos (${sessionId.slice(0, 8)})`),
      section(lines.join("\n")),
    ],
  };
}
export function formatOCDiff(
  sessionId: string,
  diffs: FileDiff[],
): { text: string; blocks: Block[] } {
  if (diffs.length === 0) {
    return {
      text: `No file changes for ${sessionId.slice(0, 8)}`,
      blocks: [section(`📂 No file diffs for *${sessionId.slice(0, 8)}*`)],
    };
  }

  const lines = diffs.map(
    (diff) => `• \`${diff.file}\`  +${diff.additions} / -${diff.deletions}`,
  );

  return {
    text: `${diffs.length} diffs for ${sessionId.slice(0, 8)}`,
    blocks: [
      header(`📂 diff (${sessionId.slice(0, 8)})`),
      section(lines.join("\n")),
    ],
  };
}
export function formatOCAborted(sessionId: string): { text: string; blocks: Block[] } {
  return {
    text: `Aborted ${sessionId.slice(0, 8)}`,
    blocks: [section(`🛑 Aborted session *${sessionId.slice(0, 8)}*`)],
  };
}
export function formatIdleNotification(sessionId: string): { text: string; blocks: Block[] } {
  const short = sessionId.slice(0, 8);
  return {
    text: `opencode session ${short} is now idle`,
    blocks: [
      section(`💤 opencode session *${short}* is now idle — work complete`),
    ],
  };
}
