import { THEME } from "../lib/theme";

export interface FilterInputProps {
  active: boolean;
  value: string;
  onInput: (value: string) => void;
}

export function FilterInput(props: FilterInputProps) {
  return (
    <box
      flexDirection="row"
      alignItems="center"
      paddingX={1}
      paddingY={0}
      height={3}
      border
      borderColor={props.active ? THEME.accent : THEME.muted}
      backgroundColor={THEME.bgDark}
    >
      <text fg={props.active ? THEME.accent : THEME.muted}>/ </text>
      <input
        width="100%"
        value={props.value}
        placeholder="Filter sessions"
        focused={props.active}
        onInput={props.onInput}
      />
    </box>
  );
}
