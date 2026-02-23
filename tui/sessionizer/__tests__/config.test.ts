import { describe, it, expect } from "bun:test";

describe("config lib", () => {
  it("readConfig returns valid config structure", () => {
    const { readConfig } = require("../src/lib/config");
    const config = readConfig();
    expect(config).toHaveProperty("scanDir");
    expect(config).toHaveProperty("extraDirs");
    expect(config).toHaveProperty("layoutDir");
    expect(config).toHaveProperty("layouts");
    expect(typeof config.scanDir).toBe("string");
    expect(Array.isArray(config.extraDirs)).toBe(true);
    expect(Array.isArray(config.layouts)).toBe(true);
  });

  it("scanDir is a valid path", () => {
    const { readConfig } = require("../src/lib/config");
    const config = readConfig();
    expect(config.scanDir.startsWith("/")).toBe(true);
  });

  it("extraDirs is an array", () => {
    const { readConfig } = require("../src/lib/config");
    const config = readConfig();
    expect(Array.isArray(config.extraDirs)).toBe(true);
  });
});
