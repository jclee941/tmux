import { createHash } from "node:crypto";
import { type Bot } from "grammy";
import { config } from "./config.js";
import { capturePane } from "./tmux.js";
import type { StreamState } from "../types.js";

/** Key a stream by chat+target so each window gets its own live message per chat. */
function key(chatId: number, target: string): string {
  return `${chatId}::${target}`;
}

const streams = new Map<string, StreamState>();

function hash(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}

/** Escape for Telegram HTML <pre> blocks (only & < > matter inside <pre>). */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** HH:MM:SS in the server's local time, for the "updated" line. */
function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}

/** Collapse trailing blank lines and a trailing-space gutter for a tighter box. */
function tidy(content: string): string {
  return content
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "");
}

interface RenderOpts {
  /** false → idle (no change this tick), true → live (just changed). */
  live: boolean;
  ts: number;
}

function renderBody(target: string, content: string, opts: RenderOpts): string {
  const clean = tidy(content);
  const trimmed = clean.slice(-config.stream.maxChars);
  const dot = opts.live ? "\uD83D\uDFE2" : "\u26AA"; // 🟢 live / ⚪ idle
  const status = opts.live ? "live" : "idle";
  const header =
    `${dot} <b>${escapeHtml(target)}</b> \u00B7 <i>${status}</i> \u00B7 <code>${clock(opts.ts)}</code>`;
  const box = trimmed.length ? escapeHtml(trimmed) : "(blank screen)";
  return `${header}\n<pre>${box}</pre>`;
}

// (Inline control pad removed — only window-selection buttons remain, in index.ts.)

/** Per-chat "active" target: plain text and key buttons route here by default. */
const activeTarget = new Map<number, string>();
export function setActiveTarget(chatId: number, target: string): void {
  activeTarget.set(chatId, target);
}
export function getActiveTarget(chatId: number): string | undefined {
  return activeTarget.get(chatId);
}

/** Start (or restart) streaming a tmux window into a freshly sent Telegram message. */
export async function startStream(
  bot: Bot,
  chatId: number,
  target: string,
): Promise<{ ok: boolean; error?: string }> {
  stopStream(chatId, target);

const cap = await capturePane(target);
  const body = renderBody(target, cap.content, { live: true, ts: cap.timestamp });

  let messageId: number;
  try {
    const sent = await bot.api.sendMessage(chatId, body, {
      parse_mode: "HTML",
    });
    messageId = sent.message_id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const state: StreamState = {
    target,
    chatId,
    messageId,
    lastBody: body,
    lastHash: hash(cap.content),
    idleTicks: 0,
    timer: null,
  };

  state.timer = setInterval(() => void tick(bot, state), config.stream.intervalMs);
  streams.set(key(chatId, target), state);
  setActiveTarget(chatId, target);
  return { ok: true };
}

async function tick(bot: Bot, state: StreamState): Promise<void> {
  const cap = await capturePane(state.target);
  const h = hash(cap.content);

  if (h === state.lastHash) {
    state.idleTicks += 1;
    // On the first idle tick, flip the header dot to ⚪ once (no body churn after).
    if (state.idleTicks === 1) {
      const body = renderBody(state.target, cap.content, {
        live: false,
        ts: cap.timestamp,
      });
      if (body !== state.lastBody) {
        state.lastBody = body;
        await edit(bot, state, body);
      }
    }
    if (
      config.stream.idleStopTicks > 0 &&
      state.idleTicks >= config.stream.idleStopTicks
    ) {
      stopStream(state.chatId, state.target);
    }
    return; // otherwise no edit → no rate-limit pressure
  }

  state.idleTicks = 0;
  state.lastHash = h;

  const body = renderBody(state.target, cap.content, {
    live: true,
    ts: cap.timestamp,
  });
  if (body === state.lastBody) return;
  state.lastBody = body;

  await edit(bot, state, body);
}

/** Edit the live message; if it's gone, stop the stream so we don't spin. */
async function edit(bot: Bot, state: StreamState, body: string): Promise<void> {
  try {
    await bot.api.editMessageText(state.chatId, state.messageId, body, {
      parse_mode: "HTML",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("message is not modified")) {
      stopStream(state.chatId, state.target);
    }
  }
}

export function stopStream(chatId: number, target: string): boolean {
  const k = key(chatId, target);
  const state = streams.get(k);
  if (!state) return false;
  if (state.timer) clearInterval(state.timer);
  streams.delete(k);
  return true;
}

export function stopAllForChat(chatId: number): number {
  let n = 0;
  for (const [k, state] of streams) {
    if (state.chatId === chatId) {
      if (state.timer) clearInterval(state.timer);
      streams.delete(k);
      n += 1;
    }
  }
  return n;
}

export function activeStreams(chatId: number): string[] {
  return [...streams.values()]
    .filter((s) => s.chatId === chatId)
    .map((s) => s.target);
}
