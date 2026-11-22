// What a plain TypeScript consumer gets: the tag map and the event map, typed. Compiled by tests/node/typings.test.ts.
import "@srctool/camouflage-core";

const button = document.createElement("camo-button");
button.text = "Save";
button.appearance = "outline";
button.tone = "error";
// @ts-expect-error not a tone
button.tone = "purple";

const dialog = document.querySelector("camo-dialog")!;
dialog.addEventListener("camo-close", (event) => {
  const result: unknown = event.detail.result;
  void result;
});
// @ts-expect-error there is no such tag
void document.createElement("camo-nothing").text;

const provider = document.createElement("camo-provider");
provider.scheme = "dark";
provider.windowSize = "compact";
// @ts-expect-error not a window size
provider.windowSize = "huge";
