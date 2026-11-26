// Writes the Custom Elements Manifest into each package that ships elements, so it is published beside the code
// (`customElements` in its package.json points at it, and editors and docs tools find it from there).
import { writeFileSync } from "node:fs";
import { PACKAGES, generateManifest, manifestFor } from "./manifest.ts";

const manifest = generateManifest();
for (const name of PACKAGES) {
  const path = new URL(`../packages/${name}/custom-elements.json`, import.meta.url);
  writeFileSync(path, `${JSON.stringify(manifestFor(manifest, name), null, 2)}\n`);
  console.warn(`wrote packages/${name}/custom-elements.json`);
}
