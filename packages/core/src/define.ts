import { CamoButton } from "./components/button.ts";
import { CamoDivider } from "./components/divider.ts";
import { CamoIcon } from "./components/icon.ts";
import { CamoIconButton } from "./components/icon-button.ts";
import { CamoSurface } from "./components/surface.ts";
import { CamoText } from "./components/text.ts";
import { CamoDialog } from "./components/dialog.ts";
import { defineElement } from "./define-element.ts";
import { CamoProvider } from "./provider/camo-provider.ts";

// The element-defining entry: importing "@srctool/camouflage-core/define" registers every element once.
defineElement("camo-provider", CamoProvider);
defineElement("camo-button", CamoButton);
defineElement("camo-dialog", CamoDialog);
defineElement("camo-text", CamoText);
defineElement("camo-icon", CamoIcon);
defineElement("camo-surface", CamoSurface);
defineElement("camo-divider", CamoDivider);
defineElement("camo-icon-button", CamoIconButton);
