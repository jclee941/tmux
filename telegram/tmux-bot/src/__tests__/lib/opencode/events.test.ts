import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  globalEvent: vi.fn(),
  scopedSubscribe: vi.fn(),
}));

vi.mock("../../../lib/opencode/client.js", () => ({
  getOpencodeClient: () => ({
    global: { event: sdk.globalEvent },
    event: { subscribe: sdk.scopedSubscribe },
  }),
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { subscribeEvents } from "../../../lib/opencode/events.js";

type TestEvent = {
  readonly type: string;
  readonly properties: Readonly<Record<string, unknown>>;
};

const event = (type: string): TestEvent => ({ type, properties: {} });

async function* scriptedStream(
  steps: readonly (TestEvent | Error)[],
): AsyncGenerator<TestEvent> {
  for (const step of steps) {
    if (step instanceof Error) throw step;
    yield step;
  }
}

async function* idleStream(): AsyncGenerator<TestEvent> {
  await new Promise<void>(() => undefined);
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("OpenCode event subscription", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispatches global events and reports connection transitions", async () => {
    // Given: a global stream containing one event
    const controller = new AbortController();
    const received: TestEvent[] = [];
    const states: string[] = [];
    sdk.globalEvent.mockResolvedValue({
      stream: scriptedStream([event("session.status")]),
    });

    // When: the event is dispatched
    const listening = subscribeEvents({
      signal: controller.signal,
      onEvent: (item) => {
        received.push(item);
        controller.abort();
      },
      onStateChange: (state) => states.push(state),
    });
    await listening;

    // Then: consumers see the event and each state transition once
    expect(received).toEqual([event("session.status")]);
    expect(states).toEqual(["connected", "disconnected"]);
  });

  it("falls back to the directory-scoped stream when global events fail", async () => {
    // Given: an unavailable global endpoint and a working scoped stream
    const controller = new AbortController();
    const received: TestEvent[] = [];
    sdk.globalEvent.mockRejectedValue(new Error("unsupported"));
    sdk.scopedSubscribe.mockResolvedValue({
      stream: scriptedStream([event("session.idle")]),
    });

    // When: subscription starts with a project directory
    const listening = subscribeEvents({
      directory: "/work/project",
      signal: controller.signal,
      onEvent: (item) => {
        received.push(item);
        controller.abort();
      },
    });
    await listening;

    // Then: the fallback carries the directory and dispatches its event
    expect(sdk.scopedSubscribe).toHaveBeenCalledWith(
      { directory: "/work/project" },
      { signal: expect.any(AbortSignal) },
    );
    expect(received).toEqual([event("session.idle")]);
  });

  it("reconnects after a stream error with exponential backoff", async () => {
    // Given: a stream that fails, followed by a working stream
    const controller = new AbortController();
    const states: string[] = [];
    sdk.globalEvent
      .mockResolvedValueOnce({ stream: scriptedStream([new Error("broken")]) })
      .mockResolvedValueOnce({
        stream: scriptedStream([event("message.part.updated")]),
      });

    // When: the first reconnect delay elapses
    const listening = subscribeEvents({
      signal: controller.signal,
      onEvent: () => controller.abort(),
      onStateChange: (state) => states.push(state),
    });
    await flushPromises();
    expect(sdk.globalEvent).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1_000);
    await listening;

    // Then: a second connection is made and transitions are not duplicated
    expect(sdk.globalEvent).toHaveBeenCalledTimes(2);
    expect(states).toEqual([
      "connected",
      "disconnected",
      "connected",
      "disconnected",
    ]);
  });

  it("reconnects when no event arrives for thirty seconds", async () => {
    // Given: an idle stream followed by a working stream
    const controller = new AbortController();
    sdk.globalEvent
      .mockResolvedValueOnce({ stream: idleStream() })
      .mockResolvedValueOnce({ stream: scriptedStream([event("session.idle")]) });

    // When: the idle timeout and first backoff elapse
    const listening = subscribeEvents({
      signal: controller.signal,
      onEvent: () => controller.abort(),
    });
    await flushPromises();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(sdk.globalEvent).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1_000);
    await listening;

    // Then: the stream is subscribed again
    expect(sdk.globalEvent).toHaveBeenCalledTimes(2);
  });

  it("stops during backoff without reconnecting after abort", async () => {
    // Given: a stream that ends and enters reconnect backoff
    const controller = new AbortController();
    sdk.globalEvent.mockResolvedValue({ stream: scriptedStream([]) });
    const listening = subscribeEvents({
      signal: controller.signal,
      onEvent: vi.fn(),
    });
    await flushPromises();

    // When: the caller aborts before the timer expires
    controller.abort();
    await listening;
    await vi.advanceTimersByTimeAsync(15_000);

    // Then: no further subscription is attempted
    expect(sdk.globalEvent).toHaveBeenCalledOnce();
  });
});
