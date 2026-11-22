import { registerSkin } from "@srctool/camouflage-core";
import { cupertinoSkin, cupertinoThemes } from "./index.ts";

// Opt-in: lets `<camo-provider skin="cupertino">` work in plain HTML and on the server.
registerSkin(cupertinoSkin, { theme: cupertinoThemes });
