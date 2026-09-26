import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { logger } from "../logger.js";
import type { Binding } from "./bindings.js";

const SCHEMA_VERSION = 1;

/** Both the store file and its backup failed to parse. Neither was modified. */
export class BindingStoreCorruptError extends Error {
  readonly filePath: string;
  readonly backupPath: string;

  constructor(filePath: string, backupPath: string) {
    super(
      `Binding store unusable: neither ${filePath} nor ${backupPath} could be parsed. ` +
        "Both files were left untouched - fix or remove them and restart.",
    );
    this.name = "BindingStoreCorruptError";
    this.filePath = filePath;
    this.backupPath = backupPath;
  }
}

/** Durable side of the binding store: load once, then persist atomically. */
export interface BindingFile {
  load(): readonly Binding[];
  save(bindings: readonly Binding[]): void;
}

type ReadOutcome =
  | { readonly kind: "ok"; readonly bindings: readonly Binding[] }
  | { readonly kind: "missing" }
  | { readonly kind: "unusable" };

interface LoadResult {
  readonly bindings: readonly Binding[];
  readonly recoveredFromBackup: boolean;
}

function assertNever(value: never): never {
  throw new Error(`Unreachable variant: ${JSON.stringify(value)}`);
}

function isFileNotFound(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === "ENOENT";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses one persisted entry. Returns null when the shape does not hold. */
function parseBinding(value: unknown): Binding | null {
  if (!isRecord(value)) {
    return null;
  }
  const {
    chatId,
    threadId,
    tmuxSession,
    directory,
    opencodeSessionId,
    createdAt,
    updatedAt,
  } = value;

  if (typeof chatId !== "number") return null;
  if (threadId !== null && typeof threadId !== "number") return null;
  if (typeof tmuxSession !== "string") return null;
  if (typeof directory !== "string") return null;
  if (opencodeSessionId !== null && typeof opencodeSessionId !== "string") {
    return null;
  }
  if (typeof createdAt !== "string") return null;
  if (typeof updatedAt !== "string") return null;

  return {
    chatId,
    threadId,
    tmuxSession,
    directory,
    opencodeSessionId,
    createdAt,
    updatedAt,
  };
}

/** Parses the whole file. One bad entry invalidates it, so the caller falls back. */
function parseStoreFile(raw: string): readonly Binding[] | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value) || !Array.isArray(value.bindings)) {
    return null;
  }

  const parsed: Binding[] = [];
  for (const entry of value.bindings) {
    const binding = parseBinding(entry);
    if (binding === null) {
      return null;
    }
    parsed.push(binding);
  }
  return parsed;
}

function readStoreFile(path: string): ReadOutcome {
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (error) {
    return isFileNotFound(error) ? { kind: "missing" } : { kind: "unusable" };
  }

  const bindings = parseStoreFile(raw);
  return bindings === null ? { kind: "unusable" } : { kind: "ok", bindings };
}

function loadFromBackup(
  filePath: string,
  backupPath: string,
  primaryKind: "missing" | "unusable",
): LoadResult {
  const backup = readStoreFile(backupPath);
  switch (backup.kind) {
    case "ok":
      logger.warn(
        `[bindings] ${filePath} was ${primaryKind}; recovered from ${backupPath}`,
      );
      // Only a damaged primary must be shielded from the next rotation: rotating
      // it would overwrite the backup that holds the only good copy.
      return {
        bindings: backup.bindings,
        recoveredFromBackup: primaryKind === "unusable",
      };
    case "missing":
      if (primaryKind === "missing") {
        return { bindings: [], recoveredFromBackup: false };
      }
      throw new BindingStoreCorruptError(filePath, backupPath);
    case "unusable":
      throw new BindingStoreCorruptError(filePath, backupPath);
    default:
      return assertNever(backup);
  }
}

function loadBindings(filePath: string, backupPath: string): LoadResult {
  const primary = readStoreFile(filePath);
  switch (primary.kind) {
    case "ok":
      return { bindings: primary.bindings, recoveredFromBackup: false };
    case "missing":
    case "unusable":
      return loadFromBackup(filePath, backupPath, primary.kind);
    default:
      return assertNever(primary);
  }
}

/**
 * Crash-safe JSON file for bindings: every save goes
 * write-temp -> rotate-backup -> rename, so an interrupted write leaves either
 * the previous file or the new one intact - never a half-written file.
 *
 * @param filePath absolute path to the store file (injected, never derived here)
 */
export function createBindingFile(filePath: string): BindingFile {
  // Siblings of the target so both renames stay inside one filesystem.
  const backupPath = `${filePath}.bak`;
  const tempPath = `${filePath}.tmp`;
  let rotateBackupOnSave = true;

  const rotateBackup = (): void => {
    try {
      renameSync(filePath, backupPath);
    } catch (error) {
      // Nothing to rotate before the very first write.
      if (!isFileNotFound(error)) {
        throw error;
      }
    }
  };

  return {
    load: () => {
      const result = loadBindings(filePath, backupPath);
      rotateBackupOnSave = !result.recoveredFromBackup;
      return result.bindings;
    },

    save: (bindings) => {
      const payload = { version: SCHEMA_VERSION, bindings };
      mkdirSync(dirname(filePath), { recursive: true });
      try {
        writeFileSync(
          tempPath,
          `${JSON.stringify(payload, null, 2)}\n`,
          "utf-8",
        );
        if (rotateBackupOnSave) {
          rotateBackup();
        }
        renameSync(tempPath, filePath);
        rotateBackupOnSave = true;
      } catch (error) {
        rmSync(tempPath, { force: true });
        throw error;
      }
    },
  };
}
