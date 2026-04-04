import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { createSessionActions } from "./actions/session-actions";
import { CreateWizard } from "./components/create-wizard";
import { FilterInput } from "./components/filter-input";
import { KillConfirmDialog } from "./components/kill-confirm-dialog";
import { PreviewPanel } from "./components/preview-panel";
import { RenameDialog } from "./components/rename-dialog";
import { SessionList } from "./components/session-list";
import { useKeyboardHandler } from "./hooks/use-keyboard-handler";
import { THEME } from "./lib/theme";
import { capturePanes, currentSession, listSessions, switchClient } from "./lib/tmux";

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

  const showPreview = () => (process.stdout.columns ?? 80) >= 60;

  const filteredSessions = createMemo(() => {
    const query = filterQuery().trim().toLowerCase();
    if (!query) return sessions();
    return sessions().filter((session) => session.name.toLowerCase().includes(query));
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
    filteredSessions().find((session) => session.name === effectiveSessionName()) ?? null;

  const clearSelectionDebounce = () => {
    if (!selectionDebounceTimer) return;
    clearTimeout(selectionDebounceTimer);
    selectionDebounceTimer = undefined;
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

  const { handleWizardCreated, handleRenameConfirm, handleKillConfirm } =
    createSessionActions({
      selectedSession,
      renameValue,
      setSessions,
      setActiveSessionName,
      setPreviewContent,
      setWizardOpen,
      setRenameOpen,
      setKillConfirmOpen,
    });

  useKeyboardHandler({
    restoreAndExit,
    wizardOpen,
    renameOpen,
    killConfirmOpen,
    filterActive,
    filterQuery,
    selectedSession,
    setFilterActive,
    setWizardOpen,
    setRenameOpen,
    setRenameValue,
    setKillConfirmOpen,
    selectFilteredSelection,
    onRenameConfirm: handleRenameConfirm,
    onKillConfirm: handleKillConfirm,
  });

  onMount(() => {
    const initialSessions = listSessions();
    const original = currentSession();
    setSessions(initialSessions);
    setOriginalSessionName(original);

    const initialTarget =
      initialSessions.find((session) => session.name === original) ?? initialSessions[0] ?? null;

    if (!initialTarget) return;
    setActiveSessionName(initialTarget.name);
    setPreviewContent(capturePanes(initialTarget.name));
  });

  createEffect(() => {
    const name = effectiveSessionName();
    if (!name) {
      setPreviewContent("");
      return;
    }
    scheduleSelectionEffects(name);
  });

  onCleanup(clearSelectionDebounce);

  return (
    <box
      flexDirection="row"
      width="100%"
      height="100%"
      backgroundColor={THEME.bg}
      padding={1}
      gap={1}
    >
      <box width={showPreview() ? "40%" : "100%"} height="100%" flexDirection="column">
        <FilterInput
          active={filterActive()}
          value={filterQuery()}
          onInput={(value) => {
            setFilterQuery(value);
            setFilterActive(true);
          }}
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

      <RenameDialog
        open={renameOpen()}
        currentSessionName={effectiveSessionName()}
        value={renameValue()}
        onInput={setRenameValue}
      />
      <KillConfirmDialog open={killConfirmOpen()} sessionName={effectiveSessionName()} />
    </box>
  );
}
