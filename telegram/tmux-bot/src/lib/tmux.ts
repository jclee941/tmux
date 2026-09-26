import type { TmuxSession, TmuxWindow, CaptureResult } from "../types.js";
import { spawn as nodeSpawn } from "node:child_process";
import { config } from "./config.js";

const TMUX = "tmux";

function run(
  cmd: string,
  args: string[],
  input?: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = nodeSpawn(cmd, args, {
      stdio: [input !== undefined ? "pipe" : "ignore", "pipe", "pipe"],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    proc.stdout!.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    proc.stderr!.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    proc.on("close", (code) => {
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
        stderr: Buffer.concat(stderrChunks).toString("utf-8").trim(),
        exitCode: code ?? 1,
      });
    });
    if (input !== undefined) {
      proc.stdin!.write(input);
      proc.stdin!.end();
    }
  });
}

function exec(
  args: string[],
  input?: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const socketArgs =
    config.tmux.socket !== "default" ? ["-L", config.tmux.socket] : [];
  return run(TMUX, [...socketArgs, ...args], input);
}

export async function listSessions(): Promise<TmuxSession[]> {
  const { stdout, exitCode } = await exec([
    "list-sessions",
    "-F",
    "#{session_name}\t#{session_windows}\t#{session_created}\t#{session_attached}\t#{session_path}\t#{session_activity}",
  ]);
  if (exitCode !== 0 || !stdout.trim()) return [];

  return stdout
    .trim()
    .split("\n")
    .map((line) => {
      const [name, windows, created, attached, path, activity] =
        line.split("\t");
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

export async function hasSession(name: string): Promise<boolean> {
  const sessions = await listSessions();
  return sessions.some((session) => session.name === name);
}

/** Enumerate every window across every session — the unit a user streams. */
export async function listWindows(session?: string): Promise<TmuxWindow[]> {
  const args = ["list-windows", session ? "-t" : "-a"];
  if (session) args.push(session);
  args.push(
    "-F",
    "#{session_name}\t#{window_index}\t#{window_name}\t#{window_active}\t#{window_panes}",
  );

  const { stdout, exitCode } = await exec(args);
  if (exitCode !== 0 || !stdout.trim()) return [];

  return stdout
    .trim()
    .split("\n")
    .map((line) => {
      const [sess, index, name, active, panes] = line.split("\t");
      return {
        session: sess,
        index: parseInt(index, 10),
        name,
        active: active === "1",
        panes: parseInt(panes, 10),
        target: `${sess}:${index}`,
      };
    });
}

/**
 * Send literal text then Enter as two calls with a short gap, so a TUI does not
 * treat a rapid Enter in the same input batch as a newline rather than submit.
 */
export async function sendKeys(
  target: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const literal = await exec(["send-keys", "-t", target, "-l", "--", text]);
  if (literal.exitCode !== 0) return { ok: false, error: literal.stderr };

  await new Promise((resolve) => setTimeout(resolve, 150));

  const enter = await exec(["send-keys", "-t", target, "Enter"]);
  if (enter.exitCode !== 0) return { ok: false, error: enter.stderr };
  return { ok: true };
}

/** Send a single special key (Up/Down/Escape/C-c/...) without an appended Enter. */
export async function sendKey(
  target: string,
  key: string,
): Promise<{ ok: boolean; error?: string }> {
  const { exitCode, stderr } = await exec(["send-keys", "-t", target, key]);
  if (exitCode !== 0) return { ok: false, error: stderr };
  return { ok: true };
}

export async function capturePane(
  target: string,
  lines = config.stream.lines,
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
    target,
    content: exitCode === 0 ? stdout.replace(/\n+$/, "") : `(capture failed for ${target})`,
    timestamp: Date.now(),
  };
}

export async function hasTarget(target: string): Promise<boolean> {
  const { exitCode } = await exec(["has-session", "-t", target.split(":")[0]]);
  return exitCode === 0;
}
