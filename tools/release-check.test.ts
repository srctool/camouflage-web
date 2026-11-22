import { describe, expect, it } from "vitest";
import { resolveRelease } from "./release-check.mjs";

const files: Record<string, unknown> = {
  "./packages/core/package.json": { name: "@srctool/camouflage-core", version: "0.2.0-alpha.1" },
  "./packages/skin-minimal/package.json": {
    name: "@srctool/camouflage-skin-minimal",
    version: "0.2.0-alpha.1",
  },
  "./packages/secret/package.json": { name: "x", version: "0.2.0-alpha.1", private: true },
  "./package.json": {},
};
const read = (path: string): string => {
  if (!(path in files)) throw new Error("ENOENT");
  return JSON.stringify(files[path]);
};

describe("resolveRelease", () => {
  it("resolves a package from its tag, including a hyphenated folder", () => {
    expect(resolveRelease("core-v0.2.0-alpha.1", { read })).toMatchObject({
      ok: true,
      dir: "packages/core",
      distTag: "alpha",
    });
    expect(resolveRelease("skin-minimal-v0.2.0-alpha.1", { read })).toMatchObject({
      ok: true,
      name: "@srctool/camouflage-skin-minimal",
    });
  });
  it("rejects a tag that does not match the package's version", () => {
    const result = resolveRelease("core-v0.2.0-alpha.2", { read });
    expect(result).toMatchObject({ ok: false });
  });
  it("rejects unknown packages, private packages and malformed tags", () => {
    expect(resolveRelease("nothing-v0.2.0-alpha.1", { read })).toMatchObject({ ok: false });
    expect(resolveRelease("secret-v0.2.0-alpha.1", { read })).toMatchObject({ ok: false });
    expect(resolveRelease("v0.2.0", { read })).toMatchObject({ ok: false });
  });
  it("accepts only 0.x.y-alpha.N before parity", () => {
    files["./packages/core/package.json"] = { name: "@srctool/camouflage-core", version: "0.2.0" };
    const result = resolveRelease("core-v0.2.0", { read });
    expect(result).toMatchObject({ ok: false });
    expect(resolveRelease("core-v0.2.0", { read, parity: true })).toMatchObject({
      ok: true,
      distTag: "latest",
    });
    files["./packages/core/package.json"] = {
      name: "@srctool/camouflage-core",
      version: "0.2.0-beta.1",
    };
    expect(resolveRelease("core-v0.2.0-beta.1", { read })).toMatchObject({ ok: false });
  });
});
