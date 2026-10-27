import { afterEach, describe, expect, it, vi } from "vitest";
import { createStreamCoordinator } from "../../bot/stream-coordinator.js";
import type {
  EventConnectionState,
  OpenCodeEvent,
  SubscribeEventsOptions,
} from "../../lib/opencode/events.js";
import type { Binding } from "../../lib/store/bindings.js";

type ApiMethod =
  | "deleteMessage"
  | "editMessageText"
  | "sendMessage"
  | "sendMessageDraft"
  | "sendRichMessage"
  | "sendRichMessageDraft";

interface ApiCall {
  readonly method: ApiMethod;
  readonly args: readonly unknown[];
}

class FakeApi {
  readonly calls: ApiCall[] = [];
  private nextMessageId = 100;

  private record(method: ApiMethod, args: readonly unknown[]): void {
    this.calls.push({ method, args });
  }

  async sendMessage(chatId: number | string, text: string, options?: unknown) {
    this.record("sendMessage", [chatId, text, options]);
    return { message_id: this.nextMessageId++ };
  }

  async sendRichMessage(chatId: number | string, message: unknown, options?: unknown) {
    this.record("sendRichMessage", [chatId, message, options]);
    return { message_id: this.nextMessageId++ };
  }

  async editMessageText(chatId: number | string, messageId: number, text: unknown, options?: unknown) {
    this.record("editMessageText", [chatId, messageId, text, options]);
    return true;
  }

  async deleteMessage(chatId: number | string, messageId: number) {
    this.record("deleteMessage", [chatId, messageId]);
    return true;
  }

  async sendMessageDraft(chatId: number, draftId: number, text: string, options?: unknown) {
    this.record("sendMessageDraft", [chatId, draftId, text, options]);
    return true;
  }

  async sendRichMessageDraft(chatId: number, draftId: number, message: unknown, options?: unknown) {
    this.record("sendRichMessageDraft", [chatId, draftId, message, options]);
    return true;
  }
}

class FakeEventFeed {
  readonly subscribe = vi.fn(async (options: SubscribeEventsOptions): Promise<void> => {
    this.options = options;
    for await (const event of this.events(options.signal)) options.onEvent(event);
  });
  private readonly queue: OpenCodeEvent[] = [];
  private options: SubscribeEventsOptions | null = null;
  private wake: (() => void) | null = null;

  push(event: OpenCodeEvent): void {
    this.queue.push(event);
    this.wake?.();
  }

  state(state: EventConnectionState): void {
    this.options?.onStateChange?.(state);
  }

  get aborted(): boolean {
    return this.options?.signal.aborted ?? false;
  }

  private async *events(signal: AbortSignal): AsyncGenerator<OpenCodeEvent> {
    while (!signal.aborted) {
      const event = this.queue.shift();
      if (event) {
        yield event;
        continue;
      }
      await new Promise<void>((resolve) => {
        const finish = (): void => {
          signal.removeEventListener("abort", finish);
          if (this.wake === finish) this.wake = null;
          resolve();
        };
        this.wake = finish;
        signal.addEventListener("abort", finish, { once: true });
      });
    }
  }
}

const binding: Binding = {
  chatId: -42,
  threadId: 17,
  tmuxSession: "work",
  directory: "/work",
  opencodeSessionId: "session-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const config = {
  stream: { throttleMs: 100 },
  telegram: { draftStreaming: false },
} as const;

function event(type: string, properties: Readonly<Record<string, unknown>>): OpenCodeEvent {
  return { type, properties };
}

function partEvent(text: string): OpenCodeEvent {
  return event("message.part.updated", {
    sessionID: "session-1",
    part: { id: "part-1", messageID: "message-1", type: "text", text },
  });
}

function setup(bound = true) {
  const api = new FakeApi();
  const feed = new FakeEventFeed();
  const store = {
    list: () => (bound ? [binding] : []),
    getByOpencodeSession: (sessionId: string) =>
      bound && sessionId === binding.opencodeSessionId ? binding : null,
  };
  const coordinator = createStreamCoordinator({ store, subscribeEvents: feed.subscribe, api, config });
  coordinator.start();
  return { api, coordinator, feed };
}

