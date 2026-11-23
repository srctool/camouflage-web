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

| Component   | Minimal                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Text        | the theme's type role, content color, links in `primary` and **underlined**                                            |
| Icon        | 24 px unless the container sets `--camo-icon-size`, drawn in the content color                                         |
| Surface     | flat: the level's `surface*` role, the shape role, no shadow; `border` is 1px `outlineVariant`                         |
| Divider     | 1px `outlineVariant`; `start` and `middle` insets of `spacing.l`                                                       |
| Icon button | 40 container, radius `full`, 24 px icon, 48 px touch area, **Ghost** by default; on (toggle) is `surfaceContainerHigh` |

| Component         | Minimal                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Text field        | label **above**, 44 tall, radius 8, 1px `outline` border, primary border and ring when focused, `error` in the error color |
| Search field      | 44 tall pill (`shapes.full`), `surfaceContainerHigh`, a magnifier and an automatic clear button                            |
| Checkbox          | 18 box, radius 2, 2px border, primary fill and an `onPrimary` check; label **after** the box                               |
| Switch            | 44 by 24 track, a 12 (off) or 16 (on) thumb, primary when on; label **before** the switch                                  |
| Radio             | 20 ring, a 10 dot; label after the ring                                                                                    |
| Segmented control | 40 tall, radius 8, 1px outline, `surfaceContainer` track, `secondaryContainer` selection, no check icon                    |
| Slider            | 4 track, a 20 thumb, stop marks, a value bubble while dragging                                                             |
| Stepper           | inline: minus, value, plus in a 40 tall outlined box                                                                       |
| Calendar          | 40 days (48 touch), a filled circle for the selection, `primaryContainer` for the range, a ring for today                  |
| Time picker       | **fields**: two number fields and an AM and PM control                                                                     |

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

| Component   | Cupertino                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| Text        | the theme's type role, links in the accent with **no underline**                                                |
| Icon        | 24 px, as Minimal                                                                                               |
| Surface     | Classic: an opaque fill with a soft shadow that grows with elevation; `border` is a 0.5px hairline              |
| Divider     | a 0.5px hairline                                                                                                |
| Icon button | 44 container in the accent, 48 px touch area, Ghost by default; soft, outline and on are the tinted accent fill |

| Component         | Cupertino                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Text field        | 44 tall, radius 12, a hairline border; the same engine and ids as Minimal                                                |
| Search field      | 36 tall, radius 12, an 18 magnifier                                                                                      |
| Checkbox          | a 22 round box (`shapes.full`), the check at the **end** of the row (label first)                                        |
| Switch            | the iOS 51 by 31 track with a 27 thumb that does not change size; label before                                           |
| Radio             | a **checkmark list**: no ring, a check at the end of the selected row                                                    |
| Segmented control | 32 tall, a filled track with the selected segment lifted                                                                 |
| Slider            | 4 track, a 28 thumb, no value bubble                                                                                     |
| Stepper           | inline, 32 tall                                                                                                          |
| Time picker       | **wheels**: three scroll-snapped columns (hour, minute, AM and PM) with a selection band; each is one adjustable control |

The same `<camo-dialog>` markup gives side-by-side actions under Minimal and stacked ones under Cupertino; that is the
contract's point, tested in the server-rendering and browser tests.

## Material (W8): what the W2 components need

Surface levels are Material's `surfaceContainer*` roles one to one, and elevation is a shadow (Paper), so Material needs
only `defaults(theme)` for Surface and Divider, and the Classic treatment. Material's icon button maps Solid to Filled,
Soft to Filled tonal, Outline to Outlined and Ghost to Standard (the base note's table), with `onSurfaceVariant` icons.
Carbon and Fluent have no Surface level of their own: Carbon's layers and Fluent's neutral backgrounds 1 to 6 are mapped
onto the same six levels by the skin.

## Known gaps

- Several of Apple's published colors are below WCAG AA contrast (white on systemBlue is 4.0:1). The skin keeps them as
  published; `tests/node/theme.test.ts` lists the known pairs, the same list as the Dart skin's test, and fails on a new one.
- The icon theme's `size` and `color` (the root icon style) are not variables: the provider sets 24 px and the content
  color, and a skin changes them in its renderers.
- Theme fields that change structure (`labelPlacement`, `labelPosition`, `showCheckIcon`, `showStopMarks`, `showValueLabel`, the
  stepper's `layout`, `showOutsideDays`, the time picker's `style`) are chosen by the skin; see `docs/contract.md`.
- Cupertino has no date wheel yet: its single date is the calendar.
- `actionsLayout`, `titleAlign` and `defaultAppearance` are chosen by the skin, not by a theme variable (see `docs/contract.md`).
