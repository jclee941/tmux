import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({ spawn: spawnMock }));

type SpawnResult = {
  stdout: string;
  stderr?: string;
  exitCode?: number;
};

function queueSpawnResult(result: SpawnResult): void {
  spawnMock.mockImplementationOnce((_command: string, _args: string[]) => {
    const stdout = {
      on: (_event: string, callback: (chunk: Buffer) => void) => {
        if (result.stdout) queueMicrotask(() => callback(Buffer.from(result.stdout)));
      },
    };
    const stderr = {
      on: (_event: string, callback: (chunk: Buffer) => void) => {
        if (result.stderr) {
          queueMicrotask(() => callback(Buffer.from(result.stderr ?? "")));
        }
      },
    };
    return {
      stdout,
      stderr,
      on: (_event: string, callback: (code: number) => void) => {
        queueMicrotask(() => callback(result.exitCode ?? 0));
      },
    };
  });
}

async function importTmux() {
  vi.resetModules();
  return import("../../lib/tmux.js");
}

beforeEach(() => {
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
  vi.stubEnv("TMUX_SOCKET", "default");
  spawnMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("tmux session functions", () => {
  it("parses tab-separated list-sessions output into TmuxSession objects", async () => {
    // Given tmux's session metadata output
    queueSpawnResult({
      stdout: [
        "alpha\t3\t1700000000\t1\t/home/alpha\t1700000010",
        "beta\t1\t1700000020\t0\t/home/beta\t1700000030",
      ].join("\n"),
    });
    const { listSessions } = await importTmux();

    // When sessions are listed
    const sessions = await listSessions();

    // Then all fields are parsed with the expected types
    expect(sessions).toEqual([
      {
        name: "alpha",
        windows: 3,
        created: 1700000000,
        attached: true,
        path: "/home/alpha",
        activity: 1700000010,
      },
      {
        name: "beta",
        windows: 1,
        created: 1700000020,
        attached: false,
        path: "/home/beta",
        activity: 1700000030,
      },
    ]);
  });

  it("passes a non-default tmux socket before list-sessions arguments", async () => {
    // Given a configured tmux socket
    vi.stubEnv("TMUX_SOCKET", "telegram");
    queueSpawnResult({ stdout: "alpha\t1\t1\t0\t/home/alpha\t2" });
    const { listSessions } = await importTmux();

    // When sessions are listed
    await listSessions();

    // Then the socket selector is included in the tmux invocation
    expect(spawnMock).toHaveBeenCalledWith(
      "tmux",
      [
        "-L",
        "telegram",
        "list-sessions",
        "-F",
        "#{session_name}\t#{session_windows}\t#{session_created}\t#{session_attached}\t#{session_path}\t#{session_activity}",
      ],
      expect.objectContaining({ stdio: ["ignore", "pipe", "pipe"] }),
    );
  });

  it("returns an empty list when tmux reports a list-sessions error", async () => {
    // Given a failed tmux command
    queueSpawnResult({ stderr: "no server running", exitCode: 1, stdout: "" });
    const { listSessions } = await importTmux();

    // When sessions are listed
    const sessions = await listSessions();

    // Then the existing wrapper error behavior is preserved
    expect(sessions).toEqual([]);
  });

  it("reports whether a named session exists", async () => {
    // Given tmux output containing two sessions
    queueSpawnResult({
      stdout: "alpha\t1\t1\t1\t/home/alpha\t2\nbeta\t1\t1\t0\t/home/beta\t2",
    });
    queueSpawnResult({
      stdout: "alpha\t1\t1\t1\t/home/alpha\t2\nbeta\t1\t1\t0\t/home/beta\t2",
    });
    const { hasSession } = await importTmux();

    // When each name is checked
    const found = await hasSession("beta");
    const missing = await hasSession("gamma");

    // Then only the listed session is reported as present
    expect(found).toBe(true);
    expect(missing).toBe(false);
  });
});
