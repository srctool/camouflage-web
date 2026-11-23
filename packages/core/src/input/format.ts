// Input filters and display formats: what text a field accepts, and how it is shown (the Text Field note, "Formatting
// without cursor jumps"). Both are pure objects, so they run on the server and in tests with no DOM. The field applies
// them around the edit it sees (old text, new text, cursor), which is what keeps the cursor where the user put it.

/** Decides which input is accepted, before the app sees it. Returns the accepted raw text. */
export interface CamoInputFilter {
  filter(previous: string, next: string): string;
}

/** How a raw value is shown. `value` stays raw; the cursor is mapped between the two texts. */
export interface CamoDisplayFormat {
  /** What the user sees for a raw value. */
  format(raw: string): string;
  /** The raw value behind what the user typed. */
  parse(shown: string): string;
  /** The cursor in the shown text for a cursor in the raw text. */
  rawToShown(offset: number, raw: string): number;
  /** The cursor in the raw text for a cursor in the shown text. */
  shownToRaw(offset: number, shown: string): number;
}

/** Built-in filters. */
export const inputFilters = {
  /** Digits only, at most `maxLength` of them. */
  digitsOnly(maxLength?: number): CamoInputFilter {
    return {
      filter: (_previous, next) => {
        const digits = next.replace(/\D/g, "");
        return maxLength === undefined ? digits : digits.slice(0, maxLength);
      },
    };
  },
  /** At most `n` characters. */
  maxLength(n: number): CamoInputFilter {
    return { filter: (_previous, next) => next.slice(0, n) };
  },
  /** Only the characters the regex accepts (test one character at a time). */
  pattern(allowed: RegExp): CamoInputFilter {
    return { filter: (_previous, next) => [...next].filter((c) => allowed.test(c)).join("") };
  },
  /** Digits and one separator, at most `decimals` after it. */
  decimal(decimals = 2, separator = ","): CamoInputFilter {
    return {
      filter: (_previous, next) => {
        let seenSeparator = false;
        let after = 0;
        let out = "";
        for (const c of next) {
          if (/\d/.test(c)) {
            if (seenSeparator) {
              if (after >= decimals) continue;
              after++;
            }
            out += c;
          } else if (c === separator && !seenSeparator && decimals > 0) {
            seenSeparator = true;
            out += c;
          }
        }
        return out;
      },
    };
  },
};

// The offset in `shown` after `rawOffset` raw characters: skips the fixed characters in between.
function shownOffset(
  shown: string,
  isRaw: (c: string, i: number) => boolean,
  rawOffset: number,
): number {
  if (rawOffset <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < shown.length; i++) {
    if (isRaw(shown[i]!, i)) {
      seen++;
      if (seen === rawOffset) return i + 1;
    }
  }
  return shown.length;
}

/** Built-in display formats. */
export const displayFormats = {
  /** A mask where `#` is one raw character and anything else is fixed: `"####-####-####"`. */
  pattern(mask: string): CamoDisplayFormat {
    const isSlot = (i: number): boolean => mask[i] === "#";
    const shownIsRaw = (_c: string, i: number): boolean => isSlot(i);
    const fixed = new Set([...mask].filter((c) => c !== "#"));
    const format = (raw: string): string => {
      let out = "";
      let r = 0;
      for (let i = 0; i < mask.length && r < raw.length; i++) {
        if (mask[i] === "#") out += raw[r++];
        else out += mask[i];
      }
      return out;
    };
    return {
      format,
      // Typed text may or may not carry the fixed characters; the mask's own characters are never raw.
      parse: (shown) => [...shown].filter((c) => !fixed.has(c)).join(""),
      rawToShown: (offset, raw) => {
        const shown = format(raw);
        // After the last raw character the fixed ones that follow come along (`12-` when the dash is next).
        return shownOffset(shown, shownIsRaw, offset);
      },
      // Typed text is not laid out as the mask is, so count what is not a fixed character before the cursor.
      shownToRaw: (offset, shown) =>
        [...shown.slice(0, offset)].filter((c) => !fixed.has(c)).length,
    };
  },
  /** Groups digits: `1250000` as `1.250.000`. */
  grouping(separator = ".", size = 3): CamoDisplayFormat {
    const format = (raw: string): string => {
      const head = raw.length % size;
      const parts: string[] = [];
      if (head > 0) parts.push(raw.slice(0, head));
      for (let i = head; i < raw.length; i += size) parts.push(raw.slice(i, i + size));
      return parts.join(separator);
    };
    const isRaw = (c: string): boolean => c !== separator;
    return {
      format,
      parse: (shown) => shown.split(separator).join(""),
      rawToShown: (offset, raw) => shownOffset(format(raw), isRaw, offset),
      shownToRaw: (offset, shown) => shown.slice(0, offset).split(separator).join("").length,
    };
  },
  /** `1250000,5` as `1.250.000,5`: grouped integer part, a decimal separator. */
  decimal(decimals = 2, decimalSeparator = ",", groupSeparator = "."): CamoDisplayFormat {
    const group = displayFormats.grouping(groupSeparator, 3);
    const split = (raw: string): [string, string | null] => {
      const at = raw.indexOf(decimalSeparator);
      return at < 0 ? [raw, null] : [raw.slice(0, at), raw.slice(at + 1, at + 1 + decimals)];
    };
    const format = (raw: string): string => {
      const [integer, fraction] = split(raw);
      return group.format(integer) + (fraction === null ? "" : decimalSeparator + fraction);
    };
    const isRaw = (c: string): boolean => c !== groupSeparator;
    return {
      format,
      parse: (shown) => shown.split(groupSeparator).join(""),
      rawToShown: (offset, raw) => shownOffset(format(raw), isRaw, offset),
      shownToRaw: (offset, shown) => shown.slice(0, offset).split(groupSeparator).join("").length,
    };
  },
};

/**
 * Applies a filter and a format to one edit, and says where the cursor goes. `previous` is the raw value before the
 * edit, `typed` what the input now holds (the shown text), `cursor` its caret. Pure.
 */
export function applyEdit(
  previous: string,
  typed: string,
  cursor: number,
  filter: CamoInputFilter | null,
  format: CamoDisplayFormat | null,
): { raw: string; shown: string; cursor: number } {
  const candidate = format === null ? typed : format.parse(typed);
  let rawCursor = format === null ? cursor : format.shownToRaw(cursor, typed);
  const raw = filter === null ? candidate : filter.filter(previous, candidate);
  // Characters the filter dropped before the cursor move it back.
  if (raw !== candidate) {
    let kept = 0;
    let at = 0;
    for (let i = 0; i < Math.min(rawCursor, candidate.length); i++) {
      if (raw[at] === candidate[i]) {
        at++;
        kept++;
      }
    }
    rawCursor = kept;
  }
  rawCursor = Math.min(rawCursor, raw.length);
  const shown = format === null ? raw : format.format(raw);
  return {
    raw,
    shown,
    cursor: format === null ? rawCursor : format.rawToShown(rawCursor, raw),
  };
}
