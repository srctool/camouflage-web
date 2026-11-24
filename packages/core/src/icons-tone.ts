import { resolveIcon } from "./icons.ts";
import type { IconArtwork, Tone } from "./skin/types.ts";

// The status icons a banner and a snackbar draw for a tone (Material's `info`, `check_circle`, `warning`, `error`). A
// brand replaces one by registering an icon named `tone-info`, `tone-success`, `tone-warning` or `tone-error`.
const TONE_ICONS: Record<Exclude<Tone, "default">, string> = {
  info: "M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  success:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  warning: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  error:
    "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z",
};

/** The status icon of a tone: a registered `tone-<tone>` icon, else the built-in one; `null` for the default tone. */
export function toneIcon(tone: Tone): IconArtwork | null {
  if (tone === "default") return null;
  return (
    resolveIcon(`tone-${tone}`) ?? { svg: `<path d="${TONE_ICONS[tone]}"/>`, viewBox: "0 0 24 24" }
  );
}
