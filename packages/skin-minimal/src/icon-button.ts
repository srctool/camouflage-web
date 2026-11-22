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

/** Minimal's icon button: a 40 container (radius full) in a 48 touch area, quiet by default (Ghost). */
export const minimalIconButton: Renderer<IconButtonState, IconButtonSlots, IconButtonStyle> = {
  ...iconButtonBase,
  defaults(theme) {
    const c = theme.colors;
    const clear = "transparent";
    const checked: ButtonColors = { container: c.surfaceContainerHigh, content: c.onSurface };
    return {
      defaultAppearance: "ghost",
      containerSize: field("container-size", "40px"),
      shape: field("shape", theme.shapes.full),
      iconSize: field("icon-size", "24px"),
      touchTarget: field("touch-target", "48px"),
      borderWidth: "1px",
      solid: { container: c.primary, content: c.onPrimary },
      soft: { container: c.surfaceContainerHigh, content: c.onSurface },
      outline: { container: clear, content: c.onSurfaceVariant, border: c.outlineVariant },
      ghost: { container: clear, content: c.onSurfaceVariant },
      checked,
      disabledContainerAlpha: field("disabled-container-alpha", "12%"),
      disabledContentAlpha: field("disabled-content-alpha", "38%"),
    };
  },
};
