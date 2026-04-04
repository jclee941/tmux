import type { TmuxSession } from "../lib/tmux";
import {
  capturePanes,
  currentSession,
  killSession,
  listSessions,
  renameSession,
  switchClient,
} from "../lib/tmux";

export interface SessionActionDeps {
  selectedSession: () => TmuxSession | null;
  renameValue: () => string;
  setSessions: (sessions: TmuxSession[]) => void;
  setActiveSessionName: (name: string) => void;
  setPreviewContent: (content: string) => void;
  setWizardOpen: (open: boolean) => void;
  setRenameOpen: (open: boolean) => void;
  setKillConfirmOpen: (open: boolean) => void;
}

export function createSessionActions(deps: SessionActionDeps) {
  const handleWizardCreated = (sessionName: string) => {
    const refreshed = listSessions();
    deps.setSessions(refreshed);
    deps.setActiveSessionName(sessionName);
    switchClient(sessionName);
    deps.setPreviewContent(capturePanes(sessionName));
    deps.setWizardOpen(false);
  };

  const handleRenameConfirm = () => {
    const target = deps.selectedSession();
    const nextName = deps.renameValue().trim();
    if (!target || !nextName || nextName === target.name) {
      deps.setRenameOpen(false);
      return;
    }

    if (!renameSession(target.name, nextName)) {
      deps.setRenameOpen(false);
      return;
    }

    const refreshed = listSessions();
    deps.setSessions(refreshed);
    deps.setActiveSessionName(nextName);
    switchClient(nextName);
    deps.setPreviewContent(capturePanes(nextName));
    deps.setRenameOpen(false);
  };

  const handleKillConfirm = () => {
    const target = deps.selectedSession();
    if (!target) {
      deps.setKillConfirmOpen(false);
      return;
    }

    const current = currentSession();
    if (!killSession(target.name)) {
      deps.setKillConfirmOpen(false);
      return;
    }

    const refreshed = listSessions();
    deps.setSessions(refreshed);

    const next = refreshed[0] ?? null;
    if (target.name === current && next) {
      switchClient(next.name);
    }

    if (next) {
      deps.setActiveSessionName(next.name);
      deps.setPreviewContent(capturePanes(next.name));
    } else {
      deps.setActiveSessionName("");
      deps.setPreviewContent("");
    }

    deps.setKillConfirmOpen(false);
  };

  return {
    handleWizardCreated,
    handleRenameConfirm,
    handleKillConfirm,
  };
}
