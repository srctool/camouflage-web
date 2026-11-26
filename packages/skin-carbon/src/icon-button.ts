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

/** Carbon's icon button. */
export const carbonIconButton: Renderer<IconButtonState, IconButtonSlots, IconButtonStyle> = {
  ...iconButtonBase,
  defaults(theme) {
    const c = theme.colors;
    const clear = "transparent";
    const checked: ButtonColors = { container: c.surfaceContainerHigh, content: c.onSurface };
    return {
      defaultAppearance: "ghost",
      containerSize: field(
        "container-size",
        "var(--carbon-density-control, calc(48px - var(--camo-input-pointer, 0) * 8px))",
      ),
      shape: field("shape", theme.shapes.none),
      iconSize: field("icon-size", "16px"),
      touchTarget: field("touch-target", "48px"),
      borderWidth: "1px",
      solid: { container: c.primary, content: c.onPrimary },
      soft: { container: c.secondary, content: c.onSecondary },
      outline: { container: clear, content: c.primary, border: c.primary },
      ghost: { container: clear, content: c.onSurface },
      checked: checked,
      disabledContainerAlpha: field("disabled-container-alpha", "12%"),
      disabledContentAlpha: field("disabled-content-alpha", "38%"),
    };
  },
};
