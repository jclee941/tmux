import { THEME } from "../lib/theme";

export interface KillConfirmDialogProps {
  open: boolean;
  sessionName: string;
}

export function KillConfirmDialog(props: KillConfirmDialogProps) {
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
        borderColor={THEME.red}
        backgroundColor={THEME.bg}
        padding={1}
        gap={1}
      >
        <text fg={THEME.fgHighlight}>
          <strong>Kill session {props.sessionName}?</strong>
        </text>
        <text fg={THEME.muted}>Press y to confirm, n or Esc to cancel.</text>
      </box>
    </box>
  );
}
