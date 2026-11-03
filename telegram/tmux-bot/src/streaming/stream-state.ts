// Adapted from opencode-telegram-bot (MIT) — https://github.com/grinev/opencode-telegram-bot
import type { Api, RawApi } from "grammy";
import { logger } from "../lib/logger.js";
import { chunkPlainText } from "../render/chunker.js";
import type { TelegramRenderedPart } from "../render/types.js";

type SendMessageApi = Pick<Api<RawApi>, "sendMessage">;
type EditMessageApi = Pick<Api<RawApi>, "editMessageText">;

export type TelegramSendMessageOptions = Parameters<SendMessageApi["sendMessage"]>[2];
export type TelegramEditMessageOptions = Parameters<EditMessageApi["editMessageText"]>[3];

export interface StreamingMessagePayload {
  parts: TelegramRenderedPart[];
  sendOptions?: TelegramSendMessageOptions;
  editOptions?: TelegramEditMessageOptions;
}

export interface StreamState {
  key: string;
  sessionId: string;
  messageId: string;
  latestPayload: StreamingMessagePayload | null;
  lastSentSignatures: string[];
  telegramMessageIds: number[];
  timer: ReturnType<typeof setTimeout> | null;
  task: Promise<boolean>;
  cancelled: boolean;
  isBroken: boolean;
  plainOnly: boolean;
  fatalErrorMessage: string | null;
  fatalErrorLogged: boolean;
}

export function buildStateKey(sessionId: string, messageId: string): string {
  return `${sessionId}:${messageId}`;
}

export function clonePart(part: TelegramRenderedPart): TelegramRenderedPart {
  return {
    blocks: [...part.blocks],
    fallbackText: part.fallbackText,
    source: part.source,
    ...(part.entities ? { entities: [...part.entities] } : {}),
  };
}

export function isEmptyPart(part: TelegramRenderedPart): boolean {
  return part.blocks.length === 0 && part.fallbackText.length === 0;
}

/**
 * Rebuilds a payload as plain text. Native parts may hold far more than a text
 * message can carry, so the whole representation is re-chunked rather than
 * swapped part by part; the resulting part count may differ.
 */
export function toPlainPayload(payload: StreamingMessagePayload): StreamingMessagePayload {
  // Nothing native to degrade: re-chunking here would only invalidate the
  // entity offsets a plain part carries.
  if (payload.parts.every((part) => part.blocks.length === 0)) {
    return payload;
  }

  const text = payload.parts
    .map((part) => part.fallbackText)
    .filter(Boolean)
    .join("\n\n");

  return {
    ...payload,
    parts: chunkPlainText(text),
  };
}

export function normalizePayload(
  payload: StreamingMessagePayload,
): StreamingMessagePayload | null {
  const normalizedParts = payload.parts.map(clonePart).filter((part) => !isEmptyPart(part));
  if (normalizedParts.length === 0) {
    logger.debug("[ResponseStreamer] Dropped empty streaming payload after normalization");
    return null;
  }

  return {
    parts: normalizedParts,
    sendOptions: payload.sendOptions,
    editOptions: payload.editOptions,
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function getRetryAfterMs(error: unknown): number | null {
  const message = getErrorMessage(error);
  if (!/\b429\b/.test(message)) {
    return null;
  }

  const retryMatch = message.match(/retry after\s+(\d+)/i);
  if (!retryMatch) {
    return null;
  }

  const seconds = Number.parseInt(retryMatch[1], 10);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return seconds * 1000;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function enableNotificationForOptions(
  options: TelegramSendMessageOptions | undefined,
): TelegramSendMessageOptions | undefined {
  if (!options) {
    return options;
  }

  const nextOptions = {
    ...options,
  } as NonNullable<TelegramSendMessageOptions> & { disable_notification?: unknown };
  delete nextOptions.disable_notification;

  return nextOptions as TelegramSendMessageOptions;
}
