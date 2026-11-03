import { beforeEach, describe, expect, it } from "vitest";
import type { Bot } from "grammy";
import type * as OpencodeApiModule from "../../lib/opencode/api.js";
import type { BridgeApi, BridgeBot } from "../../bot/deps.js";
import {
  BOUND_MARK,
  promptBoundSession,
  registerBridgeCommands,
} from "../../bot/commands.js";
import {
  CHAT_ID,
  DIRECTORY,
  OTHER_DIRECTORY,
  binding,
  buttonLabels,
  callbackData,
  commandCtx,
  createFakeBot,
  createFakeDeps,
} from "./fakes.js";
import type { FakeBot, FakeDeps } from "./fakes.js";

/** Commands src/index.ts already owns; the bridge layer must not shadow them. */
const EXISTING_COMMANDS = [
  "start",
  "menu",
  "help",
  "windows",
  "stop",
  "stopall",
  "streams",
  "cap",
] as const;

// Compile-time proof that the entrypoint can pass the real grammY bot.
type BotSatisfiesPort = Bot extends BridgeBot ? true : never;
const botSatisfiesPort: BotSatisfiesPort = true;

// Compile-time proof that the entrypoint can pass the real opencode api module.
type ApiModuleSatisfiesPort = typeof OpencodeApiModule extends BridgeApi ? true : never;
const apiModuleSatisfiesPort: ApiModuleSatisfiesPort = true;

