import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { expectation } from "../../tools/contract.ts";
import type { Contract } from "../../tools/contract.ts";
import { checkManifest, unionAliases } from "../helpers/manifest.ts";
import type { ComponentContract } from "../helpers/manifest.ts";

type Manifest = Parameters<typeof checkManifest>[0];

// What the base notes name, from `contract/camouflage-contract.json`, with the web conventions applied (Components note,
// sections 3.1 to 3.4): attributes in kebab-case, enum values lowercase, an inverted boolean, slots, custom events.
const contract = JSON.parse(readFileSync("contract/camouflage-contract.json", "utf8")) as Contract;
const CONTRACTS: ComponentContract[] = contract.components.map(expectation);

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
  aliases = unionAliases(
    ["skin", "theme"]
      .map((dir) => readFileSync(`packages/core/src/${dir}/types.ts`, "utf8"))
      .join("\n"),
  );
}, 60_000);

describe("the manifest against the contract", () => {
  it("matches for every component in the contract", () => {
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
