// The two rules of an avatar that must come out the same on every platform: which letters it shows and which color it
// gets. Kotlin and Dart test the same vectors ("Dwiki Riyadi" hashes to 0xCDC853E9). Pure, so they run in Node.

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/** The first user-perceived character (grapheme) of `text`: a letter with its marks, an emoji with its modifiers. */
function firstGrapheme(text: string): string {
  if (segmenter !== null) {
    for (const part of segmenter.segment(text)) return part.segment;
    return "";
  }
  return Array.from(text)[0] ?? "";
}

const LETTER = /^\p{L}/u;

/**
 * The letters an avatar shows for a name: the first letters of the first and the last word ("Dwiki Riyadi" is "DR"), or
 * one for a single word. It is the first grapheme of a word, so a name in a script with no word spaces (CJK, Arabic)
 * gives one. A name that does not start with a letter (an emoji, a digit, a symbol) or is empty gives `null`: the avatar
 * shows its person icon.
 */
export function avatarInitials(name: string | null | undefined): string | null {
  const words = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter((w) => w !== "");
  const first = firstGrapheme(words[0] ?? "");
  if (first === "" || !LETTER.test(first)) return null;
  if (words.length < 2) return first.toUpperCase();
  const last = firstGrapheme(words[words.length - 1]!);
  return LETTER.test(last) ? (first + last).toUpperCase() : first.toUpperCase();
}

/** The 32-bit FNV-1a hash of the name's UTF-8 bytes: the same name always picks the same background. */
export function avatarColorSeed(name: string): number {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(name)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}
