import type { Appearance, Tone } from "../skin/types.ts";
import type { CamoDialog } from "./dialog.ts";

/** A button of an imperative dialog and the result it closes the dialog with. */
export interface DialogAction<T> {
  text: string;
  appearance?: Appearance;
  tone?: Tone;
  result?: T;
}

/** The options of `showCamoDialog`: the same fields as the declarative `<camo-dialog>`, plus the actions. */
export interface ShowDialogOptions<T> {
  title?: string;
  message: string;
  confirm: DialogAction<T>;
  dismiss?: DialogAction<T>;
  /** Where to attach the dialog, so it takes the skin and theme from that provider. Default: the first `camo-provider`. */
  host?: Element;
}

function button(action: DialogAction<unknown>, slot: string): HTMLElement {
  const el = document.createElement("camo-button");
  el.setAttribute("slot", slot);
  el.setAttribute("text", action.text);
  if (action.appearance !== undefined) el.setAttribute("appearance", action.appearance);
  if (action.tone !== undefined) el.setAttribute("tone", action.tone);
  return el;
}

/**
 * Shows a dialog and resolves with the result of the action that closed it, or `undefined` when it was dismissed
 * (Escape or the scrim), like `showCamoDialog<T>` in Flutter. Needs the `define` entry to have been imported.
 */
export function showCamoDialog<T = boolean>(options: ShowDialogOptions<T>): Promise<T | undefined> {
  const host = options.host ?? document.querySelector("camo-provider") ?? document.body;
  const dialog = document.createElement("camo-dialog") as CamoDialog;
  if (options.title !== undefined) dialog.title = options.title;
  dialog.message = options.message;
  const confirm = button(options.confirm, "confirm");
  confirm.addEventListener("click", () => dialog.close(options.confirm.result));
  dialog.append(confirm);
  if (options.dismiss !== undefined) {
    const dismiss = button(options.dismiss, "dismiss");
    dismiss.addEventListener("click", () => dialog.close(options.dismiss?.result));
    dialog.append(dismiss);
  }
  return new Promise((resolve) => {
    dialog.addEventListener(
      "camo-close",
      (event) => {
        dialog.remove();
        resolve(event.detail.result as T | undefined);
      },
      { once: true },
    );
    host.append(dialog);
    dialog.open = true;
  });
}
