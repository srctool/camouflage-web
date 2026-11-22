# Skins: dialect alignment

How each skin renders the components that exist so far, in the format of the skin notes (`Dialect alignment`). Each
row is what the code does (`packages/skin-*/src`); a milestone adds its components' rows. `f` is the tone's family:
`strong`, `onStrong`, `container`, `onContainer`.

## Minimal

Flat surfaces, hairlines, an ink primary, **Fade** feedback (a veil of the content color, 4% on hover and 8% on press, a 2px
ring for keyboard focus). 40 px buttons, radius 8, a 48 px touch area.

| Appearance | Default tone                                        | Status tones                               |
| ---------- | --------------------------------------------------- | ------------------------------------------ |
| `solid`    | `primary` fill, `onPrimary` content                 | `f.strong` fill, `f.onStrong`              |
| `soft`     | `surfaceContainerHigh` fill, `onSurface`            | `f.container`, `f.onContainer`             |
| `raised`   | `surface` fill, 1px `outline` hairline, `onSurface` | same fill and hairline, `f.strong` content |
| `outline`  | transparent, 1px `outlineVariant`, `primary`        | transparent, 1px `f.strong`, `f.strong`    |
| `ghost`    | transparent, `primary`                              | transparent, `f.strong`                    |
| `link`     | transparent, `primary`, underlined, no padding      | transparent, `f.strong`, underlined        |

| Component | Minimal                                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog    | radius `large` (12), `surface` with a 1px `outlineVariant` hairline, no shadow, 280 to 560 wide, `titleLarge` and `bodyMedium`, **actions at the end** (dismiss then confirm) |

## Cupertino (Classic)

Apple's system colors from the HIG tables, SF type, iOS radii, **Classic** surface (an opaque fill with a soft shadow) and
**Opacity** feedback (the content dims to 35% while pressed, a faint hover veil, a 3px focus ring). Liquid Glass arrives in W8.
`cupertinoTheme({ accent })` replaces the primary family with your accent.

| Appearance | Cupertino                                            |
| ---------- | ---------------------------------------------------- |
| `solid`    | accent fill, white label (`.borderedProminent`)      |
| `soft`     | accent at about 15% fill, accent label (`.bordered`) |
| `raised`   | folds into `soft`                                    |
| `outline`  | folds into `soft` (Apple has no outlined buttons)    |
| `ghost`    | plain accent text (`.borderless`)                    |
| `link`     | plain accent text (`.plain`)                         |

| Tone                         | Cupertino                                   |
| ---------------------------- | ------------------------------------------- |
| `error`                      | systemRed (`#ff3b30` light, `#ff453a` dark) |
| `success`, `warning`, `info` | systemGreen, systemOrange, systemTeal       |

| Component | Cupertino                                                                                                                                                            |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button    | 44 tall, radius `medium` (12), 20 px icons, no border                                                                                                                |
| Dialog    | an alert: 270 wide, radius `large` (14), `surfaceContainerHigh`, a **centered** title in `titleMedium`, message in `bodySmall`, **actions stacked** (confirm on top) |

The same `<camo-dialog>` markup gives side-by-side actions under Minimal and stacked ones under Cupertino; that is the
contract's point, tested in the server-rendering and browser tests.

## Known gaps

- Several of Apple's published colors are below WCAG AA contrast (white on systemBlue is 4.0:1). The skin keeps them as
  published; `tests/node/theme.test.ts` lists the known pairs, the same list as the Dart skin's test, and fails on a new one.
- `actionsLayout`, `titleAlign` and `defaultAppearance` are chosen by the skin, not by a theme variable (see `docs/contract.md`).
