import type { InlineKeyboardMarkup } from "grammy/types";
import { logger } from "../lib/logger.js";
import type { PermissionReply } from "../lib/opencode/api.js";
import type { BridgeBot, BridgeCallbackContext, BridgeDeps } from "./deps.js";

/** Payload of a session picker button: `bind:<tmux session name>`. */
export const BIND_PATTERN = /^bind:(.+)$/;

/** Payload of a permission prompt button: `permission:<reply>:<request id>`. */
export const PERMISSION_PATTERN = /^permission:(once|always|reject):(.+)$/;

/** Shown when the request a button refers to can no longer be answered. */
export const ALREADY_HANDLED = "This request is no longer pending.";

/** Passed to an edit to retire the buttons of a message that was acted on. */
const NO_KEYBOARD: InlineKeyboardMarkup = { inline_keyboard: [] };

function permissionReplyOf(value: string | undefined): PermissionReply | null {
  switch (value) {
    case "once":
    case "always":
    case "reject":
      return value;
    default:
      return null;
  }
}

function threadOf(ctx: BridgeCallbackContext): number | null {
  return ctx.callbackQuery.message?.message_thread_id ?? null;
}

/**
 * Register the bridge's inline button handlers on the existing bot.
 *
 * Payloads are re-parsed from `callbackQuery.data` with the very regex used to
 * register the handler, so the trigger and the parse can never drift apart.
 */
export function registerBridgeCallbacks(bot: BridgeBot, deps: BridgeDeps): void {
  const { router, api } = deps;

  bot.callbackQuery(BIND_PATTERN, async (ctx) => {
    const chatId = ctx.chat?.id;
    const sessionName = BIND_PATTERN.exec(ctx.callbackQuery.data ?? "")?.[1];
    if (chatId === undefined || sessionName === undefined) {
      await ctx.answerCallbackQuery();
      return;
    }

    const result = await router.bind(chatId, threadOf(ctx), sessionName);
    if (!result.ok) {
      await ctx.answerCallbackQuery(`Cannot bind: ${result.error}`);
      return;
    }

    await ctx.answerCallbackQuery(`Bound to ${result.binding.tmuxSession}`);
    if (ctx.callbackQuery.message === undefined) return;
    await ctx.editMessageText(
      `Bound to ${result.binding.tmuxSession} — ${result.binding.directory}`,
      { reply_markup: NO_KEYBOARD },
    );
  });

  bot.callbackQuery(PERMISSION_PATTERN, async (ctx) => {
    const chatId = ctx.chat?.id;
    const match = PERMISSION_PATTERN.exec(ctx.callbackQuery.data ?? "");
    const reply = permissionReplyOf(match?.[1]);
    const requestId = match?.[2];
    if (chatId === undefined || reply === null || requestId === undefined) {
      await ctx.answerCallbackQuery();
      return;
    }

    const route = router.resolveRoute(chatId, threadOf(ctx));
    if (route === null) {
      await ctx.answerCallbackQuery(ALREADY_HANDLED);
      return;
    }

    try {
      await api.permissionReply(requestId, route.directory, reply);
    } catch (error) {
      // opencode rejects a request that already expired or was answered
      // elsewhere; the button is dead either way, so say so instead of failing.
      logger.warn(`permission reply ${requestId} rejected`, error);
      await ctx.answerCallbackQuery(ALREADY_HANDLED);
      return;
    }

    await ctx.answerCallbackQuery(`Permission: ${reply}`);
    if (ctx.callbackQuery.message === undefined) return;
    await ctx.editMessageText(`Permission answered: ${reply}`, {
      reply_markup: NO_KEYBOARD,
    });
  });
}
