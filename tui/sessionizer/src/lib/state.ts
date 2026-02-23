import { createStore } from "solid-js/store";
import type { TmuxSession } from "./tmux";

export interface SessionizerState {
  sessions: TmuxSession[];
  filter: string;
  selectedIdx: number;
  previewLines: string[];
  originalSession: string;
  isWizardOpen: boolean;
  isRenaming: boolean;
}

const initialState: SessionizerState = {
  sessions: [],
  filter: "",
  selectedIdx: 0,
  previewLines: [],
  originalSession: "",
  isWizardOpen: false,
  isRenaming: false,
};

export function createSessionizerStore() {
  return createStore<SessionizerState>({ ...initialState });
}

export type SessionizerStore = ReturnType<typeof createSessionizerStore>;
