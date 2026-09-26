import { createOpencodeClient } from "@opencode-ai/sdk/v2";
import { config } from "../config.js";

type OpencodeClient = ReturnType<typeof createOpencodeClient>;

let client: OpencodeClient | null = null;

export function getOpencodeClient(): OpencodeClient {
  client ??= createOpencodeClient({ baseUrl: config.opencode.apiUrl });
  return client;
}

export function resetOpencodeClientForTests(): void {
  client = null;
}
