import { homedir } from "os";
import { join } from "path";
import { sanitizeName, type CandidateDir } from "./dirs";
import { hasSession, newSession } from "./tmux";

interface LayoutOption {
  name: string;
  path: string;
}

export interface CreateSessionParams {
  selectedDir: CandidateDir | null;
  selectedLayout: LayoutOption | null;
  rawSessionName: string;
  onError: (message: string) => void;
  onCreated: (sessionName: string) => void;
}

export function createSession(params: CreateSessionParams): void {
  const name = sanitizeName(params.rawSessionName.trim());

  if (!params.selectedDir) {
    params.onError("No directory selected");
    return;
  }
  if (!params.selectedLayout) {
    params.onError("No layout selected");
    return;
  }
  if (!name) {
    params.onError("Session name is required");
    return;
  }
  if (hasSession(name)) {
    params.onError(`Session already exists: ${name}`);
    return;
  }

  const created = newSession(name, params.selectedDir.path);
  if (!created) {
    params.onError("Failed to create tmux session");
    return;
  }

  const layoutScript = join(homedir(), ".tmux", "bin", "tmux-layout-apply");
  const sidebarScript = join(homedir(), ".tmux", "bin", "tmux-sidebar-init");

  Bun.spawnSync([layoutScript, name, params.selectedDir.path, params.selectedLayout.path], {
    stdout: "pipe",
    stderr: "pipe",
  });
  Bun.spawnSync([sidebarScript, name], {
    stdout: "pipe",
    stderr: "pipe",
  });

  params.onCreated(name);
}
