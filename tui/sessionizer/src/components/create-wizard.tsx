import { createEffect, createMemo, createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { join } from "path";
import { scanDirs, type CandidateDir } from "../lib/dirs";
import { readConfig } from "../lib/config";
import { THEME } from "../lib/theme";
import { createSession } from "../lib/create-session";
import { WizardStepDir } from "./wizard-step-dir";
import { WizardStepLayout } from "./wizard-step-layout";
import { WizardStepName } from "./wizard-step-name";

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

  const handleCreate = () => {
    createSession({
      selectedDir: selectedDir(),
      selectedLayout: selectedLayout(),
      rawSessionName: sessionName(),
      onError: setErrorText,
      onCreated: props.onCreated,
    });
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
          <WizardStepDir
            dirs={dirs()}
            selectedIndex={dirIndex()}
            onChange={setDirIndex}
            onSelect={nextStep}
          />
        ) : null}

        {step() === 2 ? (
          <WizardStepLayout
            layouts={layouts()}
            selectedIndex={layoutIndex()}
            onChange={setLayoutIndex}
            onSelect={nextStep}
          />
        ) : null}

        {step() === 3 ? (
          <WizardStepName
            sessionName={sessionName()}
            onSessionNameInput={setSessionName}
            selectedDirPath={selectedDir()?.path ?? "-"}
            selectedLayoutName={selectedLayout()?.name ?? "-"}
          />
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
