// Ambient Bun globals for TypeScript when bun-types is not installed.
// Bun runtime provides these natively; this file satisfies the type checker.

declare namespace Bun {
  interface SpawnSyncResult {
    stdout: Buffer;
    stderr: Buffer;
    exitCode: number;
  }

  interface SpawnSyncOptions {
    stdout?: "pipe" | "inherit" | "ignore";
    stderr?: "pipe" | "inherit" | "ignore";
    cwd?: string;
  }

  function spawnSync(
    cmd: string[],
    options?: SpawnSyncOptions,
  ): SpawnSyncResult;

  interface BunFile {
    text(): Promise<string>;
  }

  function file(path: string): BunFile;
}
