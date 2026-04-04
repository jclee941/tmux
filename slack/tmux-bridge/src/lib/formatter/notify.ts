import type { NotifyEvent } from "../../types.js";
import { type Block, divider, header, section } from "./blocks.js";

export function formatSync(
  created: string[],
  errors: string[],
): { text: string; blocks: Block[] } {
  const blocks: Block[] = [header("🔄 Session sync")];

  if (created.length > 0) {
    blocks.push(section(`Created: ${created.map((c) => `*${c}*`).join(", ")}`));
  } else {
    blocks.push(section("All sessions already in sync."));
  }

  if (errors.length > 0) {
    blocks.push(divider());
    blocks.push(section(`⚠️ Errors:\n${errors.join("\n")}`));
  }

  return { text: `Synced ${created.length} sessions`, blocks };
}

export function formatNotifyEvent(ev: NotifyEvent): {
  text: string;
  blocks: Block[];
} {
  const icons: Record<NotifyEvent["event"], string> = {
    "session-created": "🆕",
    "session-closed": "🔴",
    "session-renamed": "🔀",
    "client-attached": "🔗",
    "client-detached": "⛓️‍💥",
    "opencode-idle": "💤",
  };

  const icon = icons[ev.event] ?? "ℹ️";
  const label = ev.event.replace(/-/g, " ");

  return {
    text: `${label}: ${ev.session}`,
    blocks: [
      section(
        `${icon} *${label}* — \`${ev.session}\`${ev.details ? ` · ${ev.details}` : ""}`,
      ),
    ],
  };
}

export function formatError(message: string): {
  text: string;
  blocks: Block[];
} {
  return {
    text: `Error: ${message}`,
    blocks: [section(`❌ ${message}`)],
  };
}

export function formatHelp(): { text: string; blocks: Block[] } {
  const usage = [
    "*Session management:*",
    "• `/tmux list` (ls) — List all sessions",
    "• `/tmux new <name> [path]` (create) — Create session",
    "• `/tmux kill <name>` (rm) — Kill session",
    "• `/tmux rename <old> <new>` (mv) — Rename session",
    "• `/tmux sync` — Sync sessions from ~/dev",
    "",
    "*Interaction:*",
    "• `/tmux send <session> <command>` (type) — Send keys to session",
    "• `/tmux capture <session> [lines]` (cap) — Capture pane output",
    "",
    "*opencode (SDK):*",
    "• `/tmux oc` — List opencode sessions with status",
    "• `/tmux oc ask <prompt>` — New session + send prompt",
    "• `/tmux oc prompt <id> <text>` — Prompt existing session",
    "• `/tmux oc status` — Session statuses (idle/busy)",
    "• `/tmux oc todos <id>` — Show session todos",
    "• `/tmux oc diff <id>` — Show file changes",
    "• `/tmux oc abort <id>` — Abort busy session",
    "• `/tmux oc launch` — Launch opencode in tmux (legacy)",
    "",
    "*Other:*",
    "• `/tmux help` — This message",
  ];

  return {
    text: "tmux Slack bridge help",
    blocks: [header("🛟 /tmux help"), section(usage.join("\n"))],
  };
}
