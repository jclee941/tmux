# Learnings: opentui-sessionizer

## [2026-02-23] Session Start

### Environment

- Bun 1.3.9 at /home/jclee/.bun/bin/bun
- tmux 3.4 with display-popup support
- Project root: /home/jclee/dev/tmux/ (symlinked as ~/.tmux/)

### Stack

- @opentui/solid@0.1.81 + solid-js + Bun 1.3.9
- Project dir: tui/sessionizer/
- Entry: tui/sessionizer/index.tsx

### Theme Colors

- bg: '#1a1b26', fg: '#a9b1d6', bgHighlight: '#292e42'
- fgHighlight: '#c0caf5', accent: '#7aa2f7', purple: '#bb9af7'
- cyan: '#7dcfff', green: '#9ece6a', muted: '#565f89'

### OpenTUI Key Facts

- bunfig.toml MUST have: preload = ["@opentui/solid/preload"]
- tsconfig.json: jsx: "preserve", jsxImportSource: "@opentui/solid"
- package.json: type: "module"
- Entry must call render() from @opentui/solid

## [2026-02-23] Task 0 PoC Spike

- OpenTUI Solid 0.1.81 uses intrinsic JSX tags (`<box>`, `<text>`) rather than `Box`/`Text` named exports.
- Root-level smoke invocation (`bun tui/sessionizer/src/index.tsx --smoke`) avoids jsx runtime coupling by skipping App import in smoke mode.
- `render(() => <App />)` matches current @opentui/solid API; passing `process.stdout` is invalid for this version.
- Gate timing measured at 108ms with exit code 0, meeting the <500ms startup requirement.
