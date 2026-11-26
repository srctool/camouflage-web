import { registerSkin } from "@srctool/camouflage-core";
import { fluentSkin, fluentThemes } from "./index.ts";

// Opt-in: lets `<camo-provider skin="fluent">` work in plain HTML and on the server.
registerSkin(fluentSkin, { theme: fluentThemes });
