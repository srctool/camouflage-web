import { registerSkin } from "@srctool/camouflage-core";
import { carbonSkin, carbonThemes } from "./index.ts";

// Opt-in: lets `<camo-provider skin="carbon">` work in plain HTML and on the server.
registerSkin(carbonSkin, { theme: carbonThemes });
