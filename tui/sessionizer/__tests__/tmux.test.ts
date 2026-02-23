import { describe, it, expect } from "bun:test";

describe("tmux lib", () => {
  const hasTmux = (() => {
    try {
      const result = Bun.spawnSync(["tmux", "has-session"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      return result.exitCode === 0 || result.exitCode === 1;
    } catch {
      return false;
    }
  })();

  const itIfTmux = hasTmux ? it : it.skip;

  itIfTmux("listSessions returns array of sessions", () => {
    const { listSessions } = require("../src/lib/tmux");
    const sessions = listSessions();
    expect(Array.isArray(sessions)).toBe(true);
    sessions.forEach(
      (s: { name: unknown; windows: unknown; attached: unknown }) => {
        expect(typeof s.name).toBe("string");
        expect(typeof s.windows).toBe("number");
        expect(typeof s.attached).toBe("boolean");
      },
    );
  });

  itIfTmux("hasSession returns boolean", () => {
    const { hasSession } = require("../src/lib/tmux");
    const result = hasSession("nonexistent-session");
    expect(typeof result).toBe("boolean");
  });

  itIfTmux("currentSession returns string", () => {
    const { currentSession } = require("../src/lib/tmux");
    const result = currentSession();
    expect(typeof result).toBe("string");
  });
});
