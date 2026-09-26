import { Bot, InlineKeyboard } from "grammy";
import { config } from "./lib/config.js";
import { listWindows, sendKeys, capturePane } from "./lib/tmux.js";
import {
  startStream,
  stopStream,
  stopAllForChat,
  activeStreams,
  getActiveTarget,
} from "./lib/stream.js";
import { canDeleteUserMessages, invalidateCapability } from "./lib/capability.js";
import { registerBridgeCallbacks } from "./bot/callbacks.js";
import { promptBoundSession, registerBridgeCommands } from "./bot/commands.js";
import { createStreamCoordinator } from "./bot/stream-coordinator.js";
import * as api from "./lib/opencode/api.js";
import { subscribeEvents } from "./lib/opencode/events.js";
import { createRouter } from "./lib/router.js";
import { createBindingStore } from "./lib/store/bindings.js";

const bot = new Bot(config.telegram.botToken);

/** Bot's own user id, resolved once at startup (needed for admin checks). */
let botId = 0;

/** Chats already shown the private-mode onboarding notice (once each). */
const onboarded = new Set<number>();

/** Gate every update to the allow-list. Empty list = open (warned at startup). */
bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return;
  if (
    config.telegram.allowedChats.length > 0 &&
    !config.telegram.allowedChats.includes(chatId)
  ) {
    await ctx.reply("⛔ This chat is not authorized.");
    return;
  }
  await next();
});

const store = createBindingStore(config.bindingsPath);
const router = createRouter({ store });
const bridgeDeps = { router, api, store };
registerBridgeCommands(bot, bridgeDeps);
registerBridgeCallbacks(bot, bridgeDeps);

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Best-effort delete; ignores "message can't be deleted" etc. */
async function tryDelete(chatId: number, messageId: number): Promise<void> {
  await bot.api.deleteMessage(chatId, messageId).catch(() => {});
}

/** Send a transient notice that self-deletes after `ms` (default 4s). */
async function flash(chatId: number, text: string, ms = 4000): Promise<void> {
  const m = await bot.api
    .sendMessage(chatId, text, { parse_mode: "HTML" })
    .catch(() => null);
  if (m) setTimeout(() => void tryDelete(chatId, m.message_id), ms);
}

/**
 * Delete a user's input message when allowed (group + admin). In a private
 * chat Telegram forbids this, so we skip the call and (once) explain how to
 * get the clean-mirror experience. Returns true if the message was deleted.
 */
async function deleteUserInput(
  chatId: number,
  chatType: string,
  messageId: number,
): Promise<boolean> {
  const canDelete = await canDeleteUserMessages(bot.api, chatId, chatType, botId);
  if (!canDelete) {
    if (chatType === "private" && !onboarded.has(chatId)) {
      onboarded.add(chatId);
      await flash(
        chatId,
        "ℹ Telegram won't let bots delete your messages in a 1:1 chat, so your input lines stay visible. For a clean terminal mirror, make a private <b>group</b>, add this bot, and grant it <b>Delete messages</b> admin rights.",
        12000,
      );
    }
    return false;
  }
  try {
    await bot.api.deleteMessage(chatId, messageId);
    return true;
  } catch {
    invalidateCapability(chatId); // lost admin rights? re-check next time
    return false;
  }
}

/** Build the window-list keyboard (each window → start a stream). */
async function windowsKeyboard(activeTarget?: string): Promise<InlineKeyboard | null> {
  const wins = await listWindows();
  if (wins.length === 0) return null;
  wins.sort((a, b) =>
    a.session === b.session
      ? a.index - b.index
      : a.session.localeCompare(b.session),
  );
  const kb = new InlineKeyboard();
  for (const w of wins) {
    const mark = w.target === activeTarget ? "✓ " : w.active ? "● " : "○ ";
    kb.text(`${mark}${w.target}  ·  ${w.name}`, `st:${w.target}`).row();
  }
  return kb;
}

async function showWindows(chatId: number): Promise<number | null> {
  const active = getActiveTarget(chatId);
  const kb = await windowsKeyboard(active);
  if (!kb) {
    const m = await bot.api.sendMessage(chatId, "No tmux windows found.");
    return m.message_id;
  }
  const hint = active
    ? `streaming <b>${escapeHtml(active)}</b> — type to send keystrokes there`
    : "tap a window to stream · then just type to send keystrokes";
  const m = await bot.api.sendMessage(chatId, `🖥 <b>tmux windows</b>\n<i>${hint}</i>`, {
parse_mode: "HTML",
reply_markup: kb,
  });
  return m.message_id;
}

// ── /menu /start /help → the window list (everything else is buttons) ──
bot.command(["start", "menu", "help", "windows"], async (ctx) => {
  await deleteUserInput(ctx.chat.id, ctx.chat.type, ctx.message!.message_id);
  await showWindows(ctx.chat.id);
});

