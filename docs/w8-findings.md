# W8 findings: the skins

## How the skins were built

Material, Fluent and Carbon each provide all renderers on core's public API: most are a shared base with the skin's own
`defaults(theme)`, plus a little dialect CSS on the base's parts. Button and dialog are the skin's own, as in Minimal.

## Core changes the skins needed

- The press controller leaves the pointer's position in `--camo-press-x` and `--camo-press-y` (Material's ripple).
- The provider writes the measured capabilities and input as custom properties, after hydration only.
- `runtimeShaders` is now true only on Chromium (`userAgentData`, so a secure context): other engines parse
  `backdrop-filter: url()` and draw nothing. `backdropBlur` also accepts the `-webkit-` form.
- `EnvironmentSources` has a new `chromium()` source.

## Bugs found by the new skins

- A navigation item with a `line` or `dot` indicator sized the icon's box from the indicator's height, so the icon and
  the label overlapped.
- A bottom sheet with a close button stacked it under the title.
- A tooltip removed while it rendered threw from `showPopover`.
- Below 600 px a snackbar aligned to a side now centers.

## Differences from the notes and from Kotlin and Dart

- Theme factories are a separate `/factory` entry: they use the color library, which plain Node cannot load.
- `cupertinoSkin` itself changed: its bars, sheets and menus now blur what is behind (the Classic material).
- Material's time picker is the number fields: core has no dial.
- Material's switch has no thumb icons.
- Fluent's slider has no value bubble or stop marks, and its dialog no close button (`DialogStyle` has no such field).
- Fluent's date picker is not drawn in Acrylic on its own; it follows the surface's elevation rule.
- Carbon: a tile steps one layer inside a tile, not further; the selected tree row has no start bar; no batch actions
  bar; the toggle has no On/Off text.
- Liquid Glass bends the whole backdrop with a noise field, not only the rim.
- Smoothness of Liquid Glass on a mid-range device was not measured.
- Mica is untested against a real window material: the web reports none.
- The densities follow the input only after the client has measured; the server draws the touch sizes.

## Not done here

Publishing the `0.2.0-alpha.N` previews is a release step (`docs/publishing.md`); the three new package names need their
one-time npm setup first.
