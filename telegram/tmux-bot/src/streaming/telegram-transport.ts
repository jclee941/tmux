// Adapted in part from opencode-telegram-bot (MIT) — https://github.com/grinev/opencode-telegram-bot
import type { Api, RawApi } from "grammy";
import { getTelegramRenderedPartSignature } from "../render/part-signature.js";
import type { TelegramRenderedPart } from "../render/types.js";
import type {
  TelegramEditMessageOptions,
  TelegramSendMessageOptions,
} from "./stream-state.js";

type GrammyApi = Api<RawApi>;
type SendRichOptions = Parameters<GrammyApi["sendRichMessage"]>[2];
type SendDraftOptions = Parameters<GrammyApi["sendMessageDraft"]>[3];
type SendRichDraftOptions = Parameters<GrammyApi["sendRichMessageDraft"]>[3];

interface SentMessage {
  readonly message_id: number;
}

export interface TelegramTransportApi {
  sendMessage(chatId: number | string, text: string, options?: TelegramSendMessageOptions): Promise<SentMessage>;
  sendRichMessage(
    chatId: number | string,
    richMessage: { readonly blocks: TelegramRenderedPart["blocks"] },
    options?: SendRichOptions,
  ): Promise<SentMessage>;
  editMessageText(
    chatId: number | string,
    messageId: number,
    text: string | { readonly blocks: TelegramRenderedPart["blocks"] },
    options?: TelegramEditMessageOptions,
  ): Promise<unknown>;
  deleteMessage(chatId: number | string, messageId: number): Promise<unknown>;
  sendMessageDraft(
    chatId: number,
    draftId: number,
    text: string,
    options?: SendDraftOptions,
  ): Promise<unknown>;
  sendRichMessageDraft(chatId: number, draftId: number,
    richMessage: { readonly blocks: TelegramRenderedPart["blocks"] }, options?: SendRichDraftOptions): Promise<unknown>;
}

interface TransportConfig {
  readonly stream: { readonly throttleMs: number };
  readonly telegram: { readonly draftStreaming: boolean };
}

export interface CreateTransportOptions {
  readonly api: TelegramTransportApi;
  readonly chatId: number;
  readonly threadId: number | null;
  readonly chatType: string;
  readonly config: TransportConfig;
}

interface DeliveryResult {
  readonly deliveredSignature: string;
  readonly degradedToPlain?: boolean;
}

interface SendResult extends DeliveryResult {
  readonly messageId: number;
}

export interface TelegramTransport {
  readonly throttleMs: number;
  readonly sendPart: (
    part: TelegramRenderedPart,
    options?: TelegramSendMessageOptions,
  ) => Promise<SendResult>;
  readonly editPart: (
    messageId: number,
    part: TelegramRenderedPart,
    options?: TelegramEditMessageOptions,
  ) => Promise<DeliveryResult>;
  readonly deleteText: (messageId: number) => Promise<void>;
  readonly completePart?: (
    part: TelegramRenderedPart,
    options?: TelegramSendMessageOptions,
  ) => Promise<SendResult>;
}

const PARSE_ERROR_MARKERS = [
  "can't parse entities",
  "can't parse entity",
  "can't find end of the entity",
  "entity beginning",
  "bad request: can't parse",
  "entity url",
  "wrong http url",
  "url host is empty",
] as const;

function errorText(error: unknown): string {
  const parts: string[] = [];
  if (error instanceof Error) parts.push(error.message);
  if (typeof error === "object" && error !== null) {
    const description = Reflect.get(error, "description");
    if (typeof description === "string") parts.push(description);
  }
  if (typeof error === "string") parts.push(error);
  return parts.join("\n").toLowerCase();
}

function isParseError(error: unknown): boolean {
  const text = errorText(error);
  return PARSE_ERROR_MARKERS.some((marker) => text.includes(marker));
}

function isNotModified(error: unknown): boolean {
  return errorText(error).includes("message is not modified");
}

function deliveredSignature(part: TelegramRenderedPart): string {
  return getTelegramRenderedPartSignature(part);
}

function plainSignature(part: TelegramRenderedPart): string {
  return getTelegramRenderedPartSignature({
    blocks: [],
    fallbackText: part.fallbackText,
    source: "plain",
  });
}

function sendOptions(
  options: TelegramSendMessageOptions | undefined,
  threadId: number | null,
  entities?: TelegramRenderedPart["entities"],
): TelegramSendMessageOptions {
  const { parse_mode: _parseMode, entities: _entities, ...rest } = options ?? {};
  return {
    ...rest,
    ...(entities?.length ? { entities } : {}),
    ...(threadId === null ? {} : { message_thread_id: threadId }),
  };
}

