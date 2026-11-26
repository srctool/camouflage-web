// Generates the Custom Elements Manifest of the elements package, fresh, with the analyzer. The manifest check, the
// typings generator and `pnpm manifest` all start from this.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

export interface ManifestDeclaration {
  kind: string;
  name: string;
  tagName?: string;
  description?: string;
  attributes?: { name: string; type?: { text: string }; description?: string }[];
  slots?: { name: string; description?: string }[];
  events?: { name: string; type?: { text: string }; description?: string }[];
}

export interface Manifest {
  schemaVersion?: string;
  modules: { path?: string; declarations?: ManifestDeclaration[] }[];
}

const root = new URL("..", import.meta.url).pathname;

/** Runs the analyzer over the repository and returns the manifest it wrote. */
export function generateManifest(outdir = "node_modules/.cache/camo-manifest"): Manifest {
  // The analyzer joins `--outdir` to the working directory, so it must be relative.
  rmSync(join(root, outdir), { recursive: true, force: true });
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
    { cwd: root, stdio: "pipe" },
  );
  return JSON.parse(readFileSync(join(root, outdir, "custom-elements.json"), "utf8")) as Manifest;
}

/** The packages that ship elements. */
export const PACKAGES = ["core", "charts"] as const;
export type PackageName = (typeof PACKAGES)[number];

/** The part of a manifest that one package ships. */
export function manifestFor(manifest: Manifest, name: PackageName): Manifest {
  return {
    ...manifest,
    modules: manifest.modules.filter((m) => m.path?.startsWith(`packages/${name}/`) === true),
  };
}

/** The custom elements (declarations with a tag name) of a manifest, in tag order. */
export function elementsOf(manifest: Manifest): ManifestDeclaration[] {
  return manifest.modules
    .flatMap((m) => m.declarations ?? [])
    .filter((d) => d.tagName !== undefined)
    .sort((a, b) => a.tagName!.localeCompare(b.tagName!));
}
