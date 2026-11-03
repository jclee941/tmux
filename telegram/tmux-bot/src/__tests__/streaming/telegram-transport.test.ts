import { describe, expect, it } from "vitest";
import type { MessageEntity } from "grammy/types";
import { getTelegramRenderedPartSignature } from "../../render/part-signature.js";
import type { TelegramRenderedPart } from "../../render/types.js";
import { createTransport } from "../../streaming/telegram-transport.js";

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
  private readonly failures = new Map<ApiMethod, Error[]>();
  private nextMessageId = 100;

  failNext(method: ApiMethod, error: Error): void {
    const failures = this.failures.get(method) ?? [];
    failures.push(error);
    this.failures.set(method, failures);
  }

  private record(method: ApiMethod, args: readonly unknown[]): void {
    this.calls.push({ method, args });
    const error = this.failures.get(method)?.shift();
    if (error) throw error;
  }

  async sendMessage(chatId: number | string, text: string, options?: unknown) {
    this.record("sendMessage", [chatId, text, options]);
    return { message_id: this.nextMessageId++ };
  }

  async sendRichMessage(chatId: number | string, richMessage: unknown, options?: unknown) {
    this.record("sendRichMessage", [chatId, richMessage, options]);
    return { message_id: this.nextMessageId++ };
  }

  async editMessageText(
    chatId: number | string,
    messageId: number,
    text: unknown,
    options?: unknown,
  ) {
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

  async sendRichMessageDraft(
    chatId: number,
    draftId: number,
    richMessage: unknown,
    options?: unknown,
  ) {
    this.record("sendRichMessageDraft", [chatId, draftId, richMessage, options]);
    return true;
  }
}

const entities: MessageEntity[] = [{ type: "bold", offset: 0, length: 5 }];

function plainPart(text = "plain", withEntities = false): TelegramRenderedPart {
  return {
    blocks: [],
    fallbackText: text,
    source: "plain",
    ...(withEntities ? { entities } : {}),
  };
}

function richPart(text = "rich"): TelegramRenderedPart {
  return {
    blocks: [{ type: "paragraph", text: { type: "bold", text } }],
    fallbackText: text,
    source: "blocks",
  };
}

function transport(
  api: FakeApi,
  options: { readonly draftStreaming?: boolean; readonly chatType?: string; readonly threadId?: number | null } = {},
) {
  return createTransport({
    api,
    chatId: 42,
    threadId: options.threadId ?? null,
    chatType: options.chatType ?? "group",
    config: {
      stream: { throttleMs: 250 },
      telegram: { draftStreaming: options.draftStreaming ?? false },
    },
  });
}

