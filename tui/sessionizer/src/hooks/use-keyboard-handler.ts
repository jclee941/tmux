import { useKeyboard } from "@opentui/solid";

interface NamedSession {
  name: string;
}

export interface KeyboardHandlerOptions {
  restoreAndExit: () => void;
  wizardOpen: () => boolean;
  renameOpen: () => boolean;
  killConfirmOpen: () => boolean;
  filterActive: () => boolean;
  filterQuery: () => string;
  selectedSession: () => NamedSession | null;
  setFilterActive: (active: boolean) => void;
  setWizardOpen: (open: boolean) => void;
  setRenameOpen: (open: boolean) => void;
  setRenameValue: (value: string) => void;
  setKillConfirmOpen: (open: boolean) => void;
  selectFilteredSelection: () => void;
  onRenameConfirm: () => void;
  onKillConfirm: () => void;
}

export function useKeyboardHandler(options: KeyboardHandlerOptions) {
  useKeyboard((key) => {
    const name = key.name?.toLowerCase?.() ?? "";
    const sequence = key.sequence?.toLowerCase?.() ?? "";
    const ctrl = key.ctrl === true;

    if (name === "escape") {
      options.restoreAndExit();
      return;
    }

    if (options.wizardOpen()) {
      return;
    }

    if (options.renameOpen()) {
      if (name === "enter") {
        options.onRenameConfirm();
      }
      return;
    }

    if (options.killConfirmOpen()) {
      if (sequence === "n") {
        options.setKillConfirmOpen(false);
        return;
      }
      if (sequence === "y") {
        options.onKillConfirm();
      }
      return;
    }

    if (ctrl && sequence === "n") {
      options.setFilterActive(false);
      options.setWizardOpen(true);
      return;
    }

    if (ctrl && sequence === "r") {
      const target = options.selectedSession();
      if (!target) return;
      options.setFilterActive(false);
      options.setRenameValue(target.name);
      options.setRenameOpen(true);
      return;
    }

    if (ctrl && sequence === "d") {
      const target = options.selectedSession();
      if (!target) return;
      options.setFilterActive(false);
      options.setKillConfirmOpen(true);
      return;
    }

    if (options.filterActive()) {
      if (name === "enter") {
        options.selectFilteredSelection();
        return;
      }
      if (name === "backspace" && options.filterQuery() === "") {
        options.setFilterActive(false);
      }
      return;
    }

    if (sequence === "/") {
      options.setFilterActive(true);
      return;
    }

    if (sequence === "q") {
      options.restoreAndExit();
    }
  });
}
