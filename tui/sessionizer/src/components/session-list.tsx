import { createEffect, createMemo, createSignal } from "solid-js";
import { THEME } from "../lib/theme";
import type { TmuxSession } from "../lib/tmux";

export interface SessionListProps {
  sessions: TmuxSession[];
  currentSession: string;
  onSelectionChange: (session: TmuxSession) => void;
  onConfirm: (session: TmuxSession) => void;
}

function sortSessions(sessions: TmuxSession[]): TmuxSession[] {
  return [...sessions].sort((a, b) => a.name.localeCompare(b.name));
}

function formatLabel(session: TmuxSession, currentSession: string): string {
  const isCurrent = session.name === currentSession;
  const prefix = isCurrent ? "▸" : " ";
  const attached = session.attached ? " ●" : "";
  return `${prefix} ${session.name}  ${session.windows}w${attached}`;
}

export function SessionList(props: SessionListProps) {
  const sorted = createMemo(() => sortSessions(props.sessions));

  const options = createMemo(() =>
    sorted().map((session) => ({
      name: formatLabel(session, props.currentSession),
      description: session.path,
      value: session,
    })),
  );

  const [selectedIndex, setSelectedIndex] = createSignal(0);

  createEffect(() => {
    const sessions = sorted();
    if (sessions.length === 0) {
      setSelectedIndex(0);
      return;
    }
    const idx = sessions.findIndex((s) => s.name === props.currentSession);
    setSelectedIndex(idx >= 0 ? idx : 0);
  });

  return (
    <select
      options={options()}
      selectedIndex={selectedIndex()}
      focused
      wrapSelection
      showScrollIndicator
      showDescription={false}
      backgroundColor={THEME.bg}
      textColor={THEME.fg}
      selectedBackgroundColor={THEME.bgHighlight}
      selectedTextColor={THEME.accent}
      onChange={(index, _option) => {
        setSelectedIndex(index);
        const session = sorted()[index];
        if (session) props.onSelectionChange(session);
      }}
      onSelect={(index, _option) => {
        const session = sorted()[index];
        if (session) props.onConfirm(session);
      }}
      flexGrow={1}
    />
  );
}
