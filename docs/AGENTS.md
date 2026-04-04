# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-04 17:40 KST
**Branch:** tmux-overhaul-20260404

## OVERVIEW

Policy and documentation domain for tmux configuration. Contains governance documents, session persistence strategy, and architectural decision records. These are reference documents that inform implementation but have no direct runtime hooks.

## STRUCTURE

```
docs/
├── supermemory-governance.md          # Supermemory automation policy and redaction rules
└── session-persistence-brainstorming.md  # Session save/restore strategy and systemd integration
```

## WHERE TO LOOK

| Task | Location | Notes |
| ---- | -------- | ----- |
| Supermemory policy | `supermemory-governance.md` | TTL, schema, redaction, audit requirements |
| Session persistence strategy | `session-persistence-brainstorming.md` | Save/restore options, UPS hardware consideration |

## CONVENTIONS

- Documents are policy-level only — no executable code
- Use semantic line breaks for version control friendliness
- Cross-reference implementation files in parent AGENTS.md
- Keep governance separate from operational concerns

## ANTI-PATTERNS

| Never | Why |
| ----- | --- |
| Store raw pane/terminal/command-history content as memory | Sensitive data persistence risk |
| Add memory automation without schema/ttl/redaction/audit | Durable secret/noise risk |
| Modify `data/in-memoria.db` directly | Binary cache, auto-generated |

## NOTES

- Supermemory governance applies controls upstream; no direct runtime hooks
- Session persistence is software-only; power loss requires UPS hardware
- Documents serve as architectural decision records (ADRs)
