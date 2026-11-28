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

/** Fluent's icon button. */
export const fluentIconButton: Renderer<IconButtonState, IconButtonSlots, IconButtonStyle> = {
  ...iconButtonBase,
  defaults(theme) {
    const c = theme.colors;
    const clear = "transparent";
    const checked: ButtonColors = { container: c.surfaceContainerHigh, content: c.onSurface };
    return {
      defaultAppearance: "ghost",
      containerSize: field(
        "container-size",
        "var(--camo-density-control, var(--fluent-density-control, calc(40px - var(--camo-input-pointer, 0) * 8px)))",
      ),
      shape: field("shape", theme.shapes.small),
      iconSize: field("icon-size", "20px"),
      touchTarget: field("touch-target", "48px"),
      borderWidth: "1px",
      solid: { container: c.primary, content: c.onPrimary },
      soft: { container: c.surface, content: c.onSurface, border: c.outlineVariant },
      outline: { container: clear, content: c.onSurface, border: c.outlineVariant },
      ghost: { container: clear, content: c.onSurface },
      checked: checked,
      disabledContainerAlpha: field("disabled-container-alpha", "12%"),
      disabledContentAlpha: field("disabled-content-alpha", "38%"),
    };
  },
};
