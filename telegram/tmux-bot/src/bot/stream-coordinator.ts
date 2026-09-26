import { logger as defaultLogger } from "../lib/logger.js";
import type { EventConnectionState, OpenCodeEvent, SubscribeEventsOptions } from "../lib/opencode/events.js";
import type { Binding } from "../lib/store/bindings.js";
import { renderTelegramParts } from "../render/pipeline.js";
import { ResponseStreamer } from "../streaming/response-streamer.js";
import { createTransport, type TelegramTransportApi } from "../streaming/telegram-transport.js";

type SubscribeEvents = (options: SubscribeEventsOptions) => Promise<void>;

interface CoordinatorStore {
  list(): readonly Binding[];
  getByOpencodeSession(sessionId: string): Binding | null;
}

interface CoordinatorConfig {
  readonly stream: { readonly throttleMs: number };
  readonly telegram: { readonly draftStreaming: boolean };
}

interface CoordinatorLogger {
  readonly error: (message: string, ...values: readonly unknown[]) => void;
}

export interface StreamCoordinatorDependencies {
  readonly store: CoordinatorStore;
  readonly subscribeEvents: SubscribeEvents;
  readonly api: TelegramTransportApi;
  readonly config: CoordinatorConfig;
  readonly logger?: CoordinatorLogger;
}

