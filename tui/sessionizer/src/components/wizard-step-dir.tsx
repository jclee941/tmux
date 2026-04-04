import type { CandidateDir } from "../lib/dirs";
import { THEME } from "../lib/theme";

export interface WizardStepDirProps {
  dirs: CandidateDir[];
  selectedIndex: number;
  onChange: (index: number) => void;
  onSelect: () => void;
}

export function WizardStepDir(props: WizardStepDirProps) {
  return (
    <box flexDirection="column" flexGrow={1} gap={1}>
      <text fg={THEME.muted}>Select project directory</text>
      <select
        width="100%"
        height="100%"
        options={props.dirs.map((dir) => ({
          name: dir.name,
          description: dir.path,
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
