// Color parsing for the seed builder and the validator. Pure functions on strings; no browser API.

/** An sRGB color as three 0..255 channels. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parses `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` and `rgb()`/`rgba()`; anything else (a `var()`, a keyword) is `null`. */
export function parseColor(value: string): Rgb | null {
  const v = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v);
  if (hex !== null) {
    let h = hex[1]!;
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const fn = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)/.exec(v);
  if (fn !== null) return { r: Number(fn[1]), g: Number(fn[2]), b: Number(fn[3]) };
  return null;
}

/** `#rrggbb` for an ARGB integer (the form `@material/material-color-utilities` uses). */
export function hexFromArgb(argb: number): string {
  return `#${(argb & 0xffffff).toString(16).padStart(6, "0")}`;
}

/** The ARGB integer for a color string, or throws: a seed must be a plain color. */
export function argbFromColor(value: string): number {
  const rgb = parseColor(value);
  if (rgb === null) throw new TypeError(`"${value}" is not a color a seed can use (use #rrggbb).`);
  return (0xff000000 | (rgb.r << 16) | (rgb.g << 8) | rgb.b) >>> 0;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** The WCAG relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The WCAG contrast ratio of two colors, from 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [l1, l2] = [luminance(a) + 0.05, luminance(b) + 0.05];
  return Math.max(l1, l2) / Math.min(l1, l2);
}
