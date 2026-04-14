import { afterEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV = {
  SLACK_BOT_TOKEN: "xoxb-test",
  SLACK_CHANNEL_OPENCODE: "C-OPENCODE",
} as const;

function clearConfigEnv() {
  vi.unstubAllEnvs();
  delete process.env.SLACK_BOT_TOKEN;
  delete process.env.SLACK_SIGNING_SECRET;
  delete process.env.SLACK_MODE;
  delete process.env.SLACK_APP_TOKEN;
  delete process.env.SLACK_HTTP_PORT;
  delete process.env.SLACK_CHANNEL_OPENCODE;
  delete process.env.TMUX_SOCKET;
  delete process.env.TMUX_HOME;
  delete process.env.TMUX_SLACK_NOTIFY_PORT;
  delete process.env.OPENCODE_URL;
  delete process.env.OPENCODE_DIRECTORY;
  delete process.env.OPENCODE_ENABLED;
}

async function importConfig() {
  vi.resetModules();
  return import("../lib/config.js");
}

function setRequiredEnv(extra: Record<string, string> = {}) {
  for (const [key, value] of Object.entries({ ...REQUIRED_ENV, ...extra })) {
    vi.stubEnv(key, value);
  }
}

afterEach(() => {
  clearConfigEnv();
  vi.resetModules();
});

describe("config", () => {
  it("throws when SLACK_BOT_TOKEN is missing", async () => {
    vi.stubEnv("SLACK_CHANNEL_OPENCODE", "C-OPENCODE");

    await expect(importConfig()).rejects.toThrow("Missing required env: SLACK_BOT_TOKEN");
  });

  it("throws when SLACK_CHANNEL_OPENCODE is missing", async () => {
    vi.stubEnv("SLACK_BOT_TOKEN", "xoxb-test");

    await expect(importConfig()).rejects.toThrow(
      "Missing required env: SLACK_CHANNEL_OPENCODE",
    );
  });

  it("uses defaults for optional env vars", async () => {
    setRequiredEnv({ HOME: "/tmp/home", SLACK_MODE: "http" });

    const { config } = await importConfig();

    expect(config.slack.signingSecret).toBe("");
    expect(config.slack.httpPort).toBe(3000);
    expect(config.tmux.socket).toBe("default");
    expect(config.tmux.home).toBe("/tmp/home/.tmux");
    expect(config.notify.port).toBe(9876);
    expect(config.opencode.url).toBe("http://localhost:0");
    expect(config.opencode.directory).toBe("/tmp/home");
    expect(config.opencode.enabled).toBe(true);
  });

  it("parses SLACK_HTTP_PORT as an integer", async () => {
    setRequiredEnv({ SLACK_MODE: "http", SLACK_HTTP_PORT: "4312" });

    const { config } = await importConfig();

    expect(config.slack.httpPort).toBe(4312);
  });

  it("parses TMUX_SLACK_NOTIFY_PORT as an integer", async () => {
    setRequiredEnv({ SLACK_MODE: "http", TMUX_SLACK_NOTIFY_PORT: "9911" });

    const { config } = await importConfig();

    expect(config.notify.port).toBe(9911);
  });

  it("throws in socket mode when SLACK_APP_TOKEN is missing", async () => {
    setRequiredEnv();

    await expect(importConfig()).rejects.toThrow(
      "SLACK_APP_TOKEN is required in socket mode",
    );
  });

  it("works in HTTP mode without SLACK_APP_TOKEN", async () => {
    setRequiredEnv({ SLACK_MODE: "http" });

    const { config } = await importConfig();

    expect(config.slack.mode).toBe("http");
    expect(config.slack.appToken).toBe("");
  });

  it("parses OPENCODE_ENABLED true and false values", async () => {
    setRequiredEnv({ SLACK_MODE: "http", OPENCODE_ENABLED: "true" });
    let imported = await importConfig();
    expect(imported.config.opencode.enabled).toBe(true);

    clearConfigEnv();
    setRequiredEnv({ SLACK_MODE: "http", OPENCODE_ENABLED: "false" });
    imported = await importConfig();
    expect(imported.config.opencode.enabled).toBe(false);
  });

  it('defaults OPENCODE_URL to "http://localhost:0"', async () => {
    setRequiredEnv({ SLACK_MODE: "http" });

    const { config } = await importConfig();

    expect(config.opencode.url).toBe("http://localhost:0");
  });
});
