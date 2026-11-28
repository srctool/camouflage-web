# W9 findings: desktop foundations

## What was added

- `camo-menu-submenu`: submenus at any depth, as nested popovers.
- `camo-split-pane` and `camo-pane`: a draggable, keyboard-resizable split. Each pane sizes itself from its own
  attributes and draws the divider after it, so a server needs no measurement.
- `camo-scrollbar`: a scroll area with the skin's bar for a mouse; touch and no-script keep the platform's.
- Renderers `splitPane` and `scrollbar` in all five skins (60 renderers in all).
- `density="xs|sm|md|lg"` on `camo-provider`, plain CSS, read by Carbon and Fluent.
- Camouflage's own scroll containers (table, sheets, drawers, rail, select) use the platform bar in the theme's colors.

## Differences from the notes and from Kotlin and Dart

- The pane is an element (`camo-pane`), not a data class; there is no state object, only `fractions` and `snapshot()`.
- The drawn scrollbar is not put inside the tree, data table or paged list by itself; those use the platform's bar.
- There is no scroll adapter: the area measures its own content.
- A submenu has an `open` attribute, so it can be shown declaratively.

## Gaps

- No safe triangle for the pointer's path to a submenu (the 120 ms grace covers most of it).
- Carbon `xs` keeps the 14 px control text (Kotlin draws 12).
- The operating system's scrollbar setting is not read.
- Touch: submenus open on tap; the Back gesture was not tried on a device.

## Fixed on the way

- A Carbon list row at a small density was padded past its height.
- A split's resize reopened a collapsed pane (found before release, with a test).
