import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BindingStoreCorruptError,
  createBindingStore,
} from "../../lib/store/bindings.js";
import type { Binding } from "../../lib/store/bindings.js";

const EPOCH = "2026-01-01T00:00:00.000Z";

/** Deterministic clock: every read advances by `stepMs`. No wall-clock flake. */
function stepClock(stepMs = 1_000): () => Date {
  const base = Date.parse(EPOCH);
  let tick = 0;
  return () => new Date(base + stepMs * tick++);
}

function writeRaw(path: string, content: string): void {
  writeFileSync(path, content, "utf-8");
}

function serialized(bindings: readonly Partial<Binding>[]): string {
  return JSON.stringify({ version: 1, bindings }, null, 2);
}

describe("createBindingStore", () => {
  let dir: string;
  let file: string;
  let backup: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "tmux-bot-bindings-"));
    file = join(dir, "bindings.json");
    backup = `${file}.bak`;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const openStore = (): ReturnType<typeof createBindingStore> =>
    createBindingStore(file, { now: stepClock() });

  it("returns an empty store when the file does not exist", () => {
    // Given a path with no file on disk
    // When the store loads
    const store = openStore();

    // Then it is empty and nothing was written
    expect(store.list()).toEqual([]);
    expect(readdirSync(dir)).toEqual([]);
  });

  it("creates a binding on first upsert", () => {
    // Given an empty store
    const store = openStore();

    // When a chat is bound to a tmux session
    const created = store.upsert({
      chatId: 100,
      threadId: null,
      tmuxSession: "safework",
      directory: "/home/jclee/dev/safework",
    });

    // Then the binding exists with matching timestamps and no opencode session
    expect(created).toMatchObject({
      chatId: 100,
      threadId: null,
      tmuxSession: "safework",
      directory: "/home/jclee/dev/safework",
      opencodeSessionId: null,
      createdAt: EPOCH,
      updatedAt: EPOCH,
    });
    expect(store.list()).toHaveLength(1);
  });

  it("updates in place and bumps updatedAt when upserting the same key twice", () => {
    // Given an existing binding
    const store = openStore();
    const first = store.upsert({
      chatId: 100,
      threadId: null,
      tmuxSession: "safework",
      directory: "/home/jclee/dev/safework",
    });

    // When the same (chatId, threadId) is upserted with new values
    const second = store.upsert({
      chatId: 100,
      threadId: null,
      tmuxSession: "blacklist",
      directory: "/home/jclee/dev/blacklist",
    });

    // Then there is still one entry, createdAt is preserved and updatedAt moved
    expect(store.list()).toHaveLength(1);
    expect(second.tmuxSession).toBe("blacklist");
    expect(second.directory).toBe("/home/jclee/dev/blacklist");
    expect(second.createdAt).toBe(first.createdAt);
    expect(Date.parse(second.updatedAt)).toBeGreaterThan(
      Date.parse(first.updatedAt),
    );
  });

  it("keeps threadId null and threadId 42 as distinct bindings", () => {
    // Given a store bound on the chat root
    const store = openStore();
    store.upsert({
      chatId: 100,
      threadId: null,
      tmuxSession: "root-session",
      directory: "/root/dir",
    });

    // When the same chat binds a topic thread
    store.upsert({
      chatId: 100,
      threadId: 42,
      tmuxSession: "thread-session",
      directory: "/thread/dir",
    });

    // Then both bindings coexist and resolve independently
    expect(store.list()).toHaveLength(2);
    expect(store.getByChat(100, null)?.tmuxSession).toBe("root-session");
    expect(store.getByChat(100, 42)?.tmuxSession).toBe("thread-session");
  });

  it("resolves getByChat hits and misses", () => {
    // Given one binding
    const store = openStore();
    store.upsert({
      chatId: 100,
      threadId: 7,
      tmuxSession: "s",
      directory: "/d",
    });

    // When looking up a bound and an unbound key
    // Then only the bound key resolves
    expect(store.getByChat(100, 7)?.tmuxSession).toBe("s");
    expect(store.getByChat(100, 8)).toBeNull();
    expect(store.getByChat(999, 7)).toBeNull();
    expect(store.getByChat(100, null)).toBeNull();
  });

  it("resolves getByOpencodeSession hits and misses", () => {
    // Given a binding created with an opencode session id
    const store = openStore();
    store.upsert({
      chatId: 100,
      threadId: null,
      tmuxSession: "s",
      directory: "/d",
      opencodeSessionId: "ses_abc",
    });

    // When reverse-looking up by opencode session id
    // Then the known id resolves and an unknown id does not
    expect(store.getByOpencodeSession("ses_abc")?.chatId).toBe(100);
    expect(store.getByOpencodeSession("ses_missing")).toBeNull();
  });

  it("sets the opencode session id and re-points the reverse index", () => {
    // Given a binding without an opencode session
    const store = openStore();
    store.upsert({
      chatId: 100,
      threadId: 42,
      tmuxSession: "s",
      directory: "/d",
    });

    // When an opencode session is attached, then replaced, then cleared
    const attached = store.setOpencodeSession(100, 42, "ses_one");
    expect(attached?.opencodeSessionId).toBe("ses_one");
    expect(store.getByOpencodeSession("ses_one")?.threadId).toBe(42);

    store.setOpencodeSession(100, 42, "ses_two");
    expect(store.getByOpencodeSession("ses_two")?.threadId).toBe(42);
    expect(store.getByOpencodeSession("ses_one")).toBeNull();

    store.setOpencodeSession(100, 42, null);

    // Then the field is cleared and no stale reverse entry survives
    expect(store.getByChat(100, 42)?.opencodeSessionId).toBeNull();
    expect(store.getByOpencodeSession("ses_two")).toBeNull();
  });

  it("returns null when setting an opencode session on an unbound key", () => {
    // Given an empty store
    const store = openStore();

    // When attaching a session to a key that has no binding
    const result = store.setOpencodeSession(100, null, "ses_abc");

    // Then nothing is created
    expect(result).toBeNull();
    expect(store.list()).toEqual([]);
  });

  it("removes a binding and reports whether it existed", () => {
    // Given a binding with an opencode session
    const store = openStore();
    store.upsert({
      chatId: 100,
      threadId: null,
      tmuxSession: "s",
      directory: "/d",
      opencodeSessionId: "ses_abc",
    });

    // When it is removed twice
    const first = store.remove(100, null);
    const second = store.remove(100, null);

    // Then the first removal reports true and clears both indexes
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(store.list()).toEqual([]);
    expect(store.getByOpencodeSession("ses_abc")).toBeNull();
  });

  it("leaves valid JSON and no temp file behind after a save", () => {
    // Given a store
    const store = openStore();

    // When a binding is written
    store.upsert({
      chatId: 100,
      threadId: null,
      tmuxSession: "s",
      directory: "/d",
    });

    // Then the target file parses and no .tmp remains in the directory
    const parsed: unknown = JSON.parse(readFileSync(file, "utf-8"));
    expect(parsed).toMatchObject({ version: 1 });
    expect(readdirSync(dir).filter((name) => name.endsWith(".tmp"))).toEqual([]);
  });

  it("recovers from the backup when the primary file is corrupt", () => {
    // Given a garbage primary file and a valid backup
    writeRaw(file, "{ this is not json");
    writeRaw(
      backup,
      serialized([
        {
          chatId: 100,
          threadId: null,
          tmuxSession: "recovered",
          directory: "/d",
          opencodeSessionId: "ses_bak",
          createdAt: EPOCH,
          updatedAt: EPOCH,
        },
      ]),
    );

    // When the store loads
    const store = openStore();

    // Then the backup contents are live, including the reverse index
    expect(store.list()).toHaveLength(1);
    expect(store.getByChat(100, null)?.tmuxSession).toBe("recovered");
    expect(store.getByOpencodeSession("ses_bak")?.tmuxSession).toBe(
      "recovered",
    );
  });

  it("does not overwrite the good backup with the corrupt primary on the next save", () => {
    // Given a store recovered from backup
    writeRaw(file, "{ this is not json");
    writeRaw(
      backup,
      serialized([
        {
          chatId: 100,
          threadId: null,
          tmuxSession: "recovered",
          directory: "/d",
          opencodeSessionId: null,
          createdAt: EPOCH,
          updatedAt: EPOCH,
        },
      ]),
    );
    const store = openStore();

    // When the next mutation is saved
    store.upsert({
      chatId: 200,
      threadId: null,
      tmuxSession: "fresh",
      directory: "/d2",
    });

    // Then the backup still holds parseable data, not the garbage primary
    const parsedBackup: unknown = JSON.parse(readFileSync(backup, "utf-8"));
    expect(parsedBackup).toMatchObject({ version: 1 });
    expect(JSON.parse(readFileSync(file, "utf-8"))).toMatchObject({
      version: 1,
    });
  });

  it("throws when both the primary file and its backup are unusable", () => {
    // Given two unreadable files
    writeRaw(file, "not json at all");
    writeRaw(backup, "also not json");

    // When the store loads
    // Then it fails loudly instead of silently discarding bindings
    expect(() => openStore()).toThrow(BindingStoreCorruptError);
  });

  it("round-trips bindings to a new store instance on the same path", () => {
    // Given bindings written by one instance
    const first = createBindingStore(file, { now: stepClock() });
    first.upsert({
      chatId: 100,
      threadId: null,
      tmuxSession: "alpha",
      directory: "/a",
    });
    first.upsert({
      chatId: 100,
      threadId: 42,
      tmuxSession: "beta",
      directory: "/b",
    });
    first.setOpencodeSession(100, 42, "ses_beta");

    // When a second instance loads the same path
    const second = createBindingStore(file, { now: stepClock() });

    // Then every binding and the rebuilt reverse index are visible
    expect(second.list()).toHaveLength(2);
    expect(second.getByChat(100, null)?.tmuxSession).toBe("alpha");
    expect(second.getByChat(100, 42)?.directory).toBe("/b");
    expect(second.getByOpencodeSession("ses_beta")?.tmuxSession).toBe("beta");
  });
});