export interface StreamCoordinator {
  start(): void;
  stop(): Promise<void>;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: Readonly<Record<string, unknown>>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function bindingKey(binding: Binding): string {
  return `${binding.chatId}:${binding.threadId ?? "null"}`;
}

function threadOptions(binding: Binding): { readonly message_thread_id?: number } {
  return binding.threadId === null ? {} : { message_thread_id: binding.threadId };
}

function permissionPatterns(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function questionText(properties: Readonly<Record<string, unknown>>): string | null {
  const directQuestion = stringField(properties, "question");
  if (directQuestion !== null) return directQuestion;

  const questions = properties["questions"];
  if (!Array.isArray(questions)) return null;
  const texts = questions.flatMap((question) => {
    if (!isRecord(question)) return [];
    const text = stringField(question, "question");
    return text === null ? [] : [text];
  });
  return texts.length === 0 ? null : texts.join("\n\n");
}

function sessionErrorText(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (!isRecord(value)) return "Unknown session error";

  const message = stringField(value, "message");
  if (message !== null) return message;
  const data = value["data"];
  if (isRecord(data)) {
    const dataMessage = stringField(data, "message");
    if (dataMessage !== null) return dataMessage;
  }
  return stringField(value, "name") ?? "Unknown session error";
}

export function createStreamCoordinator(dependencies: StreamCoordinatorDependencies): StreamCoordinator {
  const controller = new AbortController();
  const log = dependencies.logger ?? defaultLogger;
  const streamers = new Map<string, ResponseStreamer>();
  const lastMessageIds = new Map<string, string>();
  let eventQueue = Promise.resolve();
  let subscription: Promise<void> | null = null;
  let started = false;
  let stopped = false;
  let disconnectedNoticeSent = false;

  const streamerFor = (binding: Binding): ResponseStreamer => {
    const key = bindingKey(binding);
    const existing = streamers.get(key);
    if (existing) return existing;

    const transport = createTransport({
      api: dependencies.api,
      chatId: binding.chatId,
      threadId: binding.threadId,
      chatType: binding.chatId > 0 ? "private" : "supergroup",
      config: dependencies.config,
    });
    const streamer = new ResponseStreamer(transport);
    streamers.set(key, streamer);
    return streamer;
  };

  const handlePartUpdate = (properties: Readonly<Record<string, unknown>>): void => {
    const sessionId = stringField(properties, "sessionID");
    const part = properties["part"];
    if (sessionId === null || !isRecord(part)) return;

    const type = stringField(part, "type");
    if (type !== "text" && type !== "reasoning") return;
    const messageId = stringField(part, "messageID");
    const text = stringField(part, "text");
    if (messageId === null || text === null) return;

    const binding = dependencies.store.getByOpencodeSession(sessionId);
    if (binding === null) return;
    lastMessageIds.set(sessionId, messageId);
    streamerFor(binding).enqueue(sessionId, messageId, { parts: renderTelegramParts(text) });
  };

  const handleIdle = async (properties: Readonly<Record<string, unknown>>): Promise<void> => {
    const sessionId = stringField(properties, "sessionID");
    if (sessionId === null) return;
    const status = properties["status"];
    if (!isRecord(status) || stringField(status, "type") !== "idle") return;

    const messageId = lastMessageIds.get(sessionId);
    const binding = dependencies.store.getByOpencodeSession(sessionId);
    if (messageId === undefined || binding === null) return;
    lastMessageIds.delete(sessionId);
    await streamerFor(binding).complete(sessionId, messageId);
  };

  const handlePermission = async (properties: Readonly<Record<string, unknown>>): Promise<void> => {
    const sessionId = stringField(properties, "sessionID");
    const requestId = stringField(properties, "id") ?? stringField(properties, "requestID");
    const permission = stringField(properties, "permission");
    if (sessionId === null || requestId === null || permission === null) return;
    const binding = dependencies.store.getByOpencodeSession(sessionId);
    if (binding === null) return;

    const patterns = permissionPatterns(properties["patterns"]);
    const summary = patterns.length === 0 ? "(all)" : patterns.join("\n");
    await dependencies.api.sendMessage(
      binding.chatId,
      `🔐 Permission requested: ${permission}\n${summary}`,
      {
        ...threadOptions(binding),
        reply_markup: {
          inline_keyboard: [[
            { text: "✅ Once", callback_data: `permission:once:${requestId}` },
            { text: "🔁 Always", callback_data: `permission:always:${requestId}` },
            { text: "⛔ Reject", callback_data: `permission:reject:${requestId}` },
          ]],
        },
      },
    );
  };

  const handleQuestion = async (properties: Readonly<Record<string, unknown>>): Promise<void> => {
    const sessionId = stringField(properties, "sessionID");
    const text = questionText(properties);
    if (sessionId === null || text === null) return;
    const binding = dependencies.store.getByOpencodeSession(sessionId);
    if (binding === null) return;
    await dependencies.api.sendMessage(binding.chatId, text, threadOptions(binding));
  };

  const handleSessionError = async (properties: Readonly<Record<string, unknown>>): Promise<void> => {
    const sessionId = stringField(properties, "sessionID");
    if (sessionId === null) return;
    const binding = dependencies.store.getByOpencodeSession(sessionId);
    if (binding === null) return;
    streamerFor(binding).clearSession(sessionId, "session_error");
    lastMessageIds.delete(sessionId);
    await dependencies.api.sendMessage(
      binding.chatId,
      `⚠️ OpenCode error: ${sessionErrorText(properties["error"])}`,
      threadOptions(binding),
    );
  };

  const handleEvent = async (event: OpenCodeEvent): Promise<void> => {
    switch (event.type) {
      case "message.part.updated":
        handlePartUpdate(event.properties);
        return;
      case "session.status":
        await handleIdle(event.properties);
        return;
      case "permission.asked":
        await handlePermission(event.properties);
        return;
      case "question.asked":
        await handleQuestion(event.properties);
        return;
      case "session.error":
        await handleSessionError(event.properties);
        return;
      default:
        return;
    }
  };

  const sendConnectionNotice = async (text: string): Promise<void> => {
    const seen = new Set<string>();
    for (const binding of dependencies.store.list()) {
      const key = bindingKey(binding);
      if (seen.has(key)) continue;
      seen.add(key);
      await dependencies.api.sendMessage(binding.chatId, text, threadOptions(binding));
    }
  };

  const handleStateChange = async (state: EventConnectionState): Promise<void> => {
    if (state === "disconnected") {
      if (disconnectedNoticeSent) return;
      disconnectedNoticeSent = true;
      await sendConnectionNotice("⚠️ OpenCode event stream disconnected. Reconnecting…");
      return;
    }
    if (!disconnectedNoticeSent) return;
    disconnectedNoticeSent = false;
    await sendConnectionNotice("✅ OpenCode event stream restored.");
  };

  const schedule = (operation: () => Promise<void>): void => {
    eventQueue = eventQueue.then(operation).catch((error: unknown) => {
      log.error("Stream coordinator event handling failed", error);
    });
  };

  return {
    start: () => {
      if (started || stopped) return;
      started = true;
      subscription = Promise.resolve()
        .then(() =>
          dependencies.subscribeEvents({
            signal: controller.signal,
            onEvent: (event) => {
              if (!stopped) schedule(() => handleEvent(event));
            },
            onStateChange: (state) => {
              if (!stopped) schedule(() => handleStateChange(state));
            },
          }),
        )
        .catch((error: unknown) => {
          if (!controller.signal.aborted) log.error("OpenCode event subscription stopped", error);
        });
    },
    stop: async () => {
      if (stopped) {
        await subscription;
        await eventQueue;
        return;
      }
      stopped = true;
      controller.abort();
      await subscription;
      await eventQueue;
      for (const streamer of streamers.values()) streamer.clearAll("coordinator_stop");
      streamers.clear();
      lastMessageIds.clear();
    },
  };
}