function editOptions(
  options: TelegramEditMessageOptions | undefined,
  entities?: TelegramRenderedPart["entities"],
): TelegramEditMessageOptions {
  const { parse_mode: _parseMode, entities: _entities, ...rest } = options ?? {};
  return { ...rest, ...(entities?.length ? { entities } : {}) };
}

export function createTransport({
  api,
  chatId,
  threadId,
  chatType,
  config,
}: CreateTransportOptions): TelegramTransport {
  const draftEnabled = config.telegram.draftStreaming && chatType === "private";
  const draftId = Math.floor(Math.random() * 2_147_483_647) + 1;

  const sendPersistent = async (
    part: TelegramRenderedPart,
    options?: TelegramSendMessageOptions,
  ): Promise<SendResult> => {
    const plainOptions = sendOptions(options, threadId, part.entities);
    if (part.blocks.length === 0) {
      const message = await api.sendMessage(chatId, part.fallbackText, plainOptions);
      return { messageId: message.message_id, deliveredSignature: deliveredSignature(part) };
    }

    try {
      const message = await api.sendRichMessage(chatId, { blocks: part.blocks }, plainOptions);
      return { messageId: message.message_id, deliveredSignature: deliveredSignature(part) };
    } catch (error) {
      if (!isParseError(error)) throw error;
      const message = await api.sendMessage(
        chatId,
        part.fallbackText,
        sendOptions(options, threadId),
      );
      return {
        messageId: message.message_id,
        deliveredSignature: plainSignature(part),
        degradedToPlain: true,
      };
    }
  };

  const editPersistent = async (
    messageId: number,
    part: TelegramRenderedPart,
    options?: TelegramEditMessageOptions,
  ): Promise<DeliveryResult> => {
    const currentSignature = deliveredSignature(part);
    const richOptions = editOptions(options, part.entities);
    try {
      await api.editMessageText(
        chatId,
        messageId,
        part.blocks.length === 0 ? part.fallbackText : { blocks: part.blocks },
        richOptions,
      );
      return { deliveredSignature: currentSignature };
    } catch (error) {
      if (isNotModified(error)) return { deliveredSignature: currentSignature };
      if (part.blocks.length === 0 || !isParseError(error)) throw error;
      const fallbackSignature = plainSignature(part);
      try {
        await api.editMessageText(
          chatId,
          messageId,
          part.fallbackText,
          editOptions(options),
        );
      } catch (fallbackError) {
        if (!isNotModified(fallbackError)) throw fallbackError;
      }
      return { deliveredSignature: fallbackSignature, degradedToPlain: true };
    }
  };

  if (!draftEnabled) {
    return {
      throttleMs: config.stream.throttleMs,
      sendPart: sendPersistent,
      editPart: editPersistent,
      deleteText: async (messageId) => {
        await api.deleteMessage(chatId, messageId);
      },
    };
  }

  const sendDraft = async (part: TelegramRenderedPart): Promise<SendResult> => {
    const options = {
      ...(part.entities?.length ? { entities: part.entities } : {}),
      ...(threadId === null ? {} : { message_thread_id: threadId }),
    };
    if (part.blocks.length === 0) {
      await api.sendMessageDraft(chatId, draftId, part.fallbackText, options);
      return { messageId: draftId, deliveredSignature: deliveredSignature(part) };
    }
    try {
      await api.sendRichMessageDraft(chatId, draftId, { blocks: part.blocks }, options);
      return { messageId: draftId, deliveredSignature: deliveredSignature(part) };
    } catch (error) {
      if (!isParseError(error)) throw error;
      await api.sendMessageDraft(chatId, draftId, part.fallbackText, {
        ...(threadId === null ? {} : { message_thread_id: threadId }),
      });
      return {
        messageId: draftId,
        deliveredSignature: plainSignature(part),
        degradedToPlain: true,
      };
    }
  };

  return {
    throttleMs: config.stream.throttleMs,
    sendPart: sendDraft,
    editPart: async (_messageId, part) => {
      const result = await sendDraft(part);
      return {
        deliveredSignature: result.deliveredSignature,
        ...(result.degradedToPlain ? { degradedToPlain: true } : {}),
      };
    },
    deleteText: async (messageId) => {
      await api.deleteMessage(chatId, messageId);
    },
    completePart: sendPersistent,
  };
}
