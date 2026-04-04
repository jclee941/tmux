#!/usr/bin/env bash
# Save all tmux sessions before shutdown
set -euo pipefail

# Get the tmux socket path (support both default and custom)
TMUX_SOCKET="${TMUX_SOCKET:-${TMUX:-$(ls -t /tmp/tmux-$(id - u)/default.* 2>/dev/null | head -1)}}"
TMUX_SOCKET="${TMUX_SOCKET:-/tmp/tmux-$(id - u)/default}"
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
