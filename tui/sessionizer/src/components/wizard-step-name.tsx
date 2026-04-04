import { THEME } from "../lib/theme";

export interface WizardStepNameProps {
  sessionName: string;
  onSessionNameInput: (value: string) => void;
  selectedDirPath: string;
  selectedLayoutName: string;
}

export function WizardStepName(props: WizardStepNameProps) {
  return (
    <box flexDirection="column" flexGrow={1} gap={1}>
      <text fg={THEME.muted}>Session name</text>
      <input
        focused
        width="100%"
        value={props.sessionName}
        placeholder="session-name"
        onInput={props.onSessionNameInput}
      />
      <text fg={THEME.muted}>Dir: {props.selectedDirPath}</text>
      <text fg={THEME.muted}>Layout: {props.selectedLayoutName}</text>
    </box>
  );
}
