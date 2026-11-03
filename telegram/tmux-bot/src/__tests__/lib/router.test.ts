import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TmuxSession } from "../../types.js";
import { createBindingStore } from "../../lib/store/bindings.js";
import type { Binding, BindingStore } from "../../lib/store/bindings.js";
import { createRouter } from "../../lib/router.js";
import type { BindResult, Router } from "../../lib/router.js";

const listSessionsMock = vi.hoisted(() =>
  vi.fn<() => Promise<TmuxSession[]>>(),
);

vi.mock("../../lib/tmux.js", () => ({ listSessions: listSessionsMock }));

const EPOCH = "2026-01-01T00:00:00.000Z";

/** Deterministic clock: every read advances by `stepMs`. No wall-clock flake. */
function stepClock(stepMs = 1_000): () => Date {
  const base = Date.parse(EPOCH);
  let tick = 0;
  return () => new Date(base + stepMs * tick++);
}

function session(name: string, path: string): TmuxSession {
  return {
    name,
    windows: 1,
    created: 1_700_000_000,
    attached: false,
    path,
    activity: 1_700_000_010,
  };
}

/** Narrow a bind result to its binding, failing the test with the error text. */
function bound(result: BindResult): Binding {
  if (!result.ok) throw new Error(`expected bind to succeed: ${result.error}`);
  return result.binding;
}

const SAFEWORK = session("safework", "/home/jclee/dev/safework");
const BLACKLIST = session("blacklist", "/home/jclee/dev/blacklist");

