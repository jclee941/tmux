import type { TmuxSession } from "../../types.js";
import {
  type Block,
  actionsBlock,
  buttonEl,
  divider,
  header,
  section,
} from "./blocks.js";
import { timeAgo } from "./time.js";
import { ActionId } from "../../types.js";

export function formatSessionList(sessions: TmuxSession[]): {
  text: string;
  blocks: Block[];
} {
  if (sessions.length === 0) {
    return {
      text: "No active tmux sessions.",
      blocks: [header("📋 tmux sessions"), section("No active sessions.")],
    };
  }

  const lines = sessions.map((s) => {
    const status = s.attached ? "🟢" : "⚪";
    const activity = timeAgo(s.activity);
    return `${status} *${s.name}* — ${s.windows} win · ${activity} · \`${s.path}\``;
  });

  return {
    text: `${sessions.length} active tmux sessions`,
    blocks: [
      header(`📋 tmux sessions (${sessions.length})`),
      section(lines.join("\n")),
    ],
  };
}

export function formatSessionDashboard(sessions: TmuxSession[]): {
  text: string;
  blocks: Block[];
} {
  const blocks: Block[] = [header(`📋 tmux sessions (${sessions.length})`)];

  if (sessions.length === 0) {
    blocks.push(section("No active sessions."));
  } else {
    for (const s of sessions) {
      const status = s.attached ? "🟢" : "⚪";
      const activity = timeAgo(s.activity);
      blocks.push(
        section(
          `${status} *${s.name}* — ${s.windows} win · ${activity} · \`${s.path}\``,
        ),
      );
      blocks.push(
        actionsBlock([
          buttonEl("📸 Capture", ActionId.SESSION_CAPTURE, s.name),
          buttonEl("⌨️ Send", ActionId.SESSION_SEND_KEYS, s.name),
          buttonEl("✏️ Rename", ActionId.SESSION_RENAME, s.name),
          buttonEl("🗑️ Kill", ActionId.SESSION_KILL, s.name, "danger"),
        ]),
      );
    }
  }

  blocks.push(divider());
  blocks.push(
    actionsBlock([
      buttonEl("🆕 New", ActionId.SESSION_NEW, "_", "primary"),
      buttonEl("🔄 Sync", ActionId.SESSION_SYNC),
      buttonEl("🤖 Opencode", ActionId.SESSION_OPENCODE),
      buttonEl("🔃 Refresh", ActionId.SESSION_LIST),
    ]),
  );

  return { text: `${sessions.length} active tmux sessions`, blocks };
}

export function formatCreated(
  name: string,
  path?: string,
): {
  text: string;
  blocks: Block[];
} {
  const detail = path ? ` at \`${path}\`` : "";
  return {
    text: `Session "${name}" created${detail}`,
    blocks: [section(`✅ Session *${name}* created${detail}`)],
  };
}

export function formatKilled(name: string): { text: string; blocks: Block[] } {
  return {
    text: `Session "${name}" killed`,
    blocks: [section(`🗑️ Session *${name}* killed`)],
  };
}

export function formatRenamed(
  oldName: string,
  newName: string,
): { text: string; blocks: Block[] } {
  return {
    text: `Session "${oldName}" → "${newName}"`,
    blocks: [section(`✏️ *${oldName}* → *${newName}*`)],
  };
}