describe("Telegram streaming transport", () => {
  it("propagates the message thread to sends", async () => {
    // Given a transport targeting a forum thread
    const api = new FakeApi();
    const adapter = transport(api, { threadId: 17 });

    // When a plain part is sent
    await adapter.sendPart(plainPart());

    // Then Telegram receives the thread identifier
    expect(api.calls).toEqual([
      { method: "sendMessage", args: [42, "plain", { message_thread_id: 17 }] },
    ]);
  });

  it("sends and edits plain parts with entities and delivered signatures", async () => {
    // Given a plain entity-bearing part
    const api = new FakeApi();
    const adapter = transport(api);
    const part = plainPart("plain", true);

    // When the part is sent and then edited
    const sent = await adapter.sendPart(part);
    const edited = await adapter.editPart(sent.messageId, part);

    // Then text, entities, and the actual representation signature are preserved
    expect(api.calls).toEqual([
      { method: "sendMessage", args: [42, "plain", { entities }] },
      { method: "editMessageText", args: [42, 100, "plain", { entities }] },
    ]);
    expect(sent.deliveredSignature).toBe(getTelegramRenderedPartSignature(part));
    expect(edited.deliveredSignature).toBe(getTelegramRenderedPartSignature(part));
  });

  it("uses Telegram rich-message methods for block parts", async () => {
    // Given a native rich part
    const api = new FakeApi();
    const adapter = transport(api);
    const part = richPart();

    // When the part is sent and edited
    const sent = await adapter.sendPart(part);
    const edited = await adapter.editPart(sent.messageId, part);

    // Then native block payloads are delivered without text degradation
    expect(api.calls).toEqual([
      { method: "sendRichMessage", args: [42, { blocks: part.blocks }, {}] },
      { method: "editMessageText", args: [42, 100, { blocks: part.blocks }, {}] },
    ]);
    expect(sent).toEqual({
      messageId: 100,
      deliveredSignature: getTelegramRenderedPartSignature(part),
    });
    expect(edited).toEqual({ deliveredSignature: getTelegramRenderedPartSignature(part) });
  });

  it("retries rich sends as plain text after Telegram parse errors", async () => {
    // Given Telegram rejects a rich entity and rich-only options are present
    const api = new FakeApi();
    api.failNext("sendRichMessage", new Error("Bad Request: can't parse entities"));
    const adapter = transport(api);
    const part = richPart("fallback");

    // When the rich part is sent
    const result = await adapter.sendPart(part, { parse_mode: "MarkdownV2" });

    // Then it retries once without formatting options and reports plain delivery
    expect(api.calls).toEqual([
      {
        method: "sendRichMessage",
        args: [42, { blocks: part.blocks }, {}],
      },
      { method: "sendMessage", args: [42, "fallback", {}] },
    ]);
    expect(result).toEqual({
      messageId: 100,
      deliveredSignature: getTelegramRenderedPartSignature(plainPart("fallback")),
      degradedToPlain: true,
    });
  });

  it("retries rich edits as plain text after Telegram parse errors", async () => {
    // Given Telegram rejects a rich edit
    const api = new FakeApi();
    api.failNext("editMessageText", new Error("Bad Request: entity URL is invalid"));
    const adapter = transport(api);
    const part = richPart("fallback");

    // When the rich part is edited
    const result = await adapter.editPart(77, part, { parse_mode: "MarkdownV2" });

    // Then it retries as unformatted text and reports degradation
    expect(api.calls).toEqual([
      { method: "editMessageText", args: [42, 77, { blocks: part.blocks }, {}] },
      { method: "editMessageText", args: [42, 77, "fallback", {}] },
    ]);
    expect(result).toEqual({
      deliveredSignature: getTelegramRenderedPartSignature(plainPart("fallback")),
      degradedToPlain: true,
    });
  });

  it("swallows message-not-modified edit errors", async () => {
    // Given Telegram reports an idempotent edit
    const api = new FakeApi();
    api.failNext("editMessageText", new Error("Bad Request: message is not modified"));
    const adapter = transport(api);
    const part = plainPart("same");

    // When the part is edited
    const result = await adapter.editPart(77, part);

    // Then the current delivered signature is returned
    expect(result).toEqual({ deliveredSignature: getTelegramRenderedPartSignature(part) });
  });

  it("propagates non-parse Telegram errors", async () => {
    // Given Telegram rejects a rich send for a non-rendering reason
    const api = new FakeApi();
    const error = new Error("Forbidden: bot was blocked");
    api.failNext("sendRichMessage", error);
    const adapter = transport(api);

    // When the part is sent, then the original error escapes without retry
    await expect(adapter.sendPart(richPart())).rejects.toBe(error);
    expect(api.calls).toHaveLength(1);
  });

  it("uses one threaded draft only when enabled for a private chat", async () => {
    // Given private-chat draft streaming is enabled
    const api = new FakeApi();
    const adapter = transport(api, { draftStreaming: true, chatType: "private", threadId: 17 });
    const first = plainPart("first", true);
    const second = richPart("second");

    // When the stream sends and edits partials
    const sent = await adapter.sendPart(first);
    await adapter.editPart(sent.messageId, second);

    // Then both updates reuse one draft id and preserve the thread
    expect(api.calls).toEqual([
      {
        method: "sendMessageDraft",
        args: [42, sent.messageId, "first", { entities, message_thread_id: 17 }],
      },
      {
        method: "sendRichMessageDraft",
        args: [42, sent.messageId, { blocks: second.blocks }, { message_thread_id: 17 }],
      },
    ]);
  });

  it("uses normal messages when draft streaming is disabled or chat is not private", async () => {
    // Given one disabled private transport and one enabled group transport
    const disabledApi = new FakeApi();
    const groupApi = new FakeApi();

    // When each transport sends a part
    await transport(disabledApi, { chatType: "private" }).sendPart(plainPart());
    await transport(groupApi, { draftStreaming: true, chatType: "group" }).sendPart(plainPart());

    // Then neither transport invokes the draft API
    expect(disabledApi.calls[0]?.method).toBe("sendMessage");
    expect(groupApi.calls[0]?.method).toBe("sendMessage");
  });

  it("persists draft completion as a real message", async () => {
    // Given an enabled private draft transport
    const api = new FakeApi();
    const adapter = transport(api, { draftStreaming: true, chatType: "private" });
    const part = richPart("final");

    // When the final part completes
    const result = await adapter.completePart?.(part);

    // Then a persistent rich message is sent
    expect(api.calls).toEqual([
      { method: "sendRichMessage", args: [42, { blocks: part.blocks }, {}] },
    ]);
    expect(result).toEqual({
      messageId: 100,
      deliveredSignature: getTelegramRenderedPartSignature(part),
    });
  });

  it("passes deletion through to Telegram", async () => {
    // Given a transport
    const api = new FakeApi();
    const adapter = transport(api);

    // When streamed text is deleted
    await adapter.deleteText(77);

    // Then the target message is deleted in its chat
    expect(api.calls).toEqual([{ method: "deleteMessage", args: [42, 77] }]);
  });
});
