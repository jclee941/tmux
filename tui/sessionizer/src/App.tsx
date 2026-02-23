import { THEME } from "./lib/theme";
import { createSessionizerStore } from "./lib/state";
import type { SessionizerConfig } from "./lib/config";
import type { TmuxSession } from "./lib/tmux";
import type { CandidateDir } from "./lib/dirs";

export function App() {
  const [state, setState] = createSessionizerStore();

  return (
    <box flexDirection="column" padding={1}>
      <text>
        <strong>tmux sessionizer TUI</strong>
      </text>
      <text>lib layer loaded — components pending T3-T8</text>
      <text>Press Ctrl+C to exit</text>
    </box>
  );
}
