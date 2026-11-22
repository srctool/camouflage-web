// A published skin must satisfy `CamoSkin`: a renderer for every component, a surface treatment and feedback, and a
// `register` entry (Skin Contract, section 3.4). `tsc` already fails a skin that is written with `satisfies CamoSkin`;
// this check is the second net, for what the compiler never saw, and it names every missing renderer. Run after a build.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { missingRenderers } from "../packages/core/dist/index.js";

const root = new URL("..", import.meta.url).pathname;
const packagesDir = join(root, "packages");
const errors = [];
let checked = 0;

for (const dir of readdirSync(packagesDir).filter((d) => d.startsWith("skin-"))) {
  const manifest = JSON.parse(readFileSync(join(packagesDir, dir, "package.json"), "utf8"));
  if (manifest.exports?.["./register"] === undefined)
    errors.push(`${manifest.name} has no "./register" entry.`);
  const entry = await import(join(packagesDir, dir, "dist", "index.js"));
  const skins = Object.entries(entry).filter(
    ([name, value]) => name.endsWith("Skin") && value !== null && typeof value === "object",
  );
  if (skins.length === 0) errors.push(`${manifest.name} exports no skin (a "<name>Skin" object).`);
  for (const [name, skin] of skins) {
    checked++;
    const missing = missingRenderers(skin);
    for (const part of ["surfaceTreatment", "feedback"])
      if (skin[part] === undefined) missing.push(part);
    if (missing.length > 0)
      errors.push(`${manifest.name} ${name} is missing ${missing.join(", ")}.`);
  }
}

if (errors.length > 0) {
  console.error(`Skin check failed:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log(`Skin check passed: ${checked} skins are complete and have a register entry.`);
