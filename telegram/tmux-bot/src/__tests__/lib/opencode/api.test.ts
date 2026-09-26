import { beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  session: {
    create: vi.fn(),
    prompt: vi.fn(),
    abort: vi.fn(),
    status: vi.fn(),
  },
  permission: { reply: vi.fn() },
}));

vi.mock("../../../lib/opencode/client.js", () => ({
  getOpencodeClient: () => ({
    session: sdk.session,
    permission: sdk.permission,
  }),
}));

import {
  abort,
  createSession,
  permissionReply,
  prompt,
  sessionStatus,
} from "../../../lib/opencode/api.js";

describe("OpenCode API wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards per-call directories and returns SDK data", async () => {
    // Given: successful SDK responses
    const session = { id: "session-1" };
    const prompted = { info: { id: "message-1" }, parts: [] };
    const statuses = { "session-1": { type: "idle" } };
    sdk.session.create.mockResolvedValue({ data: session });
    sdk.session.prompt.mockResolvedValue({ data: prompted });
    sdk.session.abort.mockResolvedValue({ data: true });
    sdk.session.status.mockResolvedValue({ data: statuses });
    sdk.permission.reply.mockResolvedValue({ data: true });

    // When: every wrapper is called
    const created = await createSession("/work/project", "Telegram task");
    const response = await prompt("/work/project", "session-1", "Fix it");
    const aborted = await abort("session-1");
    const current = await sessionStatus();
    const replied = await permissionReply(
      "permission-1",
      "/work/project",
      "once",
    );

    // Then: data is returned and directory stays on each scoped request
    expect(created).toBe(session);
    expect(response).toBe(prompted);
    expect(aborted).toBe(true);
    expect(current).toBe(statuses);
    expect(replied).toBe(true);
    expect(sdk.session.create).toHaveBeenCalledWith({
      directory: "/work/project",
      title: "Telegram task",
    });
    expect(sdk.session.prompt).toHaveBeenCalledWith({
      directory: "/work/project",
      sessionID: "session-1",
      parts: [{ type: "text", text: "Fix it" }],
    });
    expect(sdk.session.abort).toHaveBeenCalledWith({ sessionID: "session-1" });
    expect(sdk.session.status).toHaveBeenCalledWith();
    expect(sdk.permission.reply).toHaveBeenCalledWith({
      requestID: "permission-1",
      directory: "/work/project",
      reply: "once",
    });
  });

  it.each([
    ["create session", () => createSession("/work"), sdk.session.create],
    ["prompt session", () => prompt("/work", "s1", "hello"), sdk.session.prompt],
    ["abort session", () => abort("s1"), sdk.session.abort],
    ["get session status", () => sessionStatus(), sdk.session.status],
    [
      "reply to permission",
      () => permissionReply("p1", "/work", "reject"),
      sdk.permission.reply,
    ],
  ])("throws a useful error when %s fails", async (operation, invoke, method) => {
    // Given: an SDK error payload
    method.mockResolvedValue({ error: { message: "denied", code: "E_TEST" } });

    // When / Then: the wrapper rejects with operation context and SDK detail
    await expect(invoke()).rejects.toThrow(
      new RegExp(`${operation}.*denied`, "i"),
    );
  });
});
