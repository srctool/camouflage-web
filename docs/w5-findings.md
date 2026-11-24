# W5 findings

What building the feedback components (progress, snackbar, banner), the compact data display (chip, badge, avatar), the
navigation (tabs, navigation bar, rail and drawer) and the floating action button settled, and what it did not.

## Decisions

- **Two progress elements, one rule.** `camo-progress-bar` and `camo-progress-circle` take `progress` (0 to 1, clamped); no
  attribute is indeterminate. A determinate indicator is a `progressbar` with a value and a percentage text; an indeterminate
  one has no value, which is how a screen reader says "in progress". The sweep, the spin and Cupertino's twelve fading spokes are
  CSS animations; under `prefers-reduced-motion` all of them become a slow pulse of the whole indicator. The circle is drawn
  in percentages of its own box (`r: calc(50% - stroke / 2)`) with a normalized path length, so its stroke is the style's
  length and its fraction needs no arithmetic in JavaScript.
- **The messenger is a queue with a promise, not a component.** `messengerOf(element).show(message, options)` returns a
  promise of `"action"` or `"dismissed"`. There is one messenger per provider (so snackbars queue instead of stacking), one
  message is shown at a time as a `camo-snackbar` in the top layer (`popover="manual"`), and the timer stands still while
  the snackbar is hovered or has focus (WCAG 2.2.1). `dismissCurrent()` replaces an outdated message; a swipe (up, for a
  top snackbar) dismisses. `camo-snackbar` also works as an element. The skin chooses the edge: Minimal at the bottom,
  Cupertino at the top as a banner with its status icon. `--camo-messenger-inset-bottom` and `--camo-messenger-inset-top`,
  which the app sets, lift it clear of a bottom bar or a FAB; they replace the notes' `CamoMessengerInsets`.
- **A banner's icon is slot fallback.** The skin's status icon for the tone is the content of `<slot name="icon">`, so a server
  renders it and an element in the slot replaces it (an empty one removes it). The icons are `tone-info`, `tone-success`,
  `tone-warning` and `tone-error`: register icons under those names to change them, for banners and snackbars at once.
  Quiet buttons among a banner's `actions` take the banner's accent through `--camo-action-color`, which Minimal's and
  Cupertino's ghost and link buttons read (the notes' nested provider); a Retry on a solid error banner is readable.
- **One chip, four kinds, and a group.** `selectable` is a filter (the app flips `selected` from `click`), `removable` an input
  chip, `clickable` an action and none a tag. The ✕ is a button of its own on an input chip (labelled "Remove ada") and
  pointer-only on a chip that is itself a button (no button nests in a button); Delete and Backspace on the focused chip remove
  it. `camo-chip-group` is the multi-select replacement for a segmented control: single choice is a radio group (arrows move
  and select, `required` keeps the last one on), `multiple` a group of toggle buttons, `layout="scroll"` one scrolling row.
  Form-associated, like the segmented control.
- **A badge hides inside its box.** `camo-badge` is an image with a description ("3 new", or the app's `content-description`);
  inside a `camo-badged-box` it is hidden from assistive technology and its description becomes the anchor's accessible
  description, so a screen reader says "Notifications, 3 new". The box places it on the anchor's top-end corner with
  logical offsets and mirrors it in right-to-left (`:dir(rtl)`). A count of 0 or less draws nothing.
- **An avatar's rules are pure functions.** `avatarInitials` (first letters of the first and last words; the first grapheme of
  a word, so a script with no word spaces gives one letter; a name that does not start with a letter gives the person icon) and
  `avatarColorSeed` (32-bit FNV-1a of the UTF-8 bytes: "Dwiki Riyadi" is `0xCDC853E9`, the vector Kotlin and Dart test) run in
  Node. The photo is the app's `<img slot="image">`; the initials show until it loads and again if it fails. A "+N" is a
  `camo-avatar` with `initials="+2"`.
- **Tabs measure once, in the container.** `camo-tabs` selects on a click and with the arrows (automatic activation), asks
  first with a cancelable `camo-before-change`, then fires `change`. It measures the selected tab (or its content) and sets
  `--camo-tabs-x`, `--camo-tabs-w` and `--camo-tabs-ready`, so one indicator slides with a CSS transition and the renderer
  stays pure; in right-to-left the start is measured from the right. Until it has measured, and on the server, the selected tab
  draws a static indicator of its own, so nothing jumps. Cupertino draws a segmented control (a pill behind the tab); a
  `scrollable` bar falls back to the underline there.
