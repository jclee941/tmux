# SESSIONIZER KNOWLEDGE BASE

**Generated:** 2026-02-24 09:04:04 KST
**Commit:** 4afdc74
**Branch:** master

## OVERVIEW

Bun + OpenTUI session picker package for tmux session browsing, preview, create/rename/kill actions, and fast switching.

## STRUCTURE

```
tui/sessionizer/
├── package.json              # Bun scripts: start/smoke/test
├── tsconfig.json             # strict + noEmit + @opentui/solid JSX
├── __tests__/                # bun:test coverage for config/tmux libs
└── src/
    ├── index.tsx             # Entry point + --smoke mode
    ├── App.tsx               # Main UI and keyboard workflow
    ├── components/           # UI widgets (list/filter/preview/wizard)
    └── lib/                  # tmux/config/dirs/theme/state utilities
```

## WHERE TO LOOK

| Task                         | Location                                | Notes                                        |
| ---------------------------- | --------------------------------------- | -------------------------------------------- |
| Change startup behavior      | `src/index.tsx`                         | `--smoke` path and dynamic App import        |
| Update keyboard interactions | `src/App.tsx`                           | Main key handling and modal flow             |
| Modify tmux command behavior | `src/lib/tmux.ts`                       | All tmux calls via `Bun.spawnSync`           |
| Change project scanning      | `src/lib/dirs.ts` + `src/lib/config.ts` | Reads `sessionizer.conf` and sanitizes names |
| Tune visual style            | `src/lib/theme.ts`                      | Tokyo Night values for TUI components        |
| Extend test coverage         | `__tests__/*.test.ts`                   | bun:test with tmux-availability gating       |

## CONVENTIONS

- Runtime is Bun only (`bun src/index.tsx`, `bun test`)
- TypeScript runs strict and no-emit mode (`strict: true`, `noEmit: true`)
- Tmux interactions are synchronous wrappers in `src/lib/tmux.ts`
- `App.tsx` orchestrates UI state with Solid signals/memos and keyboard handlers
- Tests use `bun:test`; tmux-dependent tests guard with conditional skip when tmux is unavailable

## ANTI-PATTERNS

| Never                                                    | Why                                            |
| -------------------------------------------------------- | ---------------------------------------------- |
| Introduce `child_process` for tmux calls                 | Package standard is `Bun.spawnSync` wrappers   |
| Bypass `src/lib/tmux.ts` and shell out inside components | Breaks separation between UI and command layer |
| Add Node-specific runtime assumptions                    | Package executes under Bun, not Node toolchain |
| Duplicate root tmux policy text in this file             | Child AGENTS must carry local deltas only      |

## COMMANDS

```bash
cd ~/.tmux/tui/sessionizer && bun src/index.tsx
cd ~/.tmux/tui/sessionizer && bun src/index.tsx --smoke
cd ~/.tmux/tui/sessionizer && bun test
```

## NOTES

- `src/lib/state.ts` exists but current primary flow is direct signal state in `App.tsx`
- Most behavior changes impact both selection UX (`App.tsx`) and tmux primitives (`src/lib/tmux.ts`)
