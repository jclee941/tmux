import { beforeEach, describe, expect, it, vi } from "vitest";

const mockList = vi.fn();
const mockCreate = vi.fn();
const mockSetTopic = vi.fn();
const mockArchive = vi.fn();
const mockListSessions = vi.fn();

vi.mock("@slack/web-api", () => {
  class WebClient {
    conversations = {
      list: mockList,
      create: mockCreate,
      setTopic: mockSetTopic,
      archive: mockArchive,
    };
  }
  return { WebClient };
});

vi.mock("../lib/config.js", () => ({
  config: {
    slack: {
      botToken: "xoxb-test",
      signingSecret: "",
      channelId: "fallback-id",
      mode: "socket",
      appToken: "xapp-test",
      httpPort: 3000,
      channels: {
        tmux: "tmux-id",
        opencode: "opencode-id",
      },
      inviteUsers: [],
    },
    tmux: {
      socket: "default",
      home: "/tmp/.tmux",
      scanDir: "/definitely-missing-dir-for-tests",
    },
    notify: { port: 9876 },
    supermemory: {
      enabled: false,
      url: "http://localhost:8050",
    },
  },
}));

vi.mock("../lib/tmux.js", () => ({
  listSessions: mockListSessions,
}));

describe("channels", () => {
  beforeEach(() => {
    vi.resetModules();
    mockList.mockReset();
    mockCreate.mockReset();
    mockSetTopic.mockReset();
    mockArchive.mockReset();
    mockListSessions.mockReset();

    mockSetTopic.mockResolvedValue({ ok: true });
    mockArchive.mockResolvedValue({ ok: true });
  });

  it("resolveSessionChannel uses cache after first lookup", async () => {
    mockList.mockResolvedValue({ channels: [], response_metadata: {} });
    mockCreate.mockResolvedValue({ channel: { id: "CNEW" } });

    const channels = await import("../lib/channels.js");

    const first = await channels.resolveSessionChannel("My Session");
    const second = await channels.resolveSessionChannel("My Session");

    expect(first).toBe("CNEW");
    expect(second).toBe("CNEW");
    expect(mockList).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({ name: "tmux-my-session" });
  });

  it("initChannelRegistry creates channels for missing sessions", async () => {
    mockList.mockResolvedValue({ channels: [], response_metadata: {} });
    mockCreate.mockResolvedValue({ channel: { id: "CFOO" } });
    mockListSessions.mockResolvedValue([
      {
        name: "foo",
        windows: 1,
        created: 1,
        attached: false,
        path: "/tmp",
        activity: 1,
      },
      {
        name: "opencode",
        windows: 1,
        created: 1,
        attached: false,
        path: "/tmp",
        activity: 1,
      },
    ]);

    const channels = await import("../lib/channels.js");
    await channels.initChannelRegistry();

    expect(mockCreate).toHaveBeenCalledWith({ name: "tmux-foo" });

    const registry = channels.getChannelRegistry();
    expect(registry.get("foo")).toBe("CFOO");
    expect(registry.get("opencode")).toBe("opencode-id");
    expect(registry.get("tmux")).toBe("tmux-id");
    expect(registry.get("__fallback__")).toBe("fallback-id");
  });

  it("initChannelRegistry detects stale tmux channels without archiving", async () => {
    mockList.mockResolvedValue({
      channels: [
        { name: "tmux-stale", id: "CSTALE" },
        { name: "tmux-keep", id: "CKEEP" },
      ],
      response_metadata: {},
    });
    mockCreate.mockResolvedValue({ channel: { id: "CKEEP" } });
    mockListSessions.mockResolvedValue([
      {
        name: "keep",
        windows: 1,
        created: 1,
        attached: false,
        path: "/tmp",
        activity: 1,
      },
    ]);

    const channels = await import("../lib/channels.js");
    await channels.initChannelRegistry();

    // Code intentionally logs stale channels without archiving (see channels.ts L195)
    expect(mockArchive).not.toHaveBeenCalled();
  });
});
