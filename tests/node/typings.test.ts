import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { elementsOf, generateManifest } from "../../tools/manifest.ts";

const root = new URL("../..", import.meta.url).pathname;
const read = (path: string): string => readFileSync(`${root}${path}`, "utf8");

describe("the generated typings", () => {
  const elements = elementsOf(generateManifest("node_modules/.cache/camo-manifest-typings"));

  it("name every element of the manifest in the tag map, and no other", () => {
    const map = read("packages/core/src/elements.ts");
    for (const el of elements) expect(map).toContain(`"${el.tagName}": ${el.name};`);
    expect([...map.matchAll(/^\s{4}"(camo-[\w-]+)": \w+;/gm)].map((m) => m[1]).sort()).toEqual(
      elements.map((e) => e.tagName).sort(),
    );
  });

  it("type each event from the manifest's @fires, and each attribute in kebab-case", () => {
    expect(read("packages/core/src/elements.ts")).toContain(
      '"camo-close": CustomEvent<CamoCloseDetail>;',
    );
    const react = read("packages/core/typings/react.d.ts");
    expect(react).toContain('"window-size"?: WindowSize | null;');
    expect(react).toContain("appearance?: Appearance | null;");
    // State and reflected output are not inputs.
    expect(react).not.toMatch(/measured|data-camo-scheme/);
    expect(read("packages/core/typings/vue.d.ts")).toContain("onCamoClose?:");
  });

  it("compile for a DOM, a React and a Vue consumer, and reject a wrong value", () => {
    let output = "";
    try {
      execFileSync(
        process.execPath,
        ["node_modules/typescript/bin/tsc", "-p", "tests/fixtures/consumers", "--noEmit"],
        { cwd: root, encoding: "utf8", stdio: "pipe" },
      );
    } catch (error) {
      output = String((error as { stdout?: string }).stdout ?? error);
    }
    // Every `@ts-expect-error` held (a wrong value is an error) and nothing else failed.
    expect(output).toBe("");
  }, 90_000);
});
