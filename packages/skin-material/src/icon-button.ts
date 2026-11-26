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

/** Material's icon button: a 40 container in a 48 touch area. */
export const materialIconButton: Renderer<IconButtonState, IconButtonSlots, IconButtonStyle> = {
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
      soft: { container: c.secondaryContainer, content: c.onSecondaryContainer },
      outline: { container: clear, content: c.onSurfaceVariant, border: c.outline },
      ghost: { container: clear, content: c.onSurfaceVariant },
      checked: checked,
      disabledContainerAlpha: field("disabled-container-alpha", "12%"),
      disabledContentAlpha: field("disabled-content-alpha", "38%"),
    };
  },
};
