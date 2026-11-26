// What a chart looks like. The layers, later ones winning: the theme's defaults, the preset for the skin's name, the
// theme's `chart` token set, then the chart's own `chartStyle`. Pure: it takes what it needs as arguments.
import { contrastRatio, parseColor, tokens } from "@srctool/camouflage-core";
import type { CamoTheme, CamoTokenSets } from "@srctool/camouflage-core";

/** Chart style changes: a field that is absent keeps the layer below. Lengths are CSS pixels. */
export interface ChartStyle {
  gridLines?: boolean;
  gridDashed?: boolean;
  lineWidth?: number;
  markerSize?: number;
  areaOpacity?: number;
  barRadius?: number;
  barGap?: number;
  /** The space between groups of bars, as a share of a group. */
  groupGap?: number;
  /** The ring's width as a share of the radius (donut). */
  donutThickness?: number;
  sliceGap?: number;
  selectedOffset?: number;
  /** The smallest share that gets a label. */
  labelThreshold?: number;
  /** The draw-in when the chart first paints; never under reduced motion. */
  animate?: boolean;
  /** Series colors, CSS values. */
  palette?: readonly string[];
}

/** A color as the page paints it (`css`, which may follow the theme live) and, when known, as a value to compute with. */
export interface ChartColor {
  css: string;
  value: string | null;
}

/** A style with every field set. */
export type ResolvedChartStyle = Omit<Required<ChartStyle>, "palette"> & {
  palette: readonly ChartColor[];
};

const BASE: Omit<ResolvedChartStyle, "palette"> = {
  gridLines: true,
  gridDashed: false,
  lineWidth: 2,
  markerSize: 6,
  areaOpacity: 0.18,
  barRadius: 4,
  barGap: 4,
  groupGap: 0.3,
  donutThickness: 0.35,
  sliceGap: 2,
  selectedOffset: 6,
  labelThreshold: 0.05,
  animate: true,
};

const presets = new Map<string, ChartStyle>([
  ["minimal", { lineWidth: 1.5, areaOpacity: 0.12, barRadius: 2, markerSize: 5 }],
  ["fluent", { lineWidth: 2, areaOpacity: 0.2, barRadius: 4, gridDashed: true, sliceGap: 3 }],
  [
    "cupertino",
    {
      lineWidth: 2,
      markerSize: 7,
      areaOpacity: 0.2,
      barRadius: 4,
      barGap: 2,
      donutThickness: 0.4,
      sliceGap: 2,
    },
  ],
  [
    "carbon",
    {
      lineWidth: 1.5,
      markerSize: 6,
      areaOpacity: 0.3,
      barRadius: 0,
      barGap: 1,
      gridDashed: true,
      donutThickness: 0.35,
      sliceGap: 1,
    },
  ],
  [
    "material",
    {
      lineWidth: 3,
      markerSize: 8,
      areaOpacity: 0.16,
      barRadius: 8,
      barGap: 2,
      donutThickness: 0.3,
      sliceGap: 4,
    },
  ],
]);

/** Chart presets per skin name, and the way to add one for a skin of your own. Register before the charts render. */
export const CamoCharts: {
  registerPreset(skinName: string, style: ChartStyle): void;
  presetFor(skinName: string): ChartStyle | undefined;
} = {
  registerPreset(skinName, style) {
    presets.set(skinName, style);
  },
  presetFor: (skinName) => presets.get(skinName),
};

const ROLES = ["primary", "info", "success", "warning", "error", "secondary", "tertiary"] as const;

/**
 * The series colors from the theme's families, as live `var()` references. A color under 3:1 contrast with the surface
 * is left out of the cycle (when at least three remain), which needs the theme's values.
 */
export function themePalette(theme: CamoTheme | undefined): ChartColor[] {
  const all: ChartColor[] = ROLES.map((role) => ({
    css: tokens.colors[role],
    value: theme?.colors[role] ?? null,
  }));
  if (theme === undefined) return all;
  const seen = new Set<string>();
  const distinct = all.filter((c) => !seen.has(c.value!) && seen.add(c.value!) !== undefined);
  const surface = parseColor(theme.colors.surface);
  const readable = distinct.filter((c) => {
    const color = parseColor(c.value!);
    return surface === null || color === null || contrastRatio(color, surface) >= 3;
  });
  return readable.length >= 3 ? readable : distinct;
}

const NUMBERS = [
  "lineWidth",
  "markerSize",
  "areaOpacity",
  "barRadius",
  "barGap",
  "groupGap",
  "donutThickness",
  "sliceGap",
  "selectedOffset",
  "labelThreshold",
] as const;
const FLAGS = ["gridLines", "gridDashed", "animate"] as const;

const dashed = (name: string): string => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * A brand's chart tokens (ADR-32): the theme's `tokenSets.chart`, one entry per style field in kebab-case
 * (`line-width: "3"`, `grid-dashed: "true"`, `palette: "#123456, #654321"`). An entry that is not a number is ignored.
 */
export function styleFromTokens(sets: CamoTokenSets | undefined): ChartStyle {
  const set = sets?.["chart"] as Readonly<Record<string, string>> | undefined;
  if (set === undefined) return {};
  const style: ChartStyle = {};
  for (const field of NUMBERS) {
    const n = Number.parseFloat(set[dashed(field)] ?? "");
    if (Number.isFinite(n)) style[field] = n;
  }
  for (const field of FLAGS) {
    const value = set[dashed(field)];
    if (value === "true" || value === "false") style[field] = value === "true";
  }
  const palette = set["palette"]?.split(/,(?![^(]*\))/).map((c) => c.trim());
  if (palette !== undefined) style.palette = palette.filter((c) => c !== "");
  return style;
}

/** The style a chart draws with, for the skin's name, the theme in force and the chart's own overrides. */
export function resolveChartStyle(
  skinName: string | undefined,
  theme: CamoTheme | undefined,
  overrides: ChartStyle | null = null,
): ResolvedChartStyle {
  const layers: ChartStyle[] = [
    (skinName === undefined ? undefined : presets.get(skinName)) ?? {},
    styleFromTokens(theme?.tokenSets),
    overrides ?? {},
  ];
  const merged = layers.reduce<ChartStyle>((all, layer) => {
    const set = Object.fromEntries(Object.entries(layer).filter(([, v]) => v !== undefined));
    return { ...all, ...set };
  }, {});
  const { palette, ...rest } = merged;
  return {
    ...BASE,
    ...rest,
    palette:
      palette !== undefined && palette.length > 0
        ? palette.map((css) => ({ css, value: css }))
        : themePalette(theme),
  };
}

/** The color of series `index`: its own, else the palette's, cycling. */
export function seriesColor(style: ResolvedChartStyle, index: number, own?: string): ChartColor {
  return own !== undefined && own !== ""
    ? { css: own, value: own }
    : style.palette[index % style.palette.length]!;
}
