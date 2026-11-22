import { registerSkin } from "@srctool/camouflage-core";
import { minimalSkin, minimalThemes } from "./index.ts";

// Opt-in: lets `<camo-provider skin="minimal">` work in plain HTML and on the server, and makes Minimal the
// fallback for a component with no provider. Importing the main entry registers nothing.
registerSkin(minimalSkin, { theme: minimalThemes, fallback: true });
