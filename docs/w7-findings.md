# W7 findings

What building the charts settled: the `@srctool/camouflage-charts` package (frame, data table, style presets,
`camo-sparkline`, `camo-line-chart`, `camo-bar-chart`, `camo-pie-chart`) and what it did not.

## Decisions

- **A package of its own that depends only on core.** `import "@srctool/camouflage-charts/define"` defines the chart
  elements and the core ones they use. Charts are not part of the skin contract: they follow the theme's variables,
  reuse the skin's chips and skeleton, and take a preset by skin name (`minimal`, `fluent`, `cupertino`, `carbon`,
  `material`).
- **Drawn by fractions, so nothing is measured.** Lines and areas are paths in an SVG that stretches
  (`preserveAspectRatio="none"` with non-scaling strokes); bars, dots, grid lines and labels are boxes at percentages
  (with `calc` for the pixel gaps); a pie is a square SVG that scales uniformly. A server's drawing is therefore right at
  any width, and hydration moves nothing. Only the thinning of crowded labels and the sparkline's downsampling measure,
  in the browser.
- **Data are JSON attributes.** `categories`, `series`, `slices`, `values` (properties work too). The server writes them
  into the HTML and the browser reads the same ones before its first render, which is what W6's property-driven rows
  could not do. Functions (`yAxis.format`, `valueFormat`) are properties only.
- **Style layers.** The theme's defaults, the skin's preset (`CamoCharts.registerPreset`), the theme's `tokenSets.chart`
  (`line-width: "3"`), then the element's `chart-style`. The palette is the color families as live `var()` references,
  leaving out those under 3:1 with the surface; `palette` replaces it.
- **The plot is `role="application"`**, not an image, so a screen reader passes the arrow keys through. It is named by
  the title and a generated summary, and the point in focus is said in a live region. A sparkline, which has nothing to
  walk, is an image.
- **The table fallback is `camo-chart-data-table`**, a plain table in the charts package, not `camo-data-table`: its data
  are attributes, so it renders on the server.
- **Replacing the drawing** is `<camo-charts-provider .renderer=…>`: four template methods; the frame, axes, legend, keys
  and tables stay.
- **Right-to-left** is logical properties and one mirrored SVG, so a server is right too. A time axis stays left to right,
  and a pie keeps turning clockwise.
- **The draw-in is CSS**, once, at the first paint, and never under reduced motion.

## Findings

- **A non-clickable card swallowed every click inside it (a W4 bug).** `camo-card` and `camo-list-item` cancelled clicks
  in the capture phase unless clickable, which also cancelled a button, switch or segmented control placed in them. The
  dashboard sample found it. They now block only their own click (a disabled one still blocks everything), with a
  regression test.
- **A legend dot disappears on a filled chip** of its own color; it has a ring in the surface color.
- **`Element.innerHTML`-style page dumps leave shadow roots out**: a server-render check has to read the response.

## Gaps

- Zoom, pan, brush selection, dual y axes, rotated labels, bar labels inside the bar, gauges and a reference band.
- `patterns` (dashes and marker shapes as a second cue beside color) is in the notes and not built in any platform.
- The tooltip is the charts' own box, not the skin's tooltip renderer, as in Kotlin.
- The draw-in does not replay when data change.
- On a server, labels are not thinned and a time axis assumes six ticks.
- Presets for Material, Fluent and Carbon are registered but unseen until those skins exist (W8).
- Firefox for the new tests (CI only), and the Linux baselines of the new scenarios (from the CI artifact after merge).

## Sizes

gzip, from `pnpm size`: core + charts 70 071 (budget 77 000), so the charts add about 14.6 KB to core. The other
budgets are unchanged.
