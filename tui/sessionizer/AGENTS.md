# tui/sessionizer

## OVERVIEW
Bun + @opentui/solid session picker (list, filter, live ANSI preview, create wizard, rename/kill) opened by `bin/tmux-sessionizer-tui` (`prefix+f` / `+`) only when the launcher resolves this directory (see root NOTES). Own file: score 13 (27 files, own package + tests, `THEME` 70 refs).

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Entry, smoke | `src/index.tsx` | `--smoke` prints `SMOKE OK` and exits before loading `App` |
| Screen + state | `src/App.tsx` | Solid signals + `createStore` |
| Keys | `src/hooks/use-keyboard-handler.ts` | `useKeyboardHandler` |
| Session mutations | `src/actions/session-actions.ts` | `createSessionActions` |
| tmux CLI | `src/lib/tmux.ts` | `Bun.spawnSync`: `listSessions`, `switchClient`, `capturePanes`, `newSession`, `killSession`, `renameSession`, `currentSession` |
| Create with layout | `src/lib/create-session.ts` | `createSession`; layouts from `~/.tmux/layouts/*.yml` |
| Scan dirs | `src/lib/config.ts`, `src/lib/dirs.ts` | `readConfig` (regex over bash `SCAN_DIR` / `EXTRA_DIRS`), `scanDirs` |
| Colors | `src/lib/theme.ts` | `THEME` (Tokyo Night) |
| Components | `src/components/` | list, filter, preview, wizard + `wizard-step-*`, rename/kill dialogs |
| Tests | `__tests__/` | `config.test.ts`, `tmux.test.ts` (bun:test) |

## CONVENTIONS
- Bun runtime; process spawning only via `Bun.spawnSync` in `src/lib/tmux.ts`. Node `fs` sync APIs are in use (`config.ts`, `dirs.ts`).
- SolidJS signals/stores rendered with `@opentui/solid` JSX.
- Files: kebab-case in `components/`, camelCase exports in `lib/`.

## ANTI-PATTERNS
| Never | Why |
|-------|-----|
| `child_process` or tmux calls inside components | all CLI goes through `lib/tmux.ts` |
| React hooks (`useState`, `useEffect`) | Solid, not React |
| vitest / jest | `bun test` only |
| Hardcoded scan dirs | `~/.tmux/sessionizer.conf` via `readConfig` |
| Colors outside `THEME` | tmux/fzf palette parity |

## COMMANDS
```bash
bun test
bun run smoke        # bun src/index.tsx --smoke (no UI render)
bun run start        # launch
bunx tsc --noEmit    # typecheck; there is no script for it
```

## NOTES
- Moving the selection live-switches the attached client (150 ms debounce) for the preview; Esc restores the original session, Enter keeps it and calls `process.exit(0)`.
- Config path is fixed to `join(homedir(), ".tmux", "sessionizer.conf")`, not package-relative.
- `newSession` sizes the window from the most recently active client (`list-clients`).
