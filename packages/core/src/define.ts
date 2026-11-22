import { CamoButton } from "./components/button.ts";
import { CamoDialog } from "./components/dialog.ts";
import { defineElement } from "./define-element.ts";
import { CamoProvider } from "./provider/camo-provider.ts";

// The element-defining entry: importing "@srctool/camouflage-core/define" registers every element once.
defineElement("camo-provider", CamoProvider);
defineElement("camo-button", CamoButton);
defineElement("camo-dialog", CamoDialog);
