import {
  createOpencodeClient,
  type FileDiff,
  type Session,
  type SessionMessagesResponse,
  type SessionPromptResponse,
  type SessionStatus,
  type Todo,
} from "@opencode-ai/sdk";
import { config } from "./config.js";

let client: ReturnType<typeof createOpencodeClient> | null = null;

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function getClient() {
  if (!config.opencode.enabled) {
    throw new Error("OpenCode integration disabled");
  }

  if (!client) {
    client = createOpencodeClient({
      baseUrl: config.opencode.url,
      directory: config.opencode.directory,
    });
  }

  return client;
}

export async function listOpencodeSessions(): Promise<Session[]> {
  const c = getClient();
  const res = await c.session.list();
  if (res.error) {
    throw new Error(`Failed to list sessions: ${stringifyError(res.error)}`);
  }
  return res.data ?? [];
}

export async function getSessionStatus(): Promise<
  Record<string, SessionStatus>
> {
  const c = getClient();
  const res = await c.session.status();
  if (res.error) {
    throw new Error(`Failed to get status: ${stringifyError(res.error)}`);
  }
  return res.data ?? {};
}

export async function createOCSession(title?: string): Promise<Session> {
  const c = getClient();
  const res = await c.session.create({ body: { title } });
  if (res.error) {
    throw new Error(`Failed to create session: ${stringifyError(res.error)}`);
  }
  if (!res.data) {
    throw new Error("Failed to create session: empty response");
  }
  return res.data;
}

export async function promptSession(
  sessionId: string,
  text: string,
): Promise<SessionPromptResponse | undefined> {
  const c = getClient();
  const res = await c.session.prompt({
    path: { id: sessionId },
    body: { parts: [{ type: "text", text }] },
  });
  if (res.error) {
    throw new Error(`Prompt failed: ${stringifyError(res.error)}`);
  }
  return res.data;
}

export async function getSessionMessages(
  sessionId: string,
): Promise<SessionMessagesResponse> {
  const c = getClient();
  const res = await c.session.messages({ path: { id: sessionId } });
  if (res.error) {
    throw new Error(`Failed to get messages: ${stringifyError(res.error)}`);
  }
  return res.data ?? [];
}

export async function getSessionTodos(sessionId: string): Promise<Todo[]> {
  const c = getClient();
  const res = await c.session.todo({ path: { id: sessionId } });
  if (res.error) {
    throw new Error(`Failed to get todos: ${stringifyError(res.error)}`);
  }
  return res.data ?? [];
}

export async function getSessionDiff(sessionId: string): Promise<FileDiff[]> {
  const c = getClient();
  const res = await c.session.diff({ path: { id: sessionId } });
  if (res.error) {
    throw new Error(`Failed to get diff: ${stringifyError(res.error)}`);
  }
  return res.data ?? [];
}

export async function abortSession(
  sessionId: string,
): Promise<boolean | undefined> {
  const c = getClient();
  const res = await c.session.abort({ path: { id: sessionId } });
  if (res.error) {
    throw new Error(`Failed to abort: ${stringifyError(res.error)}`);
  }
  return res.data;
}
