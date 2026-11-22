# W2 findings

What building the primitives and actions (text, icon, surface, divider, button, icon button) settled, and what it did not.

## Decisions

- **`variant`, not `style`.** The contract's `CamoText(style = ...)` is the attribute `variant`, because `style` is the
  global HTML attribute for inline CSS. The contract file lists it as `variant`; the Kotlin and Dart parameter keeps its name.
- **Rich text is markup.** Kotlin's `CamoSpan` list becomes slotted `<strong>`, `<em>` and `<a href>`, which the skin styles
  (`::slotted(a)`). Each link is a real link: focusable, announced, in tab order. No span model is invented.
- **Icons are registered or inline.** `registerIcons({ name: pathData | { svg, viewBox, autoMirror, original } })`, or an
  `<svg>` child. A registered icon is trusted markup (the app ships it), drawn through `unsafeSVG`, so it also renders on the
  server. A name that is not registered draws an empty box of the right size and no error, as the base note says.
- **No label means decorative.** `camo-icon` with no `label` is `aria-hidden`; with one it is `role="img"`.
- **A toggle icon button is `toggle` plus `checked`.** The contract's non-null `checked` (a tri-state) is two booleans on the
  web, because an HTML boolean cannot be null. `aria-pressed` is set only when `toggle` is.
- **The tooltip is a stand-in.** `tooltip` shows on hover and keyboard focus, drawn by the skin and hidden from assistive
  technology (the label already names the button). It is clipped by an ancestor with `overflow: hidden`; the real
  `camo-tooltip` (W5) replaces it with an overlay.
- **Shared drawing, per-skin numbers.** `textBase`, `iconBase`, `surfaceBase`, `dividerBase` and `iconButtonBase` live in core
  (`skin/primitives.ts`); a skin writes `defaults(theme)` and spreads the base. A skin that draws differently replaces
  `render` and `styles` and keeps the contract. The no-literals rule still holds, because the literals are in `defaults`.
- **Surface sets the content color.** Its subtree reads `--camo-content-color: onSurface`, so text and icons are readable
  on any level; a nested surface wins.

## Findings

- **An empty attribute broke the button.** A framework that binds `appearance=""` for "none" gave `style[""]`, and the button
  threw while rendering. Button and icon button now treat an empty appearance as absent. Found by the Storybook story run, not
  by a unit test, so a test now covers it.
- **Vitest re-optimizes a dependency it first sees mid-run** and reloads the page, so a browser test file failed to start.
  `lit/directives/unsafe-svg.js` is declared in `optimizeDeps` (`vitest.config.ts`); a new Lit directive needs the same.
- **The manifest check's union reader** did not read a type written with a leading `|`, which Prettier produces for a long
  union (the 15 text roles). It does now.
- **Gaps:** the icon theme's `size` and `color` cannot be variables (the root icon style is the provider's reset), and the icon
  button's `defaultAppearance` is skin-chosen, as the button's is. All are listed in the contract and tested as gaps.

## Sizes

gzip, from `pnpm size`: core 12 760 (budget 13 500), core + Minimal 18 941 (19 500), core + Minimal + Cupertino 20 322
(21 000), Minimal alone 11 498 (12 000). Five components and two skins' renderers for them.

## Not done

- Firefox for the new tests (CI only), and the Linux screenshot baselines of the new scenarios (recorded from the CI artifact
  after merge, as for W1).
- `camo-fab`, button group and split button: W2's milestone lists button and icon button only, so the rest of the actions
  category stays in W5/W6.
