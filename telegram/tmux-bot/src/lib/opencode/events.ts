import { logger } from "../logger.js";
import { getOpencodeClient } from "./client.js";

const IDLE_TIMEOUT_MS = 30_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 15_000;

export type OpenCodeEvent = {
  readonly type: string;
  readonly properties: Readonly<Record<string, unknown>>;
};

export type EventConnectionState = "connected" | "disconnected";

export type SubscribeEventsOptions = {
  readonly directory?: string;
  readonly onEvent: (event: OpenCodeEvent) => void;
  readonly onStateChange?: (state: EventConnectionState) => void;
  readonly signal: AbortSignal;
};

type EventStream = AsyncGenerator<unknown, unknown, unknown>;
type StreamRead =
  | { readonly kind: "event"; readonly result: IteratorResult<unknown, unknown> }
  | { readonly kind: "error"; readonly error: unknown }
  | { readonly kind: "timeout" }
  | { readonly kind: "aborted" };

class EventSubscriptionError extends Error {
  readonly name = "EventSubscriptionError";
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toEvent(value: unknown): OpenCodeEvent | null {
  const candidate = isRecord(value) && "payload" in value ? value.payload : value;
  if (!isRecord(candidate) || typeof candidate.type !== "string") return null;
  if (!isRecord(candidate.properties)) return null;
  return { type: candidate.type, properties: candidate.properties };
}

function createAttemptSignal(parent: AbortSignal): {
  readonly controller: AbortController;
  readonly cleanup: () => void;
} {
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  if (parent.aborted) controller.abort();
  else parent.addEventListener("abort", abort, { once: true });
  return {
    controller,
    cleanup: () => parent.removeEventListener("abort", abort),
  };
}

function readStream(stream: EventStream, signal: AbortSignal): Promise<StreamRead> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: StreamRead): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      resolve(result);
    };
    const abort = (): void => finish({ kind: "aborted" });
    const timeout = setTimeout(
      () => finish({ kind: "timeout" }),
      IDLE_TIMEOUT_MS,
    );

    if (signal.aborted) {
      finish({ kind: "aborted" });
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
    stream.next().then(
      (result) => finish({ kind: "event", result }),
      (error: unknown) => finish({ kind: "error", error }),
    );
  });
}

function waitForReconnect(delayMs: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }
    const abort = (): void => {
      clearTimeout(timeout);
      resolve(false);
    };
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve(true);
    }, delayMs);
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function openStream(
  directory: string,
  signal: AbortSignal,
): Promise<EventStream> {
  const client = getOpencodeClient();
  try {
    const response = await client.global.event({ signal });
    if (!response.stream) throw new EventSubscriptionError("Global event stream missing");
    return response.stream;
  } catch (error) {
    if (signal.aborted) throw error;
    logger.warn("OpenCode global event stream unavailable; using scoped stream", error);
    const response = await client.event.subscribe({ directory }, { signal });
    if (!response.stream) throw new EventSubscriptionError("Scoped event stream missing");
    return response.stream;
  }
}

function closeStream(stream: EventStream): void {
  const closing = stream.return?.(undefined);
  void closing?.catch((error: unknown) => {
    logger.debug("OpenCode event stream cleanup failed", error);
  });
}

export async function subscribeEvents(options: SubscribeEventsOptions): Promise<void> {
  const directory = options.directory ?? process.cwd();
  let state: EventConnectionState = "disconnected";
  let reconnectDelay = RECONNECT_BASE_MS;
  const setState = (next: EventConnectionState): void => {
    if (state === next) return;
    state = next;
    options.onStateChange?.(next);
  };

  while (!options.signal.aborted) {
    const attempt = createAttemptSignal(options.signal);
    let stream: EventStream | null = null;
    try {
      stream = await openStream(directory, attempt.controller.signal);
      reconnectDelay = RECONNECT_BASE_MS;
      setState("connected");

      while (!options.signal.aborted) {
        const read = await readStream(stream, attempt.controller.signal);
        if (read.kind === "aborted") break;
        if (read.kind === "timeout") {
          logger.warn("OpenCode event stream idle; reconnecting");
          break;
        }
        if (read.kind === "error") throw read.error;
        if (read.result.done) break;
        const event = toEvent(read.result.value);
        if (event) options.onEvent(event);
      }
    } catch (error) {
      if (!options.signal.aborted) {
        logger.warn("OpenCode event stream failed; reconnecting", error);
      }
    } finally {
      attempt.controller.abort();
      attempt.cleanup();
      if (stream) closeStream(stream);
      setState("disconnected");
    }

    if (options.signal.aborted) break;
    const shouldReconnect = await waitForReconnect(reconnectDelay, options.signal);
    if (!shouldReconnect) break;
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
  }
}
