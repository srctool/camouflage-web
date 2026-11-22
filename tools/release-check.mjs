// Resolves a release tag to a package and checks the tag against the package's version and the version rules.
// Tag: `<package>-v<version>`, for example `core-v0.2.0-alpha.1` or `skin-minimal-v0.2.0-alpha.1`, where <package> is a
// folder under packages/. Run by the release workflow, and importable for tests.
import { readFileSync } from "node:fs";

const TAG = /^([a-z][a-z0-9-]*)-v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;
const ALPHA = /^0\.\d+\.\d+-alpha\.\d+$/;

/**
 * @param {string} tag
 * @param {{ read?: (path: string) => string, root?: string, parity?: boolean }} [options]
 * @returns {{ ok: true, dir: string, name: string, version: string, distTag: string } | { ok: false, error: string }}
 */
export function resolveRelease(tag, options = {}) {
  const read = options.read ?? ((path) => readFileSync(path, "utf8"));
  const root = options.root ?? ".";
  const match = TAG.exec(tag);
  if (match === null) return { ok: false, error: `"${tag}" is not <package>-v<version>` };
  const [, folder, version] = match;
  const dir = `${root}/packages/${folder}`;
  let manifest;
  try {
    manifest = JSON.parse(read(`${dir}/package.json`));
  } catch {
    return { ok: false, error: `no package at packages/${folder} for tag ${tag}` };
  }
  if (manifest.private === true) return { ok: false, error: `packages/${folder} is private` };
  if (manifest.version !== version) {
    return {
      ok: false,
      error: `packages/${folder}/package.json has version ${manifest.version}, but the tag says ${version}`,
    };
  }
  let parity = options.parity;
  if (parity === undefined) {
    try {
      parity = JSON.parse(read(`${root}/package.json`)).camouflage?.parity === true;
    } catch {
      parity = false;
    }
  }
  // Before parity with Kotlin and Dart, a version never claims it: only 0.x.y-alpha.N is accepted.
  if (!parity && !ALPHA.test(version)) {
    return {
      ok: false,
      error: `${version} claims parity with Kotlin and Dart; before parity only 0.x.y-alpha.N is published`,
    };
  }
  return {
    ok: true,
    dir: `packages/${folder}`,
    name: manifest.name,
    version,
    distTag: version.includes("-") ? "alpha" : "latest",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME ?? "";
  const result = resolveRelease(tag);
  if (!result.ok) {
    console.error(`::error::${result.error}`);
    process.exit(1);
  }
  console.warn(`${result.name}@${result.version} from ${result.dir} (dist-tag ${result.distTag})`);
  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `dir=${result.dir}\nname=${result.name}\nversion=${result.version}\ndist_tag=${result.distTag}\n`,
    );
  }
}
