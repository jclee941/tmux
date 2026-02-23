import { render } from "@opentui/solid";

const isSmoke = process.argv.includes("--smoke");

if (isSmoke) {
  console.error("SMOKE OK: OpenTUI render function available");
  process.exit(0);
} else {
  const { App } = await import("./App");
  await render(() => <App />);
}
