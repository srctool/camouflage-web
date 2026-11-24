# W4 findings

What building the containers, lists and overlays (card, list item and section, accordion, skeleton, paged list, select,
the overlay frame and dialog, bottom sheet, menu, tooltip, top bar) settled, and what it did not.

## Decisions

- **One overlay frame.** `CamoModal` (`behavior/modal.ts`) is the base of every modal overlay: a native `<dialog>` shown with
  `showModal()`, so the top layer, the scrim, the focus trap, the inert page and Escape are the platform's. It adds
  dismissal by a click on the scrim, `close(result)` and the one `camo-close`, a focus target inside slotted content, and a
  server-rendered overlay that arrives open and becomes modal on hydration. `camo-dialog` (refactored onto it, behavior
  unchanged) and `camo-bottom-sheet` extend it; `persistent` turns scrim and Escape off.
- **Menus, tooltips and pickers use the Popover API** (`popover="auto"`, or `manual` for the tooltip): the top layer, Escape
  and light dismissal are the browser's, and `placePopover` puts the popup below the anchor, above when there is no room, at
  the anchor's start edge. CSS anchor positioning is not used (not in every engine), so that fallback is the only path.
- **Menu entries are elements.** `camo-menu` takes an `anchor` slot and entries as children (`camo-menu-item`,
  `camo-menu-divider`, `camo-menu-group exclusive`). The anchor says "has popup" and expanded. Up, Down, Home, End and
  typeahead move; Enter, Space or a click run the item's own `click` and close. A checkable item in an exclusive group is a
  radio item (`menuitemradio`).
- **A tooltip is the anchor's description.** The text is set as the anchor's `ariaDescription` (not its name), it shows
  after a delay on hover and at once on keyboard focus, hides on Escape, blur and press, and the pointer can move onto it.
  It never takes focus. `open` forces it shown (documentation, tests).
- **The paged list is controlled by one object.** `list.state = { items, loading, endReached, error }`, a `renderItem`
  function and an optional `itemKey`; it fires `camo-load-more` (once per state, when the sentinel `prefetch-distance` items
  before the end scrolls in, never while loading, at the end, or after an error), `camo-retry` and `camo-refresh` (a pull of
  80 px from the top on touch). The list role and name are on a real element in the shadow root, so a checker sees them.
  Virtualization is not built: the page sizes an API returns do not need it, and it stays invisible to callers if added.
- **Select is a text field plus a panel, not a renderer.** `camo-select` extends the picker base (field renderer, native
  popover); options are `camo-option` children or an `options` property; `searchable` adds a search field (it filters the
  options it owns; with an `options` property the app answers `camo-query`, debounced 500 ms); async is the same element
  (`loading`, `selected-label`, `camo-open`, `camo-load-more`). `auto` picks a sheet on a compact window or for more than seven
  options, else a menu as wide as the field. The rows are `camo-list-item`s inside `role="option"` wrappers.
- **Skeletons keep step without a group element.** Every skeleton starts its cycle at `performance.now() % 1500`, so any two
  on a page are at the same point of the animation however late each mounted; there is no `camo-skeleton-group`. The
  animation stops under reduced motion (the media query), and a server render starts at 0 so its bytes do not depend on time.
- **A list section draws the dividers** its rows show, through two custom properties it sets on its panel (`--camo-li-divider`,
  `--camo-li-inset`), so `inset` (from where the text starts), `full` and `none` work for any row inside, and the last row has none.
- **A top bar knows its scroll.** `scroll-offset` is a distance (the contract's), and `scroll-target` (a selector or `window`)
  lets the bar read a scroller itself. Cupertino's large title collapses with the offset and the small title fades in; a
  `title-content` slot replaces the drawn title and the heading stays for screen readers. `hidden` slides it away.
- **Names that differ from the base notes** (in `contract/camouflage-contract.json`): `variant`-style enums as before;
  `clickable` and `selectable` for a card's and a row's nullable `onClick` and `selected`; `visible` is the inverted `hidden`;
  `anchor` is the menu's anchor slot; `persistent` and `detent` are the sheet's.

## Findings

- **`:host(:has(...))` is not in every engine, and W1 and W2 used it.** Chromium does not support it, so the button's reduced
  padding next to an icon never applied there (WebKit did it). Slotted content is now styled from the shadow root with
  `::slotted(...)` (the icon pulls itself toward the edge with a margin; a list row's gap belongs to its leading widget), which
  needs no knowledge of the host's children and so also works on the server. One case needs the host to know
  (`title-content` on the top bar): it sets a `data-camo-title-content` attribute itself.
- **Two nested dialogs close together unless a gesture separates them.** A browser groups overlays opened with no user gesture
  between them, so one Escape closed both. In use the second opens from a click, and Escape then closes the top one only; the
  test opens it with a click. Native behavior, not ours to fix.
- **A server cannot read light DOM.** `closest`, `querySelector` and `textContent` do not exist there, so the select's label for
  its value, the segments' positions and a rich label's name arrive on hydration; `selected-label` names the value on the
  server. The sample's hydration test covers the page with no pixel moving.
- **axe cannot see roles set through `ElementInternals`**, so two rules would fail what a screen reader sees as right for a
  menu (`aria-required-children` for slotted items, `aria-allowed-attr` for the anchor's `aria-haspopup`). The conformance
  run leaves those two out for menu scenarios and says why.
- **The touch target of a row.** Cupertino's rows were 44 px; the harness wants 48, so they are 48, 64 and 80. A row's hit area
  is not widened (it would overlap its neighbors).
- **Adopted styles beat a `<style>` in the shadow root** (W3), so `CamoSelect` and the picker base keep `static styles` to
  layout the renderer does not set.

## Gaps

- Cupertino's picker wheel inside a select sheet, and a date wheel (W3's gap): a select's sheet is the list in both skins.
- `CamoMenuController` and context menus (`CamoContextMenuArea`): a menu opens from its anchor; right click and long press are W6.
- Submenus, the command palette, the popover and the side sheet (W6 and later).
- Theme fields that change structure and are the skin's: card `defaultAppearance` and `showSelectedCheck`, list item `dividers`,
  accordion `indicator` and `indicatorPosition`, skeleton `animation`, bottom sheet `showHandle`, `titleAlign` and
  `showCloseButton`, menu `checkPosition`, top bar `titleAlign`, `divider` and `largeTitle`. Listed and tested as gaps.
- A paged list's `refreshKeepsItems` and `itemFadeIn` (a refresh always keeps its items and shows the indicator).
- Firefox for the new tests (CI only), and the Linux baselines of the new scenarios (from the CI artifact after merge).

## Sizes

gzip, from `pnpm size`: core 34 462 (budget 37 500), core + Minimal 54 715 (60 000), core + Minimal + Cupertino 56 840
(62 500), Minimal alone 25 972 (28 500). Thirty-two elements and thirty-nine renderers. The budgets were raised again here;
`core (define)` registers every element, which is what W10 (#66) changes with per-component entries and tree-shaking.
