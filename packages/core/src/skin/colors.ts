import type { ButtonColors, Appearance, ButtonStyle, Tone } from "./types.ts";
import type { CamoTheme } from "../theme/types.ts";

const CLEAR = "transparent";

/**
 * The colors of a button for an appearance and a tone: the style's own for the default tone, the tone's global
 * family otherwise (the contract's `colorsFor`, the same rule in Kotlin and Dart). Pure.
 */
export function buttonColorsFor(
  style: Pick<ButtonStyle, Appearance>,
  appearance: Appearance,
  tone: Tone,
  theme: CamoTheme,
): ButtonColors {
  if (tone === "default") return style[appearance];
  const c = theme.colors;
  const f = {
    error: {
      strong: c.error,
      onStrong: c.onError,
      container: c.errorContainer,
      onContainer: c.onErrorContainer,
    },
    success: {
      strong: c.success,
      onStrong: c.onSuccess,
      container: c.successContainer,
      onContainer: c.onSuccessContainer,
    },
    warning: {
      strong: c.warning,
      onStrong: c.onWarning,
      container: c.warningContainer,
      onContainer: c.onWarningContainer,
    },
    info: {
      strong: c.info,
      onStrong: c.onInfo,
      container: c.infoContainer,
      onContainer: c.onInfoContainer,
    },
  }[tone];
  switch (appearance) {
    case "solid":
      return { container: f.strong, content: f.onStrong };
    case "soft":
      return { container: f.container, content: f.onContainer };
    case "raised":
      return {
        container: style.raised.container,
        content: f.strong,
        ...(style.raised.border !== undefined ? { border: style.raised.border } : {}),
      };
    case "outline":
      return { container: CLEAR, content: f.strong, border: f.strong };
    case "ghost":
    case "link":
      return { container: CLEAR, content: f.strong };
  }
}

/** A tone's color family: the strong fill and its content, the soft container and its content. `Default` is the primary family. */
export interface ToneFamily {
  strong: string;
  onStrong: string;
  container: string;
  onContainer: string;
}

/** The family of a tone from the theme's global roles (the contract's `Tone` families, the same in every skin). */
export function toneFamily(theme: CamoTheme, tone: Tone): ToneFamily {
  const c = theme.colors;
  switch (tone) {
    case "error":
      return {
        strong: c.error,
        onStrong: c.onError,
        container: c.errorContainer,
        onContainer: c.onErrorContainer,
      };
    case "success":
      return {
        strong: c.success,
        onStrong: c.onSuccess,
        container: c.successContainer,
        onContainer: c.onSuccessContainer,
      };
    case "warning":
      return {
        strong: c.warning,
        onStrong: c.onWarning,
        container: c.warningContainer,
        onContainer: c.onWarningContainer,
      };
    case "info":
      return {
        strong: c.info,
        onStrong: c.onInfo,
        container: c.infoContainer,
        onContainer: c.onInfoContainer,
      };
    case "default":
      return {
        strong: c.primary,
        onStrong: c.onPrimary,
        container: c.primaryContainer,
        onContainer: c.onPrimaryContainer,
      };
  }
}
