import { listSessions as tmuxListSessions } from "./tmux.js";
import type { Binding, BindingStore } from "./store/bindings.js";
import type { TmuxSession } from "../types.js";

/**
 * The only tmux capability routing needs. Injected so tests never shell out,
 * and so the router stays independent of the socket/config wiring in tmux.ts.
 */
export interface RouterTmux {
  listSessions(): Promise<TmuxSession[]>;
}

/** A tmux session offered as a bind target: its name and its project directory. */
export interface SessionCandidate {
  readonly name: string;
  readonly path: string;
}

/** A conversation resolved to the project directory its prompts run in. */
export interface ResolvedRoute {
  readonly binding: Binding;
  readonly directory: string;
}

/** Binding failure is an expected outcome (typo'd session name), never a throw. */
export type BindResult =
  | { readonly ok: true; readonly binding: Binding }
  | { readonly ok: false; readonly error: string };

export interface RouterDeps {
  readonly store: BindingStore;
  /** Defaults to the real tmux module. */
  readonly tmux?: RouterTmux;
}

export interface Router {
  /** Stored route for a conversation, or null when it has never been bound. */
  resolveRoute(chatId: number, threadId: number | null): ResolvedRoute | null;
  /** Live tmux sessions, reduced to what a bind menu renders. */
  discoverSessions(): Promise<SessionCandidate[]>;
  /** Bind a conversation to a live tmux session, adopting its `session_path`. */
  bind(
    chatId: number,
    threadId: number | null,
    sessionName: string,
  ): Promise<BindResult>;
  /** Drop a route; false when the conversation had none. */
  unbind(chatId: number, threadId: number | null): boolean;
  /** True once tmux no longer runs the bound session. Routing still works. */
  isStale(binding: Binding): Promise<boolean>;
  listBindings(): readonly Binding[];
}

/**
 * Maps (Telegram chat, thread) -> tmux session -> project directory -> opencode
 * session.
 *
 * The stored `directory` is authoritative for routing: a killed tmux session
 * makes a binding stale, not unusable, so prompts keep reaching the project.
 */
export function createRouter(deps: RouterDeps): Router {
  const { store } = deps;
  const tmux: RouterTmux = deps.tmux ?? { listSessions: tmuxListSessions };

  const findSession = async (name: string): Promise<TmuxSession | null> => {
    const sessions = await tmux.listSessions();
    return sessions.find((session) => session.name === name) ?? null;
  };

  return {
    resolveRoute: (chatId, threadId) => {
      const binding = store.getByChat(chatId, threadId);
      if (binding === null) {
        return null;
      }
      return { binding, directory: binding.directory };
    },

    discoverSessions: async () => {
      const sessions = await tmux.listSessions();
      return sessions.map(({ name, path }) => ({ name, path }));
    },

    bind: async (chatId, threadId, sessionName) => {
      const session = await findSession(sessionName);
      if (session === null) {
        return { ok: false, error: `unknown tmux session: ${sessionName}` };
      }

      // An opencode session belongs to a directory; only a rebind that keeps
      // the same directory may carry it over.
      const previous = store.getByChat(chatId, threadId);
      const samePlace = previous !== null && previous.directory === session.path;

      return {
        ok: true,
        binding: store.upsert({
          chatId,
          threadId,
          tmuxSession: session.name,
          directory: session.path,
          opencodeSessionId: samePlace ? previous.opencodeSessionId : null,
        }),
      };
    },

    unbind: (chatId, threadId) => store.remove(chatId, threadId),

    isStale: async (binding) => (await findSession(binding.tmuxSession)) === null,

    listBindings: () => store.list(),
  };
}
