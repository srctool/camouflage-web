# Camouflage for web

The third platform of [Camouflage](https://github.com/srctool/camouflage), next to
[Kotlin](https://github.com/srctool/camouflage-kotlin) and
[Flutter](https://github.com/srctool/camouflage-dart): the same components, themes and skins as **Web Components**,
written in TypeScript with [Lit](https://lit.dev), usable from any framework or plain HTML, from Tauri webviews, and
with **server rendering**.

> **Status: W5, feedback, data display and navigation.** Progress bar and circle, snackbar (through a messenger with a
> queue), banner, chip and chip group, badge, avatar, floating action button, tabs, and the navigation bar, rail and
> drawer join W4's containers and overlays (card, lists, accordion, skeleton, select, the overlay frame with dialog, bottom
> sheet, menu, tooltip and top bar), W3's inputs and W2's primitives and actions, on **W1's foundations**: the theme model,
> the provider and its environment, the skin contract and behavior layer, the scenario-driven test harness, and the
> contract, manifest and typings checks. More components follow in W6 to W9. The design notes are in the
> [contributor docs](https://camouflage-dev.srctool.com) (the "Web (planned)" sections); the findings are in
> [docs/spike-findings.md](docs/spike-findings.md) (W0), [docs/w1-findings.md](docs/w1-findings.md),
> [docs/w2-findings.md](docs/w2-findings.md), [docs/w3-findings.md](docs/w3-findings.md),
> [docs/w4-findings.md](docs/w4-findings.md) and [docs/w5-findings.md](docs/w5-findings.md).

## How it fits together

```html
<camo-provider skin="cupertino" scheme="dark">
  <camo-dialog open title="Delete item?" message="This can't be undone.">
    <camo-button slot="confirm" text="Delete" tone="error"></camo-button>
    <camo-button slot="dismiss" text="Cancel" appearance="ghost"></camo-button>
  </camo-dialog>
</camo-provider>
```

- A **component element** owns state, behavior and accessibility. It does not draw itself.
- A **skin** is a package of pure render functions (one per component), a surface treatment and interaction
  feedback. The same markup draws differently per skin: the dialog's actions sit side by side in Minimal and stack
  in Cupertino.
- The **theme** is CSS custom properties (`--camo-*`), so it cascades through shadow roots and is correct in the
  first byte of server-rendered HTML.

| Package                              | What it holds                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `@srctool/camouflage-core`           | theme, provider, skin contract, behavior layer and the components (no look)     |
| `@srctool/camouflage-skin-minimal`   | the Minimal skin; `/register` makes `skin="minimal"` work and sets the fallback |
| `@srctool/camouflage-skin-cupertino` | the Cupertino skin (Classic; Liquid Glass comes in W8)                          |

Importing a package's main entry never defines an element and never touches `window` or `document`. Define the
elements with `import "@srctool/camouflage-core/define"`, and register a skin with
`import "@srctool/camouflage-skin-minimal/register"`.

## Commands

You need Node 22 or later. pnpm comes from the `packageManager` field through Corepack:

```sh
corepack enable
pnpm install
pnpm exec playwright install chromium firefox webkit   # once
```

| Command                                   | What it does                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm check`                              | everything CI runs: build, typecheck, lint, generated files, layers, skins, side effects, tests |
| `pnpm themes` / `pnpm themes:check`       | write, or verify, the skins' starter themes (`tools/generate-starter-themes.ts`)                |
| `pnpm typings` / `pnpm typings:check`     | write, or verify, the tag and event maps and the React and Vue typings                          |
| `pnpm manifest`                           | write the Custom Elements Manifest into `packages/core`                                         |
| `pnpm skins`                              | every skin is complete (a renderer for every component) and has a `register` entry              |
| `pnpm build`                              | compiles every package to `dist/` (ESM and declarations)                                        |
| `pnpm typecheck`                          | type-checks the packages and the tests                                                          |
| `pnpm lint`                               | ESLint (Lit, TypeScript and the no-literals rule for renderers) and Prettier                    |
| `pnpm layers`                             | `core` depends on no skin, and a skin only on `core`                                            |
| `pnpm side-effects`                       | each main entry loads in plain Node with no side effects                                        |
| `pnpm test`                               | Node tests (renderers, server rendering) and browser tests in three engines                     |
| `CAMO_BROWSERS=chromium,webkit pnpm test` | limits the browser tests, for a machine where one engine cannot start                           |
| `pnpm size`                               | gzip and brotli size of what an app would ship; fails over budget                               |

## Documentation

- [docs/testing.md](docs/testing.md): the scenario list, the screenshot runner, the conformance checks, the size budget.
- [docs/contract.md](docs/contract.md): `camouflage-contract.json`, the manifest check and the generated typings.
- [docs/adding-a-component.md](docs/adding-a-component.md): the checklist for a new component.
- [docs/skins.md](docs/skins.md): how each skin renders what exists (dialect alignment).
- [docs/w2-findings.md](docs/w2-findings.md): what the primitives settled.
- [docs/w3-findings.md](docs/w3-findings.md): what the inputs settled (forms, validation, pickers, the gaps).
- [docs/w4-findings.md](docs/w4-findings.md): what the overlays and containers settled (the overlay frame, menus, lists, the gaps).
- [docs/w5-findings.md](docs/w5-findings.md): what feedback, data display and navigation settled (the messenger, chips, tabs, the navigation chrome, the gaps).
- [docs/browser-baseline.md](docs/browser-baseline.md), [docs/publishing.md](docs/publishing.md).

## Publishing

Packages are published to npm under the `@srctool` scope from GitHub Actions with provenance and no stored token
(npm trusted publishing). Until the web port reaches parity with Kotlin and Flutter `0.2.0`, versions are
`0.2.0-alpha.N`, never a number that claims parity. Tags are per package, like `core-v0.2.0-alpha.1`. See
[docs/publishing.md](docs/publishing.md).

## License

Apache-2.0.

## Storybook

`apps/storybook` is the catalog, built for the usage site under `/web/`. The toolbar switches skin (Minimal, Cupertino) and scheme (light, dark), so one story covers every mode.

```bash
pnpm storybook                # dev server on :6006
pnpm storybook:build          # static build in apps/storybook/dist
cd apps/storybook && pnpm preview   # serves the build under /web/ on :6007
cd apps/storybook && pnpm e2e       # renders every story per skin and scheme, and the scenario screenshots (docs/testing.md)
```

## Samples

- `apps/ssr-sample`: plain Node server rendering and hydration (`pnpm --filter @srctool/camouflage-ssr-sample start`, :4173).
- `apps/next-sample`: the same page in the Next.js App Router (`next build`, then `next start`, :4174).
- `apps/tauri-sample`: the feature probe and the spike scenario in the platform webview (see `docs/browser-baseline.md`).

## Publishing

Packages go to npm under `@srctool` from GitHub Actions with trusted publishing (OIDC, no stored token), on a tag `<package>-v<version>` such as `core-v0.2.0-alpha.1`. Until parity with Kotlin and Dart only `0.x.y-alpha.N` is accepted, and the workflow is a dry run until the release milestone. The tag rules, the one-time npm setup and how to rehearse are in [docs/publishing.md](docs/publishing.md).
