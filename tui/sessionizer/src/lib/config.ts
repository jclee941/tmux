import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";

export interface SessionizerConfig {
  scanDir: string;
  extraDirs: string[];
  layoutDir: string;
  layouts: string[];
}

const CONF_PATH = join(homedir(), ".tmux", "sessionizer.conf");
const LAYOUT_DIR = join(homedir(), ".tmux", "layouts");

/**
 * Parse sessionizer.conf — bash-sourceable KEY="value" format.
 * Handles: SCAN_DIR="$HOME/dev" and EXTRA_DIRS=("path1" "path2")
 */
export function readConfig(): SessionizerConfig {
  const home = homedir();
  let scanDir = join(home, "dev");
  let extraDirs: string[] = [];

  if (existsSync(CONF_PATH)) {
    const raw = readFileSync(CONF_PATH, "utf-8");

    // Parse SCAN_DIR="value"
    const scanMatch = raw.match(/^SCAN_DIR=["']?(.*?)["']?\s*$/m);
    if (scanMatch) {
      scanDir = scanMatch[1].replace(/\$HOME/g, home).replace(/~/g, home);
    }

    // Parse EXTRA_DIRS=("path1" "path2" ...)
    const extraMatch = raw.match(/^EXTRA_DIRS=\(([^)]*)\)/m);
    if (extraMatch) {
      const inner = extraMatch[1].trim();
      if (inner.length > 0) {
        extraDirs = inner
          .split(/\s+/)
          .map((s) => s.replace(/^["']|["']$/g, ""))
          .map((s) => s.replace(/\$HOME/g, home).replace(/~/g, home))
          .filter(Boolean);
      }
    }
  }

  // Discover available layouts
  let layouts: string[] = [];
  if (existsSync(LAYOUT_DIR)) {
    layouts = readdirSync(LAYOUT_DIR)
      .filter((f) => f.endsWith(".yml"))
      .map((f) => f.replace(/\.yml$/, ""))
      .sort();
  }

  return {
    scanDir: resolve(scanDir),
    extraDirs: extraDirs.map((d) => resolve(d)),
    layoutDir: resolve(LAYOUT_DIR),
    layouts,
  };
}
