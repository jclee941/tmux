import type { App } from "@slack/bolt";
import {
  registerSessionActionHandlers,
  registerModalOpenHandlers,
  registerModalSubmitHandlers,
} from "./handlers/index.js";

export function registerActions(app: App): void {
  registerSessionActionHandlers(app);
  registerModalOpenHandlers(app);
  registerModalSubmitHandlers(app);
}
