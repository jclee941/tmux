/** Tokyo Night color palette — consistent with tmux conf.d/10-theme.conf */
export const THEME = {
  // Core
  bg: "#1a1b26",
  fg: "#a9b1d6",
  bgHighlight: "#292e42",
  fgHighlight: "#c0caf5",

  // Accents
  accent: "#7aa2f7",
  purple: "#bb9af7",
  cyan: "#7dcfff",
  green: "#9ece6a",
  orange: "#ff9e64",
  red: "#f7768e",
  yellow: "#e0af68",

  // Surfaces
  muted: "#565f89",
  border: "#3d59a1",
  bgDark: "#16161e",
  selection: "#3b4261",

  // Semantic
  active: "#7aa2f7",
  inactive: "#565f89",
  error: "#f7768e",
  warning: "#e0af68",
  success: "#9ece6a",
  info: "#7dcfff",
} as const;

export type ThemeColor = keyof typeof THEME;

/** fzf color string for consistency across all pickers */
export const FZF_COLORS =
  "bg+:#292e42,fg:#a9b1d6,fg+:#c0caf5,hl:#bb9af7,hl+:#bb9af7,info:#7aa2f7,prompt:#7dcfff,pointer:#bb9af7,marker:#9ece6a,header:#565f89";
