import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/config.js", () => ({
  config: {
    slack: {
      botToken: "xoxb-test",
      signingSecret: "",
      mode: "socket",
      appToken: "xapp-test",
      httpPort: 3000,
      channels: {
        opencode: "C-OPENCODE",
      },
    },
    tmux: {
      socket: "default",
      home: "/tmp/.tmux",
    },
    notify: { port: 9876 },
    opencode: {
      url: "http://localhost:0",
      directory: "/tmp",
      enabled: true,
    },
  },
}));

describe("channels", () => {
  it("getNotifyChannel returns configured opencode channel", async () => {
    const { getNotifyChannel } = await import("../lib/channels.js");
    expect(getNotifyChannel()).toBe("C-OPENCODE");
  });
});