describe("registerBridgeCommands", () => {
  let bot: FakeBot;
  let deps: FakeDeps;

  beforeEach(() => {
    bot = createFakeBot();
    deps = createFakeDeps();
    registerBridgeCommands(bot, deps);
  });

  it("registers the bridge commands without shadowing the pane-mirror ones", () => {
    // Given the bridge layer registered onto the existing bot
    // When the registered command names are inspected
    const registered = bot.registeredCommands();

    // Then it owns exactly the bridge verbs and collides with none of index.ts
    expect(registered).toEqual(["sessions", "use", "new", "status", "abort"]);
    expect(botSatisfiesPort && apiModuleSatisfiesPort).toBe(true);
    for (const existing of EXISTING_COMMANDS) {
      expect(registered).not.toContain(existing);
    }
  });

  describe("/sessions", () => {
    it("offers every tmux session as its own bind button", async () => {
      // Given tmux reporting two sessions
      deps.router.discoverSessions.mockResolvedValue([
        { name: "safework", path: DIRECTORY },
        { name: "blacklist", path: OTHER_DIRECTORY },
      ]);

      // When /sessions runs in an unbound chat
      const call = commandCtx();
      await bot.commandHandler("sessions")(call.ctx);

      // Then each session becomes one bind: button carrying its name
      expect(call.replies).toHaveLength(1);
      expect(callbackData(call.replies[0]?.options?.reply_markup)).toEqual([
        "bind:safework",
        "bind:blacklist",
      ]);
    });

    it("marks the session this conversation is already bound to", async () => {
      // Given a chat already bound to the second of two sessions
      deps.router.discoverSessions.mockResolvedValue([
        { name: "safework", path: DIRECTORY },
        { name: "blacklist", path: OTHER_DIRECTORY },
      ]);
      deps.router.resolveRoute.mockReturnValue({
        binding: binding({ tmuxSession: "blacklist", directory: OTHER_DIRECTORY }),
        directory: OTHER_DIRECTORY,
      });

      // When /sessions runs
      const call = commandCtx();
      await bot.commandHandler("sessions")(call.ctx);

      // Then only the bound session's label carries the bound mark
      const labels = buttonLabels(call.replies[0]?.options?.reply_markup);
      expect(labels[0]?.startsWith(BOUND_MARK)).toBe(false);
      expect(labels[1]?.startsWith(BOUND_MARK)).toBe(true);
      expect(labels[1]).toContain("blacklist");
    });

    it("explains what to do when tmux has no sessions", async () => {
      // Given a tmux server with no sessions
      deps.router.discoverSessions.mockResolvedValue([]);

      // When /sessions runs
      const call = commandCtx();
      await bot.commandHandler("sessions")(call.ctx);

      // Then a keyboard-less hint is sent instead of an empty picker
      expect(call.replies).toHaveLength(1);
      expect(call.replies[0]?.options?.reply_markup).toBeUndefined();
      expect(call.replies[0]?.text).toContain("tmux");
    });
  });

  describe("/use", () => {
    it("binds the conversation to the named session", async () => {
      // Given a forum topic issuing /use for a known session
      deps.router.bind.mockResolvedValue({
        ok: true,
        binding: binding({ threadId: 42, tmuxSession: "blacklist", directory: OTHER_DIRECTORY }),
      });

      // When /use blacklist runs in that thread
      const call = commandCtx({ threadId: 42, match: " blacklist " });
      await bot.commandHandler("use")(call.ctx);

      // Then the thread identity reaches the router and the bind is confirmed
      expect(deps.router.bind).toHaveBeenCalledWith(CHAT_ID, 42, "blacklist");
      expect(call.replies[0]?.text).toContain("blacklist");
      expect(call.replies[0]?.text).toContain(OTHER_DIRECTORY);
    });

    it("treats the chat root as a null thread", async () => {
      // Given a root-chat message with no forum topic
      // When /use runs
      const call = commandCtx({ match: "safework" });
      await bot.commandHandler("use")(call.ctx);

      // Then the router is addressed with a null thread id
      expect(deps.router.bind).toHaveBeenCalledWith(CHAT_ID, null, "safework");
    });

    it("asks for a session name when the argument is missing", async () => {
      // Given /use with no argument
      const call = commandCtx({ match: "   " });

      // When it runs
      await bot.commandHandler("use")(call.ctx);

      // Then nothing is bound and the usage is shown
      expect(deps.router.bind).not.toHaveBeenCalled();
      expect(call.replies[0]?.text).toContain("/use");
    });

    it("surfaces the router error for an unknown session", async () => {
      // Given a session name tmux does not know
      deps.router.bind.mockResolvedValue({
        ok: false,
        error: "unknown tmux session: ghost",
      });

      // When /use ghost runs
      const call = commandCtx({ match: "ghost" });
      await bot.commandHandler("use")(call.ctx);

      // Then the router's own error text is reported back
      expect(call.replies[0]?.text).toContain("unknown tmux session: ghost");
    });
  });

  describe("/new", () => {
    it("creates a fresh opencode session and persists it on the binding", async () => {
      // Given a bound conversation
      deps.router.resolveRoute.mockReturnValue({ binding: binding(), directory: DIRECTORY });
      deps.api.createSession.mockResolvedValue({ id: "ses_fresh" });

      // When /new runs
      const call = commandCtx();
      await bot.commandHandler("new")(call.ctx);

      // Then the session is created in the bound directory and stored
      expect(deps.api.createSession).toHaveBeenCalledWith(DIRECTORY);
      expect(deps.store.setOpencodeSession).toHaveBeenCalledWith(CHAT_ID, null, "ses_fresh");
      expect(call.replies[0]?.text).toContain("ses_fresh");
    });

    it("replaces the opencode session already attached to the binding", async () => {
      // Given a binding that already drives an opencode session
      deps.router.resolveRoute.mockReturnValue({
        binding: binding({ opencodeSessionId: "ses_old" }),
        directory: DIRECTORY,
      });
      deps.api.createSession.mockResolvedValue({ id: "ses_fresh" });

      // When /new runs
      const call = commandCtx();
      await bot.commandHandler("new")(call.ctx);

      // Then a new session is created regardless of the existing one
      expect(deps.api.createSession).toHaveBeenCalledOnce();
      expect(deps.store.setOpencodeSession).toHaveBeenCalledWith(CHAT_ID, null, "ses_fresh");
    });

    it("tells an unbound conversation how to bind first", async () => {
      // Given a conversation with no binding
      // When /new runs
      const call = commandCtx();
      await bot.commandHandler("new")(call.ctx);

      // Then no session is created and the bind path is explained
      expect(deps.api.createSession).not.toHaveBeenCalled();
      expect(call.replies[0]?.text).toContain("/sessions");
    });

    it("reports the failure when opencode is down", async () => {
      // Given a bound conversation and an unreachable opencode server
      deps.router.resolveRoute.mockReturnValue({ binding: binding(), directory: DIRECTORY });
      deps.api.createSession.mockRejectedValue(new Error("connect ECONNREFUSED"));

      // When /new runs
      const call = commandCtx();
      await bot.commandHandler("new")(call.ctx);

      // Then nothing is persisted and the failure reaches the user
      expect(deps.store.setOpencodeSession).not.toHaveBeenCalled();
      expect(call.replies[0]?.text).toContain("connect ECONNREFUSED");
    });
  });

  describe("/status", () => {
    it("reports the binding and a reachable opencode server", async () => {
      // Given a live binding with an opencode session
      deps.router.resolveRoute.mockReturnValue({
        binding: binding({ opencodeSessionId: "ses_live" }),
        directory: DIRECTORY,
      });

      // When /status runs
      const call = commandCtx();
      await bot.commandHandler("status")(call.ctx);

      // Then the route facts and a reachability probe are reported
      expect(deps.api.sessionStatus).toHaveBeenCalledOnce();
      const text = call.replies[0]?.text ?? "";
      expect(text).toContain("safework");
      expect(text).toContain(DIRECTORY);
      expect(text).toContain("ses_live");
    });

    it("distinguishes a stale binding from a live one", async () => {
      // Given the same binding reported live, then stale
      deps.router.resolveRoute.mockReturnValue({ binding: binding(), directory: DIRECTORY });
      const live = commandCtx();
      await bot.commandHandler("status")(live.ctx);

      deps.router.isStale.mockResolvedValue(true);
      const stale = commandCtx();

      // When /status runs again
      await bot.commandHandler("status")(stale.ctx);

      // Then staleness is checked against the binding and changes the report
      expect(deps.router.isStale).toHaveBeenLastCalledWith(binding());
      expect(stale.replies[0]?.text).not.toBe(live.replies[0]?.text);
    });

    it("reports an unreachable opencode server without failing the command", async () => {
      // Given a bound conversation and a refused opencode connection
      deps.router.resolveRoute.mockReturnValue({ binding: binding(), directory: DIRECTORY });
      deps.api.sessionStatus.mockRejectedValue(new Error("connect ECONNREFUSED"));

      // When /status runs
      const call = commandCtx();
      await bot.commandHandler("status")(call.ctx);

      // Then the probe failure is part of the report
      expect(call.replies[0]?.text).toContain("connect ECONNREFUSED");
    });

    it("tells an unbound conversation how to bind", async () => {
      // Given no binding for this conversation
      // When /status runs
      const call = commandCtx();
      await bot.commandHandler("status")(call.ctx);

      // Then the bind path is explained and no probe is wasted
      expect(call.replies[0]?.text).toContain("/sessions");
      expect(deps.router.isStale).not.toHaveBeenCalled();
    });
  });

  describe("/abort", () => {
    it("aborts the opencode session the binding drives", async () => {
      // Given a binding with a running opencode session
      deps.router.resolveRoute.mockReturnValue({
        binding: binding({ opencodeSessionId: "ses_live" }),
        directory: DIRECTORY,
      });

      // When /abort runs
      const call = commandCtx();
      await bot.commandHandler("abort")(call.ctx);

      // Then that exact session is aborted and confirmed
      expect(deps.api.abort).toHaveBeenCalledWith("ses_live");
      expect(call.replies[0]?.text).toContain("ses_live");
    });

    it("has nothing to abort when the binding has no opencode session", async () => {
      // Given a binding that never started an opencode session
      deps.router.resolveRoute.mockReturnValue({ binding: binding(), directory: DIRECTORY });

      // When /abort runs
      const call = commandCtx();
      await bot.commandHandler("abort")(call.ctx);

      // Then no abort is attempted
      expect(deps.api.abort).not.toHaveBeenCalled();
      expect(call.replies).toHaveLength(1);
    });

    it("has nothing to abort when the conversation is unbound", async () => {
      // Given no binding at all
      // When /abort runs
      const call = commandCtx();
      await bot.commandHandler("abort")(call.ctx);

      // Then no abort is attempted
      expect(deps.api.abort).not.toHaveBeenCalled();
      expect(call.replies).toHaveLength(1);
    });

    it("reports the failure when the abort call fails", async () => {
      // Given a live opencode session and a failing abort
      deps.router.resolveRoute.mockReturnValue({
        binding: binding({ opencodeSessionId: "ses_live" }),
        directory: DIRECTORY,
      });
      deps.api.abort.mockRejectedValue(new Error("connect ECONNREFUSED"));

      // When /abort runs
      const call = commandCtx();
      await bot.commandHandler("abort")(call.ctx);

      // Then the failure reaches the user
      expect(call.replies[0]?.text).toContain("connect ECONNREFUSED");
    });
  });
});

