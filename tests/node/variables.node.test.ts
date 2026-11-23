import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { COMPONENT_FIELDS, kebab, themeEntries } from "@srctool/camouflage-core";
import { minimalThemes } from "@srctool/camouflage-skin-minimal";
import { describe, expect, it } from "vitest";

const root = new URL("../..", import.meta.url).pathname;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "node_modules" || name === "dist" ? [] : sources(path);
    return path.endsWith(".ts") && !path.endsWith(".d.ts") ? [path] : [];
  });
}

// Every `var(--camo-…)` the library writes by hand must be a variable the theme sets (or one a component or a container
// sets for what is inside it). A misspelt one is silently an unset variable: no error, and the style quietly falls back.
describe("the custom properties the source names", () => {
  const theme = new Set(themeEntries(minimalThemes.light).map(([name]) => name));
  const components = Object.keys(COMPONENT_FIELDS).map((c) => `--camo-${kebab(c)}-`);
  // Set by a container for its content, or local to one renderer.
  const local = new Set([
    "--camo-content-color",
    "--camo-icon-size",
    "--camo-veil",
    "--camo-icon-default-size",
  ]);

  it("all exist", () => {
    const unknown: string[] = [];
    for (const dir of ["core", "skin-minimal", "skin-cupertino"]) {
      for (const file of sources(join(root, "packages", dir, "src"))) {
        const text = readFileSync(file, "utf8");
        for (const [, name] of text.matchAll(/var\((--camo-[a-z0-9-]+)/g)) {
          const known =
            theme.has(name!) || local.has(name!) || components.some((c) => name!.startsWith(c));
          if (!known) unknown.push(`${file.replace(root, "")}: ${name}`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });
});
