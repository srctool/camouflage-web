// A size check of what an app would ship, per entry, bundled and minified with Rolldown, with gzip and brotli sizes.
// The budgets are gzip bytes, about 10% above the size at the time they were set, and a build over budget fails. A
// milestone that adds components raises them in its own pull request, with the new size in the description.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { rolldown } from "rolldown";

const root = new URL("..", import.meta.url).pathname;
const BUDGETS = {
  "core (define)": 13_500,
  "core + minimal": 19_500,
  "core + minimal + cupertino": 21_000,
  "minimal skin only": 12_000,
};
const entries = {
  "core (define)": `import "@srctool/camouflage-core/define";`,
  "core + minimal": `import "@srctool/camouflage-core/define"; import "@srctool/camouflage-skin-minimal/register";`,
  "core + minimal + cupertino": `import "@srctool/camouflage-core/define"; import "@srctool/camouflage-skin-minimal/register"; import "@srctool/camouflage-skin-cupertino/register";`,
  "minimal skin only": `import { minimalSkin } from "@srctool/camouflage-skin-minimal"; console.log(minimalSkin.name);`,
};

// Inside the repository, so bare imports resolve to the linked workspace packages.
const dir = join(root, "node_modules", ".cache", "camo-size");
mkdirSync(dir, { recursive: true });
const rows = [];
for (const [name, code] of Object.entries(entries)) {
  const file = join(dir, `${name.replace(/\W+/g, "-")}.mjs`);
  writeFileSync(file, code);
  const bundle = await rolldown({
    input: file,
    cwd: root,
    resolve: { conditionNames: ["import", "default"] },
    logLevel: "silent",
  });
  const { output } = await bundle.generate({ format: "esm", minify: true });
  await bundle.close();
  const text = output.map((chunk) => ("code" in chunk ? chunk.code : "")).join("");
  const bytes = Buffer.byteLength(text);
  rows.push({
    name,
    bytes,
    gzip: gzipSync(text).length,
    brotli: brotliCompressSync(text).length,
    budget: BUDGETS[name],
  });
}

const pad = (value, width) => String(value).padStart(width);
console.log(
  "entry".padEnd(30),
  pad("min", 9),
  pad("gzip", 9),
  pad("brotli", 9),
  pad("budget(gz)", 11),
);
for (const r of rows) {
  const flag = r.gzip > r.budget ? "  OVER BUDGET" : "";
  console.log(
    r.name.padEnd(30),
    pad(r.bytes, 9),
    pad(r.gzip, 9),
    pad(r.brotli, 9),
    pad(r.budget, 11) + flag,
  );
}
const over = rows.filter((r) => r.gzip > r.budget);
if (over.length > 0) {
  console.error(`\nSize check failed: ${over.map((r) => r.name).join(", ")} over budget.`);
  process.exit(1);
}
