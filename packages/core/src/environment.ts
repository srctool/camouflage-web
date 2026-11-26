import type { CamoCapabilities, CamoEnvironment, InputKind, WindowSize } from "./skin/types.ts";

/** A media query the page can read now and watch for changes. */
export interface WatchedQuery {
  readonly matches: boolean;
  /** Calls `listener` when `matches` changes; returns the function that stops it. */
  subscribe(listener: () => void): () => void;
}

/**
 * Everything the environment reads from a browser, one small function each, so a server (or a test) can replace the
 * ones that cannot work there (Provider note, section 3.3). A source that is missing answers "unknown", and the
 * provider keeps its default for that value.
 */
export interface EnvironmentSources {
  /** The viewport width in CSS pixels, or `undefined` when there is no viewport. */
  viewportWidth(): number | undefined;
  /** Calls `listener` when the viewport changes size; returns the function that stops it. */
  observeViewport(listener: () => void): () => void;
  /** A media query, or `undefined` when there is no `matchMedia`. */
  query(media: string): WatchedQuery | undefined;
  /** `CSS.supports(property, value)`, or `false` when there is no `CSS`. */
  supports(property: string, value: string): boolean;
  /** Whether the engine is Chromium: the only one that draws an SVG filter inside `backdrop-filter`. */
  chromium(): boolean;
}

/** The breakpoints of ADR-41 in CSS pixels. */
export const BREAKPOINTS = { medium: 600, expanded: 840, large: 1200 } as const;

/** The window size class of a width (ADR-41). */
export function windowSizeOf(width: number): WindowSize {
  return width >= BREAKPOINTS.large
    ? "large"
    : width >= BREAKPOINTS.expanded
      ? "expanded"
      : width >= BREAKPOINTS.medium
        ? "medium"
        : "compact";
}

/** The sources of a real browser. Safe to create anywhere: each reads the globals only when it is called. */
export const browserSources: EnvironmentSources = {
  viewportWidth: () => (typeof window === "undefined" ? undefined : window.innerWidth),
  observeViewport(listener) {
    if (typeof ResizeObserver === "undefined" || typeof document === "undefined") return () => {};
    const observer = new ResizeObserver(listener);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  },
  query(media) {
    if (typeof matchMedia === "undefined") return undefined;
    const list = matchMedia(media);
    return {
      get matches() {
        return list.matches;
      },
      subscribe(listener) {
        list.addEventListener("change", listener);
        return () => list.removeEventListener("change", listener);
      },
    };
  },
  supports: (property, value) => typeof CSS !== "undefined" && CSS.supports(property, value),
  // `userAgentData` exists in Chromium alone (in a secure context); elsewhere the answer is "no", and glass keeps its
  // blur and edge.
  chromium: () => typeof navigator !== "undefined" && "userAgentData" in navigator,
};

let sources: EnvironmentSources = browserSources;

/** The sources in force. */
export function environmentSources(): EnvironmentSources {
  return sources;
}

/**
 * Replaces some or all of the sources (a server render, or a test that fakes a media query) and returns a function
 * that puts the previous ones back. The change is read by providers connected after it.
 */
export function setEnvironmentSources(replacement: Partial<EnvironmentSources>): () => void {
  const previous = sources;
  sources = { ...previous, ...replacement };
  return () => {
    sources = previous;
  };
}

/** What a provider reads, with the queries it has to watch. */
export interface Measured {
  windowSize: WindowSize | undefined;
  input: InputKind | undefined;
  reducedMotion: boolean | undefined;
  capabilities: Partial<CamoCapabilities>;
}

/** The media queries behind the environment: touch input, reduced motion and reduced transparency. */
export const QUERIES = {
  coarse: "(pointer: coarse)",
  noHover: "(hover: none)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
  reducedTransparency: "(prefers-reduced-transparency: reduce)",
  dark: "(prefers-color-scheme: dark)",
} as const;

