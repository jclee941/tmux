import { afterEach, describe, expect, it, vi } from "vitest";
import { resolve } from "node:path";

function clearConfigEnv(): void {
  vi.unstubAllEnvs();
  for (const key of [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_ALLOWED_CHATS",
    "TMUX_SOCKET",
    "TMUX_HOME",
    "STREAM_INTERVAL_MS",
    "STREAM_LINES",
    "STREAM_MAX_CHARS",
    "STREAM_IDLE_STOP_TICKS",
    "OPENCODE_API_URL",
    "STREAM_THROTTLE_MS",
    "TELEGRAM_DRAFT_STREAMING",
    "BINDINGS_PATH",
  ]) {
    delete process.env[key];
  }
}

async function importConfig() {
  vi.resetModules();
  return import("../../lib/config.js");
}

afterEach(() => {
  clearConfigEnv();
  vi.resetModules();
});

describe("config", () => {
  it("requires TELEGRAM_BOT_TOKEN", async () => {
    await expect(importConfig()).rejects.toThrow(
      "Missing required env: TELEGRAM_BOT_TOKEN",
    );
  });

  it("parses allowed chat IDs", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "token");
    vi.stubEnv("TELEGRAM_ALLOWED_CHATS", "123, -456, 789");

    const { config } = await importConfig();

    expect(config.telegram.allowedChats).toEqual([123, -456, 789]);
  });

  it("uses bridge defaults", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "token");

    const { config } = await importConfig();

    expect(config.opencode.apiUrl).toBe("http://127.0.0.1:4096");
    expect(config.stream.throttleMs).toBe(1000);
    expect(config.telegram.draftStreaming).toBe(false);
    expect(config.bindingsPath).toBe(resolve(process.cwd(), "data/bindings.json"));
  });

  it("parses bridge settings", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "token");
    vi.stubEnv("OPENCODE_API_URL", "http://localhost:5000");
    vi.stubEnv("STREAM_THROTTLE_MS", "2500");
    vi.stubEnv("TELEGRAM_DRAFT_STREAMING", "true");
    vi.stubEnv("BINDINGS_PATH", "/tmp/custom-bindings.json");

    const { config } = await importConfig();

    expect(config.opencode.apiUrl).toBe("http://localhost:5000");
    expect(config.stream.throttleMs).toBe(2500);
    expect(config.telegram.draftStreaming).toBe(true);
    expect(config.bindingsPath).toBe("/tmp/custom-bindings.json");
  });
});