async function settle(): Promise<void> {
  for (let iteration = 0; iteration < 10; iteration += 1) await Promise.resolve();
}

describe("bot/stream-coordinator", () => {
  afterEach(() => vi.useRealTimers());

  it("streams two assistant updates through a throttled edit and completes on idle", async () => {
    // Given
    vi.useFakeTimers();
    const { api, coordinator, feed } = setup();

    // When
    feed.push(partEvent("draft"));
    await settle();
    await vi.advanceTimersByTimeAsync(100);
    feed.push(partEvent("final"));
    await settle();
    await vi.advanceTimersByTimeAsync(100);
    feed.push(event("session.status", { sessionID: "session-1", status: { type: "idle" } }));
    await settle();

    // Then
    expect(api.calls.map((call) => call.method)).toEqual(["sendRichMessage", "editMessageText"]);
    expect(api.calls[0]?.args[2]).toEqual({ message_thread_id: 17 });
    await coordinator.stop();
  });

  it("ignores assistant updates for an unbound session", async () => {
    // Given
    vi.useFakeTimers();
    const { api, coordinator, feed } = setup(false);

    // When
    feed.push(partEvent("ignored"));
    await settle();
    await vi.advanceTimersByTimeAsync(100);

    // Then
    expect(api.calls).toEqual([]);
    await coordinator.stop();
  });

  it("forwards permission requests with the required callback keyboard", async () => {
    // Given
    const { api, coordinator, feed } = setup();

    // When
    feed.push(event("permission.asked", {
      id: "request-7",
      sessionID: "session-1",
      permission: "bash",
      patterns: ["git status", "npm test"],
    }));
    await settle();

    // Then
    expect(api.calls[0]?.args[1]).toContain("bash");
    expect(api.calls[0]?.args[1]).toContain("git status");
    expect(api.calls[0]?.args[2]).toEqual({
      message_thread_id: 17,
      reply_markup: { inline_keyboard: [[
        { text: "✅ Once", callback_data: "permission:once:request-7" },
        { text: "🔁 Always", callback_data: "permission:always:request-7" },
        { text: "⛔ Reject", callback_data: "permission:reject:request-7" },
      ]] },
    });
    await coordinator.stop();
  });

  it("forwards questions as plain threaded messages", async () => {
    // Given
    const { api, coordinator, feed } = setup();

    // When
    feed.push(event("question.asked", {
      id: "question-1",
      sessionID: "session-1",
      questions: [{ question: "Deploy now?", header: "Deploy", options: [] }],
    }));
    await settle();

    // Then
    expect(api.calls).toEqual([
      { method: "sendMessage", args: [-42, "Deploy now?", { message_thread_id: 17 }] },
    ]);
    await coordinator.stop();
  });

  it("forwards session errors to the bound thread", async () => {
    // Given
    const { api, coordinator, feed } = setup();

    // When
    feed.push(event("session.error", {
      sessionID: "session-1",
      error: { message: "provider unavailable" },
    }));
    await settle();

    // Then
    expect(api.calls[0]?.args).toEqual([
      -42,
      "⚠️ OpenCode error: provider unavailable",
      { message_thread_id: 17 },
    ]);
    await coordinator.stop();
  });

  it("sends one disconnect notice until a connected transition restores it", async () => {
    // Given
    const { api, coordinator, feed } = setup();
    await settle();

    // When
    feed.state("disconnected");
    feed.state("disconnected");
    await settle();
    feed.state("connected");
    feed.state("connected");
    await settle();

    // Then
    expect(api.calls.map((call) => call.args[1])).toEqual([
      "⚠️ OpenCode event stream disconnected. Reconnecting…",
      "✅ OpenCode event stream restored.",
    ]);
    await coordinator.stop();
  });

  it("aborts the subscription and clears pending streamer timers", async () => {
    // Given
    vi.useFakeTimers();
    const { api, coordinator, feed } = setup();
    feed.push(partEvent("pending"));
    await settle();

    // When
    await coordinator.stop();
    await vi.advanceTimersByTimeAsync(100);

    // Then
    expect(feed.aborted).toBe(true);
    expect(api.calls).toEqual([]);
  });
});
