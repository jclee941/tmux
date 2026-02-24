import { describe, expect, it } from "vitest";
import { ActionId, CallbackId } from "../types.js";

describe("type constants", () => {
  it("ActionId exposes expected keys", () => {
    expect(Object.keys(ActionId).sort()).toEqual(
      [
        "SESSION_LIST",
        "SESSION_KILL",
        "SESSION_CAPTURE",
        "SESSION_SEND_KEYS",
        "SESSION_RENAME",
        "SESSION_NEW",
        "SESSION_SYNC",
        "SESSION_OPENCODE",
        "BACK_TO_LIST",
      ].sort(),
    );
  });

  it("CallbackId exposes expected keys", () => {
    expect(Object.keys(CallbackId).sort()).toEqual(
      ["SEND_KEYS", "RENAME", "NEW_SESSION"].sort(),
    );
  });

  it("values are unique strings", () => {
    const actionValues = Object.values(ActionId);
    const callbackValues = Object.values(CallbackId);

    for (const v of [...actionValues, ...callbackValues]) {
      expect(typeof v).toBe("string");
    }

    expect(new Set(actionValues).size).toBe(actionValues.length);
    expect(new Set(callbackValues).size).toBe(callbackValues.length);

    const all = [...actionValues, ...callbackValues];
    expect(new Set(all).size).toBe(all.length);
  });
});
