import { THEME } from "../lib/theme";

export interface RenameDialogProps {
  open: boolean;
  currentSessionName: string;
  value: string;
  onInput: (value: string) => void;
}

export function RenameDialog(props: RenameDialogProps) {
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
        <text fg={THEME.muted}>Current: {props.currentSessionName}</text>
        <input focused width="100%" value={props.value} onInput={props.onInput} />
        <text fg={THEME.muted}>Enter: confirm / Esc: cancel</text>
      </box>
    </box>
  );
}