// ── Tap a window → start streaming it; remove the picker so only the stream stays ──
bot.callbackQuery(/^st:(.+)$/, async (ctx) => {
  const target = ctx.match![1];
  const chatId = ctx.chat!.id;
  const res = await startStream(bot, chatId, target);
  await ctx.answerCallbackQuery(res.ok ? `▶ ${target}` : `Failed: ${res.error}`);
  if (res.ok && ctx.callbackQuery.message) {
    await tryDelete(chatId, ctx.callbackQuery.message.message_id);
  }
});

// ── Stop streaming the active window ──
bot.command("stop", async (ctx) => {
const chatId = ctx.chat.id;
  await deleteUserInput(chatId, ctx.chat.type, ctx.message!.message_id);
  const target = ctx.match.trim() || getActiveTarget(chatId);
  if (!target) return void flash(chatId, "No active stream.");
  const ok = stopStream(chatId, target);
  await flash(chatId, ok ? `⏹ stopped ${escapeHtml(target)}` : `No stream for ${escapeHtml(target)}`);
});

// ── Windows button: re-show the picker ──
bot.callbackQuery("wins", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showWindows(ctx.chat!.id);
});

// ── Plain text → typed into the active window (no /send needed) ──
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const chatId = ctx.chat.id;
  const msgId = ctx.message.message_id;
  if (text.startsWith("/")) return; // unknown command; ignore

  const threadId = ctx.message.message_thread_id ?? null;
  const promptResult = await promptBoundSession(bridgeDeps, chatId, threadId, text);
  if (promptResult.ok) return;
  if (promptResult.reason === "error") {
    await flash(chatId, `⚠ opencode: ${promptResult.error}`);
    return;
  }

  const target = getActiveTarget(chatId);
  if (!target) {
    await deleteUserInput(chatId, ctx.chat.type, msgId);
    await showWindows(chatId);
    return;
  }

  const res = await sendKeys(target, text);
  // Delete the user's input so the chat stays a clean mirror (group+admin only).
  await deleteUserInput(chatId, ctx.chat.type, msgId);
  if (!res.ok) await flash(chatId, `⚠ ${escapeHtml(res.error ?? "send failed")}`);
});

// ── Utility commands (input message is deleted; replies self-expire) ──
bot.command("stopall", async (ctx) => {
  await deleteUserInput(ctx.chat.id, ctx.chat.type, ctx.message!.message_id);
  const n = stopAllForChat(ctx.chat.id);
  await flash(ctx.chat.id, `⏹ stopped ${n} stream(s)`);
});

bot.command("streams", async (ctx) => {
  await deleteUserInput(ctx.chat.id, ctx.chat.type, ctx.message!.message_id);
  const t = activeStreams(ctx.chat.id);
  await flash(
    ctx.chat.id,
    t.length ? `Active:\n${t.map(escapeHtml).join("\n")}` : "No active streams.",
    6000,
  );
});

bot.command("cap", async (ctx) => {
  await deleteUserInput(ctx.chat.id, ctx.chat.type, ctx.message!.message_id);
  const target = ctx.match.trim() || getActiveTarget(ctx.chat.id);
  if (!target) return void flash(ctx.chat.id, "No active window. /menu first.");
  const cap = await capturePane(target);
  const body = cap.content.slice(-config.stream.maxChars) || "(empty)";
  await ctx.reply(`<pre>${escapeHtml(body)}</pre>`, { parse_mode: "HTML" });
});

bot.catch((err) => console.error("[grammy]", err.error));

/** Register the BotFather command menu so the ☰ button lists commands. */
async function registerCommands(): Promise<void> {
  await bot.api.setMyCommands([
    { command: "menu", description: "Show tmux windows" },
    { command: "streams", description: "List active streams" },
    { command: "stopall", description: "Stop all streams" },
    { command: "cap", description: "One-shot capture of active window" },
    { command: "sessions", description: "Bind a tmux session" },
    { command: "use", description: "Bind by name" },
    { command: "new", description: "Fresh opencode session" },
    { command: "status", description: "Binding status" },
    { command: "abort", description: "Interrupt opencode" },
  ]);
}

if (config.telegram.allowedChats.length === 0) {
  console.warn(
    "[warn] TELEGRAM_ALLOWED_CHATS is empty — ANY chat can control tmux. Set it.",
  );
}

console.log("[bot] starting tmux-telegram bridge…");
const coordinator = createStreamCoordinator({
  store,
  subscribeEvents,
  api: bot.api,
  config,
});
coordinator.start();

let shuttingDown = false;
const shutdown = async (): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;
  const forceExit = setTimeout(() => process.exit(1), 5000);
  await coordinator.stop();
  bot.stop();
  clearTimeout(forceExit);
  process.exit(0);
};
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

bot.start({
onStart: async (info) => {
botId = info.id;
await registerCommands().catch(() => {});
    console.log(`[bot] @${info.username} (id=${botId}) running`);
    // Zero-friction: proactively push the window picker to every allowed chat
    // so the user never has to type /menu.
    for (const chatId of config.telegram.allowedChats) {
      const mid =
      await showWindows(chatId).catch((e) => {
        console.error(`[startup] push to ${chatId} failed:`, e);
        return null;
      }
      );
      console.log(`[startup] pushed window picker to ${chatId
    } (message_id=${mid})`);
    }
},
});
