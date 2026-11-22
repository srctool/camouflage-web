// What a Vue consumer gets from `@srctool/camouflage-core/vue`: the components in `GlobalComponents`.
import "@srctool/camouflage-core/vue";
import type { GlobalComponents } from "vue";

type Props<K extends keyof GlobalComponents> = InstanceType<GlobalComponents[K]>["$props"];

export const ok: Props<"CamoButton"> = { text: "Save", appearance: "ghost", tone: "info" };
export const dialog: Props<"CamoDialog"> = {
  title: "Delete?",
  onCamoClose: (event) => void event.detail.result,
};
// @ts-expect-error not a tone
export const bad: Props<"CamoButton"> = { tone: "purple" };
