import type { InlineKeyboardMarkup } from "grammy/types";
import type { PermissionReply } from "../lib/opencode/api.js";
import type { Router } from "../lib/router.js";
import type { BindingStore } from "../lib/store/bindings.js";

/**
 * Ports the bridge bot layer talks through.
 *
 * Every type here is the narrowest shape the handlers actually read, so tests
 * build plain objects instead of grammY updates. The real `Bot`, the real
 * `src/lib/opencode/api.js` module, and real contexts satisfy them
 * structurally - `src/__tests__/bot/commands.test.ts` proves that at compile
 * time.
 */

export interface BridgeReplyOptions {
  readonly reply_markup?: InlineKeyboardMarkup;
}

export interface BridgeEditOptions {
  readonly reply_markup?: InlineKeyboardMarkup;
}

/** What a bridge command reads off an incoming command update. */
export interface BridgeCommandContext {
  readonly chat: { readonly id: number };
  /** Absent for channel posts; its topic id is the conversation's thread. */
  readonly message?: { readonly message_thread_id?: number };
  /** Everything after the command word, as grammY parses it. */
  readonly match: string;
  reply(text: string, other?: BridgeReplyOptions): Promise<unknown>;
}

/** What a bridge callback reads off an incoming callback query. */
export interface BridgeCallbackContext {
  /** Absent for callbacks on inline messages, which route nowhere. */
  readonly chat?: { readonly id: number };
  readonly callbackQuery: {
    readonly data?: string;
    /** Absent once the originating message is gone; then no edit is possible. */
    readonly message?: {
      readonly message_id: number;
      readonly message_thread_id?: number;
    };
  };
  answerCallbackQuery(text?: string): Promise<unknown>;
  editMessageText(text: string, other?: BridgeEditOptions): Promise<unknown>;
}

export type BridgeCommandHandler = (ctx: BridgeCommandContext) => Promise<void>;
export type BridgeCallbackHandler = (ctx: BridgeCallbackContext) => Promise<void>;

/** The registration surface of the existing bot; never a bot the layer owns. */
export interface BridgeBot {
  command(command: string | string[], ...middleware: BridgeCommandHandler[]): unknown;
  callbackQuery(trigger: RegExp, ...middleware: BridgeCallbackHandler[]): unknown;
}

/** The opencode calls the bridge layer makes, satisfied by `lib/opencode/api`. */
export interface BridgeApi {
  createSession(directory: string, title?: string): Promise<{ readonly id: string }>;
  prompt(directory: string, sessionId: string, text: string): Promise<unknown>;
  abort(sessionId: string): Promise<unknown>;
  sessionStatus(): Promise<unknown>;
  permissionReply(
    requestID: string,
    directory: string,
    reply: PermissionReply,
  ): Promise<unknown>;
}

export interface BridgeDeps {
  readonly router: Router;
  readonly api: BridgeApi;
  readonly store: BindingStore;
}
