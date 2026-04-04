import { THEME } from "../lib/theme";

interface LayoutOption {
  name: string;
  path: string;
}

export interface WizardStepLayoutProps {
  layouts: LayoutOption[];
  selectedIndex: number;
  onChange: (index: number) => void;
  onSelect: () => void;
}

export function WizardStepLayout(props: WizardStepLayoutProps) {
  return (
    <box flexDirection="column" flexGrow={1} gap={1}>
      <text fg={THEME.muted}>Select layout</text>
      <select
        width="100%"
        height="100%"
        options={props.layouts.map((layout) => ({
          name: layout.name,
          description: layout.path,
        }))}
        selectedIndex={props.selectedIndex}
        wrapSelection
        showDescription
        showScrollIndicator
        focused
        backgroundColor={THEME.bg}
        textColor={THEME.fg}
        selectedBackgroundColor={THEME.bgHighlight}
        selectedTextColor={THEME.fgHighlight}
        onChange={props.onChange}
        onSelect={props.onSelect}
      />
    </box>
  );
}
