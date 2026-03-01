-- ~/.tmux/wezterm/wezterm.lua
-- WezTerm config optimized for remote tmux over SSH
-- Symlink: ln -sf ~/.tmux/wezterm/wezterm.lua ~/.wezterm.lua
--
-- Design: WezTerm is a thin GPU-accelerated terminal.
-- All session management, splits, and tabs are handled by tmux on the remote.

local wezterm = require 'wezterm'
local config = wezterm.config_builder()

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Performance
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
config.front_end = 'WebGpu'
config.max_fps = 120
config.animation_fps = 120
config.cursor_blink_rate = 500
config.scrollback_lines = 5000 -- tmux owns scrollback; keep WezTerm lean

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Font
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
config.font = wezterm.font_with_fallback {
  { family = 'JetBrains Mono', weight = 'Medium' },
  { family = 'Hack Nerd Font' },
  'Noto Sans KR', -- CJK fallback
}
config.font_size = 11.0
config.line_height = 1.1
config.freetype_load_target = 'Light'
config.freetype_render_target = 'HorizontalLcd' -- subpixel antialiasing
config.font_shaper = 'Harfbuzz'
config.harfbuzz_features = { 'calt=1', 'clig=1', 'liga=1' } -- ligatures
config.treat_east_asian_ambiguous_width_as_wide = true -- CJK width

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tokyo Night (matches tmux 10-theme.conf exactly)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
config.color_scheme = 'Tokyo Night'

-- Override to exact parity with tmux palette
config.colors = {
  foreground = '#c0caf5',
  background = '#1a1b26',
  cursor_fg = '#1a1b26',
  cursor_bg = '#c0caf5',
  cursor_border = '#c0caf5',
  selection_fg = '#c0caf5',
  selection_bg = '#33467c',
  scrollbar_thumb = '#292e42',
  split = '#3d59a1',
  compose_cursor = '#ff9e64',

  ansi = {
    '#15161e', -- black
    '#f7768e', -- red
    '#9ece6a', -- green
    '#e0af68', -- yellow
    '#7aa2f7', -- blue
    '#bb9af7', -- magenta
    '#7dcfff', -- cyan
    '#a9b1d6', -- white
  },
  brights = {
    '#414868', -- bright black
    '#f7768e', -- bright red
    '#9ece6a', -- bright green
    '#e0af68', -- bright yellow
    '#7aa2f7', -- bright blue
    '#bb9af7', -- bright magenta
    '#7dcfff', -- bright cyan
    '#c0caf5', -- bright white
  },

  tab_bar = {
    background = '#1a1b26',
    active_tab = {
      bg_color = '#3d59a1',
      fg_color = '#c0caf5',
      intensity = 'Bold',
    },
    inactive_tab = {
      bg_color = '#292e42',
      fg_color = '#565f89',
    },
    inactive_tab_hover = {
      bg_color = '#3b4261',
      fg_color = '#c0caf5',
    },
    new_tab = {
      bg_color = '#1a1b26',
      fg_color = '#565f89',
    },
    new_tab_hover = {
      bg_color = '#292e42',
      fg_color = '#c0caf5',
    },
  },
}

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Window & Chrome
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
config.hide_tab_bar_if_only_one_tab = true -- tmux handles tabs
config.window_decorations = 'RESIZE'       -- no title bar
config.window_padding = {
  left = 4,
  right = 4,
  top = 4,
  bottom = 0,
}
config.window_close_confirmation = 'NeverPrompt' -- tmux persists sessions
config.adjust_window_size_when_changing_font_size = false
config.window_background_opacity = 1.0
config.macos_window_background_blur = 0
config.initial_cols = 200
config.initial_rows = 55

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SSH Domains (remote tmux servers)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- WezTerm multiplexing disabled — tmux handles persistence.
-- Adjust remote_address / username for your hosts.
config.ssh_domains = {
  -- Example: uncomment and adjust for your server
  -- {
  --   name = 'homelab',
  --   remote_address = '192.168.50.100',
  --   username = 'jclee',
  --   multiplexing = 'None',       -- let tmux handle mux
  --   assume_shell = 'Posix',
  --   default_prog = { 'tmux', 'new-session', '-A', '-s', 'main' },
  -- },
}

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Latency Optimization (remote SSH)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
config.enable_csi_u_key_encoding = true -- modern key reporting
config.enable_kitty_keyboard = true     -- Kitty keyboard protocol

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Mouse
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
config.mouse_wheel_scrolls_tabs = false -- tmux handles mouse
config.bypass_mouse_reporting_modifiers = 'SHIFT' -- Shift+click = WezTerm select

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Keys: Minimal — let tmux C-a prefix handle everything
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
config.disable_default_key_bindings = true

config.keys = {
  -- Font size (SUPER only — no conflict with tmux)
  { key = '=', mods = 'SUPER', action = wezterm.action.IncreaseFontSize },
  { key = '-', mods = 'SUPER', action = wezterm.action.DecreaseFontSize },
  { key = '0', mods = 'SUPER', action = wezterm.action.ResetFontSize },

  -- Clipboard (SUPER only)
  { key = 'c', mods = 'SUPER', action = wezterm.action.CopyTo 'Clipboard' },
  { key = 'v', mods = 'SUPER', action = wezterm.action.PasteFrom 'Clipboard' },

  -- Quick actions
  { key = 'f', mods = 'SUPER', action = wezterm.action.Search 'CurrentSelectionOrEmptyString' },
  { key = 'k', mods = 'SUPER', action = wezterm.action.ClearScrollback 'ScrollbackAndViewport' },
  { key = 'l', mods = 'SUPER', action = wezterm.action.ShowDebugOverlay },
  { key = 'r', mods = 'SUPER', action = wezterm.action.ReloadConfiguration },

  -- Fullscreen
  { key = 'Enter', mods = 'SUPER', action = wezterm.action.ToggleFullScreen },

  -- Passthrough C-a to tmux (WezTerm must not intercept)
  -- No CTRL-A binding here → goes straight to tmux prefix
}

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Misc
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
config.audible_bell = 'Disabled'
config.visual_bell = {
  fade_in_duration_ms = 75,
  fade_out_duration_ms = 75,
  target = 'CursorColor',
}
config.check_for_updates = false
config.automatically_reload_config = true
config.status_update_interval = 1000

-- Detect SSH session and auto-connect to tmux
-- Uncomment if WezTerm is your daily driver:
-- config.default_prog = { 'ssh', '-t', 'your-server', 'tmux', 'new-session', '-A', '-s', 'main' }

return config
