import { vi } from "vitest";
import type { Mock } from "vitest";
import type { InlineKeyboardMarkup } from "grammy/types";
import type { Router } from "../../lib/router.js";
import type { Binding, BindingStore } from "../../lib/store/bindings.js";
import type {
  BridgeApi,
  BridgeBot,
  BridgeCallbackContext,
  BridgeCallbackHandler,
  BridgeCommandContext,
  BridgeCommandHandler,
  BridgeDeps,
  BridgeEditOptions,
  BridgeReplyOptions,
} from "../../bot/deps.js";

export const CHAT_ID = 100;
export const DIRECTORY = "/home/jclee/dev/safework";
export const OTHER_DIRECTORY = "/home/jclee/dev/blacklist";

const EPOCH = "2026-01-01T00:00:00.000Z";

/** A stored binding with test-friendly defaults; override only what matters. */
export function binding(overrides: Partial<Binding> = {}): Binding {
  return {
    chatId: CHAT_ID,
    threadId: null,
    tmuxSession: "safework",
    directory: DIRECTORY,
    opencodeSessionId: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

// ── bot registrar ────────────────────────────────────────────────────────────

/** Captures registrations instead of wiring a real grammY bot. */
export interface FakeBot extends BridgeBot {
  readonly command: Mock<BridgeBot["command"]>;
  readonly callbackQuery: Mock<BridgeBot["callbackQuery"]>;
  /** Handler registered for `/name`; throws when it was never registered. */
  commandHandler(name: string): BridgeCommandHandler;
  /** Handler registered for a callback trigger, looked up by regex source. */
  callbackHandler(trigger: RegExp): BridgeCallbackHandler;
  registeredCommands(): readonly string[];
  registeredCallbacks(): readonly string[];
}

function firstHandler<H>(handlers: readonly H[], label: string): H {
  const handler = handlers[0];
  if (handler === undefined) throw new Error(`no handler passed for ${label}`);
  return handler;
}

export function createFakeBot(): FakeBot {
  const commands = new Map<string, BridgeCommandHandler>();
  const callbacks = new Map<string, BridgeCallbackHandler>();

  const command = vi.fn<BridgeBot["command"]>((trigger, ...handlers) => {
    const handler = firstHandler(handlers, String(trigger));
    for (const name of Array.isArray(trigger) ? trigger : [trigger]) {
      commands.set(name, handler);
    }
  });

  const callbackQuery = vi.fn<BridgeBot["callbackQuery"]>((trigger, ...handlers) => {
    callbacks.set(trigger.source, firstHandler(handlers, trigger.source));
  });

  return {
    command,
    callbackQuery,
    commandHandler: (name) => {
      const handler = commands.get(name);
      if (handler === undefined) throw new Error(`command not registered: ${name}`);
      return handler;
    },
    callbackHandler: (trigger) => {
      const handler = callbacks.get(trigger.source);
      if (handler === undefined) {
        throw new Error(`callback not registered: ${trigger.source}`);
      }
      return handler;
    },
    registeredCommands: () => [...commands.keys()],
    registeredCallbacks: () => [...callbacks.keys()],
  };
}

// ── contexts ─────────────────────────────────────────────────────────────────

export interface ReplyRecord {
  readonly text: string;
  readonly options: BridgeReplyOptions | undefined;
}

export interface EditRecord {
  readonly text: string;
  readonly options: BridgeEditOptions | undefined;
}

export interface CommandInvocation {
  readonly ctx: BridgeCommandContext;
  readonly replies: readonly ReplyRecord[];
}

export interface CommandCtxInput {
  readonly chatId?: number;
  readonly threadId?: number | null;
  /** The command argument string grammY exposes as `ctx.match`. */
  readonly match?: string;
}

export function commandCtx(input: CommandCtxInput = {}): CommandInvocation {
  const replies: ReplyRecord[] = [];
  const threadId = input.threadId ?? null;
  const ctx: BridgeCommandContext = {
    chat: { id: input.chatId ?? CHAT_ID },
    message: threadId === null ? {} : { message_thread_id: threadId },
    match: input.match ?? "",
    reply: async (text, options) => {
      replies.push({ text, options });
    },
  };
  return { ctx, replies };
}

export interface CallbackInvocation {
  readonly ctx: BridgeCallbackContext;
  readonly answers: readonly (string | undefined)[];
  readonly edits: readonly EditRecord[];
}

export interface CallbackCtxInput {
  readonly data: string;
  /** null models an inline-message callback that carries no chat. */
  readonly chatId?: number | null;
  readonly threadId?: number | null;
  /** null models a callback whose originating message is gone. */
  readonly messageId?: number | null;
}

export function callbackCtx(input: CallbackCtxInput): CallbackInvocation {
  const answers: (string | undefined)[] = [];
  const edits: EditRecord[] = [];
  const chatId = input.chatId === undefined ? CHAT_ID : input.chatId;
  const messageId = input.messageId === undefined ? 555 : input.messageId;
  const threadId = input.threadId ?? null;
  const ctx: BridgeCallbackContext = {
    ...(chatId === null ? {} : { chat: { id: chatId } }),
    callbackQuery: {
      data: input.data,
      ...(messageId === null
        ? {}
        : {
            message: {
              message_id: messageId,
              ...(threadId === null ? {} : { message_thread_id: threadId }),
            },
          }),
    },
    answerCallbackQuery: async (text) => {
      answers.push(text);
    },
    editMessageText: async (text, options) => {
      edits.push({ text, options });
    },
  };
  return { ctx, answers, edits };
}

// ── dependency mocks ─────────────────────────────────────────────────────────

export interface RouterMock extends Router {
  readonly resolveRoute: Mock<Router["resolveRoute"]>;
  readonly discoverSessions: Mock<Router["discoverSessions"]>;
  readonly bind: Mock<Router["bind"]>;
  readonly unbind: Mock<Router["unbind"]>;
  readonly isStale: Mock<Router["isStale"]>;
  readonly listBindings: Mock<Router["listBindings"]>;
}

export interface StoreMock extends BindingStore {
  readonly list: Mock<BindingStore["list"]>;
  readonly getByChat: Mock<BindingStore["getByChat"]>;
  readonly getByOpencodeSession: Mock<BindingStore["getByOpencodeSession"]>;
  readonly upsert: Mock<BindingStore["upsert"]>;
  readonly setOpencodeSession: Mock<BindingStore["setOpencodeSession"]>;
  readonly remove: Mock<BindingStore["remove"]>;
}

export interface ApiMock extends BridgeApi {
  readonly createSession: Mock<BridgeApi["createSession"]>;
  readonly prompt: Mock<BridgeApi["prompt"]>;
  readonly abort: Mock<BridgeApi["abort"]>;
  readonly sessionStatus: Mock<BridgeApi["sessionStatus"]>;
  readonly permissionReply: Mock<BridgeApi["permissionReply"]>;
}

export interface FakeDeps extends BridgeDeps {
  readonly router: RouterMock;
  readonly store: StoreMock;
  readonly api: ApiMock;
}

export function createFakeDeps(): FakeDeps {
  return {
    router: {
      resolveRoute: vi.fn<Router["resolveRoute"]>(() => null),
      discoverSessions: vi.fn<Router["discoverSessions"]>(async () => []),
      bind: vi.fn<Router["bind"]>(async () => ({ ok: true, binding: binding() })),
      unbind: vi.fn<Router["unbind"]>(() => false),
      isStale: vi.fn<Router["isStale"]>(async () => false),
      listBindings: vi.fn<Router["listBindings"]>(() => []),
    },
    store: {
      list: vi.fn<BindingStore["list"]>(() => []),
      getByChat: vi.fn<BindingStore["getByChat"]>(() => null),
      getByOpencodeSession: vi.fn<BindingStore["getByOpencodeSession"]>(() => null),
      upsert: vi.fn<BindingStore["upsert"]>(() => binding()),
      setOpencodeSession: vi.fn<BindingStore["setOpencodeSession"]>(
        (_chatId, _threadId, opencodeSessionId) => binding({ opencodeSessionId }),
      ),
      remove: vi.fn<BindingStore["remove"]>(() => false),
    },
    api: {
      createSession: vi.fn<BridgeApi["createSession"]>(async () => ({ id: "ses_new" })),
      prompt: vi.fn<BridgeApi["prompt"]>(async () => undefined),
      abort: vi.fn<BridgeApi["abort"]>(async () => true),
      sessionStatus: vi.fn<BridgeApi["sessionStatus"]>(async () => ({})),
      permissionReply: vi.fn<BridgeApi["permissionReply"]>(async () => true),
    },
  };
}

/** Callback payloads of every button in a reply markup, in render order. */
export function callbackData(markup: InlineKeyboardMarkup | undefined): string[] {
  return (markup?.inline_keyboard ?? [])
    .flat()
    .map((button) => ("callback_data" in button ? button.callback_data : ""));
}

/** Button labels of every button in a reply markup, in render order. */
export function buttonLabels(markup: InlineKeyboardMarkup | undefined): string[] {
  return (markup?.inline_keyboard ?? []).flat().map((button) => button.text);
}
