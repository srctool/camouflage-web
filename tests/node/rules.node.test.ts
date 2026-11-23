import { CamoRules, firstFailure } from "@srctool/camouflage-core";
import { describe, expect, it } from "vitest";

const form = { password: "secret123" };

describe("form rules", () => {
  it("required: null, blank text, false and an empty list are missing", () => {
    const r = CamoRules.required("missing");
    for (const v of [null, undefined, "", "   ", false, []])
      expect(r(v, form), String(v)).toBe("missing");
    for (const v of ["a", 0, true, ["x"]]) expect(r(v, form), String(v)).toBeNull();
  });
  it("requiredTrue is for a consent checkbox", () => {
    const r = CamoRules.requiredTrue("accept");
    expect(r(false, form)).toBe("accept");
    expect(r(true, form)).toBeNull();
  });
  it("length, number and pattern rules skip an empty value (that is `required`'s job)", () => {
    expect(CamoRules.minLength(3, "m")("", form)).toBeNull();
    expect(CamoRules.minLength(3, "m")("ab", form)).toBe("m");
    expect(CamoRules.maxLength(3, "m")("abcd", form)).toBe("m");
    expect(CamoRules.min(5, "m")("4", form)).toBe("m");
    expect(CamoRules.min(5, "m")("4,5", form)).toBe("m");
    expect(CamoRules.max(5, "m")("5.5", form)).toBe("m");
    expect(CamoRules.max(5, "m")("abc", form)).toBe("m");
  });
  it("pattern needs the whole value to match", () => {
    const r = CamoRules.pattern(/\d{3}/, "three digits");
    expect(r("123", form)).toBeNull();
    expect(r("1234", form)).toBe("three digits");
    expect(r("a123", form)).toBe("three digits");
  });
  it("email is a practical shape", () => {
    const r = CamoRules.email("bad");
    expect(r("ada@example.com", form)).toBeNull();
    for (const v of ["ada", "ada@", "ada@example", "a b@c.d"]) expect(r(v, form), v).toBe("bad");
  });
  it("matches another field in the same form", () => {
    const r = CamoRules.matches("password", "differs");
    expect(r("secret123", form)).toBeNull();
    expect(r("other", form)).toBe("differs");
  });
  it("runs rules in order and the first failure wins; accepts one rule or a list", () => {
    const list = [CamoRules.required("a"), CamoRules.minLength(5, "b")];
    expect(firstFailure(list, "", form)).toBe("a");
    expect(firstFailure(list, "abc", form)).toBe("b");
    expect(firstFailure(list, "abcdef", form)).toBeNull();
    expect(firstFailure(CamoRules.required("only"), "", form)).toBe("only");
    expect(firstFailure(undefined, "", form)).toBeNull();
  });
  it("takes any function as a rule", () => {
    const promo = (v: unknown): string | null =>
      v === null || v === "" || String(v).startsWith("CAMO") ? null : "Invalid code";
    expect(firstFailure(promo, "NOPE", form)).toBe("Invalid code");
    expect(firstFailure(promo, "CAMO10", form)).toBeNull();
  });
});
