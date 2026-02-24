import { THEME } from "../lib/theme";
import type { TmuxSession } from "../lib/tmux";

export interface PreviewPanelProps {
  session: TmuxSession | null;
  previewContent: string;
  isDirectory?: boolean;
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "unknown";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PreviewPanel(props: PreviewPanelProps) {
  if (!props.session) {
    return (
      <box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
        backgroundColor={THEME.bgDark}
        border
        borderColor={THEME.muted}
      >
        <text fg={THEME.muted}>No session selected</text>
      </box>
    );
  }

  const { session } = props;
  const hasContent = props.previewContent && props.previewContent.trim().length > 0;

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      backgroundColor={THEME.bgDark}
      border
      borderColor={THEME.muted}
    >
      <box
        flexDirection="column"
        padding={1}
        backgroundColor={THEME.bgDark}
        border
        borderColor={THEME.muted}
      >
        <box flexDirection="row" gap={1}>
          <text fg={THEME.fgHighlight}>
            <strong>{session.name}</strong>
          </text>
          <text fg={THEME.muted}>
            [{session.windows} window{session.windows !== 1 ? "s" : ""}]
          </text>
        </box>
        <text fg={THEME.muted}>{session.path}</text>
        <text fg={THEME.muted}>Created: {formatDate(session.created)}</text>
      </box>

      <box flexGrow={1} flexDirection="column">
        {hasContent ? (
          <scrollbox
            width="100%"
            height="100%"
            backgroundColor={THEME.bgDark}
            rootOptions={{
              backgroundColor: THEME.bgDark,
            }}
            viewportOptions={{
              backgroundColor: THEME.bgDark,
            }}
            contentOptions={{
              backgroundColor: THEME.bgDark,
            }}
          >
            <text fg={THEME.fg}>{props.previewContent}</text>
          </scrollbox>
        ) : (
          <box
            flexGrow={1}
            justifyContent="center"
            alignItems="center"
            backgroundColor={THEME.bgDark}
          >
            <text fg={THEME.muted}>Empty</text>
          </box>
        )}
      </box>
    </box>
  );
}
