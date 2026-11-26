import { registerSkin } from "@srctool/camouflage-core";
import { materialSkin, materialThemes } from "./index.ts";

// Opt-in: lets `<camo-provider skin="material">` work in plain HTML and on the server.
registerSkin(materialSkin, { theme: materialThemes });
