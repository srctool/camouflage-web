import { avatarColorSeed, avatarInitials } from "@srctool/camouflage-core";
import { describe, expect, it } from "vitest";

// The two avatar rules that must come out the same on every platform (Kotlin and Dart test the same vectors).
describe("avatarInitials", () => {
  it("takes the first letters of the first and the last word", () => {
    expect(avatarInitials("Dwiki Riyadi")).toBe("DR");
    expect(avatarInitials("ada lovelace")).toBe("AL");
    expect(avatarInitials("Ludwig van Beethoven")).toBe("LB");
    expect(avatarInitials("  Grace   Hopper  ")).toBe("GH");
  });

  it("gives one letter for a single word", () => {
    expect(avatarInitials("Madonna")).toBe("M");
  });

  it("takes the first grapheme, so a script without word spaces gives one", () => {
    expect(avatarInitials("山田太郎")).toBe("山");
    expect(avatarInitials("محمد")).toBe("م");
    // A letter with a combining mark is one grapheme.
    expect(avatarInitials("e\u0301mile Zola")).toBe("E\u0301Z");
  });

  it("gives null (the person icon) for no name, or one that does not start with a letter", () => {
    expect(avatarInitials(null)).toBeNull();
    expect(avatarInitials("")).toBeNull();
    expect(avatarInitials("   ")).toBeNull();
    expect(avatarInitials("😀 Smile")).toBeNull();
    expect(avatarInitials("42 Club")).toBeNull();
    expect(avatarInitials("#hashtag")).toBeNull();
  });

  it("keeps one letter when the last word does not start with one", () => {
    expect(avatarInitials("Ada 3rd")).toBe("A");
    expect(avatarInitials("Ada 😀")).toBe("A");
  });
});

describe("avatarColorSeed", () => {
  it("is the 32-bit FNV-1a hash of the UTF-8 bytes, the same on every platform", () => {
    expect(avatarColorSeed("")).toBe(0x811c9dc5);
    expect(avatarColorSeed("a")).toBe(0xe40c292c);
    expect(avatarColorSeed("foobar")).toBe(0xbf9cf968);
    expect(avatarColorSeed("Dwiki Riyadi")).toBe(0xcdc853e9);
  });

  it("is stable, and picks the same background for the same name", () => {
    expect(avatarColorSeed("Ada Lovelace")).toBe(avatarColorSeed("Ada Lovelace"));
    expect(avatarColorSeed("Ada Lovelace")).not.toBe(avatarColorSeed("Grace Hopper"));
  });

  it("hashes the UTF-8 bytes, not the UTF-16 units", () => {
    expect(avatarColorSeed("é")).not.toBe(avatarColorSeed("e"));
    expect(avatarColorSeed("山")).toBe(avatarColorSeed("山"));
  });
});
