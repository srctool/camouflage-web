import { TonalPalette } from "@material/material-color-utilities";
import { argbFromColor, hexFromArgb } from "./color.ts";
import type { CamoColors } from "./types.ts";

/** The seeds `fromSeed` takes: only `primary` is required. A `null` or missing seed is derived or defaulted. */
export interface SeedOptions {
  primary: string;
  secondary?: string | null;
  tertiary?: string | null;
  error?: string | null;
  success?: string | null;
  warning?: string | null;
  info?: string | null;
  /** The seed for surfaces and text; `null` gives true grays. Pass the primary for brand-tinted surfaces. */
  neutral?: string | null;
  dark?: boolean;
}

// Camouflage's default status seeds (base Theme §3.4, settled 2026-09-27). Only hue and chroma matter.
const ERROR = "#b3261e";
const SUCCESS = "#2e7d32";
const WARNING = "#f9a825";
const INFO = "#0288d1";

// The tone tables of base Theme §3.4.
const LIGHT = { strong: 40, onStrong: 100, container: 90, onContainer: 10 };
const DARK = { strong: 80, onStrong: 20, container: 30, onContainer: 90 };

// Material's "tonal spot" derivation when no secondary or tertiary seed is given.
const SECONDARY_CHROMA = 16;
const TERTIARY_CHROMA = 24;
const TERTIARY_HUE_SHIFT = 60;
// A `neutral` seed keeps only a hint of its hue, so surfaces stay readable.
const TINTED_NEUTRAL_CHROMA = 6;

const palette = (seed: string): TonalPalette => TonalPalette.fromInt(argbFromColor(seed));

/**
 * All 42 roles from a few seeds: the Material tonal-palette algorithm (HCT) with Camouflage's tone table, the same
 * as `CamoColors.fromSeed` in Kotlin and Dart. The test suite compares the result with their values for shared seeds.
 */
export function fromSeed(options: SeedOptions): CamoColors {
  const dark = options.dark === true;
  const t = dark ? DARK : LIGHT;
  const p = palette(options.primary);
  const s =
    options.secondary != null
      ? palette(options.secondary)
      : TonalPalette.fromHueAndChroma(p.hue, SECONDARY_CHROMA);
  const ter =
    options.tertiary != null
      ? palette(options.tertiary)
      : TonalPalette.fromHueAndChroma((p.hue + TERTIARY_HUE_SHIFT) % 360, TERTIARY_CHROMA);
  const n =
    options.neutral != null
      ? TonalPalette.fromHueAndChroma(palette(options.neutral).hue, TINTED_NEUTRAL_CHROMA)
      : TonalPalette.fromHueAndChroma(0, 0);

  const tone = (pal: TonalPalette, value: number): string => hexFromArgb(pal.tone(value));
  const family = (pal: TonalPalette) => ({
    strong: tone(pal, t.strong),
    onStrong: tone(pal, t.onStrong),
    container: tone(pal, t.container),
    onContainer: tone(pal, t.onContainer),
  });
  const pf = family(p);
  const sf = family(s);
  const tf = family(ter);
  const ef = family(palette(options.error ?? ERROR));
  const kf = family(palette(options.success ?? SUCCESS));
  const wf = family(palette(options.warning ?? WARNING));
  const inf = family(palette(options.info ?? INFO));
  // Camouflage's neutral tones: [light, dark].
  const nt = (light: number, darkTone: number): string => tone(n, dark ? darkTone : light);

  return {
    primary: pf.strong,
    onPrimary: pf.onStrong,
    primaryContainer: pf.container,
    onPrimaryContainer: pf.onContainer,
    secondary: sf.strong,
    onSecondary: sf.onStrong,
    secondaryContainer: sf.container,
    onSecondaryContainer: sf.onContainer,
    tertiary: tf.strong,
    onTertiary: tf.onStrong,
    tertiaryContainer: tf.container,
    onTertiaryContainer: tf.onContainer,
    surface: nt(100, 6),
    surfaceContainerLowest: nt(100, 4),
    surfaceContainerLow: nt(98, 10),
    surfaceContainer: nt(96, 12),
    surfaceContainerHigh: nt(94, 17),
    surfaceContainerHighest: nt(92, 22),
    onSurface: nt(10, 92),
    onSurfaceVariant: nt(35, 75),
    outline: nt(50, 60),
    outlineVariant: nt(90, 25),
    error: ef.strong,
    onError: ef.onStrong,
    errorContainer: ef.container,
    onErrorContainer: ef.onContainer,
    success: kf.strong,
    onSuccess: kf.onStrong,
    successContainer: kf.container,
    onSuccessContainer: kf.onContainer,
    warning: wf.strong,
    onWarning: wf.onStrong,
    warningContainer: wf.container,
    onWarningContainer: wf.onContainer,
    info: inf.strong,
    onInfo: inf.onStrong,
    infoContainer: inf.container,
    onInfoContainer: inf.onContainer,
    inverseSurface: nt(20, 90),
    inverseOnSurface: nt(95, 20),
    inversePrimary: tone(p, dark ? 40 : 80),
    scrim: tone(n, 0),
  };
}
