import type {
  Session,
  SessionPromptResponse,
  SessionStatus,
} from "@opencode-ai/sdk/v2";
import { getOpencodeClient } from "./client.js";

export type PermissionReply = "once" | "always" | "reject";

export class OpenCodeApiError extends Error {
  readonly name = "OpenCodeApiError";

  constructor(
    readonly operation: string,
    readonly details: string,
  ) {
    super(`Failed to ${operation}: ${details}`);
  }
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

function throwResponseError(operation: string, error: unknown): void {
  if (error) throw new OpenCodeApiError(operation, stringifyError(error));
}

export async function createSession(
  directory: string,
  title?: string,
): Promise<Session> {
  const response = await getOpencodeClient().session.create({
    directory,
    ...(title === undefined ? {} : { title }),
  });
  throwResponseError("create session", response.error);
  if (!response.data) {
    throw new OpenCodeApiError("create session", "empty response");
  }
  return response.data;
}

export async function prompt(
  directory: string,
  sessionId: string,
  text: string,
): Promise<SessionPromptResponse | undefined> {
  const response = await getOpencodeClient().session.prompt({
    directory,
    sessionID: sessionId,
    parts: [{ type: "text", text }],
  });
  throwResponseError("prompt session", response.error);
  return response.data;
}

export async function abort(sessionId: string): Promise<boolean | undefined> {
  const response = await getOpencodeClient().session.abort({
    sessionID: sessionId,
  });
  throwResponseError("abort session", response.error);
  return response.data;
}

export async function sessionStatus(): Promise<Record<string, SessionStatus>> {
  const response = await getOpencodeClient().session.status();
  throwResponseError("get session status", response.error);
  return response.data ?? {};
}

export async function permissionReply(
  requestID: string,
  directory: string,
  reply: PermissionReply,
): Promise<boolean | undefined> {
  const response = await getOpencodeClient().permission.reply({
    requestID,
    directory,
    reply,
  });
  throwResponseError("reply to permission", response.error);
  return response.data;
}
