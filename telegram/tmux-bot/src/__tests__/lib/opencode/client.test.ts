import { beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  client: { session: {} },
  createOpencodeClient: vi.fn(),
}));

vi.mock("@opencode-ai/sdk/v2", () => ({
  createOpencodeClient: sdk.createOpencodeClient,
}));

vi.mock("../../../lib/config.js", () => ({
  config: { opencode: { apiUrl: "http://opencode.test:4096" } },
}));

import {
  getOpencodeClient,
  resetOpencodeClientForTests,
} from "../../../lib/opencode/client.js";

describe("OpenCode client factory", () => {
  beforeEach(() => {
    sdk.createOpencodeClient.mockReset();
    sdk.createOpencodeClient.mockReturnValue(sdk.client);
    resetOpencodeClientForTests();
  });

  it("creates one client lazily when requested repeatedly", () => {
    // Given: an unused client factory
    expect(sdk.createOpencodeClient).not.toHaveBeenCalled();

    // When: callers request the client twice
    const first = getOpencodeClient();
    const second = getOpencodeClient();

    // Then: both calls share the base-URL-configured singleton
    expect(first).toBe(second);
    expect(sdk.createOpencodeClient).toHaveBeenCalledOnce();
    expect(sdk.createOpencodeClient).toHaveBeenCalledWith({
      baseUrl: "http://opencode.test:4096",
    });
  });

  it("creates a fresh client after a test reset", () => {
    // Given: an initialized singleton
    getOpencodeClient();

    // When: tests reset and request it again
    resetOpencodeClientForTests();
    getOpencodeClient();

    // Then: the SDK factory runs again
    expect(sdk.createOpencodeClient).toHaveBeenCalledTimes(2);
  });
});
