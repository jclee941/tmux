import { createBindingFile } from "./binding-file.js";

export { BindingStoreCorruptError } from "./binding-file.js";

/**
 * One Telegram conversation (chat, optional forum thread) bound to one tmux
 * session, optionally driving one opencode session.
 *
 * Defined here so the store stays self-contained; `src/types.ts` re-exports it.
 */
export interface Binding {
  readonly chatId: number;
  /** Forum topic id, or null for the chat root. Part of the identity. */
  readonly threadId: number | null;
  readonly tmuxSession: string;
  readonly directory: string;
  readonly opencodeSessionId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Fields a caller supplies; timestamps are owned by the store. */
export interface BindingInput {
  readonly chatId: number;
  readonly threadId: number | null;
  readonly tmuxSession: string;
  readonly directory: string;
  /** Omit to keep the current value; pass null to detach. */
  readonly opencodeSessionId?: string | null;
}

export interface BindingStore {
  list(): Binding[];
  getByChat(chatId: number, threadId: number | null): Binding | null;
  getByOpencodeSession(opencodeSessionId: string): Binding | null;
  upsert(input: BindingInput): Binding;
  setOpencodeSession(
    chatId: number,
    threadId: number | null,
    opencodeSessionId: string | null,
  ): Binding | null;
  remove(chatId: number, threadId: number | null): boolean;
}

export interface BindingStoreOptions {
  /** Injected clock; tests pass a deterministic one. */
  readonly now?: () => Date;
}

function bindingKey(chatId: number, threadId: number | null): string {
  return `${chatId}:${threadId ?? "null"}`;
}

/**
 * In-memory binding index persisted to a crash-safe JSON file. Reads are served
 * from two maps - by (chat, thread) and by opencode session id - and every
 * mutation is written through before it returns.
 *
 * @param filePath absolute path to the store file (injected, never derived here)
 */
export function createBindingStore(
  filePath: string,
  options: BindingStoreOptions = {},
): BindingStore {
  const now = options.now ?? (() => new Date());
  const file = createBindingFile(filePath);

  const bindings = new Map<string, Binding>();
  const byOpencodeSession = new Map<string, string>();

  const unindex = (binding: Binding | undefined): void => {
    const sessionId = binding?.opencodeSessionId;
    if (typeof sessionId === "string") {
      byOpencodeSession.delete(sessionId);
    }
  };

  const put = (key: string, binding: Binding): void => {
    unindex(bindings.get(key));
    bindings.set(key, binding);
    if (binding.opencodeSessionId !== null) {
      byOpencodeSession.set(binding.opencodeSessionId, key);
    }
  };

  for (const binding of file.load()) {
    put(bindingKey(binding.chatId, binding.threadId), binding);
  }

  const save = (): void => {
    file.save([...bindings.values()]);
  };

  return {
    list: () => [...bindings.values()],

    getByChat: (chatId, threadId) =>
      bindings.get(bindingKey(chatId, threadId)) ?? null,

    getByOpencodeSession: (opencodeSessionId) => {
      const key = byOpencodeSession.get(opencodeSessionId);
      return key === undefined ? null : (bindings.get(key) ?? null);
    },

    upsert: (input) => {
      const key = bindingKey(input.chatId, input.threadId);
      const existing = bindings.get(key);
      const timestamp = now().toISOString();
      const binding: Binding = {
        chatId: input.chatId,
        threadId: input.threadId,
        tmuxSession: input.tmuxSession,
        directory: input.directory,
        opencodeSessionId:
          input.opencodeSessionId !== undefined
            ? input.opencodeSessionId
            : (existing?.opencodeSessionId ?? null),
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      put(key, binding);
      save();
      return binding;
    },

    setOpencodeSession: (chatId, threadId, opencodeSessionId) => {
      const key = bindingKey(chatId, threadId);
      const existing = bindings.get(key);
      if (existing === undefined) {
        return null;
      }
      const binding: Binding = {
        ...existing,
        opencodeSessionId,
        updatedAt: now().toISOString(),
      };
      put(key, binding);
      save();
      return binding;
    },

    remove: (chatId, threadId) => {
      const key = bindingKey(chatId, threadId);
      const existing = bindings.get(key);
      if (existing === undefined) {
        return false;
      }
      unindex(existing);
      bindings.delete(key);
      save();
      return true;
    },
  };
}
