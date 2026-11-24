// Importing a package's main entry in plain Node must have no side effects and must not touch `window` or
// `document` (Project Setup, section 3.2). Each entry is imported in a fresh process, and the globals before and
// after are compared. The `define` and `register` entries are allowed to register things, but must still load in Node.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const packagesDir = join(root, "packages");
// Globals that Lit itself adds when it loads in Node: its version records in development builds, and (from its `node`
// export condition) a `customElements` shim and a server root. They are Lit's, not ours; what must hold is that none of
// our elements is defined (checked below) and that `window` and `document` stay undefined.
const ALLOWED = new Set([
  "litIssuedWarnings",
  "litHtmlVersions",
  "litElementVersions",
  "reactiveElementVersions",
  "litPropertyMetadata",
  "litServerRoot",
  "customElements",
]);
const errors = [];

const probe = (specifier) => `
  const before = new Set(Object.getOwnPropertyNames(globalThis));
  const guard = { window: globalThis.window, document: globalThis.document };
  await import(${JSON.stringify(specifier)});
  const added = Object.getOwnPropertyNames(globalThis).filter((k) => !before.has(k));
  const out = { added, window: typeof globalThis.window, document: typeof globalThis.document,
    elements: typeof customElements === "undefined" ? [] : ["camo-provider", "camo-button", "camo-dialog", "camo-text", "camo-icon", "camo-surface", "camo-divider", "camo-icon-button", "camo-text-field", "camo-search-field", "camo-checkbox", "camo-switch", "camo-radio", "camo-radio-group", "camo-segmented-control", "camo-segment", "camo-slider", "camo-stepper", "camo-calendar", "camo-date-picker", "camo-time-picker", "camo-form", "camo-field-action", "camo-card", "camo-list-item", "camo-list-section", "camo-accordion", "camo-accordion-group", "camo-skeleton", "camo-paged-list", "camo-bottom-sheet", "camo-menu", "camo-menu-item", "camo-tooltip", "camo-top-bar", "camo-select", "camo-option"].filter((t) => customElements.get(t)) };
  console.log(JSON.stringify(out));
`;

for (const dir of readdirSync(packagesDir)) {
  const manifest = JSON.parse(readFileSync(join(packagesDir, dir, "package.json"), "utf8"));
  for (const [key, value] of Object.entries(manifest.exports ?? {})) {
    // An entry marked `camouflage.bundlerOnly` is for build tools: a dependency of it ships ESM that Node cannot load.
    if (manifest.camouflage?.bundlerOnly?.includes(key)) continue;
    // An entry with no `default` is typings only (`./react`, `./vue`): there is nothing to import.
    if (typeof value === "object" && value !== null && value.default === undefined) continue;
    const specifier = key === "." ? manifest.name : `${manifest.name}/${key.slice(2)}`;
    const effectful = key !== ".";
    let out;
    try {
      out = JSON.parse(
        execFileSync(process.execPath, ["--input-type=module", "-e", probe(specifier)], {
          cwd: join(root, "apps", "ssr-sample"),
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        })
          .trim()
          .split("\n")
          .pop(),
      );
    } catch (error) {
      errors.push(
        `${specifier} failed to load in Node: ${String(error.stderr ?? error.message).split("\n")[0]}`,
      );
      continue;
    }
    if (out.window !== "undefined" || out.document !== "undefined")
      errors.push(`${specifier} defines window or document`);
    const added = out.added.filter((name) => !ALLOWED.has(name));
    if (!effectful && (added.length > 0 || out.elements.length > 0)) {
      errors.push(
        `${specifier} (a main entry) has side effects: new globals [${added.join(", ")}], elements [${out.elements.join(", ")}]`,
      );
    }
    void value;
  }
}

if (errors.length > 0) {
  console.error(`Side-effect check failed:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log(
  "Side-effect check passed: every main entry is safe to import in Node; define and register entries load without a DOM.",
);
