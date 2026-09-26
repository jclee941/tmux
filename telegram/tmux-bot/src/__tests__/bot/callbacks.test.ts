import { beforeEach, describe, expect, it } from "vitest";
import {
  ALREADY_HANDLED,
  BIND_PATTERN,
  PERMISSION_PATTERN,
  registerBridgeCallbacks,
} from "../../bot/callbacks.js";
import {
  CHAT_ID,
  DIRECTORY,
  OTHER_DIRECTORY,
  binding,
  callbackCtx,
  createFakeBot,
  createFakeDeps,
} from "./fakes.js";
import type { FakeBot, FakeDeps } from "./fakes.js";

const NO_KEYBOARD = { inline_keyboard: [] };

describe("registerBridgeCallbacks", () => {
  let bot: FakeBot;
  let deps: FakeDeps;

  beforeEach(() => {
    bot = createFakeBot();
    deps = createFakeDeps();
    registerBridgeCallbacks(bot, deps);
  });

  it("registers exactly the bind and permission triggers", () => {
    // Given the bridge callbacks registered onto the existing bot
    // When the registered triggers are inspected
    // Then only the two documented payload shapes are claimed
    expect(bot.registeredCallbacks()).toEqual([
      "^bind:(.+)$",
      "^permission:(once|always|reject):(.+)$",
    ]);
    expect(BIND_PATTERN.source).toBe("^bind:(.+)$");
    expect(PERMISSION_PATTERN.source).toBe("^permission:(once|always|reject):(.+)$");
  });

  describe("bind:", () => {
    it("binds the conversation and rewrites the picker into a confirmation", async () => {
      // Given a picker button for a known session in a forum topic
      deps.router.bind.mockResolvedValue({
        ok: true,
        binding: binding({
          threadId: 7,
          tmuxSession: "blacklist",
          directory: OTHER_DIRECTORY,
        }),
      });
      const call = callbackCtx({ data: "bind:blacklist", threadId: 7 });

      // When the button is tapped
      await bot.callbackHandler(BIND_PATTERN)(call.ctx);

      // Then the thread is bound, acknowledged, and the picker becomes a receipt
      expect(deps.router.bind).toHaveBeenCalledWith(CHAT_ID, 7, "blacklist");
      expect(call.answers).toHaveLength(1);
      expect(call.edits).toHaveLength(1);
      expect(call.edits[0]?.text).toContain("blacklist");
      expect(call.edits[0]?.text).toContain(OTHER_DIRECTORY);
      expect(call.edits[0]?.options?.reply_markup).toEqual(NO_KEYBOARD);
    });

    it("keeps the picker intact and reports the error for an unknown session", async () => {
      // Given a session tmux no longer knows
      deps.router.bind.mockResolvedValue({
        ok: false,
        error: "unknown tmux session: ghost",
      });
      const call = callbackCtx({ data: "bind:ghost" });

      // When the stale button is tapped
      await bot.callbackHandler(BIND_PATTERN)(call.ctx);

      // Then the error is surfaced and the picker stays usable
      expect(call.answers[0]).toContain("unknown tmux session: ghost");
      expect(call.edits).toEqual([]);
    });

    it("acknowledges without binding when the callback carries no chat", async () => {
      // Given an inline-message callback with no chat attached
      const call = callbackCtx({ data: "bind:safework", chatId: null });

      // When it arrives
      await bot.callbackHandler(BIND_PATTERN)(call.ctx);

      // Then nothing is bound but Telegram's spinner is still cleared
      expect(deps.router.bind).not.toHaveBeenCalled();
      expect(call.answers).toHaveLength(1);
    });

    it("still binds when the originating message is gone", async () => {
      // Given a callback whose message can no longer be edited
      const call = callbackCtx({ data: "bind:safework", messageId: null });

      // When the button is tapped
      await bot.callbackHandler(BIND_PATTERN)(call.ctx);

      // Then the bind happens and no edit is attempted
      expect(deps.router.bind).toHaveBeenCalledWith(CHAT_ID, null, "safework");
      expect(call.edits).toEqual([]);
      expect(call.answers).toHaveLength(1);
    });

    it("ignores a payload that does not match the bind shape", async () => {
      // Given a malformed payload delivered to the bind handler
      const call = callbackCtx({ data: "bind:" });

      // When it is handled
      await bot.callbackHandler(BIND_PATTERN)(call.ctx);

      // Then no bind is attempted and the spinner is cleared
      expect(deps.router.bind).not.toHaveBeenCalled();
      expect(call.answers).toHaveLength(1);
    });
  });

  describe("permission:", () => {
    beforeEach(() => {
      deps.router.resolveRoute.mockReturnValue({
        binding: binding(),
        directory: DIRECTORY,
      });
    });

    for (const reply of ["once", "always", "reject"] as const) {
      it(`forwards the ${reply} decision to the bound directory`, async () => {
        // Given a pending permission request in a bound conversation
        const call = callbackCtx({ data: `permission:${reply}:per_42` });

        // When the decision button is tapped
        await bot.callbackHandler(PERMISSION_PATTERN)(call.ctx);

        // Then the decision reaches opencode with the request id and directory
        expect(deps.api.permissionReply).toHaveBeenCalledWith("per_42", DIRECTORY, reply);
        expect(call.answers).toHaveLength(1);
      });
    }

    it("rewrites the prompt into an outcome and strips its buttons", async () => {
      // Given a pending permission request
      const call = callbackCtx({ data: "permission:once:per_42" });

      // When it is approved
      await bot.callbackHandler(PERMISSION_PATTERN)(call.ctx);

      // Then the message records the decision and can no longer be re-answered
      expect(call.edits).toHaveLength(1);
      expect(call.edits[0]?.text).toContain("once");
      expect(call.edits[0]?.options?.reply_markup).toEqual(NO_KEYBOARD);
    });

    it("resolves the route of the thread the prompt was posted in", async () => {
      // Given a permission prompt inside a forum topic
      const call = callbackCtx({ data: "permission:always:per_42", threadId: 7 });

      // When it is answered
      await bot.callbackHandler(PERMISSION_PATTERN)(call.ctx);

      // Then the route is resolved for that topic, not the chat root
      expect(deps.router.resolveRoute).toHaveBeenCalledWith(CHAT_ID, 7);
    });

    it("reports an unbound conversation as already handled", async () => {
      // Given a permission prompt whose conversation lost its binding
      deps.router.resolveRoute.mockReturnValue(null);
      const call = callbackCtx({ data: "permission:once:per_42" });

      // When it is answered
      await bot.callbackHandler(PERMISSION_PATTERN)(call.ctx);

      // Then no decision is sent and the button is retired
      expect(deps.api.permissionReply).not.toHaveBeenCalled();
      expect(call.answers).toEqual([ALREADY_HANDLED]);
      expect(call.edits).toEqual([]);
    });

    it("reports a request opencode no longer knows as already handled", async () => {
      // Given opencode rejecting the reply because the request is gone
      deps.api.permissionReply.mockRejectedValue(
        new Error("Failed to reply to permission: NotFound"),
      );
      const call = callbackCtx({ data: "permission:reject:per_42" });

      // When it is answered
      await bot.callbackHandler(PERMISSION_PATTERN)(call.ctx);

      // Then the user is told it is stale and the message is left alone
      expect(call.answers).toEqual([ALREADY_HANDLED]);
      expect(call.edits).toEqual([]);
    });

    it("ignores a payload whose decision verb is not a known reply", async () => {
      // Given a payload carrying a decision the bridge does not implement
      const call = callbackCtx({ data: "permission:maybe:per_42" });

      // When it is handled
      await bot.callbackHandler(PERMISSION_PATTERN)(call.ctx);

      // Then no decision is forwarded and the spinner is cleared
      expect(deps.api.permissionReply).not.toHaveBeenCalled();
      expect(call.answers).toHaveLength(1);
      expect(call.edits).toEqual([]);
    });

    it("acknowledges without deciding when the callback carries no chat", async () => {
      // Given an inline-message permission callback with no chat
      const call = callbackCtx({ data: "permission:once:per_42", chatId: null });

      // When it arrives
      await bot.callbackHandler(PERMISSION_PATTERN)(call.ctx);

      // Then no decision is forwarded
      expect(deps.api.permissionReply).not.toHaveBeenCalled();
      expect(call.answers).toHaveLength(1);
    });
  });
});
