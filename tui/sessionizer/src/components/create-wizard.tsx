import { createEffect, createMemo, createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { homedir } from "os";
import { join } from "path";
import { scanDirs, sanitizeName, type CandidateDir } from "../lib/dirs";
import { readConfig } from "../lib/config";
import { hasSession, newSession } from "../lib/tmux";
import { THEME } from "../lib/theme";

type WizardStep = 1 | 2 | 3;

interface LayoutOption {
  name: string;
  path: string;
}

export interface CreateWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: (sessionName: string) => void;
}

export function CreateWizard(props: CreateWizardProps) {
  const [step, setStep] = createSignal<WizardStep>(1);
  const [dirs, setDirs] = createSignal<CandidateDir[]>([]);
  const [layouts, setLayouts] = createSignal<LayoutOption[]>([]);
  const [dirIndex, setDirIndex] = createSignal(0);
  const [layoutIndex, setLayoutIndex] = createSignal(0);
  const [sessionName, setSessionName] = createSignal("");
  const [errorText, setErrorText] = createSignal("");

  const selectedDir = createMemo(() => dirs()[dirIndex()] ?? null);
  const selectedLayout = createMemo(() => layouts()[layoutIndex()] ?? null);

  const resetState = () => {
    const discoveredDirs = scanDirs();
    const config = readConfig();

    setDirs(discoveredDirs);
    setLayouts(
      config.layouts.map((name) => ({
        name,
        path: join(config.layoutDir, `${name}.yml`),
      })),
    );
    setStep(1);
    setDirIndex(0);
    setLayoutIndex(0);
    setErrorText("");
    setSessionName(discoveredDirs[0]?.name ?? "new_session");
  };

  createEffect(() => {
    if (props.open) resetState();
  });

  const handleDirSelect = (index: number) => {
    setDirIndex(index);
  };

  const handleLayoutSelect = (index: number) => {
    setLayoutIndex(index);
  };

  const handleCreate = () => {
    const dir = selectedDir();
    const layout = selectedLayout();
    const raw = sessionName().trim();
    const name = sanitizeName(raw);

    if (!dir) {
      setErrorText("No directory selected");
      return;
    }
    if (!layout) {
      setErrorText("No layout selected");
      return;
    }
    if (!name) {
      setErrorText("Session name is required");
      return;
    }
    if (hasSession(name)) {
      setErrorText(`Session already exists: ${name}`);
      return;
    }

    const created = newSession(name, dir.path);
    if (!created) {
      setErrorText("Failed to create tmux session");
      return;
    }

    const layoutScript = join(homedir(), ".tmux", "bin", "tmux-layout-apply");
    const sidebarScript = join(homedir(), ".tmux", "bin", "tmux-sidebar-init");

    Bun.spawnSync([layoutScript, name, dir.path, layout.path], {
      stdout: "pipe",
      stderr: "pipe",
    });
    Bun.spawnSync([sidebarScript, name], {
      stdout: "pipe",
      stderr: "pipe",
    });

    props.onCreated(name);
  };

  const nextStep = () => {
    if (step() === 1) {
      setSessionName(selectedDir()?.name ?? "new_session");
      setStep(2);
      return;
    }
    if (step() === 2) {
      setStep(3);
      return;
    }
    handleCreate();
  };

  const prevStep = () => {
    if (step() === 1) {
      props.onClose();
      return;
    }
    if (step() === 2) {
      setStep(1);
      return;
    }
    setStep(2);
  };

  useKeyboard((key) => {
    if (!props.open) return;

    const name = key.name?.toLowerCase?.() ?? "";

    if (name === "escape") {
      props.onClose();
      return;
    }

    if (name === "left") {
      prevStep();
      return;
    }

    if (name === "backspace") {
      if (step() !== 3 || sessionName() === "") {
        prevStep();
      }
      return;
    }

    if (name === "enter" && step() === 3) {
      handleCreate();
    }
  });

  if (!props.open) return null;

  return (
    <box
      position="absolute"
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
      backgroundColor={THEME.bgDark}
    >
      <box
        width="60%"
        height="70%"
        flexDirection="column"
        border
        borderStyle="double"
        borderColor={THEME.accent}
        backgroundColor={THEME.bg}
        padding={1}
      >
        <text fg={THEME.fgHighlight}>
          <strong>Create Session ({step()}/3)</strong>
        </text>

        {step() === 1 ? (
          <box flexDirection="column" flexGrow={1} gap={1}>
            <text fg={THEME.muted}>Select project directory</text>
            <select
              width="100%"
              height="100%"
              options={dirs().map((dir) => ({
                name: dir.name,
                description: dir.path,
              }))}
              selectedIndex={dirIndex()}
              wrapSelection
              showDescription
              showScrollIndicator
              focused
              backgroundColor={THEME.bg}
              textColor={THEME.fg}
              selectedBackgroundColor={THEME.bgHighlight}
              selectedTextColor={THEME.fgHighlight}
              onChange={(index) => handleDirSelect(index)}
              onSelect={() => nextStep()}
            />
          </box>
        ) : null}

        {step() === 2 ? (
          <box flexDirection="column" flexGrow={1} gap={1}>
            <text fg={THEME.muted}>Select layout</text>
            <select
              width="100%"
              height="100%"
              options={layouts().map((layout) => ({
                name: layout.name,
                description: layout.path,
              }))}
              selectedIndex={layoutIndex()}
              wrapSelection
              showDescription
              showScrollIndicator
              focused
              backgroundColor={THEME.bg}
              textColor={THEME.fg}
              selectedBackgroundColor={THEME.bgHighlight}
              selectedTextColor={THEME.fgHighlight}
              onChange={(index) => handleLayoutSelect(index)}
              onSelect={() => nextStep()}
            />
          </box>
        ) : null}

        {step() === 3 ? (
          <box flexDirection="column" flexGrow={1} gap={1}>
            <text fg={THEME.muted}>Session name</text>
            <input
              focused
              width="100%"
              value={sessionName()}
              placeholder="session-name"
              onInput={(value) => setSessionName(value)}
            />
            <text fg={THEME.muted}>Dir: {selectedDir()?.path ?? "-"}</text>
            <text fg={THEME.muted}>
              Layout: {selectedLayout()?.name ?? "-"}
            </text>
          </box>
        ) : null}

        {errorText() ? <text fg={THEME.red}>{errorText()}</text> : null}

        <box flexDirection="row" gap={2}>
          <text fg={THEME.muted}>Esc: cancel</text>
          <text fg={THEME.muted}>Left/Backspace: back</text>
          <text fg={THEME.muted}>Enter: next/create</text>
        </box>
      </box>
    </box>
  );
}
