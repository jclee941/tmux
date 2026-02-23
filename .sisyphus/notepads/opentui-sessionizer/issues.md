# Issues: opentui-sessionizer

## [2026-02-23] Session Start

- No issues yet. Task 0 (PoC) not started.

## [2026-02-23] Task 0 PoC Spike

- Initial smoke attempt failed with `Cannot find module 'react/jsx-dev-runtime'` when running from repo root.
- Resolved by deferring `App` import in non-smoke path, allowing smoke mode to validate OpenTUI stack without JSX runtime initialization.
- `bun install` reported peer warning (`solid-js@1.9.11`) but runtime smoke checks passed.
