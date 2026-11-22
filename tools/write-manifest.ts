// Writes the Custom Elements Manifest into the package that ships the elements, so it is published beside the code
// (`customElements` in its package.json points at it, and editors and docs tools find it from there).
import { writeFileSync } from "node:fs";
import { generateManifest } from "./manifest.ts";

const path = new URL("../packages/core/custom-elements.json", import.meta.url);
writeFileSync(path, `${JSON.stringify(generateManifest(), null, 2)}\n`);
console.warn("wrote packages/core/custom-elements.json");