- **Navigation items are links.** A navigation bar, rail and drawer are `navigation` landmarks of `camo-nav-item`s with
  `role="link"` and `aria-current="page"` on the selected one, not the notes' tabs: a landmark's children are links, and
  `tablist` would need the landmark and the tab list to be one element. The three share `NavigationController`: the selected
  `value`, the items' place, a roving tab stop, and the events (`camo-before-change`, `change`, and `camo-reselect` for the
  current item again, which apps use to scroll to top). One `navItem` renderer holds three looks (bar, rail, drawer), so the
  items match whichever chrome holds them. `hidden` slides the bar out and takes it out of focus. `camo-modal-drawer` is the
  overlay frame again (`CamoModal`): it slides in from the start edge, closes on Escape, the scrim, a drag toward the start
  edge and choosing an item, and returns focus to the opener.
- **A FAB is a button that folds.** `collapsed` folds an extended FAB to its icon and the name does not change; `hidden` scales it
  out and leaves it invisible, so it takes no focus, click or reading. Minimal draws a flat rounded square, Cupertino a circle.

## Findings

- **A template nested in an `<svg>` must be an `svg` template.** Cupertino's spokes were `html` templates inside an `<svg>`,
  so the browser made `HTMLUnknownElement`s that draw nothing. The animation test passed (the elements existed and animated);
  only a screenshot showed it. The test now checks they are `SVGLineElement`s.
- **A host rule cannot read a variable set inside.** The snackbar's position rules were on `:host`, its margin variable on an
  inner element, so the declaration was invalid and the snackbar sat at the top of the page. Variables the host's own rules use
  are set on the host.
- **A tab bar's hairline paints over its indicator** when it comes later in the tree; the indicator needs a `z-index`. The
  hydration test caught it as 248 pixels of difference between the server's own tab indicator and the measured one.
- **An activation guard swallows clicks inside the shadow root.** `attachActivation` stops `click` in the capture phase on the
  host, so a chip with no click of its own (a tag, an input chip) blocked its own ✕ button. Only a disabled chip blocks now.
- **A flex chain needs `min-inline-size: 0` at every box** between a chip and its label, or the label never reaches its ellipsis:
  the feedback wrapper and the surface are boxes too.
- **Firefox does not count a lone `Shift` as keyboard modality**, so a test that focuses a tooltip's anchor after pressing it
  saw no `:focus-visible` (W4's test, fixed with a real `Tab`).
- **A server cannot read children.** A tab bar, a nav bar and a chip group put the selection on their children after they
  update, so a server render needs `selected` on the chosen child (as the segmented control and the radios already do), and the
  "+N" of an avatar group exists after hydration; the sample page keeps both out of the hydration comparison.

## Gaps

- `CamoAdaptiveNavigation` (the bar, rail or drawer by window width), and an edge swipe to open the modal drawer.
- A snackbar behind an open modal dialog is visible but inert (the platform makes everything outside a modal dialog inert); it
  needs no work until a snackbar must be actionable while a dialog is open.
- A screen reader's longer snackbar timeout: the web has no recommended-timeout API, so an action snackbar lasts 10 s, and
  focus or hover holds it.
- A focus shortcut to the snackbar's action, and keeping a hidden navigation bar reachable for a screen reader.
- Theme fields that change structure and are the skin's: progress `showStopIndicator`, snackbar `position`, `alignment`,
  `showDismiss`, `showToneIcon` and the durations, banner `defaultAppearance`, `accentBorder` and `toneIcons`, chip
  `defaultAppearance` and `showCheckWhenSelected`, badge `defaultAppearance` and `defaultTone`, avatar `shape`, FAB
  `defaultAppearance` and `size`, tabs `defaultAppearance`, `indicatorWidth` and `showDivider`, and each chrome's `placement`,
  `indicator`, `showLabels`, `alignment` and `hideAnimation`. Listed and tested as gaps.
- `indicatorSize` of the navigation bar and rail is two fields on the web, `indicatorWidth` and `indicatorHeight`.
- The speed-dial FAB menu and expanding groups in the drawer (Later in the notes too); Material's wavy progress.
- Firefox for the new tests (CI only), and the Linux baselines of the new scenarios (from the CI artifact after merge).

## Sizes

gzip, from `pnpm size`: core 42 909 (budget 47 000), core + Minimal 70 938 (78 000), core + Minimal + Cupertino 74 038
(81 500), Minimal alone 35 160 (38 500). Fifty-one elements and fifty-three renderers; the budgets were raised again here
(from 37 500, 60 000, 62 500 and 28 500). Per-component entries and tree-shaking are W10.
