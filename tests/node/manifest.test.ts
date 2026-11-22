import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { checkManifest, unionAliases } from "../helpers/manifest.ts";
import type { ComponentContract } from "../helpers/manifest.ts";

type Manifest = Parameters<typeof checkManifest>[0];

// What the base notes (CamoButton, CamoDialog) name, with the web conventions applied (components note, sections 3.1 to 3.3).
const CONTRACTS: ComponentContract[] = [
  {
    tag: "camo-button",
    className: "CamoButton",
    attributes: {
      text: null,
      appearance: ["solid", "soft", "raised", "outline", "ghost", "link"],
      tone: ["default", "error", "success", "warning", "info"],
      disabled: null,
      loading: null,
    },
    slots: ["prefix-icon", "suffix-icon"],
    events: [],
    forbidden: ["enabled"],
  },
  {
    tag: "camo-dialog",
    className: "CamoDialog",
    attributes: { title: null, message: null, open: null },
    slots: ["", "confirm", "dismiss"],
    events: ["camo-close"],
  },
];

let manifest: Manifest;
let aliases: Map<string, string[]>;

beforeAll(() => {
  // Generated fresh, so a stale file never passes.
  // The analyzer joins `--outdir` to the working directory, so it is relative, under the ignored node_modules.
  const outdir = "node_modules/.cache/camo-manifest";
  rmSync(outdir, { recursive: true, force: true });
  execFileSync(
    process.execPath,
    [
      "node_modules/@custom-elements-manifest/analyzer/cem.js",
      "analyze",
      "--config",
      "custom-elements-manifest.config.mjs",
      "--outdir",
      outdir,
    ],
    { stdio: "pipe" },
  );
  manifest = JSON.parse(readFileSync(join(outdir, "custom-elements.json"), "utf8")) as Manifest;
  aliases = unionAliases(readFileSync("packages/core/src/skin/types.ts", "utf8"));
}, 60_000);

describe("the manifest against the contract", () => {
  it("matches for camo-button and camo-dialog", () => {
    expect(checkManifest(manifest, CONTRACTS, aliases)).toEqual([]);
  });

  it("fails when a slot, an enum value, an event or a component is missing", () => {
    const broken = structuredClone(manifest);
    const declarations = broken.modules.flatMap((m) => m.declarations ?? []);
    const button = declarations.find((d) => d.tagName === "camo-button")!;
    button.slots = button.slots!.filter((s) => s.name !== "suffix-icon");
    declarations.find((d) => d.tagName === "camo-dialog")!.events = [];
    const problems = checkManifest(broken, CONTRACTS, new Map([["Tone", ["default"]]]));
    expect(problems).toContain('camo-button: slot "suffix-icon" is missing');
    expect(problems).toContain('camo-dialog: event "camo-close" is missing');
    expect(problems).toContain('camo-button: attribute "tone" does not accept "error"');
    expect(checkManifest(broken, [{ ...CONTRACTS[0]!, tag: "camo-nothing" }], aliases)).toEqual([
      "camo-nothing: missing from the manifest",
    ]);
  });
});
