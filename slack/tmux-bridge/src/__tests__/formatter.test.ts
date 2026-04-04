import { describe, expect, it } from "vitest";
import {
  buildNewSessionModal,
  buildRenameModal,
  buildSendKeysModal,
  formatActionResult,
  formatCapture,
  formatCreated,
  formatError,
  formatHelp,
  formatIdleNotification,
  formatKilled,
  formatNotifyEvent,
  formatOpencode,
  formatRenamed,
  formatSendKeys,
  formatSessionDashboard,
  formatSessionList,
  formatSync,
} from "../lib/formatter/index.js";
import {
  ActionId,
  CallbackId,
  type NotifyEvent,
  type TmuxSession,
} from "../types.js";

describe("formatter", () => {
  it("formats empty session list", () => {
    const out = formatSessionList([]);
    expect(out.text).toContain("No active");
    expect(out.blocks[0]).toMatchObject({ type: "header" });
  });

  it("formats non-empty session list with status icon", () => {
    const sessions: TmuxSession[] = [
      {
        name: "alpha",
        windows: 2,
        created: 1,
        attached: true,
        path: "/tmp",
        activity: Math.floor(Date.now() / 1000),
      },
      {
        name: "beta",
        windows: 1,
        created: 1,
        attached: false,
        path: "/home",
        activity: Math.floor(Date.now() / 1000),
      },
    ];
    const out = formatSessionList(sessions);
    expect(out.text).toContain("2 active");
    const blockText = JSON.stringify(out.blocks);
    expect(blockText).toContain("alpha");
    expect(blockText).toContain("beta");
    expect(blockText).toContain("🟢");
    expect(blockText).toContain("⚪");
  });

  it("formats created responses", () => {
    expect(formatCreated("test").text).toContain("created");
    expect(formatCreated("test").text).toContain("test");

    const withPath = formatCreated("test", "/tmp");
    expect(withPath.text).toContain("/tmp");
  });

  it("formats killed and renamed responses", () => {
    expect(formatKilled("test").text).toContain("killed");

    const renamed = formatRenamed("old", "new");
    expect(renamed.text).toContain("old");
    expect(renamed.text).toContain("new");
  });

  it("formats capture with and without truncation", () => {
    const basic = formatCapture({
      session: "s",
      content: "output",
      timestamp: 0,
    });
    expect(JSON.stringify(basic.blocks)).toContain("output");

    const longContent = "a".repeat(2900);
    const truncated = formatCapture({
      session: "s",
      content: longContent,
      timestamp: 0,
    });
    const serialized = JSON.stringify(truncated.blocks);
    expect(serialized).toContain("(truncated)");
  });

  it("formats send keys", () => {
    const out = formatSendKeys("target", "ls");
    expect(out.text).toContain("target");
    expect(out.text).toContain("ls");
  });

  it("formats sync cases", () => {
    const created = formatSync(["a", "b"], []);
    expect(JSON.stringify(created.blocks)).toContain("Created");
    expect(JSON.stringify(created.blocks)).toContain("a");

    const inSync = formatSync([], []);
    expect(JSON.stringify(inSync.blocks)).toContain("in sync");

    const withErrors = formatSync([], ["err"]);
    expect(JSON.stringify(withErrors.blocks)).toContain("err");
  });

  it("formats opencode and errors", () => {
    expect(formatOpencode(true).text).toContain("active");

    const failed = formatOpencode(false, "err");
    expect(failed.text).toContain("failed");

    const err = formatError("msg");
    expect(err.text).toContain("msg");
  });

  it("formats notify events with matching icons", () => {
    const cases: Array<{ event: NotifyEvent["event"]; icon: string }> = [
      { event: "session-created", icon: "🆕" },
      { event: "session-closed", icon: "🔴" },
      { event: "session-renamed", icon: "🔀" },
      { event: "client-attached", icon: "🔗" },
      { event: "client-detached", icon: "⛓️‍💥" },
      { event: "opencode-idle", icon: "💤" },
    ];
    for (const c of cases) {
      const out = formatNotifyEvent({
        event: c.event,
        session: "s",
        timestamp: 0,
      });
      expect(JSON.stringify(out.blocks)).toContain(c.icon);
    }
  });

  it("formats idle notification", () => {
    const out = formatIdleNotification("abc12345-dead-beef");
    expect(out.text).toContain("abc12345");
    expect(JSON.stringify(out.blocks)).toContain("💤");
    expect(JSON.stringify(out.blocks)).toContain("idle");
  });

  it("formats help text", () => {
    const out = formatHelp();
    expect(out.text).toContain("help");
    expect(JSON.stringify(out.blocks)).toContain("/tmux list");
  });

  it("formats session dashboard with action buttons", () => {
    const sessions: TmuxSession[] = [
      {
        name: "alpha",
        windows: 1,
        created: 1,
        attached: true,
        path: "/tmp",
        activity: Math.floor(Date.now() / 1000),
      },
    ];
    const out = formatSessionDashboard(sessions);
    const all = JSON.stringify(out.blocks);
    expect(all).toContain(ActionId.SESSION_CAPTURE);
    expect(all).toContain(ActionId.SESSION_SEND_KEYS);
    expect(all).toContain(ActionId.SESSION_RENAME);
    expect(all).toContain(ActionId.SESSION_KILL);
    expect(all).toContain(ActionId.SESSION_NEW);
  });

  it("formats action result with back button", () => {
    const out = formatActionResult("✅", "done");
    expect(JSON.stringify(out.blocks)).toContain(ActionId.BACK_TO_LIST);
  });

  it("builds modals with expected callback ids", () => {
    const sendModal = buildSendKeysModal("alpha", "meta");
    expect(sendModal).toMatchObject({ callback_id: CallbackId.SEND_KEYS });

    const renameModal = buildRenameModal("alpha", "meta");
    expect(renameModal).toMatchObject({ callback_id: CallbackId.RENAME });

    const newModal = buildNewSessionModal("meta");
    expect(newModal).toMatchObject({ callback_id: CallbackId.NEW_SESSION });
  });
});
