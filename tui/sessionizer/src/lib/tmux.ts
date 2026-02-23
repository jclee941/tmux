/** tmux shell API — all calls via Bun.spawnSync (no child_process) */

export interface TmuxSession {
  name: string;
  windows: number;
  attached: boolean;
  created: number;
  path: string;
}

function run(args: string[]): string {
  const result = Bun.spawnSync(["tmux", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  return result.stdout.toString().trim();
}

function runRaw(args: string[]): { stdout: string; exitCode: number } {
  const result = Bun.spawnSync(["tmux", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    stdout: result.stdout.toString(),
    exitCode: result.exitCode,
  };
}

/** List all tmux sessions with metadata */
export function listSessions(): TmuxSession[] {
  const format =
    "#{session_name}|#{session_windows}|#{session_attached}|#{session_created}|#{session_path}";
  const { stdout, exitCode } = runRaw(["list-sessions", "-F", format]);
  if (exitCode !== 0) return [];

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, windows, attached, created, path] = line.split("|");
      return {
        name,
        windows: parseInt(windows, 10) || 0,
        attached: attached === "1",
        created: parseInt(created, 10) || 0,
        path: path || "",
      };
    });
}

/** Switch tmux client to target session */
export function switchClient(target: string): boolean {
  const result = Bun.spawnSync(["tmux", "switch-client", "-t", target], {
    stdout: "pipe",
    stderr: "pipe",
  });
  return result.exitCode === 0;
}

/** Capture pane content with ANSI colors preserved */
export function capturePanes(name: string): string {
  return run(["capture-pane", "-p", "-e", "-t", name]);
}

/** Check if a session exists */
export function hasSession(name: string): boolean {
  const result = Bun.spawnSync(["tmux", "has-session", "-t", `=${name}`], {
    stdout: "pipe",
    stderr: "pipe",
  });
  return result.exitCode === 0;
}

/** Create a new detached session */
export function newSession(name: string, cwd: string): boolean {
  const result = Bun.spawnSync(
    ["tmux", "new-session", "-ds", name, "-c", cwd],
    { stdout: "pipe", stderr: "pipe" },
  );
  return result.exitCode === 0;
}

/** Kill a session by name */
export function killSession(name: string): boolean {
  const result = Bun.spawnSync(["tmux", "kill-session", "-t", `=${name}`], {
    stdout: "pipe",
    stderr: "pipe",
  });
  return result.exitCode === 0;
}

/** Rename a session */
export function renameSession(oldName: string, newName: string): boolean {
  const result = Bun.spawnSync(
    ["tmux", "rename-session", "-t", `=${oldName}`, newName],
    { stdout: "pipe", stderr: "pipe" },
  );
  return result.exitCode === 0;
}

/** Get the name of the currently active session */
export function currentSession(): string {
  return run(["display-message", "-p", "#{session_name}"]);
}