/** Reads every value the sources can answer. A value they cannot answer is left out. */
export function measure(from: EnvironmentSources = sources): Measured {
  const width = from.viewportWidth();
  const coarse = from.query(QUERIES.coarse);
  const noHover = from.query(QUERIES.noHover);
  const reduced = from.query(QUERIES.reducedMotion);
  const transparency = from.query(QUERIES.reducedTransparency);
  const hasPointerInfo = coarse !== undefined || noHover !== undefined;
  return {
    windowSize: width === undefined ? undefined : windowSizeOf(width),
    input: hasPointerInfo
      ? coarse?.matches === true || noHover?.matches === true
        ? "touch"
        : "pointer"
      : undefined,
    reducedMotion: reduced?.matches,
    capabilities: {
      backdropBlur:
        from.supports("backdrop-filter", "blur(1px)") ||
        from.supports("-webkit-backdrop-filter", "blur(1px)"),
      // SVG displacement filters inside `backdrop-filter` work in Chromium only. Other engines parse the `url()` form
      // and draw nothing, so the syntax probe alone is not enough.
      runtimeShaders: from.supports("backdrop-filter", "url(#camo)") && from.chromium(),
      // A web page never has a window material (that is a desktop shell's, ADR-42).
      windowMaterial: false,
      ...(transparency === undefined ? {} : { reduceTransparency: transparency.matches }),
    },
  };
}

/** Starts watching everything `measure` reads; returns the function that stops. */
export function watchEnvironment(
  listener: () => void,
  from: EnvironmentSources = sources,
): () => void {
  const stops = [
    from.observeViewport(listener),
    ...Object.values(QUERIES).map((media) => from.query(media)?.subscribe(listener) ?? (() => {})),
  ];
  return () => stops.forEach((stop) => stop());
}

/** The environment with the measured values laid over it. Pure, so the server and the client share it. */
export function withMeasured(base: CamoEnvironment, measured: Measured | null): CamoEnvironment {
  if (measured === null) return base;
  return {
    ...base,
    ...(measured.windowSize === undefined ? {} : { windowSize: measured.windowSize }),
    ...(measured.input === undefined ? {} : { input: measured.input }),
    ...(measured.reducedMotion === undefined ? {} : { reducedMotion: measured.reducedMotion }),
    capabilities: { ...base.capabilities, ...measured.capabilities },
  };
}

/**
 * The environment as custom properties, for what a skin can only decide in CSS: materials (ADR-42) and a density that
 * follows the input (ADR-41). A provider writes them on itself once the client has measured; the server writes none, so
 * every `var()` that reads one has the safe answer as its fallback (opaque, no refraction, touch sizes).
 *
 * - `--camo-blur-supported`: `1` when a backdrop may be blurred (support, and no Reduce Transparency), else `0`.
 * - `--camo-glass-refraction`: `url(#camo-glass)` where a skin's SVG filter of that id can bend the backdrop.
 * - `--camo-material-texture`: `none` under Reduce Transparency, to drop a material's noise with its blur.
 * - `--camo-window-material`: `transparent` where the window itself draws a material (a desktop shell).
 * - `--camo-input-pointer`: `1` with a mouse or trackpad, `0` with fingers.
 */
export function environmentProperties(environment: CamoEnvironment): [string, string][] {
  const { backdropBlur, runtimeShaders, reduceTransparency, windowMaterial } =
    environment.capabilities;
  const blur = backdropBlur && !reduceTransparency;
  return [
    ["--camo-blur-supported", blur ? "1" : "0"],
    ["--camo-glass-refraction", blur && runtimeShaders ? "url(#camo-glass)" : "initial"],
    ["--camo-material-texture", reduceTransparency ? "none" : "initial"],
    ["--camo-window-material", windowMaterial && !reduceTransparency ? "transparent" : "initial"],
    ["--camo-input-pointer", environment.input === "pointer" ? "1" : "0"],
  ];
}
