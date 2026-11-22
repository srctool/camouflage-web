import { ContextConsumer, ContextProvider } from "@lit/context";
import { LitElement, css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { environmentContext, skinContext, themeContext } from "../context.ts";
import type { ThemeInfo } from "../context.ts";
import { defaultEnvironment, warnOnce } from "../controller.ts";
import { fallbackSkin, registeredSkinNames, resolveSkin, starterTheme } from "../skin/registry.ts";
import type { CamoEnvironment, CamoSkin } from "../skin/types.ts";
import { schemeStylesheet, themeDeclarations } from "../theme/css.ts";
import { createCamoTheme } from "../theme/merge.ts";
import type { CamoScheme, CamoThemeSet, PartialThemeSet } from "../theme/types.ts";
import { cssBlock } from "../style.ts";

/** The breakpoints of ADR-41 in CSS pixels. */
const MEDIUM = 600;
const EXPANDED = 840;
const LARGE = 1200;

function windowSizeOf(width: number): CamoEnvironment["windowSize"] {
  return width >= LARGE
    ? "large"
    : width >= EXPANDED
      ? "expanded"
      : width >= MEDIUM
        ? "medium"
        : "compact";
}

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
    measured: { state: true },
  };

  static override styles: CSSResult = css`
    :host {
      display: contents;
    }
  `;

  declare skin: CamoSkin | string | null;
  declare scheme: CamoScheme | null;
  declare theme: PartialThemeSet | null;
  declare windowSize: CamoEnvironment["windowSize"] | null;
  declare input: CamoEnvironment["input"] | null;
  declare platform: string | null;
  declare effectiveScheme: CamoScheme | null;
  declare measured: Partial<CamoEnvironment> | null;

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
  #resizeObserver: ResizeObserver | undefined;

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
      this.#themeCss = schemeStylesheet(
        themeDeclarations(effective.light),
        themeDeclarations(effective.dark),
      );
    }

    // The environment: the parent's, the server defaults and attributes, then what the client measured.
    const base = this.#parentEnvironment.value ?? defaultEnvironment;
    const environment: CamoEnvironment = {
      ...base,
      ...(this.windowSize !== null ? { windowSize: this.windowSize } : {}),
      ...(this.input !== null ? { input: this.input } : {}),
      ...(this.platform !== null ? { platform: this.platform } : {}),
      ...this.measured,
      capabilities: { ...base.capabilities, ...this.measured?.capabilities },
    };
    const previous = this.#environmentProvider.value;
    if (previous === undefined || JSON.stringify(previous) !== JSON.stringify(environment)) {
      this.#environmentProvider.setValue(environment);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Measured on the client only; the server uses attributes and defaults.
    if (typeof window === "undefined" || typeof ResizeObserver === "undefined") return;
    this.#resizeObserver = new ResizeObserver(() => this.#measure());
    this.#resizeObserver.observe(document.documentElement);
    this.#measure();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = undefined;
  }

  #measure(): void {
    const windowSize = windowSizeOf(window.innerWidth);
    const input: CamoEnvironment["input"] = window.matchMedia("(pointer: coarse)").matches
      ? "touch"
      : "pointer";
    const backdropBlur = typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "blur(1px)");
    const reduceTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
    const previous = this.measured;
    if (
      previous?.windowSize === windowSize &&
      previous.input === input &&
      previous.capabilities?.backdropBlur === backdropBlur &&
      previous.capabilities.reduceTransparency === reduceTransparency
    ) {
      return;
    }
    this.measured = {
      windowSize,
      input,
      capabilities: {
        ...defaultEnvironment.capabilities,
        backdropBlur,
        reduceTransparency,
      },
    };
  }

  override render(): TemplateResult {
    return html`${cssBlock(this.#themeCss)}<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "camo-provider": CamoProvider;
  }
}
