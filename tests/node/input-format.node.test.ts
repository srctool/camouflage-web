import { applyEdit, displayFormats, inputFilters } from "@srctool/camouflage-core";
import { describe, expect, it } from "vitest";

describe("input filters", () => {
  it("digitsOnly drops everything else, and caps the length", () => {
    const f = inputFilters.digitsOnly(4);
    expect(f.filter("", "12a3-456")).toBe("1234");
    expect(inputFilters.digitsOnly().filter("", "a1b2")).toBe("12");
  });
  it("maxLength, pattern and decimal", () => {
    expect(inputFilters.maxLength(3).filter("", "abcdef")).toBe("abc");
    expect(inputFilters.pattern(/[a-z]/).filter("", "a1b2C")).toBe("ab");
    const d = inputFilters.decimal(2, ",");
    expect(d.filter("", "12,345,6")).toBe("12,34");
    expect(d.filter("", "1a2")).toBe("12");
    expect(inputFilters.decimal(0, ",").filter("", "1,5")).toBe("15");
  });
});

describe("display formats", () => {
  const phone = displayFormats.pattern("####-####-####");
  it("a pattern shows the mask and parses it back", () => {
    expect(phone.format("081234567890")).toBe("0812-3456-7890");
    expect(phone.format("0812")).toBe("0812");
    expect(phone.format("08123")).toBe("0812-3");
    expect(phone.parse("0812-3456-7890")).toBe("081234567890");
  });
  it("maps the cursor both ways, over the fixed characters", () => {
    // After five raw characters ("08123") the cursor is after the "3" in "0812-3".
    expect(phone.rawToShown(5, "081234567890")).toBe(6);
    expect(phone.shownToRaw(6, "0812-3456-7890")).toBe(5);
    expect(phone.rawToShown(0, "08")).toBe(0);
    expect(phone.shownToRaw(5, "0812-3456")).toBe(4); // inside the dash
  });
  it("grouping and decimal", () => {
    const g = displayFormats.grouping(".", 3);
    expect(g.format("1250000")).toBe("1.250.000");
    expect(g.format("12")).toBe("12");
    expect(g.parse("1.250.000")).toBe("1250000");
    const d = displayFormats.decimal(2, ",", ".");
    expect(d.format("1250000,5")).toBe("1.250.000,5");
    expect(d.parse("1.250.000,50")).toBe("1250000,50");
  });
});

describe("applyEdit: filter and format around one edit", () => {
  const filter = inputFilters.digitsOnly(12);
  const format = displayFormats.pattern("####-####-####");

  it("keeps the cursor where the user typed in the middle", () => {
    // "0812-3456" shown; the user types a 9 after "0812-3": typed text "0812-39456", cursor 7.
    const r = applyEdit("08123456", "0812-39456", 7, filter, format);
    expect(r.raw).toBe("081239456");
    expect(r.shown).toBe("0812-3945-6");
    expect(r.cursor).toBe(7);
  });
  it("moves the cursor back when the filter drops what was typed", () => {
    const r = applyEdit("0812", "0812x", 5, filter, null);
    expect(r.raw).toBe("0812");
    expect(r.cursor).toBe(4);
  });
  it("with neither, passes the edit through", () => {
    expect(applyEdit("a", "ab", 2, null, null)).toEqual({ raw: "ab", shown: "ab", cursor: 2 });
  });
  it("stops at the filter's limit", () => {
    const r = applyEdit("081234567890", "0812345678901", 13, filter, format);
    expect(r.raw).toBe("081234567890");
  });
});
