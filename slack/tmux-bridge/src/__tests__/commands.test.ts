import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/tmux.js", () => ({
  listSessions: vi.fn(),
  createSession: vi.fn(),
  killSession: vi.fn(),
  renameSession: vi.fn(),
  sendKeys: vi.fn(),
  capturePane: vi.fn(),
  syncSessions: vi.fn(),
  runSessionSync: vi.fn(),
  launchOpencode: vi.fn(),
  sendToOpencode: vi.fn(),
}));

vi.mock("../lib/config.js", () => ({
  config: {
    slack: {
      botToken: "xoxb-test",
      signingSecret: "",
      channelId: "",
      mode: "socket",
      appToken: "xapp-test",
      httpPort: 3000,
      channels: { tmux: "", opencode: "" },
      inviteUsers: [],
    },
    tmux: { socket: "default", home: "/tmp/.tmux", scanDir: "/tmp" },
    notify: { port: 9876 },
    supermemory: { enabled: false, url: "" },
    opencode: { url: "http://localhost:4321", directory: "/tmp", enabled: false },
  },
}));

vi.mock("../lib/opencode.js", () => ({
  listOpencodeSessions: vi.fn(),
  getSessionStatus: vi.fn(),
  createOCSession: vi.fn(),
  promptSession: vi.fn(),
  getSessionMessages: vi.fn(),
  getSessionTodos: vi.fn(),
  getSessionDiff: vi.fn(),
  abortSession: vi.fn(),
}));

vi.mock("../lib/channels.js", () => ({
  resolveSessionChannel: vi.fn(),
  initChannelRegistry: vi.fn(),
  getChannelRegistry: vi.fn(),
}));

vi.mock("../lib/formatter.js", () => ({
  formatSessionDashboard: vi.fn(),
  formatCreated: vi.fn(),
  formatKilled: vi.fn(),
  formatRenamed: vi.fn(),
  formatCapture: vi.fn(),
  formatSendKeys: vi.fn(),
  formatSync: vi.fn(),
  formatOpencode: vi.fn(),
  formatError: vi.fn(),
  formatHelp: vi.fn(),
}));

import { parseCommand } from "../commands/handler.js";

describe("parseCommand", () => {
  it("parses empty input as list", () => {
    expect(parseCommand("")).toEqual({ subcommand: "list", args: [], raw: "" });
  });

  it("parses list and ls", () => {
    expect(parseCommand("list").subcommand).toBe("list");
    expect(parseCommand("ls").subcommand).toBe("ls");
  });

  it("parses new/create", () => {
    expect(parseCommand("new my-session /tmp")).toEqual({
      subcommand: "new",
      args: ["my-session", "/tmp"],
      raw: "new my-session /tmp",
    });
    expect(parseCommand("create foo")).toEqual({
      subcommand: "create",
      args: ["foo"],
      raw: "create foo",
    });
  });

  it("parses kill/rm", () => {
    expect(parseCommand("kill bar")).toEqual({
      subcommand: "kill",
      args: ["bar"],
      raw: "kill bar",
    });
    expect(parseCommand("rm baz")).toEqual({
      subcommand: "rm",
      args: ["baz"],
      raw: "rm baz",
    });
  });

  it("parses rename/mv", () => {
    expect(parseCommand("rename old new")).toEqual({
      subcommand: "rename",
      args: ["old", "new"],
      raw: "rename old new",
    });
    expect(parseCommand("mv a b")).toEqual({
      subcommand: "mv",
      args: ["a", "b"],
      raw: "mv a b",
    });
  });

  it("parses send/type", () => {
    expect(parseCommand("send target ls -la")).toEqual({
      subcommand: "send",
      args: ["target", "ls", "-la"],
      raw: "send target ls -la",
    });
    expect(parseCommand("type target echo hi")).toEqual({
      subcommand: "type",
      args: ["target", "echo", "hi"],
      raw: "type target echo hi",
    });
  });

  it("parses capture/cap", () => {
    expect(parseCommand("capture sess 100")).toEqual({
      subcommand: "capture",
      args: ["sess", "100"],
      raw: "capture sess 100",
    });
    expect(parseCommand("cap sess")).toEqual({
      subcommand: "cap",
      args: ["sess"],
      raw: "cap sess",
    });
  });

  it("parses sync and sync with args", () => {
    expect(parseCommand("sync")).toEqual({
      subcommand: "sync",
      args: [],
      raw: "sync",
    });
    expect(parseCommand("sync --dry-run")).toEqual({
      subcommand: "sync",
      args: ["--dry-run"],
      raw: "sync --dry-run",
    });
  });

  it("parses opencode/oc", () => {
    expect(parseCommand("opencode")).toEqual({
      subcommand: "opencode",
      args: [],
      raw: "opencode",
    });
    expect(parseCommand("oc some prompt")).toEqual({
      subcommand: "oc",
      args: ["some", "prompt"],
      raw: "oc some prompt",
    });
  });

  it("parses help and falls back invalid to help", () => {
    expect(parseCommand("help")).toEqual({
      subcommand: "help",
      args: [],
      raw: "help",
    });
    expect(parseCommand("invalid-command")).toEqual({
      subcommand: "help",
      args: [],
      raw: "invalid-command",
    });
  });

  it("trims whitespace", () => {
    expect(parseCommand("  list  ")).toEqual({
      subcommand: "list",
      args: [],
      raw: "list",
    });
  });
});
