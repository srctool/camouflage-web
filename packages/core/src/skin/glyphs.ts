import type { IconArtwork } from "./types.ts";

/** An icon from path data in a 24 by 24 box (Material Symbols, Apache-2.0). */
const glyph = (d: string): IconArtwork => ({ svg: `<path d="${d}"/>`, viewBox: "0 0 24 24" });

/** The names of the built-in glyphs. */
export type Glyph =
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "close"
  | "more"
  | "moreHorizontal"
  | "star"
  | "image"
  | "brokenImage"
  | "upload"
  | "check"
  | "alert"
  | "arrowUp"
  | "retry"
  | "trash"
  | "folder"
  | "file";

/** The path data of a glyph, for markup that draws a bare `<path>`. */
export function glyphPath(name: Glyph): string {
  return PATHS[name];
}

const PATHS: Readonly<Record<Glyph, string>> = {
  chevronDown: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z",
  chevronLeft: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  chevronRight: "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  close:
    "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  more: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  moreHorizontal:
    "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  star: "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  image:
    "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  brokenImage:
    "M21 5v6.59l-3-3.01-4 4.01-4-4-4 4-3-3.01V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2zm-3 6.42 3 3.01V19c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-6.58l3 2.99 4-4 4 4 4-3.99z",
  upload: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
  check: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  alert: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  arrowUp: "m4 12 1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8z",
  retry:
    "M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z",
  folder: "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8z",
  file: "M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm7 7V3.5L18.5 9z",
};

/** The icons a skin's defaults use for the parts it draws itself (a chevron, a star, a close mark); a brand replaces them in its skin. */
export const GLYPHS: Readonly<Record<Glyph, IconArtwork>> = {
  chevronDown: glyph(PATHS.chevronDown),
  chevronLeft: glyph(PATHS.chevronLeft),
  chevronRight: glyph(PATHS.chevronRight),
  close: glyph(PATHS.close),
  more: glyph(PATHS.more),
  moreHorizontal: glyph(PATHS.moreHorizontal),
  star: glyph(PATHS.star),
  image: glyph(PATHS.image),
  brokenImage: glyph(PATHS.brokenImage),
  upload: glyph(PATHS.upload),
  check: glyph(PATHS.check),
  alert: glyph(PATHS.alert),
  arrowUp: glyph(PATHS.arrowUp),
  retry: glyph(PATHS.retry),
  trash: glyph(PATHS.trash),
  folder: glyph(PATHS.folder),
  file: glyph(PATHS.file),
};
