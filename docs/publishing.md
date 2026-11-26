# Publishing to npm

Packages are published under the `@srctool` scope from GitHub Actions with **npm trusted publishing** (OIDC) and provenance. No npm token is stored in the repository, the organization or the workflow.

## Packages and tags

| Package                              | Folder                    | Tag                         |
| ------------------------------------ | ------------------------- | --------------------------- |
| `@srctool/camouflage-core`           | `packages/core`           | `core-v<version>`           |
| `@srctool/camouflage-skin-minimal`   | `packages/skin-minimal`   | `skin-minimal-v<version>`   |
| `@srctool/camouflage-skin-cupertino` | `packages/skin-cupertino` | `skin-cupertino-v<version>` |
| `@srctool/camouflage-charts`         | `packages/charts`         | `charts-v<version>`         |

A tag is `<folder>-v<version>`, like `camouflage_core-v0.1.0` on pub.dev. `tools/release-check.mjs` resolves the folder from the tag and fails the release when:

- the version in the tag differs from `package.json` in that folder;
- the folder is not a package or is private;
- the version claims parity with Kotlin and Dart while the web port has not reached it. **Until parity only `0.x.y-alpha.N` is accepted** (published with the `alpha` dist-tag). When parity is reached, set `"camouflage": { "parity": true }` in the root `package.json`; plain `0.2.0` then goes to `latest`.

Publish `core` before the skins and the charts: each depends on that exact core version, which `pnpm pack` writes in place of `workspace:*`.

## One-time setup (the organization owner, on npmjs.com)

Trusted publishing is configured per package, and a package must exist before its page has the setting. For each of the four packages:

1. Publish a first placeholder version by hand to create the package (for example `0.0.0-reserved`, with a README that says the name is reserved), from a machine logged in as an owner of the `@srctool` scope: `npm publish --access public --tag reserved`. This reserves the name; it is the only publish that uses your own login.
2. Open the package, **Settings**, **Trusted Publisher**, choose **GitHub Actions** and enter:
   - organization or user: `srctool`
   - repository: `camouflage-web`
   - workflow filename: `release.yml`
   - environment: `npm`
3. In the GitHub repository, create the environment `npm` (Settings, Environments). Add required reviewers if a human should approve each release, as the Kotlin and pub.dev workflows do.
4. Optional, after the first trusted publish works: in each package's **Publishing access**, choose "Require two-factor authentication and disallow tokens", so a token can no longer publish.

## The workflow

`.github/workflows/release.yml` runs on a pushed tag, or by hand (**Actions**, **Release (npm)**, **Run workflow**, with a tag name) to rehearse. It resolves the package, runs the build, typecheck, layer, side-effect and node tests, packs with pnpm, lists the tarball, and runs `npm publish <tarball> --provenance --tag <dist-tag>`.

**It is a dry run until the release milestone (W10):** the workflow's `DRY_RUN` is `"true"`, and a manual run is always a dry run. Change `DRY_RUN` to `"false"` in the release pull request.

The rehearsal needs the `npm` environment (and its approval, if set), but not a trusted publisher: `npm publish --dry-run` does not authenticate. To prove the OIDC path end to end, publish the first real alpha once trusted publishing is configured.

## Checking locally

```bash
pnpm build
cd packages/core && pnpm pack --pack-destination /tmp/packs
npm publish /tmp/packs/srctool-camouflage-core-0.2.0-alpha.0.tgz --dry-run --access public --tag alpha
node tools/release-check.mjs core-v0.2.0-alpha.0
```