describe("promptBoundSession", () => {
  let deps: FakeDeps;

  beforeEach(() => {
    deps = createFakeDeps();
  });

  it("prompts the opencode session the binding already drives", async () => {
    // Given a binding with a live opencode session
    deps.router.resolveRoute.mockReturnValue({
      binding: binding({ opencodeSessionId: "ses_live" }),
      directory: DIRECTORY,
    });

    // When a chat message is routed to it
    const result = await promptBoundSession(deps, CHAT_ID, null, "run the tests");

    // Then the text reaches that session and no new one is created
    expect(deps.api.prompt).toHaveBeenCalledWith(DIRECTORY, "ses_live", "run the tests");
    expect(deps.api.createSession).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, sessionId: "ses_live", created: false });
  });

  it("refuses to prompt an unbound conversation", async () => {
    // Given no binding for the conversation
    // When a chat message is routed
    const result = await promptBoundSession(deps, CHAT_ID, null, "hello");

    // Then it reports the unbound reason and touches no api
    expect(result).toEqual({ ok: false, reason: "unbound" });
    expect(deps.api.prompt).not.toHaveBeenCalled();
    expect(deps.api.createSession).not.toHaveBeenCalled();
  });

  it("creates the opencode session once and reuses it afterwards", async () => {
    // Given a binding with no opencode session yet, backed by a persisting store
    let current = binding({ opencodeSessionId: null });
    deps.router.resolveRoute.mockImplementation(() => ({
      binding: current,
      directory: DIRECTORY,
    }));
    deps.store.setOpencodeSession.mockImplementation((_chatId, _threadId, sessionId) => {
      current = binding({ opencodeSessionId: sessionId });
      return current;
    });
    deps.api.createSession.mockResolvedValue({ id: "ses_auto" });

    // When two messages are routed in a row
    const first = await promptBoundSession(deps, CHAT_ID, null, "first");
    const second = await promptBoundSession(deps, CHAT_ID, null, "second");

    // Then only the first message created a session; both prompt the same one
    expect(deps.api.createSession).toHaveBeenCalledExactlyOnceWith(DIRECTORY);
    expect(deps.store.setOpencodeSession).toHaveBeenCalledExactlyOnceWith(
      CHAT_ID,
      null,
      "ses_auto",
    );
    expect(first).toEqual({ ok: true, sessionId: "ses_auto", created: true });
    expect(second).toEqual({ ok: true, sessionId: "ses_auto", created: false });
    expect(deps.api.prompt).toHaveBeenNthCalledWith(1, DIRECTORY, "ses_auto", "first");
    expect(deps.api.prompt).toHaveBeenNthCalledWith(2, DIRECTORY, "ses_auto", "second");
  });

  it("reports an error instead of throwing when opencode is down", async () => {
    // Given a bound conversation and an unreachable opencode server
    deps.router.resolveRoute.mockReturnValue({
      binding: binding({ opencodeSessionId: "ses_live" }),
      directory: DIRECTORY,
    });
    deps.api.prompt.mockRejectedValue(new Error("connect ECONNREFUSED"));

    // When a chat message is routed
    const result = await promptBoundSession(deps, CHAT_ID, null, "hello");

    // Then the caller gets a typed failure carrying the server error
    expect(result).toEqual({
      ok: false,
      reason: "error",
      error: "connect ECONNREFUSED",
    });
  });

  it("reports an error when the session cannot be created", async () => {
    // Given a binding with no opencode session and a failing create
    deps.router.resolveRoute.mockReturnValue({ binding: binding(), directory: DIRECTORY });
    deps.api.createSession.mockRejectedValue(new Error("connect ECONNREFUSED"));

    // When a chat message is routed
    const result = await promptBoundSession(deps, CHAT_ID, null, "hello");

    // Then no prompt is attempted and the failure is returned
    expect(deps.api.prompt).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      reason: "error",
      error: "connect ECONNREFUSED",
    });
  });
});
