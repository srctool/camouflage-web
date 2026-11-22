import { tokens } from "@srctool/camouflage-core";
import type {
  ButtonSlots,
  ButtonState,
  CamoSkin,
  DialogSlots,
  DialogState,
  RenderArgs,
  ButtonStyle,
  DialogStyle,
} from "@srctool/camouflage-core";

export const buttonSlots = { "prefix-icon": "prefix-icon", "suffix-icon": "suffix-icon" } as const;
export const dialogSlots = { confirm: "confirm", dismiss: "dismiss", content: "content" } as const;

export function buttonArgs(
  skin: CamoSkin,
  state: Partial<ButtonState> = {},
): RenderArgs<ButtonState, ButtonSlots, ButtonStyle> {
  return {
    state: {
      text: "Save",
      appearance: "solid",
      tone: "default",
      disabled: false,
      loading: false,
      ...state,
    },
    slots: buttonSlots,
    theme: tokens,
    style: skin.button.defaults(tokens),
    skin,
  };
}

export function dialogArgs(
  skin: CamoSkin,
  state: Partial<DialogState> = {},
): RenderArgs<DialogState, DialogSlots, DialogStyle> {
  return {
    state: {
      title: "Delete item?",
      message: "This can't be undone.",
      titleId: "title",
      messageId: "message",
      ...state,
    },
    slots: dialogSlots,
    theme: tokens,
    style: skin.dialog.defaults(tokens),
    skin,
  };
}

/** The same style with every string replaced by a sentinel: what remains in a render is the renderer's own text. */
export function sentinelStyle<T extends object>(style: T, sentinel = "SENTINEL"): T {
  const walk = (value: unknown): unknown => {
    if (typeof value === "string") return sentinel;
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]));
    }
    return value;
  };
  return walk(style) as T;
}
