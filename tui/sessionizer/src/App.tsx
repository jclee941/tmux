import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { CreateWizard } from "./components/create-wizard";
import { FilterInput } from "./components/filter-input";
import { SessionList } from "./components/session-list";
import { PreviewPanel } from "./components/preview-panel";
import { THEME } from "./lib/theme";
import {
  capturePanes,
  currentSession,
  killSession,
  listSessions,
  renameSession,
  switchClient,
} from "./lib/tmux";

export function App() {
  const [sessions, setSessions] = createSignal(listSessions());
  const [activeSessionName, setActiveSessionName] = createSignal("");
  const [originalSessionName, setOriginalSessionName] = createSignal("");
  const [previewContent, setPreviewContent] = createSignal("");
  const [filterActive, setFilterActive] = createSignal(false);
  const [filterQuery, setFilterQuery] = createSignal("");
  const [wizardOpen, setWizardOpen] = createSignal(false);
  const [renameOpen, setRenameOpen] = createSignal(false);
  const [renameValue, setRenameValue] = createSignal("");
  const [killConfirmOpen, setKillConfirmOpen] = createSignal(false);
  let selectionDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  const terminalWidth = () => process.stdout.columns ?? 80;
  const showPreview = () => terminalWidth() >= 60;

  const filteredSessions = createMemo(() => {
    const query = filterQuery().trim().toLowerCase();
    if (!query) return sessions();
    return sessions().filter((session) =>
      session.name.toLowerCase().includes(query),
    );
  });

  const effectiveSessionName = createMemo(() => {
    const filtered = filteredSessions();
    if (filtered.length === 0) return "";
    if (filtered.some((session) => session.name === activeSessionName())) {
      return activeSessionName();
    }
    return filtered[0]?.name ?? "";
  });

  const selectedSession = () =>
    filteredSessions().find(
      (session) => session.name === effectiveSessionName(),
    ) ?? null;

  const clearSelectionDebounce = () => {
    if (selectionDebounceTimer) {
      clearTimeout(selectionDebounceTimer);
      selectionDebounceTimer = undefined;
    }
  };

  const scheduleSelectionEffects = (name: string) => {
    clearSelectionDebounce();
    selectionDebounceTimer = setTimeout(() => {
      switchClient(name);
      setPreviewContent(capturePanes(name));
    }, 150);
  };

  const restoreAndExit = () => {
    const original = originalSessionName();
    if (original) switchClient(original);
    process.exit(0);
  };

  onCleanup(() => {
    clearSelectionDebounce();
  });

  onMount(() => {
    const initialSessions = listSessions();
    const original = currentSession();

    setSessions(initialSessions);
    setOriginalSessionName(original);

    const initialTarget =
      initialSessions.find((session) => session.name === original) ??
      initialSessions[0] ??
      null;

    if (initialTarget) {
      setActiveSessionName(initialTarget.name);
      setPreviewContent(capturePanes(initialTarget.name));
    }
  });

  createEffect(() => {
    const name = effectiveSessionName();
    if (!name) {
      setPreviewContent("");
      return;
    }
    scheduleSelectionEffects(name);
  });

  const handleSelectionChange = (session: { name: string }) => {
    setActiveSessionName(session.name);
    scheduleSelectionEffects(session.name);
  };

  const handleConfirm = (session: { name: string }) => {
    switchClient(session.name);
    process.exit(0);
  };

  const selectFilteredSelection = () => {
    const target = selectedSession() ?? filteredSessions()[0] ?? null;
    if (!target) return;
    handleSelectionChange(target);
    setFilterActive(false);
  };

  useKeyboard((key) => {
    const name = key.name?.toLowerCase?.() ?? "";
    const sequence = key.sequence?.toLowerCase?.() ?? "";
    const ctrl = key.ctrl === true;

    if (name === "escape") {
      restoreAndExit();
      return;
    }

    if (wizardOpen()) {
      return;
    }

    if (renameOpen()) {
      if (name === "enter") {
        handleRenameConfirm();
        return;
      }
      return;
    }

    if (killConfirmOpen()) {
      if (sequence === "n") {
        setKillConfirmOpen(false);
        return;
      }
      if (sequence === "y") {
        handleKillConfirm();
        return;
      }
      return;
    }

    if (ctrl && sequence === "n") {
      setFilterActive(false);
      setWizardOpen(true);
      return;
    }

    if (ctrl && sequence === "r") {
      const target = selectedSession();
      if (!target) return;
      setFilterActive(false);
      setRenameValue(target.name);
      setRenameOpen(true);
      return;
    }

    if (ctrl && sequence === "d") {
      const target = selectedSession();
      if (!target) return;
      setFilterActive(false);
      setKillConfirmOpen(true);
      return;
    }

    if (filterActive()) {
      if (name === "enter") {
        selectFilteredSelection();
        return;
      }
      if (name === "backspace" && filterQuery() === "") {
        setFilterActive(false);
        return;
      }
      return;
    }

    if (sequence === "/") {
      setFilterActive(true);
      return;
    }

    if (sequence === "q") {
      restoreAndExit();
    }
  });

  const handleFilterInput = (value: string) => {
    setFilterQuery(value);
    setFilterActive(true);
  };

  const handleWizardCreated = (sessionName: string) => {
    const refreshed = listSessions();
    setSessions(refreshed);
    setActiveSessionName(sessionName);
    switchClient(sessionName);
    setPreviewContent(capturePanes(sessionName));
    setWizardOpen(false);
  };

  const handleRenameConfirm = () => {
    const target = selectedSession();
    const nextName = renameValue().trim();
    if (!target || !nextName || nextName === target.name) {
      setRenameOpen(false);
      return;
    }

    if (!renameSession(target.name, nextName)) {
      setRenameOpen(false);
      return;
    }

    const refreshed = listSessions();
    setSessions(refreshed);
    setActiveSessionName(nextName);
    switchClient(nextName);
    setPreviewContent(capturePanes(nextName));
    setRenameOpen(false);
  };

  const handleKillConfirm = () => {
    const target = selectedSession();
    if (!target) {
      setKillConfirmOpen(false);
      return;
    }

    const current = currentSession();
    if (!killSession(target.name)) {
      setKillConfirmOpen(false);
      return;
    }

    const refreshed = listSessions();
    setSessions(refreshed);

    const next = refreshed[0] ?? null;
    if (target.name === current && next) {
      switchClient(next.name);
    }

    if (next) {
      setActiveSessionName(next.name);
      setPreviewContent(capturePanes(next.name));
    } else {
      setActiveSessionName("");
      setPreviewContent("");
    }

    setKillConfirmOpen(false);
  };

  return (
    <box
      flexDirection="row"
      width="100%"
      height="100%"
      backgroundColor={THEME.bg}
      padding={1}
      gap={1}
    >
      <box
        width={showPreview() ? "40%" : "100%"}
        height="100%"
        flexDirection="column"
      >
        <FilterInput
          active={filterActive()}
          value={filterQuery()}
          onInput={handleFilterInput}
        />
        <box flexGrow={1}>
          <SessionList
            sessions={filteredSessions()}
            currentSession={effectiveSessionName()}
            onSelectionChange={handleSelectionChange}
            onConfirm={handleConfirm}
          />
        </box>
      </box>

      {showPreview() ? (
        <box width="60%" height="100%">
          <PreviewPanel
            session={selectedSession()}
            previewContent={previewContent()}
            isDirectory={false}
          />
        </box>
      ) : null}

      <CreateWizard
        open={wizardOpen()}
        onClose={() => setWizardOpen(false)}
        onCreated={handleWizardCreated}
      />

      {renameOpen() ? (
        <box
          position="absolute"
          width="100%"
          height="100%"
          justifyContent="center"
          alignItems="center"
          backgroundColor={THEME.bgDark}
        >
          <box
            width="55%"
            flexDirection="column"
            border
            borderColor={THEME.accent}
            backgroundColor={THEME.bg}
            padding={1}
            gap={1}
          >
            <text fg={THEME.fgHighlight}>
              <strong>Rename session</strong>
            </text>
            <text fg={THEME.muted}>Current: {effectiveSessionName()}</text>
            <input
              focused
              width="100%"
              value={renameValue()}
              onInput={(value) => setRenameValue(value)}
            />
            <text fg={THEME.muted}>Enter: confirm / Esc: cancel</text>
          </box>
        </box>
      ) : null}

      {killConfirmOpen() ? (
        <box
          position="absolute"
          width="100%"
          height="100%"
          justifyContent="center"
          alignItems="center"
          backgroundColor={THEME.bgDark}
        >
          <box
            width="55%"
            flexDirection="column"
            border
            borderColor={THEME.red}
            backgroundColor={THEME.bg}
            padding={1}
            gap={1}
          >
            <text fg={THEME.fgHighlight}>
              <strong>Kill session {effectiveSessionName()}?</strong>
            </text>
            <text fg={THEME.muted}>
              Press y to confirm, n or Esc to cancel.
            </text>
          </box>
        </box>
      ) : null}
    </box>
  );
}
