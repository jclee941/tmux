# Session Persistence Brainstorming

## Problem Statement
재부팅시 세션저장안되는문제 (Sessions not saved on reboot)

## Current State Analysis

### Existing Setup
- **tmux-resurrect**: Manual save/restore via `prefix+S` / `prefix+R`
- **tmux-continuum**: Auto-save every 1 minute (`@continuum-save-interval '1'`)
- **Systemd**: `tmux-server.service` keeps server alive across logout

### Limitations Identified
1. **Sudden power loss**: No software solution - requires UPS hardware
2. **Clean shutdown**: No automatic save trigger before system shutdown
3. **Auto-restore**: Continuum restores on tmux start, but only if save exists

## Solution Brainstorming

### Option A: Increase Auto-Save Frequency
- Reduce continuum interval to 30 seconds
- **Pros**: Simple, existing infrastructure
- **Cons**: Disk I/O overhead, still loses last 30s on power loss
- **Verdict**: Already at 1 minute, diminishing returns

### Option B: Tmux Hook on Client Detach
- Hook into `client-detached` to trigger save
- **Pros**: Catches manual detaches
- **Cons**: Doesn't help with system shutdown, power loss
- **Verdict**: Partial solution only

### Option C: systemd Shutdown Hook
- Create systemd service that triggers save before shutdown
- **Pros**: Handles clean shutdowns properly
- **Cons**: Requires systemd, doesn't help power loss
- **Verdict**: ✅ IMPLEMENTED - Best for clean shutdowns

### Option D: UPS Integration
- Hardware UPS with graceful shutdown trigger
- **Pros**: Handles power loss
- **Cons**: Hardware cost, complexity
- **Verdict**: Future consideration, out of scope for software-only fix

## Implementation

### Chosen Approach: Option C (systemd Shutdown Hook)

Created `systemd/tmux-resurrect-save.service`:
- Type: oneshot service with `RemainAfterExit=yes`
- Trigger: `ExecStop` runs before shutdown.target
- Ordering: `After=tmux-server.service` ensures save runs before server stops
- Script: `tmux-resurrect-save.sh` triggers save via key sequence + explicit script

### Key Design Decisions

1. **Socket Detection**: Dynamic socket path detection supports multi-user setups
2. **Dual Save Method**: 
   - Send `C-a S` to all clients (resurrect key binding)
   - Direct script execution as fallback
3. **Error Handling**: `|| true` ensures shutdown isn't blocked on save failure
4. **Integration**: Wired into existing continuum/resurrect infrastructure

## Verification

### Test Plan
1. Create test tmux session
2. Make some changes (create windows, panes)
3. `sudo systemctl reboot`
4. After reboot, check if `prefix+R` restores session

### Expected Behavior
- Service stops before tmux-server
- Save script triggers resurrect save
- After reboot, continuum auto-restore works
- Manual `prefix+R` can restore if needed

## Future Improvements

1. **UPS Integration**: Add NUT (Network UPS Tools) integration for power loss handling
2. **Save Notifications**: Desktop notification when auto-save triggers
3. **Save History**: Keep multiple save snapshots for rollback
4. **Per-Session Save**: Granular save/restore per session instead of all-or-nothing

## Conclusion

**Software-only solution**: systemd shutdown hook provides best-effort session persistence for clean shutdowns.

**Hardware solution**: UPS required for power loss protection.

**Current 1-minute continuum auto-save**: Already optimal for software-only approach.

---

*Brainstorming completed during tmux configuration overhaul*
