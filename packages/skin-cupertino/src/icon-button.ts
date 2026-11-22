import { iconButtonBase } from "@srctool/camouflage-core";
import type {
  ButtonColors,
  IconButtonSlots,
  IconButtonState,
  IconButtonStyle,
  Renderer,
} from "@srctool/camouflage-core";

const field = (name: string, fallback: string): string =>
  `var(--camo-icon-button-${name}, ${fallback})`;

/** Cupertino's icon button: a 44 container in the accent color, tinted when soft or on; no outline. */
export const cupertinoIconButton: Renderer<IconButtonState, IconButtonSlots, IconButtonStyle> = {
  ...iconButtonBase,
  defaults(theme) {
    const c = theme.colors;
    const clear = "transparent";
    const tinted: ButtonColors = { container: c.primaryContainer, content: c.primary };
    return {
      defaultAppearance: "ghost",
      containerSize: field("container-size", "44px"),
      shape: field("shape", theme.shapes.full),
      iconSize: field("icon-size", "24px"),
      touchTarget: field("touch-target", "48px"),
      borderWidth: "0px",
      solid: { container: c.primary, content: c.onPrimary },
      soft: tinted,
      outline: tinted,
      ghost: { container: clear, content: c.primary },
      checked: tinted,
      disabledContainerAlpha: field("disabled-container-alpha", "12%"),
      disabledContentAlpha: field("disabled-content-alpha", "38%"),
    };
  },
};
