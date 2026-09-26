#!/usr/bin/env bash
# Save all tmux sessions before shutdown
set -euo pipefail

# Default tmux socket for this user.
# The previous detection was fatal under "set -euo pipefail": the socket is
# named "default" (no suffix), so the "default.*" glob never matched, ls
# exited 2, pipefail propagated it and set -e aborted on this very line, so
# the save never ran. $TMUX is unusable here too: it holds socket,pid,session
# rather than a bare path.
TMUX_SOCKET="${TMUX_SOCKET:-${TMUX_TMPDIR:-/tmp}/tmux-$(id -u)/default}"
export TMUX_SOCKET

# Function to save sessions
save_tmux_sessions() {
  # First try to trigger save via client key sequence (prefix + S)
  if /usr/bin/tmux -S "$TMUX_SOCKET" list-clients -F '#{client_tty}' 2>/dev/null | grep -q .; then
    /usr/bin/tmux -S "$TMUX_SOCKET" list-clients -F '#{client_tty}' 2>/dev/null | while read -r tty; do
      /usr/bin/tmux -S "$TMUX_SOCKET" send-keys -t "$tty" C-a S 2>/dev/null || true
    done

    # Give it a moment to complete
    sleep 2
  fi

  # Also run explicit save script if available
  local save_script="${HOME}/.tmux/plugins/tmux-resurrect/scripts/save.sh"
  if [ -x "$save_script" ]; then
    "$save_script" 2>/dev/null || true
  fi

  return 0
}

# Main execution
save_tmux_sessions
exit 0
