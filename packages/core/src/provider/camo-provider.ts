import { ContextConsumer, ContextProvider } from "@lit/context";
import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { environmentContext, skinContext, themeContext } from "../context.ts";
import type { ThemeInfo } from "../context.ts";
import { defaultEnvironment, warnOnce } from "../controller.ts";
import { environmentProperties, measure, watchEnvironment, withMeasured } from "../environment.ts";
import type { Measured } from "../environment.ts";
import { fallbackSkin, registeredSkinNames, resolveSkin, starterTheme } from "../skin/registry.ts";
import type { CamoEnvironment, CamoSkin, InputKind, WindowSize } from "../skin/types.ts";
import { CONTENT_RESET, schemeStylesheet, themeDeclarations } from "../theme/css.ts";
import { createCamoTheme } from "../theme/merge.ts";
import type { CamoScheme, CamoThemeSet, PartialThemeSet } from "../theme/types.ts";
import { cssBlock } from "../style.ts";

/**
 * `<camo-provider>`: the skin, the theme and the environment for its subtree.
 *
 * - `skin="cupertino"` names a registered skin; `.skin = cupertinoSkin` is the typed way and wins.
 * - `scheme="light|dark"` sets the color scheme; with none, the parent provider's scheme, then `prefers-color-scheme`.
 * - `.theme` is a partial theme per scheme, merged on the effective theme (the cascade does the merging in CSS).
 * - `window-size`, `input` and `platform` are the server's defaults for what only a browser can measure; the client
 *   corrects them after hydration.
 *
 * Inheritance follows the base Provider note: a nested provider changes only what it sets. A skin switch brings
 * the new skin's starter theme unless an explicit theme is in force above.
 *
 * @tagname camo-provider
 * @slot - The subtree the skin, theme and environment apply to.
 * @attr {string} skin - The name of a registered skin; `.skin` takes the skin object and wins.
 * @attr {"light"|"dark"} scheme - The color scheme for the subtree; absent follows the provider above, then `prefers-color-scheme`.
 * @attr {"compact"|"medium"|"expanded"|"large"} window-size - The server's guess at the window size; the client measures it.
 * @attr {"touch"|"pointer"} input - The server's guess at the input kind; the client measures it.
 * @attr {string} platform - The platform name the skins may read (`web`, or the host platform inside Tauri).
 */
export class CamoProvider extends LitElement {
  static override properties: PropertyDeclarations = {
    skin: { attribute: "skin" },
    scheme: { type: String },
    theme: { attribute: false },
    windowSize: { type: String, attribute: "window-size" },
    input: { type: String },
    platform: { type: String },
    effectiveScheme: { type: String, attribute: "data-camo-scheme", reflect: true },
    measured: { state: true, attribute: false },
  };

  static override styles: CSSResult = css`
    :host {
      display: contents;
    }
  `;

  declare skin: CamoSkin | string | null;
  declare scheme: CamoScheme | null;
  declare theme: PartialThemeSet | null;
  declare windowSize: WindowSize | null;
  declare input: InputKind | null;
  declare platform: string | null;
  declare effectiveScheme: CamoScheme | null;
  declare measured: Measured | null;

