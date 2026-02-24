# Supermemory Governance

## Scope

This document defines how Supermemory must be governed for the tmux repository.
It covers memory schema, retention, safety controls, and operational verification.
It does not add runtime Supermemory hooks to tmux scripts.

## Inputs/Constraints

- Current repo behavior isolates the `opencode` tmux session using `bin/tmux-opencode`, `bin/tmux-session-cycle`, `conf.d/20-keys.conf`, and `conf.d/30-statusbar.conf`.
- `data/in-memoria.db` is an auto-generated binary cache and is not a source-of-truth configuration surface.
- Existing opencode session isolation is a stability boundary and must not be weakened.
- Secrets and sensitive terminal content must never be stored in memory.

## Decision/Rules

### P0 (Mandatory before any automation)

1. Enforce strict memory schema on every write:
   - Required keys: `type`, `scope`, `repo`, `source`, `ttl`, `tags`, `sensitivity`, `content`.
   - Reject writes that do not match the schema.
2. Enforce minimization and retention controls:
   - Every memory requires explicit `ttl`.
   - Rate-limit write frequency.
   - Disallow raw terminal transcripts, pane captures, command history dumps, and environment-value dumps.
3. Enforce safety and audit controls:
   - Redact known secret patterns before write.
   - Record audit metadata for each accepted/rejected write (who, source, reason, timestamp).

### P1 (Operational hardening)

1. Keep `project` and `user` memory scopes separated.
2. Track governance metrics:
   - write volume
   - reject rate
   - redaction-hit rate
   - ttl aging distribution
   - retrieval usefulness (search hit rate)
3. Define incident workflow for bad memory entries:
   - detection
   - quarantine/stop further writes
   - removal/forget
   - postmortem with prevention update

### P2 (Quality optimization)

1. Maintain controlled vocabulary for `type` and `tags`.
2. Dedupe recurring entries and promote stable patterns to canonical `learned-pattern` records.
3. Run periodic cleanup of stale low-value memory.

### Do Not Change Now

1. Do not add Supermemory hooks directly into `bin/` or `conf.d/` until P0 controls exist in the system that performs writes.
2. Do not modify opencode session isolation behavior:
   - Home-key entry flow
   - cycle exclusion
   - statusbar pinning/styling
3. Do not modify `data/in-memoria.db` directly.
4. Do not modify unrelated oc-vm or provider routing configuration from this repository.

## Verification

Use this checklist whenever memory automation is introduced or changed:

1. Schema test: invalid payloads are rejected with explicit reasons.
2. Redaction test: seeded secret-like values are blocked or redacted.
3. Retention test: all records have ttl and expiry behavior is observable.
4. Scope test: project-specific entries do not leak into user/global scope.
5. Audit test: every write attempt has a corresponding audit event.
6. Regression test: opencode session isolation behavior is unchanged.

## Rollback/Safety Notes

1. If a governance rule causes false positives, disable only the specific rule and keep audit logging enabled.
2. If sensitive data is detected in memory, stop writes, remove affected records, rotate impacted secrets, and resume only after policy fix.
3. Revert documentation changes with git restore/revert if policy direction changes.
