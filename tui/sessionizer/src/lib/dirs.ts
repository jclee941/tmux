import { existsSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import { readConfig } from "./config";

export interface CandidateDir {
  path: string;
  name: string;
}

/**
 * Scan SCAN_DIR + EXTRA_DIRS for candidate project directories.
 * Mirrors tmux-sessionizer: find SCAN_DIR -mindepth 1 -maxdepth 1 -type d | sort
 * Dir basename sanitized: spaces/dots/colons → underscores.
 */
export function scanDirs(): CandidateDir[] {
  const config = readConfig();
  const dirs: CandidateDir[] = [];
  const seen = new Set<string>();

  // Scan main directory (depth 1)
  if (existsSync(config.scanDir)) {
    const entries = readdirSync(config.scanDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = join(config.scanDir, entry.name);
      const name = sanitizeName(entry.name);
      if (!seen.has(fullPath)) {
        seen.add(fullPath);
        dirs.push({ path: fullPath, name });
      }
    }
  }

  // Add extra directories
  for (const dir of config.extraDirs) {
    if (existsSync(dir) && statSync(dir).isDirectory() && !seen.has(dir)) {
      seen.add(dir);
      dirs.push({ path: dir, name: sanitizeName(basename(dir)) });
    }
  }

  return dirs;
}

/** Sanitize directory name to valid tmux session name: tr ' .:' '_' */
export function sanitizeName(name: string): string {
  return name.replace(/[ .:]/g, "_");
}