  readonly #skinProvider = new ContextProvider(this, { context: skinContext });
  readonly #themeProvider = new ContextProvider(this, { context: themeContext });
  readonly #environmentProvider = new ContextProvider(this, { context: environmentContext });
  readonly #parentSkin = new ContextConsumer(this, { context: skinContext, subscribe: true });
  readonly #parentTheme = new ContextConsumer(this, { context: themeContext, subscribe: true });
  readonly #parentEnvironment = new ContextConsumer(this, {
    context: environmentContext,
    subscribe: true,
  });

  #themeCss = "";
  #stopWatching: (() => void) | undefined;

  constructor() {
    super();
    this.skin = null;
    this.scheme = null;
    this.theme = null;
    this.windowSize = null;
    this.input = null;
    this.platform = null;
    this.effectiveScheme = null;
    this.measured = null;
  }

  /** Resolves the `skin` property (an object, or a registered name) to a skin. */
  #ownSkin(): CamoSkin | undefined {
    const value = this.skin;
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    const found = resolveSkin(value);
    if (found === undefined) {
      warnOnce(
        `<camo-provider skin="${value}"> names a skin that is not registered ` +
          `(registered: ${registeredSkinNames().join(", ") || "none"}). Import the skin's "register" entry.`,
      );
    }
    return found;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    // The skin: its own, else the one above, else the fallback (the Provider note's proposal).
    const own = this.#ownSkin();
    const parentSkin = this.#parentSkin.value?.skin;
    const skin = own ?? parentSkin ?? fallbackSkin();
    if (skin !== undefined) {
      const current = this.#skinProvider.value;
      if (current?.skin !== skin) this.#skinProvider.setValue({ skin });
    } else {
      warnOnce("<camo-provider> has no skin: set `skin`, or register a skin first.");
    }

    // The theme: an explicit one wins; a skin switch brings its starter unless an explicit theme is above.
    const parentTheme = this.#parentTheme.value;
    let effective: CamoThemeSet | undefined;
    let explicit = parentTheme?.explicit ?? false;
    const starter = skin === undefined ? undefined : starterTheme(skin);
    if (own !== undefined && !explicit && starter !== undefined) {
      effective = starter;
    } else {
      effective = parentTheme?.theme ?? starter;
    }
    if (this.theme !== null && effective !== undefined) {
      effective = {
        light: createCamoTheme(effective.light, this.theme.light ?? {}),
        dark: createCamoTheme(effective.dark, this.theme.dark ?? {}),
      };
      explicit = true;
    }
    // The color scheme: its own, else the one above, else the system's (a media query in the stylesheet).
    this.effectiveScheme = this.scheme ?? parentTheme?.scheme ?? null;
    if (effective !== undefined) {
      const info = this.#themeProvider.value;
      if (
        info === undefined ||
        info.theme !== effective ||
        info.explicit !== explicit ||
        info.scheme !== this.effectiveScheme
      ) {
        this.#themeProvider.setValue({
          theme: effective,
          explicit,
          scheme: this.effectiveScheme,
        } satisfies ThemeInfo);
      }
      this.#themeCss = `${schemeStylesheet(
        themeDeclarations(effective.light),
        themeDeclarations(effective.dark),
      )}\n${CONTENT_RESET}`;
    }

    // The environment: the parent's, the server defaults and attributes, then what the client measured. The
    // attributes win over a measurement only until the client has one (it corrects the server's guesses).
    const base = this.#parentEnvironment.value ?? defaultEnvironment;
    const attributes: CamoEnvironment = {
      ...base,
      ...(this.windowSize !== null ? { windowSize: this.windowSize } : {}),
      ...(this.input !== null ? { input: this.input } : {}),
      ...(this.platform !== null ? { platform: this.platform } : {}),
    };
    const environment = withMeasured(attributes, this.measured);
    const previous = this.#environmentProvider.value;
    if (previous === undefined || JSON.stringify(previous) !== JSON.stringify(environment)) {
      this.#environmentProvider.setValue(environment);
    }
  }

  override updated(): void {
    // Written after the render, not in it: the server has measured nothing, and a style in the template would make the
    // first client render differ from the server's.
    const environment = this.#environmentProvider.value;
    if (environment === undefined || this.measured === null) return;
    for (const [name, value] of environmentProperties(environment))
      this.style.setProperty(name, value);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Measured on the client only. The server has no sources that answer, so it keeps its attributes and defaults.
    this.#measure();
    this.#stopWatching = watchEnvironment(() => this.#measure());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stopWatching?.();
    this.#stopWatching = undefined;
  }

  #measure(): void {
    const next = measure();
    const previous = this.measured;
    if (previous !== null && JSON.stringify(previous) === JSON.stringify(next)) return;
    this.measured = next;
  }

  override render(): TemplateResult {
    return html`${cssBlock(this.#themeCss)}<slot></slot>`;
  }
}
