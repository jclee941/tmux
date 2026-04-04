import type { ParsedCommand, SubCommand } from "../types.js";

export const VALID_SUBCOMMANDS: Set<string> = new Set([
  "list",
  "ls",
  "new",
  "create",
  "kill",
  "rm",
  "send",
  "type",
  "capture",
  "cap",
  "rename",
  "mv",
  "opencode",
  "oc",
  "sync",
  "help",
]);

export function parseCommand(text: string): ParsedCommand {
  const trimmed = text.trim();
  if (!trimmed) return { subcommand: "list", args: [], raw: trimmed };

  const parts = trimmed.split(/\s+/);
  const sub = parts[0].toLowerCase();

  if (!VALID_SUBCOMMANDS.has(sub)) {
    return { subcommand: "help", args: [], raw: trimmed };
  }

  return {
    subcommand: sub as SubCommand,
    args: parts.slice(1),
    raw: trimmed,
  };
}