describe("createRouter", () => {
  let dir: string;
  let store: BindingStore;
  let router: Router;

  const stored = (chatId: number, threadId: number | null): Binding => {
    const binding = store.getByChat(chatId, threadId);
    if (binding === null) {
      throw new Error(`no binding for ${chatId}:${threadId}`);
    }
    return binding;
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "tmux-bot-router-"));
    store = createBindingStore(join(dir, "bindings.json"), {
      now: stepClock(),
    });
    listSessionsMock.mockReset();
    listSessionsMock.mockResolvedValue([SAFEWORK, BLACKLIST]);
    router = createRouter({ store, tmux: { listSessions: listSessionsMock } });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("resolves no route for an unbound conversation", () => {
    // Given a router over an empty store
    // When an unbound (chat, thread) pair is resolved
    const route = router.resolveRoute(100, null);

    // Then there is no route
    expect(route).toBeNull();
  });

  it("resolves a bound conversation to its binding and directory", async () => {
    // Given a chat bound to a known tmux session
    await router.bind(100, null, "safework");

    // When the route is resolved
    const route = router.resolveRoute(100, null);

    // Then the binding and its project directory come back together
    expect(route?.directory).toBe("/home/jclee/dev/safework");
    expect(route?.binding).toMatchObject({
      chatId: 100,
      threadId: null,
      tmuxSession: "safework",
      directory: "/home/jclee/dev/safework",
      opencodeSessionId: null,
    });
  });

  it("discovers tmux sessions as name/path candidates", async () => {
    // Given tmux reporting two sessions
    // When candidates are discovered
    const candidates = await router.discoverSessions();

    // Then each session is reduced to the fields a bind menu needs
    expect(candidates).toEqual([
      { name: "safework", path: "/home/jclee/dev/safework" },
      { name: "blacklist", path: "/home/jclee/dev/blacklist" },
    ]);
  });

  it("discovers nothing when tmux reports no sessions", async () => {
    // Given a tmux server with no sessions
    listSessionsMock.mockResolvedValue([]);

    // When candidates are discovered
    const candidates = await router.discoverSessions();

    // Then the list is empty
    expect(candidates).toEqual([]);
  });

  it("binds a known session using its session_path as the directory", async () => {
    // Given a known tmux session
    // When the chat binds to it
    const binding = bound(await router.bind(100, 42, "blacklist"));

    // Then the binding is stored with the tmux session_path as directory
    expect(binding).toMatchObject({
      chatId: 100,
      threadId: 42,
      tmuxSession: "blacklist",
      directory: "/home/jclee/dev/blacklist",
      opencodeSessionId: null,
      createdAt: EPOCH,
    });
    expect(stored(100, 42).directory).toBe("/home/jclee/dev/blacklist");
  });

  it("returns an error result instead of throwing for an unknown session", async () => {
    // Given a session name tmux does not know
    // When the chat tries to bind to it
    const result = await router.bind(100, null, "ghost");

    // Then an error result naming the session is returned, and nothing persists
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toContain("ghost");
    expect(store.getByChat(100, null)).toBeNull();
    expect(router.listBindings()).toEqual([]);
  });

  it("detaches the opencode session when rebinding to another directory", async () => {
    // Given a chat bound to one project with a live opencode session
    await router.bind(100, null, "safework");
    store.setOpencodeSession(100, null, "ses_safework");

    // When the chat rebinds to a session in a different directory
    const rebound = bound(await router.bind(100, null, "blacklist"));

    // Then the opencode session does not follow it across projects
    expect(rebound.opencodeSessionId).toBeNull();
    expect(store.getByOpencodeSession("ses_safework")).toBeNull();
  });

  it("keeps the opencode session when rebinding to the same session", async () => {
    // Given a chat bound to a project with a live opencode session
    await router.bind(100, null, "safework");
    store.setOpencodeSession(100, null, "ses_safework");

    // When the same bind is repeated
    const rebound = bound(await router.bind(100, null, "safework"));

    // Then the conversation keeps talking to the same opencode session
    expect(rebound.opencodeSessionId).toBe("ses_safework");
  });

  it("replaces the binding when the same conversation rebinds", async () => {
    // Given a chat already bound to one session
    await router.bind(100, null, "safework");

    // When the same chat binds to a different session
    const rebound = bound(await router.bind(100, null, "blacklist"));

    // Then one entry survives, now pointing at the new session and directory
    expect(rebound.tmuxSession).toBe("blacklist");
    expect(router.listBindings()).toHaveLength(1);
    expect(router.resolveRoute(100, null)).toMatchObject({
      directory: "/home/jclee/dev/blacklist",
      binding: { tmuxSession: "blacklist" },
    });
  });

  it("unbinds an existing route once and reports the second attempt as a miss", async () => {
    // Given a bound chat
    await router.bind(100, null, "safework");

    // When it is unbound twice
    const first = router.unbind(100, null);
    const second = router.unbind(100, null);

    // Then only the first removal reports success and the route is gone
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(router.resolveRoute(100, null)).toBeNull();
  });

  it("keeps a route resolvable after its tmux session disappears", async () => {
    // Given a binding created while the session existed
    await router.bind(100, null, "safework");
    const binding = stored(100, null);

    // When tmux no longer reports that session
    listSessionsMock.mockResolvedValue([BLACKLIST]);

    // Then the binding is flagged stale but still routes to the stored directory
    expect(await router.isStale(binding)).toBe(true);
    expect(router.resolveRoute(100, null)?.directory).toBe(
      "/home/jclee/dev/safework",
    );
  });

  it("reports a live session as not stale", async () => {
    // Given a binding whose tmux session is still running
    await router.bind(100, null, "safework");

    // When staleness is checked
    // Then the binding is fresh
    expect(await router.isStale(stored(100, null))).toBe(false);
  });

  it("keeps the chat root and a forum thread as distinct routes", async () => {
    // Given the same chat binding its root and one topic thread
    await router.bind(100, null, "safework");
    await router.bind(100, 42, "blacklist");

    // When each route is resolved
    // Then both coexist and resolve to their own directories
    expect(router.listBindings()).toHaveLength(2);
    expect(router.resolveRoute(100, null)?.directory).toBe(
      "/home/jclee/dev/safework",
    );
    expect(router.resolveRoute(100, 42)?.directory).toBe(
      "/home/jclee/dev/blacklist",
    );
    expect(router.resolveRoute(100, 7)).toBeNull();
  });

  it("defaults to the real tmux module when no tmux port is injected", async () => {
    // Given a router built without an explicit tmux port
    const defaulted = createRouter({ store });

    // When sessions are discovered
    const candidates = await defaulted.discoverSessions();

    // Then it calls through to the module-level tmux binding
    expect(listSessionsMock).toHaveBeenCalledOnce();
    expect(candidates).toEqual([
      { name: "safework", path: "/home/jclee/dev/safework" },
      { name: "blacklist", path: "/home/jclee/dev/blacklist" },
    ]);
  });
});
