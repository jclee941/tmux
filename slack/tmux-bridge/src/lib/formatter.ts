import type { TmuxSession, CaptureResult, NotifyEvent } from "../types.js";
import { ActionId, CallbackId } from "../types.js";

type Block = Record<string, unknown>;

function section(text: string): Block {
  return { type: "section", text: { type: "mrkdwn", text } };
}

function divider(): Block {
  return { type: "divider" };
}

function header(text: string): Block {
  return { type: "header", text: { type: "plain_text", text, emoji: true } };
}

function codeBlock(code: string): Block {
  return section(`\`\`\`\n${code}\n\`\`\``);
}

function timeAgo(epoch: number): string {
  const diff = Math.floor(Date.now() / 1000) - epoch;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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

export function formatOpencode(
  ok: boolean,
  error?: string,
): {
  text: string;
  blocks: Block[];
} {
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

export function formatError(message: string): {
  text: string;
  blocks: Block[];
} {
  return {
    text: `Error: ${message}`,
    blocks: [section(`❌ ${message}`)],
  };
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
    "*opencode:*",
    "• `/tmux opencode` (oc) — Launch/attach opencode session",
    "• `/tmux send opencode <prompt>` — Send text to opencode",
    "",
    "*Other:*",
    "• `/tmux help` — This message",
  ];

  return {
    text: "tmux Slack bridge help",
    blocks: [header("🛟 /tmux help"), section(usage.join("\n"))],
  };
}


// ── Interactive helpers ──────────────────────────────────────

function buttonEl(
  text: string,
  actionId: string,
  value?: string,
  style?: "primary" | "danger",
): Block {
  const btn: Block = {
    type: "button",
    text: { type: "plain_text", text, emoji: true },
    action_id: actionId,
  };
  if (value !== undefined) btn.value = value;
  if (style) btn.style = style;
  return btn;
}

function actionsBlock(elements: Block[]): Block {
  return { type: "actions", elements };
}

export function backToListBlock(): Block {
  return actionsBlock([buttonEl("← Sessions", ActionId.BACK_TO_LIST)]);
}

// ── Session dashboard (interactive) ─────────────────────────

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

// ── Action result (with back button) ────────────────────────

export function formatActionResult(
  emoji: string,
  message: string,
): { text: string; blocks: Block[] } {
  return {
    text: message.replace(/\*/g, ""),
    blocks: [section(`${emoji} ${message}`), backToListBlock()],
  };
}

// ── Modal builders ──────────────────────────────────────────

export function buildSendKeysModal(
  sessionName: string,
  meta: string,
): Record<string, unknown> {
  return {
    type: "modal",
    callback_id: CallbackId.SEND_KEYS,
    private_metadata: meta,
    title: { type: "plain_text", text: "⌨️ Send Keys" },
    submit: { type: "plain_text", text: "Send" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      section(`Session: *${sessionName}*`),
      {
        type: "input",
        block_id: "cmd_block",
        label: { type: "plain_text", text: "Command" },
        element: {
          type: "plain_text_input",
          action_id: "cmd_input",
          placeholder: { type: "plain_text", text: "e.g. ls -la" },
        },
      },
    ],
  };
}

export function buildRenameModal(
  sessionName: string,
  meta: string,
): Record<string, unknown> {
  return {
    type: "modal",
    callback_id: CallbackId.RENAME,
    private_metadata: meta,
    title: { type: "plain_text", text: "✏️ Rename" },
    submit: { type: "plain_text", text: "Rename" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      section(`Current: *${sessionName}*`),
      {
        type: "input",
        block_id: "name_block",
        label: { type: "plain_text", text: "New name" },
        element: {
          type: "plain_text_input",
          action_id: "name_input",
          placeholder: { type: "plain_text", text: "Enter new session name" },
        },
      },
    ],
  };
}

export function buildNewSessionModal(
  meta: string,
): Record<string, unknown> {
  return {
    type: "modal",
    callback_id: CallbackId.NEW_SESSION,
    private_metadata: meta,
    title: { type: "plain_text", text: "🆕 New Session" },
    submit: { type: "plain_text", text: "Create" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "name_block",
        label: { type: "plain_text", text: "Session name" },
        element: {
          type: "plain_text_input",
          action_id: "name_input",
          placeholder: { type: "plain_text", text: "e.g. my-project" },
        },
      },
      {
        type: "input",
        block_id: "path_block",
        optional: true,
        label: { type: "plain_text", text: "Start directory" },
        element: {
          type: "plain_text_input",
          action_id: "path_input",
          placeholder: { type: "plain_text", text: "e.g. ~/dev/my-project" },
        },
      },
    ],
  };
}