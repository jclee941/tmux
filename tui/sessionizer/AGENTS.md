# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-01 09:11 KST
**Commit:** 068f8fe
**Branch:** master

## OVERVIEW

Bun + @opentui/solid terminal UI for tmux session management. Provides session listing, filtered search, ANSI pane preview, and a guided session-creation wizard. Launched via `bin/tmux-sessionizer-tui` or directly with `bun src/index.tsx`.

## STRUCTURE

```
tui/sessionizer/
├── package.json             # @tmux/sessionizer v0.1.0, type:module
├── tsconfig.json            # TypeScript config (strict, ESNext, JSX preserve)
├── bunfig.toml              # Bun test config
├── src/
│   ├── index.tsx            # Entry point — renders App via OpenTUI (11 LOC)
│   ├── App.tsx              # Main screen: layout, keyboard handling, state orchestration (383 LOC)
│   ├── bun-env.d.ts         # Bun runtime type declarations (27 LOC)
│   ├── components/
│   │   ├── session-list.tsx   # Session list display with selection highlighting (70 LOC)
│   │   ├── filter-input.tsx   # Text input for session filtering (31 LOC)
│   │   ├── preview-panel.tsx  # ANSI pane preview panel (102 LOC)
│   │   └── create-wizard.tsx  # Multi-step session creation wizard (263 LOC)
│   └── lib/
│       ├── tmux.ts          # Tmux CLI operations via Bun.spawnSync (106 LOC)
│       ├── config.ts        # Config loading from sessionizer.conf (62 LOC)
│       ├── dirs.ts          # Directory scanning for session candidates (50 LOC)
│       ├── theme.ts         # Tokyo Night color palette constants (37 LOC)
│       └── state.ts         # Signal-based reactive state (28 LOC)
└── __tests__/
    └── *.test.ts            # bun:test test files
```

## WHERE TO LOOK

| Task                        | Location                     | Notes                                        |
| --------------------------- | ---------------------------- | -------------------------------------------- |
| Modify keyboard shortcuts   | `src/App.tsx`                | `onKeyPress` handler in main component       |
| Change session list display | `src/components/session-list.tsx` | Rendering + selection highlighting      |
| Modify creation wizard      | `src/components/create-wizard.tsx` | Multi-step form: name, dir, layout      |
| Change pane preview         | `src/components/preview-panel.tsx` | ANSI capture display                    |
| Add tmux operations         | `src/lib/tmux.ts`            | All tmux CLI calls go through here           |
| Change scan directories     | `src/lib/config.ts`          | Reads `sessionizer.conf` (SCAN_DIR, EXTRA_DIRS) |
| Modify directory discovery  | `src/lib/dirs.ts`            | `scanDirs` file-system traversal             |
| Change theme colors         | `src/lib/theme.ts`           | Tokyo Night palette — keep fzf/tmux parity   |
| Add reactive state          | `src/lib/state.ts`           | SolidJS signals for shared state             |
| Run tests                   | `bun test`                   | bun:test runner                              |

## CODE MAP

| Symbol           | Type      | Location                     | Refs   | Role                                              |
| ---------------- | --------- | ---------------------------- | ------ | ------------------------------------------------- |
| `App`            | Component | `src/App.tsx`                | high   | Main screen: layout, keyboard routing, state glue |
| `SessionList`    | Component | `src/components/session-list.tsx` | high | Renders session entries with selection state  |
| `FilterInput`    | Component | `src/components/filter-input.tsx` | high | Text input for filtering session list         |
| `PreviewPanel`   | Component | `src/components/preview-panel.tsx` | medium | Displays ANSI pane capture for selected session |
| `CreateWizard`   | Component | `src/components/create-wizard.tsx` | medium | Multi-step guided session creation flow      |
| `listSessions`   | Function  | `src/lib/tmux.ts`            | high   | Enumerates tmux sessions with metadata            |
| `switchClient`   | Function  | `src/lib/tmux.ts`            | high   | Switches tmux client to selected session          |
| `capturePanes`   | Function  | `src/lib/tmux.ts`            | medium | Captures ANSI content from session panes          |
| `createSession`  | Function  | `src/lib/tmux.ts`            | medium | Creates new tmux session with directory            |
| `killSession`    | Function  | `src/lib/tmux.ts`            | medium | Terminates a tmux session by name                 |
| `scanDirs`       | Function  | `src/lib/dirs.ts`            | medium | Discovers candidate project directories           |
| `loadConfig`     | Function  | `src/lib/config.ts`          | medium | Parses sessionizer.conf for SCAN_DIR/EXTRA_DIRS   |
| `theme`          | Object    | `src/lib/theme.ts`           | high   | Tokyo Night color constants for TUI rendering     |

## CONVENTIONS

- **Bun-only runtime** — never use Node.js APIs (`child_process`, `fs/promises`)
- Use `Bun.spawnSync` for all tmux CLI calls via `src/lib/tmux.ts`
- TypeScript strict mode with `noEmit` (Bun handles transpilation)
- `bun:test` for testing — no jest, vitest, or other runners
- SolidJS signals for reactive state — no React patterns (useState/useEffect)
- @opentui/solid for TUI rendering — components return JSX elements
- All tmux operations go through `src/lib/tmux.ts` — never spawn tmux directly in components
- Config reads from `../../sessionizer.conf` (root repo) — not local config files
- `--smoke` flag on entry point for CI validation (renders once and exits)
- Component naming: kebab-case files in `components/`, camelCase in `lib/`

## ANTI-PATTERNS

| Never                                             | Why                                         |
| ------------------------------------------------- | ------------------------------------------- |
| Import `child_process` or Node.js `fs`            | Bun-only — use `Bun.spawnSync`, `Bun.file`  |
| Call tmux directly in components                  | All CLI calls go through `lib/tmux.ts`       |
| Use React hooks (`useState`, `useEffect`)         | SolidJS signals, not React                   |
| Assume Node.js process globals                    | Bun runtime has different APIs               |
| Add vitest/jest as test runner                    | Use `bun:test` exclusively                   |
| Hardcode scan directories                         | Read from `sessionizer.conf` via config.ts   |
| Break Tokyo Night color parity                    | Theme must match tmux/fzf palette            |

## COMMANDS

```bash
# Development
bun src/index.tsx           # Launch TUI
bun src/index.tsx --smoke   # CI smoke test (render once, exit)

# Testing
bun test                    # Run all tests
bun test --watch            # Watch mode

# Type checking
bunx tsc --noEmit           # Verify types without emitting
```

## NOTES

- Primary state management lives in `App.tsx` via SolidJS signals — `state.ts` provides shared signal helpers
- `create-wizard.tsx` is the second-largest file (263 LOC) — multi-step form with name input, directory picker, and layout selection
- `preview-panel.tsx` renders raw ANSI sequences captured from tmux panes — terminal-dependent rendering
- Config loading (`config.ts`) reads the root `sessionizer.conf` two directories up — symlink-aware path resolution
- `--smoke` flag exists for CI: initializes the app, renders one frame, and exits with code 0 on success
- Exact-match session switching: if filter text exactly matches a session name, switches immediately without selection
