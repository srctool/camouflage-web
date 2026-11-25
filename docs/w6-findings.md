# W6 findings

What building the components that arrived later settled: the popover family (popover, side sheet, toolbar, button group, split
button), the media and file components (image, rating, carousel, file uploader), the structured data (data table, tree) and
the navigation helpers (pagination, breadcrumb, progress steps); and what it did not.

## Decisions

- **Data-part delegation for what a renderer draws.** A renderer is pure, so it cannot carry a handler. Where it draws the
  buttons (the split button's two parts, a pagination's pages and arrows, a carousel's buttons, a file uploader's zone, remove
  and retry, a data table's sort headers) it writes `data-part` (and `data-key`, `data-id`, `data-index`) and the element
  listens once on itself and reads `composedPath()`. The same markup works on the server, and a skin never sees an event.
- **A popover is a panel placed by one pure function.** `placePanel(anchor, panel, room, placement, { rtl, gap })` returns
  where the panel goes, the side it really opened on (a physical side, after flipping: `auto` is below then above; a side asked
  for is tried, then the opposite, then below) and where the anchor's center is along the facing edge, for the arrow. It is
  tested with no window. The arrow is drawn by the renderer in a margin of its own, so the gap to the anchor includes it.
  Clicking the anchor toggles; the popover API (`popover="auto"`) closes it on Escape and on an outside click, and focus goes
  back to the anchor. The anchor announces "has popup" and expanded. A popover follows its anchor on scroll and resize.
- **The menu is reusable.** `camo-menu` gained three hooks for components built on it (`anchorElement`, `manual`, `itemsRoot`),
  so the split button's menu opens under the whole button with the split button's own children as entries, and the toolbar's
  and the breadcrumb's "more" menus are the real menu with generated items. Nothing about the menu's own use changed.
- **A split button is two real buttons and a menu.** The main part's `click` is the host's own `click`; the arrow part (named by
  `menu-content-description`, with has-popup and expanded) opens the menu; `menu-only` is one part that opens it. Down on either
  part opens it with the first entry focused; Escape closes it and focus returns to the main part.
- **A button group's corners are inherited, not asked.** The group sets `--gbg-outer` and `--gbg-inner` on its inner box, they
  reach the slotted buttons through the flat tree, and each button picks them with `:host(:first-child)` and `:host(:last-child)`.
  A server-rendered group is therefore already joined, which a property set by the group after it updates would not give.
  Place and "2 of 3" are still set by the group on the client. The app owns `selected` of a toggle, as for an icon button.
- **Side sheets share a shape with the drawer.** `camo-side-sheet` is docked (a complementary region in the layout; the content
  scrolls, the title and actions stay) and `camo-modal-side-sheet` is the overlay frame again from the end edge: scrim,
  Escape, close button and a drag toward the end edge all close it, and RTL slides in from the left.
- **The toolbar folds real buttons.** Its actions are `camo-icon-button`s. It measures its track and, with `fitCount`, hides the
  ones that do not fit (`data-camo-overflowed`) and puts a "more" menu in their place whose items carry the label, tone,
  disabled state and a checkmark for a toggle; choosing one clicks the real button. It watches the actions' attributes, so a
  flipped toggle updates the menu. Leading and trailing controls never fold. One Tab stop, arrows, Home and End.
- **Image, rating and carousel.** `camo-image` shows the browser's `<img>` in the skin's frame: a placeholder while it loads,
  the image fading in (not under reduced motion), an error mark on failure with "could not load" in the name; no
  `content-description` means decorative. A server paints it as loaded. `camo-rating` is form-associated and an adjustable value
  (a slider; a plain image when read-only): click, drag and keys, half steps, Home 0 and End the maximum, mirrored in RTL.
  `camo-carousel` is a scroll-snap strip, so swipe, wheel and keys are native; the strip is the one Tab stop, items out of sight
  are inert, each announces "2 of 5", and the page is read when the scroll settles, so a swipe through several items reports
  one change. Autoplay is opt-in, off under reduced motion, held while hovered or focused, and stopped for good by the user.
- **The file uploader owns no rows.** The zone is one button (the hint is its description) that fires a cancelable `camo-pick`
  and otherwise opens the browser's picker; picked and dropped files arrive in `camo-files-dropped` and are also its form
  value. The app sets `files` (`{ id, name, sizeBytes, progress, status, message }`) and each row draws with the skin's progress
  bar, a remove button and, when failed, a retry button; a failed row is announced once as an alert.
- **A data table is a real table.** Core builds a `<table role="grid">` (sticky header, `aria-sort`, `aria-selected`,
  rows with an index) and the renderer gives it its look. Columns are `{ key, header, width, align, sortable, cell }`; the
  selection is a `Set` or any list of keys; sorting is the app's (the table fires `camo-sort-change` and shows the arrow);
  selection asks first with `camo-before-change`, then fires `change`; Enter and a click fire the cancelable `camo-row-click`,
  and unless the app cancels it a selectable table toggles the row. One Tab stop into the body; Up, Down, Home, End, Space.
- **A tree is a flat list of tree items.** `flattenTree` (pure) gives the visible rows with level, place and parent; they are
  `<li role="treeitem">` with `aria-level`, `aria-posinset`, `aria-setsize` and `aria-expanded`. Right expands then enters the
  first child, Left collapses then goes to the parent (swapped in RTL), Home and End, typeahead, Enter and Space select
  (toggle with `multi-select`). A node with `hasChildren` and no children asks once (`camo-load-children`) and shows a spinner.
- **Pagination, breadcrumb, steps.** `pageItems` (pure) keeps the first and last page, the siblings and gaps at a fixed length of
  `2 * siblings + 5`, so nothing shifts. The arrows move focus without choosing (choosing would shift the items under them);
  Home and End go to the first and last page. A breadcrumb's items are `camo-breadcrumb-item`s that hold the data; the
  breadcrumb draws the trail, measures it, and folds the middle with `planBreadcrumb` (the first item, a more menu, as many of
  the last as fit); a click on a step is a `click` on its item. Steps take their state from `current` (complete before, upcoming
  after), `state="error"` flags one, and only `clickable` steps are buttons.
- **`page` counts from 0** (the contract's), in pagination and the carousel.

## Findings

- **A test that cannot fail is not a test.** The first tool-bar, breadcrumb and steps scenarios all looked right in the
  conformance run (axe passes on anything that draws) and were wrong in the screenshot: a harness that shrink-wraps its content
  gave them no room to overflow, and a vertical connector inherited a minimum width meant for the horizontal one. Scenarios that
  depend on a width now carry one (`style="width: 280px"`).
- **A smooth scroll reports every item it passes.** Reading the page on each scroll event made one step through three items fire
  three `camo-page-change`s, and scrolling to the page just read interrupted the scroll in progress. The carousel reads when the
  scroll settles (`scrollend`, or a pause of 120 ms) and does not scroll to a page it only just reported.
- **A disabled button's click is ignored**, which hid a bug in a test of the autoplay (it clicked "previous" at the first page).
  The test now takes hold of the carousel the way a user does.
- **A server does not hydrate what is drawn from objects.** Setting `.columns` or `.rows` in a template makes the server draw the
  table, and the client's first render (before those properties arrive) finds a different shape and throws "shorter than
  expected iterable". The data table, the tree and the uploader's rows therefore render on the server (tested in Node) but the
  hydration sample leaves them out: they hydrate when their properties are set before the element upgrades.
- **A flat skin's floating bar needs a hairline**, and a tab-bar-style hairline needs a `z-index` over what it underlines; a
  logical radius needs the per-corner properties, so a group sets them itself and the surface's `border-radius` inherits.
- **Chromium and WebKit run `scrollend` and smooth scrolling differently.** Tests wait for the scroll to settle, and compare
  events, not positions.
- **A step is a `listitem` the container labels from outside**, so on the server it needs its `index` and `count` written (the
  attributes reflect for that), as a nav item or a tab needs `selected`.

## Gaps

- A breadcrumb, a button group's appearance for its buttons, a carousel's "2 of 5" names and dots, and a toolbar's folding
  draw or apply on the client: a server cannot read children.
- Virtualization of a long data table (all rows are drawn; `camo-pagination` is the answer in the sample), a content-measured
  column width, column resizing, reordering and hiding, row expansion, and cell editing (v0.2 in the notes).
- Checkbox trees with a tri-state parent, drag to move a node, and range selection with Shift.
- A popover that follows its anchor off screen closing itself, a rich tooltip, and a hover trigger.
- A toolbar with labels beside icons, hide on scroll, a vertical orientation, and tooltips on its actions.
- The file uploader's `accept` is the picker's hint only: the app validates what is dropped.
- `CamoAdaptiveNavigation` and an edge swipe to open the drawer (W5's), and a snackbar inert behind a modal dialog.
- Theme fields that change structure and are the skin's: button group and split button `defaultAppearance`, popover `showArrow`,
  side sheet `showDivider` and `showCloseButton`, toolbar `placement`, `floatingElevation`, `showLabels` and `showDivider`,
  image `fadeMillis`, file uploader `dashed`, data table `density`, `striped`, `dividers` and `stickyHeader`, tree
  `showLines`, steps `showNumbers`. Listed and tested as gaps.
- Firefox for the new tests (CI only), and the Linux baselines of the new scenarios (from the CI artifact after merge).

## Sizes

gzip, from `pnpm size`: core 55 485 (budget 61 000), core + Minimal 92 987 (102 000), core + Minimal + Cupertino 100 791
(111 000), Minimal alone 45 370 (50 000). The budgets were raised again (from 47 000, 78 000, 81 500 and 38 500): eighteen
elements and fifteen renderers added about 12 KB of core and 10 KB of Minimal. Per-component entries and tree-shaking are W10.
