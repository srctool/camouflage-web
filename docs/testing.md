# Testing

One scenario list drives the screenshots, the accessibility checks and the conformance checks, so a new component joins
the harness with **one entry** and no test code. The list uses a format that Kotlin and Dart can read too, so the three
libraries' screenshots can be compared name by name.

## The scenario list

`scenarios/scenarios.json` (format: `scenarios/schema.json`, expansion: `scenarios/expand.ts`).

```json
{
  "name": "button-solid-error",
  "component": "button",
  "props": { "text": "Delete", "appearance": "solid", "tone": "error" },
  "content": { "prefix-icon": "<span>*</span>" },
  "textScales": [1],
  "directions": ["ltr"]
}
```

- `component` is the name without prefix; on the web the element is `camo-<component>`. `props` are attributes (`true` is
  a present boolean, `false` is absent). `content` fills slots by name (`""` is the default slot).
- A scenario expands over **skin × mode × text scale × direction**. A file-level `defaults` object sets the axes
  (`minimal` and `cupertino`, light and dark, 1× and 2×, LTR and RTL); a scenario narrows any of them.
- Each capture has a stable id: `<scenario>_<skin>_<mode>_fs<scale>_<direction>`, for example
  `button-solid-error_cupertino_dark_fs1_ltr`. Kotlin names its files the same way (`button_primary-error_material_dark_fs2_rtl`).
- **Text scale** is the user's font-size setting: every type size is `rem`, so the harness sets the page's root font size to
  `scale × 100%`, as a user would.

**Shared with Kotlin and Dart.** The format is language-neutral (names are the contract's, `props` use contract names,
slots use contract slot names). It lives here for now because this is the only suite that reads it. Moving the file to
the umbrella repository, and having Roborazzi and Alchemist read it, needs the other two suites to agree; that is the
open step of srctool/camouflage-web#12.

## The screenshot runner

`apps/storybook/e2e/scenarios.spec.ts` opens the **harness story** (`harness-scenario--scenario`) once per variant, in
Chromium, Firefox and WebKit, and compares the capture with its baseline within 0.5% of the pixels (the Kotlin rule).

```bash
pnpm build && pnpm storybook:build
pnpm --filter @srctool/camouflage-storybook e2e              # CAMO_BROWSERS=chromium,webkit limits a local run
```

- A **missing baseline is recorded**, not failed, so a new scenario needs only its entry. Baselines are named
  `e2e/screenshots/<id>-<browser>-<platform>.png`; only the **Linux** ones (CI's) are committed, because fonts differ per
  system. Run on another system, the runner writes its own files, which are git-ignored.
- CI uploads the recorded screenshots as the `screenshots` artifact. To add or update baselines: download it, review the
  images, and commit the `-linux.png` files.
- **Test modes** (`reduced-motion`, `reduced-transparency`, `blur-off`) make the environment report that value, so a
  skin's fallback is exercised in any browser. They run for one scenario per skin; add `testMode` to the request in the spec
  to run more.

## Conformance

`tests/browser/conformance.test.ts` renders **every variant** of the list and checks, with no per-component code:

| Check         | How                                                                                                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| it paints     | the element has a shadow root with content                                                                                                                                                                                             |
| accessibility | axe finds no violation. Cupertino keeps Apple's published colors, several below WCAG AA contrast, so the contrast rule is off for it (the Dart skin documents the same list); a `[disabled]` host is exempt from contrast (WCAG 1.4.3) |
| touch area    | a button keeps a 48 px area on both axes, whatever its look                                                                                                                                                                            |

`tests/node/conformance.node.test.ts` checks the renderers themselves, on the server's side of the line:

| Check                                                                                         | Helper                 |
| --------------------------------------------------------------------------------------------- | ---------------------- |
| **pure**: no `window` or `document`, the same output twice, the same page on the server twice | `assertPure`           |
| **tokens only**: no color, size or duration literal outside `var(...)`                        | `findLiteral`          |
| **logical properties**: no `left` or `right` in a style                                       | `findPhysicalProperty` |

The helpers are in `tests/helpers/conformance.ts` and `conformance-browser.ts`.

## Size budget

`pnpm size` bundles and minifies each entry (core, core + Minimal, core + both skins, Minimal alone) and fails when the gzip
size is over its budget (`tools/size-budget.mjs`). A budget is about 10% above the size when it was set. A milestone that
adds components raises it in its own pull request, with the new size in the description.

## The rest of the suite

| Where           | What                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/node`    | theme, seed colors against Dart, validation against `validate()`, scenarios, contract, manifest, typings, server rendering, skin contract, conformance                  |
| `tests/browser` | the provider and its environment, behavior (press, focus, roving tabindex, `ElementInternals`), the components, hydration, conformance, in Chromium, Firefox and WebKit |
| `apps/*/e2e`    | Storybook under `/web/`, the screenshot runner, the SSR sample, the Next.js sample                                                                                      |

`CAMO_BROWSERS=chromium,webkit pnpm test` limits the browsers locally (Firefox cannot start in some sandboxes).
