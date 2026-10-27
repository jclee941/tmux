import { InlineKeyboard } from "grammy";
import type { SessionCandidate } from "../lib/router.js";
import type {
  BridgeApi,
  BridgeBot,
  BridgeCommandContext,
  BridgeDeps,
} from "./deps.js";

/** Prefix on the session a conversation is currently bound to. */
export const BOUND_MARK = "✓";

const UNBOUND_HINT =
  "This conversation is not bound to a tmux session yet. Run /sessions to pick one.";

/**
 * Outcome of routing a chat message into the bound opencode session.
 *
 * `unbound` is an ordinary state (the user never picked a session), so the
 * entrypoint discriminates on `reason` instead of catching.
 */
export type PromptResult =
  | { readonly ok: true; readonly sessionId: string; readonly created: boolean }
  | { readonly ok: false; readonly reason: "unbound" }
  | { readonly ok: false; readonly reason: "error"; readonly error: string };

function threadOf(ctx: BridgeCommandContext): number | null {
  return ctx.message?.message_thread_id ?? null;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sessionsKeyboard(
  candidates: readonly SessionCandidate[],
  boundSession: string | null,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const candidate of candidates) {
    const mark = candidate.name === boundSession ? `${BOUND_MARK} ` : "";
    keyboard
      .text(`${mark}${candidate.name} · ${candidate.path}`, `bind:${candidate.name}`)
      .row();
  }
  return keyboard;
}

async function probeOpencode(api: BridgeApi): Promise<string> {
  try {
    await api.sessionStatus();
    return "reachable";
  } catch (error) {
    return `unreachable (${errorText(error)})`;
  }
}

/**
 * Register the opencode bridge commands on the existing tmux mirror bot.
 *
 * Deliberately claims only verbs `src/index.ts` does not use, and adds no
 * auth: the allow-list middleware there already gates every update.
 */
export function registerBridgeCommands(bot: BridgeBot, deps: BridgeDeps): void {
  const { router, api, store } = deps;

  bot.command("sessions", async (ctx) => {
    const candidates = await router.discoverSessions();
    if (candidates.length === 0) {
      await ctx.reply("No tmux sessions are running. Start one with: tmux new -s <name>");
      return;
    }
    const route = router.resolveRoute(ctx.chat.id, threadOf(ctx));
    await ctx.reply("Pick the tmux session this conversation drives:", {
      reply_markup: sessionsKeyboard(candidates, route?.binding.tmuxSession ?? null),
    });
  });

  bot.command("use", async (ctx) => {
    const sessionName = ctx.match.trim();
    if (sessionName === "") {
      await ctx.reply("Usage: /use <tmux session> — run /sessions to see the list.");
      return;
    }
    const result = await router.bind(ctx.chat.id, threadOf(ctx), sessionName);
    await ctx.reply(
      result.ok
        ? `Bound to ${result.binding.tmuxSession} — ${result.binding.directory}`
        : `Cannot bind: ${result.error}`,
    );
  });

  bot.command("new", async (ctx) => {
    const chatId = ctx.chat.id;
    const threadId = threadOf(ctx);
    const route = router.resolveRoute(chatId, threadId);
    if (route === null) {
      await ctx.reply(UNBOUND_HINT);
      return;
    }
    try {
      const session = await api.createSession(route.directory);
      store.setOpencodeSession(chatId, threadId, session.id);
      await ctx.reply(`Started opencode session ${session.id} in ${route.directory}`);
    } catch (error) {
      await ctx.reply(`Could not start an opencode session: ${errorText(error)}`);
    }
  });

  bot.command("status", async (ctx) => {
    const route = router.resolveRoute(ctx.chat.id, threadOf(ctx));
    if (route === null) {
      await ctx.reply(UNBOUND_HINT);
      return;
    }
    const stale = await router.isStale(route.binding);
    await ctx.reply(
      [
        `tmux session: ${route.binding.tmuxSession}${stale ? " (gone)" : ""}`,
        `directory: ${route.directory}`,
        `opencode session: ${route.binding.opencodeSessionId ?? "none yet"}`,
        `opencode server: ${await probeOpencode(api)}`,
      ].join("\n"),
    );
  });

  bot.command("abort", async (ctx) => {
    const route = router.resolveRoute(ctx.chat.id, threadOf(ctx));
    const sessionId = route?.binding.opencodeSessionId ?? null;
    if (sessionId === null) {
      await ctx.reply("Nothing to abort — no opencode session is running here.");
      return;
    }
    try {
      await api.abort(sessionId);
      await ctx.reply(`Aborted opencode session ${sessionId}.`);
    } catch (error) {
      await ctx.reply(`Could not abort ${sessionId}: ${errorText(error)}`);
    }
  });
}

/**
 * Send a chat message to the conversation's opencode session, opening one on
 * first use. Called by the entrypoint's `message:text` router, never bound to
 * a command of its own.
 */
export async function promptBoundSession(
  deps: BridgeDeps,
  chatId: number,
  threadId: number | null,
  text: string,
): Promise<PromptResult> {
  const route = deps.router.resolveRoute(chatId, threadId);
  if (route === null) {
    return { ok: false, reason: "unbound" };
  }

  const existing = route.binding.opencodeSessionId;
  try {
    if (existing !== null) {
      await deps.api.prompt(route.directory, existing, text);
      return { ok: true, sessionId: existing, created: false };
    }
    const session = await deps.api.createSession(route.directory);
    deps.store.setOpencodeSession(chatId, threadId, session.id);
    await deps.api.prompt(route.directory, session.id, text);
    return { ok: true, sessionId: session.id, created: true };
  } catch (error) {
    return { ok: false, reason: "error", error: errorText(error) };
  }
}
