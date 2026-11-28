// A scrollbar's geometry as pure functions (base CamoScrollbar note, 4). Lengths are in pixels of the track.

export interface Thumb {
  start: number;
  length: number;
}

/** The thumb for content of size `content` seen through `viewport` at `offset`; none when everything is in view. */
export function thumbOf(
  viewport: number,
  content: number,
  offset: number,
  track: number,
  minimum: number,
): Thumb | null {
  if (content - viewport < 1 || viewport <= 0 || track <= 0) return null;
  const length = Math.min(track, Math.max((viewport / content) * track, minimum));
  const share = Math.min(Math.max(offset / (content - viewport), 0), 1);
  return { start: share * (track - length), length };
}

/** The offset that puts the thumb's start at `start`. */
export function offsetOfThumb(
  start: number,
  viewport: number,
  content: number,
  track: number,
  length: number,
): number {
  const room = track - length;
  if (room <= 0) return 0;
  return Math.min(Math.max(start / room, 0), 1) * (content - viewport);
}

/** Where a press on the track goes: a viewport towards the press, or nowhere on the thumb itself. */
export function pageFor(at: number, thumb: Thumb, viewport: number, offset: number): number {
  if (at < thumb.start) return offset - viewport;
  if (at > thumb.start + thumb.length) return offset + viewport;
  return offset;
}
