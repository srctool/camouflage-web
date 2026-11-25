/**
 * The rating a pointer means: `fraction` is how far along the row it is (0 to 1, from the start edge), so it follows the
 * writing direction when the caller measures from the start. Rounded up to the step, so the point on the first half of a
 * star is a half and the point on the second half is a whole; never below one step, never above `max`. Pure.
 */
export function ratingAt(fraction: number, max: number, step: "whole" | "half"): number {
  const unit = step === "half" ? 0.5 : 1;
  const raw = Math.min(Math.max(fraction, 0), 1) * max;
  return Math.min(Math.max(Math.ceil(raw / unit) * unit, unit), max);
}

/** Keeps a rating a multiple of its step, within 0 and `max`. */
export function snapRating(value: number, max: number, step: "whole" | "half"): number {
  const unit = step === "half" ? 0.5 : 1;
  return Math.min(Math.max(Math.round(value / unit) * unit, 0), max);
}
