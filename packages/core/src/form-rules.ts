// Validation rules as plain functions (the Form note, 3.1). A rule gets a field's value and the form's values and returns
// the message to show, or `null` when the value is fine. Messages are always passed in, so they can be localized. Rules
// run in list order and the first failure wins.

/** What a rule sees: every named field's current value. */
export type CamoFormValues = Readonly<Record<string, unknown>>;

/** `null` is valid; a string is the message. */
export type CamoRule<T = unknown> = (
  value: T | null | undefined,
  form: CamoFormValues,
) => string | null;

const blank = (v: unknown): boolean =>
  v === null ||
  v === undefined ||
  v === false ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

/** A practical email shape, not RFC 5322. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The built-in rules. */
export const CamoRules = {
  /** Something is set: not null, not blank text, not an empty list. A checkbox that is off is not set. */
  required:
    (message: string): CamoRule =>
    (v) =>
      blank(v) ? message : null,
  /** A boolean is true: a consent checkbox. */
  requiredTrue:
    (message: string): CamoRule =>
    (v) =>
      v === true ? null : message,
  minLength:
    (n: number, message: string): CamoRule =>
    (v) =>
      blank(v) || String(v).length >= n ? null : message,
  maxLength:
    (n: number, message: string): CamoRule =>
    (v) =>
      blank(v) || String(v).length <= n ? null : message,
  /** The numeric value is at least `n` (a text value is parsed). */
  min:
    (n: number, message: string): CamoRule =>
    (v) => {
      if (blank(v)) return null;
      const x = Number(String(v).replace(",", "."));
      return Number.isFinite(x) && x >= n ? null : message;
    },
  max:
    (n: number, message: string): CamoRule =>
    (v) => {
      if (blank(v)) return null;
      const x = Number(String(v).replace(",", "."));
      return Number.isFinite(x) && x <= n ? null : message;
    },
  /** The whole value matches the pattern. */
  pattern:
    (regex: RegExp, message: string): CamoRule =>
    (v) => {
      if (blank(v)) return null;
      const match = new RegExp(`^(?:${regex.source})$`, regex.flags.replace(/[gy]/g, "")).test(
        String(v),
      );
      return match ? null : message;
    },
  email:
    (message: string): CamoRule =>
    (v) =>
      blank(v) || EMAIL.test(String(v)) ? null : message,
  /** Equals another field's value in the same form: confirm password. */
  matches:
    (field: string, message: string): CamoRule =>
    (v, form) =>
      blank(v) && blank(form[field]) ? null : v === form[field] ? null : message,
};

/** Runs a field's rules in order and returns the first message, or `null`. */
export function firstFailure(
  rules: CamoRule | readonly CamoRule[] | undefined,
  value: unknown,
  form: CamoFormValues,
): string | null {
  if (rules === undefined) return null;
  for (const rule of Array.isArray(rules) ? rules : [rules]) {
    const message = (rule as CamoRule)(value, form);
    if (message !== null) return message;
  }
  return null;
}
