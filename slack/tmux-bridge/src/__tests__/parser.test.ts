import { describe, expect, it } from "vitest";
import { parseCommand } from "../commands/parser.js";

describe("parseCommand edge cases", () => {
  it("returns help for empty input", () => {
    expect(parseCommand("   ")).toEqual({ subcommand: "list", args: [], raw: "" });
  });

  it("parses single-word commands", () => {
    expect(parseCommand("list")).toEqual({ subcommand: "list", args: [], raw: "list" });
    expect(parseCommand("help")).toEqual({ subcommand: "help", args: [], raw: "help" });
    expect(parseCommand("sync")).toEqual({ subcommand: "sync", args: [], raw: "sync" });
  });

  it("parses commands with arguments", () => {
    expect(parseCommand("kill sessionName")).toEqual({
      subcommand: "kill",
      args: ["sessionName"],
      raw: "kill sessionName",
    });
  });

  it.todo("quoted arguments handle spaces");

  it("falls back to help for unknown commands", () => {
    expect(parseCommand("unknown stuff here")).toEqual({
      subcommand: "help",
      args: [],
      raw: "unknown stuff here",
    });
  });

  it("parses opencode subcommands", () => {
    expect(parseCommand("oc sessions")).toEqual({
      subcommand: "oc",
      args: ["sessions"],
      raw: "oc sessions",
    });
    expect(parseCommand("oc prompt hello world")).toEqual({
      subcommand: "oc",
      args: ["prompt", "hello", "world"],
      raw: "oc prompt hello world",
    });
  });

  it("normalizes the subcommand to lowercase while keeping arguments intact", () => {
    expect(parseCommand("KiLl MixedCase")).toEqual({
      subcommand: "kill",
      args: ["MixedCase"],
      raw: "KiLl MixedCase",
    });
  });
});
