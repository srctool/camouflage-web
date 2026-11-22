// The layer check (the equivalent of `checkModuleLayers` in the other libraries):
//   - `core` depends on no skin;
//   - a skin depends only on `core` (never on another skin);
//   - `charts` depends on `core` only (a later package).
// It reads each package's dependencies and scans its sources for imports of a package it must not use.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SCOPE = "@srctool/camouflage-";
const root = new URL("..", import.meta.url).pathname;
const packagesDir = join(root, "packages");
const errors = [];

function* sources(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* sources(path);
    else if (/\.(ts|js|mjs)$/.test(name)) yield path;
  }
}

const names = readdirSync(packagesDir);
for (const dir of names) {
  const manifest = JSON.parse(readFileSync(join(packagesDir, dir, "package.json"), "utf8"));
  const isSkin = dir.startsWith("skin-");
  const forbidden = (target) => {
    const short = target.slice(SCOPE.length);
    if (dir === "core") return true; // core depends on nothing of ours
    if (isSkin) return short !== "core"; // a skin: core only
    return short !== "core"; // charts and the rest: core only
  };
  const deps = {
    ...manifest.dependencies,
    ...manifest.peerDependencies,
    ...manifest.optionalDependencies,
  };
  for (const dependency of Object.keys(deps)) {
    if (dependency.startsWith(SCOPE) && forbidden(dependency)) {
      errors.push(`${manifest.name} must not depend on ${dependency} (package.json)`);
    }
  }
  const src = join(packagesDir, dir, "src");
  for (const file of sources(src)) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(
      /from\s+["'](@srctool\/camouflage-[a-z-]+)(?:\/[^"']*)?["']/g,
    )) {
      if (forbidden(match[1])) errors.push(`${file.replace(root, "")} imports ${match[1]}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Layer check failed:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log(
  `Layer check passed: core depends on no skin, and each skin only on core (${names.join(", ")}).`,
);
