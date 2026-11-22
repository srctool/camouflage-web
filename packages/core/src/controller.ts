import type { ReactiveController, ReactiveControllerHost } from "lit";
import { ContextConsumer } from "@lit/context";
import { environmentContext, skinContext, themeContext } from "./context.ts";
import { environmentSources, QUERIES } from "./environment.ts";
import { fallbackSkin } from "./skin/registry.ts";
import type { CamoEnvironment, CamoSkin } from "./skin/types.ts";
import type { CamoScheme, CamoTheme, CamoTokenSets } from "./theme/types.ts";

const warned = new Set<string>();

/** Logs a development warning once per message. */
export function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[camouflage] ${message}`);
}

/** The server's defaults for what can only be measured in a browser (the Provider note, section 3.3). */
export const defaultEnvironment: CamoEnvironment = {
  windowSize: "expanded",
  input: "pointer",
  platform: "web",
  capabilities: {
    backdropBlur: false,
    runtimeShaders: false,
    windowMaterial: false,
    reduceTransparency: false,
  },
  reducedMotion: false,
};

/**
 * Reads the skin, the theme and the environment from the nearest `camo-provider` (the notes' `camouflage(host)`). With
 * no provider it uses the registered fallback skin and warns once, so a lone component in plain HTML still works.
 * A change in the provider re-renders the host.
 */
export class CamouflageController implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #skin: ContextConsumer<typeof skinContext, ReactiveControllerHost & HTMLElement>;
  readonly #theme: ContextConsumer<typeof themeContext, ReactiveControllerHost & HTMLElement>;
  readonly #environment: ContextConsumer<
    typeof environmentContext,
    ReactiveControllerHost & HTMLElement
  >;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.#host = host;
    host.addController(this);
    this.#skin = new ContextConsumer(host, { context: skinContext, subscribe: true });
    this.#theme = new ContextConsumer(host, { context: themeContext, subscribe: true });
    this.#environment = new ContextConsumer(host, { context: environmentContext, subscribe: true });
  }

  hostConnected(): void {}

  /** The skin to draw with, or `undefined` when there is no provider and no fallback is registered. */
  get skin(): CamoSkin | undefined {
    const provided = this.#skin.value?.skin;
    if (provided !== undefined) return provided;
    const fallback = fallbackSkin();
    if (fallback !== undefined) {
      warnOnce(
        `<${this.#host.localName}> has no <camo-provider> above it: using the "${fallback.name}" fallback skin.`,
      );
      return fallback;
    }
    warnOnce(
      `<${this.#host.localName}> has no <camo-provider> above it and no fallback skin is registered: ` +
        `import a skin's "register" entry, or wrap the page in <camo-provider skin="…">.`,
    );
    return undefined;
  }

  /** The color scheme in force: the provider's, else the system's. On a server the system's is light. */
  get scheme(): CamoScheme {
    const set = this.#theme.value?.scheme;
    if (set !== undefined && set !== null) return set;
    return environmentSources().query(QUERIES.dark)?.matches === true ? "dark" : "light";
  }

  /**
   * The effective theme as values, for the scheme in force (`theme.colors.primary` is a color, not a `var()`): for
   * code that needs a number or a color to compute with. Styling should use `var(--camo-…)`, which follows the
   * theme live. `undefined` when no provider has a theme.
   */
  get theme(): CamoTheme | undefined {
    const info = this.#theme.value;
    return info === undefined ? undefined : info.theme[this.scheme];
  }

  /** The brand's token set `name` (ADR-32) from the effective theme, or an error that names the missing set. */
  tokens<K extends string = string>(name: K): CamoTokenSets[K] {
    const theme = this.theme;
    const set = theme?.tokenSets[name];
    if (set === undefined) {
      const have = Object.keys(theme?.tokenSets ?? {});
      throw new Error(
        `<${this.#host.localName}> asked for the token set "${name}", which the theme does not include` +
          ` (it has: ${have.join(", ") || "none"}).`,
      );
    }
    return set;
  }

  get environment(): CamoEnvironment {
    return this.#environment.value ?? defaultEnvironment;
  }

  /** The content color the nearest container set, as a live reference (`var(--camo-content-color)`). */
  get contentColor(): string {
    return "var(--camo-content-color)";
  }
}

/** Reads the skin, theme and environment for `host`: `private cx = camouflage(this)` in a Lit element. */
export function camouflage(host: ReactiveControllerHost & HTMLElement): CamouflageController {
  return new CamouflageController(host);
}
