import type { TmuxSession, CaptureResult } from "../types.js";
import { join } from "node:path";
import { config } from "./config.js";

const TMUX = "tmux";

async function exec(
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const socketArgs =
    config.tmux.socket !== "default" ? ["-L", config.tmux.socket] : [];

  const proc = Bun.spawn([TMUX, ...socketArgs, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

export async function listSessions(): Promise<TmuxSession[]> {
  const { stdout, exitCode } = await exec([
    "list-sessions",
    "-F",
    "#{session_name}\t#{session_windows}\t#{session_created}\t#{session_attached}\t#{session_path}\t#{session_activity}",
  ]);

  if (exitCode !== 0 || !stdout) return [];

  return stdout.split("\n").map((line) => {
    const [name, windows, created, attached, path, activity] = line.split("\t");
    return {
      name,
      windows: parseInt(windows, 10),
      created: parseInt(created, 10),
      attached: attached === "1",
      path,
      activity: parseInt(activity, 10),
    };
  });
}

export async function createSession(
  name: string,
  startDir?: string,
): Promise<{ ok: boolean; error?: string }> {
  const args = ["new-session", "-d", "-s", name];
  if (startDir) args.push("-c", startDir);

  const { exitCode, stderr } = await exec(args);
  if (exitCode !== 0) return { ok: false, error: stderr };
  return { ok: true };
}

export async function killSession(
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  const { exitCode, stderr } = await exec(["kill-session", "-t", name]);
  if (exitCode !== 0) return { ok: false, error: stderr };
  return { ok: true };
}

export async function renameSession(
  oldName: string,
  newName: string,
): Promise<{ ok: boolean; error?: string }> {
  const { exitCode, stderr } = await exec([
    "rename-session",
    "-t",
    oldName,
    newName,
  ]);
  if (exitCode !== 0) return { ok: false, error: stderr };
  return { ok: true };
}

export async function sendKeys(
  target: string,
  keys: string,
): Promise<{ ok: boolean; error?: string }> {
  const { exitCode, stderr } = await exec([
    "send-keys",
    "-t",
    target,
    keys,
    "Enter",
  ]);
  if (exitCode !== 0) return { ok: false, error: stderr };
  return { ok: true };
}

export async function capturePane(
  target: string,
  lines = 50,
): Promise<CaptureResult> {
  const { stdout, exitCode } = await exec([
    "capture-pane",
    "-t",
    target,
    "-p",
    "-S",
    `-${lines}`,
  ]);

  return {
    session: target,
    content: exitCode === 0 ? stdout : `(capture failed for ${target})`,
    timestamp: Date.now(),
  };
}

export async function syncSessions(): Promise<{
  created: string[];
  errors: string[];
}> {
  const syncBin = join(config.tmux.home, "bin", "tmux-session-sync");
  const proc = Bun.spawn(
    [syncBin, "--dry-run"],
    { stdout: "pipe", stderr: "pipe" },
  );

  const stdout = await new Response(proc.stdout).text();
  await proc.exited;

  const created: string[] = [];
  const errors: string[] = [];

  for (const line of stdout.trim().split("\n")) {
    if (line.includes("[DRY-RUN] Would create")) {
      created.push(line.replace(/.*Would create session: /, "").trim());
    }
  }

  return { created, errors };
}

export async function runSessionSync(): Promise<{
  created: string[];
  errors: string[];
}> {
  const syncBin = join(config.tmux.home, "bin", "tmux-session-sync");
  const proc = Bun.spawn([syncBin], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;

  const created: string[] = [];
  const errors: string[] = [];

  for (const line of stdout.trim().split("\n")) {
    if (line.includes("Created session")) {
      created.push(line.replace(/.*Created session: /, "").trim());
    }
  }
  if (stderr.trim()) errors.push(stderr.trim());

  return { created, errors };
}

export async function launchOpencode(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const opencodeBin = join(config.tmux.home, "bin", "tmux-opencode");
  const proc = Bun.spawn([opencodeBin], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) return { ok: false, error: stderr };
  return { ok: true };
}

export async function sendToOpencode(
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  return sendKeys("opencode", text);
}
