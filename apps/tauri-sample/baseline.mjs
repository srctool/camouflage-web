// Prints the feature-by-engine table from the web-features package (the Baseline data behind MDN and caniuse), plus the
// live probe results of Playwright's engines and the Tauri webview when their JSON files exist.
import { existsSync, readFileSync } from "node:fs";
import { features } from "web-features";

// [probe name, web-features id (null: no entry, support given by hand from MDN compat data), label]
const ROWS = [
  ["declarativeShadowDom", "declarative-shadow-dom", "Declarative shadow DOM (server rendering)"],
  ["elementInternals", "form-associated-custom-elements", "ElementInternals and form association"],
  ["elementInternalsAria", "aria-attribute-reflection", "ARIA through ElementInternals"],
  ["dialogModal", "dialog", "`<dialog>` with `showModal()`"],
  ["dialogModalPseudo", "modal", "`:modal`"],
  ["popoverApi", "popover", "Popover API"],
  ["anchorPositioning", "anchor-positioning", "CSS anchor positioning"],
  ["backdropFilter", "backdrop-filter", "`backdrop-filter`"],
  ["constructableStylesheets", null, "Constructable stylesheets (`adoptedStyleSheets`)"],
  ["has", "has", "`:has()`"],
  ["prefersReducedTransparency", "prefers-reduced-transparency", "`prefers-reduced-transparency`"],
  ["colorMix", "color-mix", "`color-mix()`"],
  ["lightDark", "light-dark", "`light-dark()`"],
  ["containerQueries", "container-queries", "Container queries"],
  ["cssNesting", "nesting", "CSS nesting"],
  ["scrollbarStyling", "scrollbar-width", "`scrollbar-width`"],
  ["dialogClosedby", "dialog-closedby", "`closedby` on `<dialog>`"],
  ["viewTransitions", "view-transitions", "View transitions"],
];
// Where web-features has no entry (MDN compat data): Chrome 73, Firefox 101, Safari 16.4.
const BY_HAND = {
  constructableStylesheets: { baseline: "widely", chrome: "73", firefox: "101", safari: "16.4" },
};

const live = (file) =>
  existsSync(new URL(file, import.meta.url))
    ? JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8"))
    : null;
const browsers = live("results-browsers.json");
const webview = live("results-webview.json");
const mark = (value) => (value === undefined ? "-" : value ? "yes" : "NO");

const lines = [
  "| Feature | Baseline | Chrome / Edge (WebView2) | Firefox | Safari (WKWebView) | " +
    ["chromium", "firefox", "webkit"]
      .filter((n) => browsers?.[n]?.features)
      .map((n) => `Playwright ${n}`)
      .join(" | ") +
    (webview ? " | Tauri webview |" : " |"),
];
const header = lines[0].split("|").length - 2;
lines.push("|" + "---|".repeat(header));
for (const [probe, id, label] of ROWS) {
  const f = id === null ? BY_HAND[probe] : features[id]?.status;
  const support = id === null ? f : (f?.support ?? {});
  const baseline =
    id === null
      ? f.baseline
      : f?.baseline === "high"
        ? "widely"
        : f?.baseline === "low"
          ? "newly"
          : "no";
  const cells = [
    label,
    baseline,
    support.chrome ?? "-",
    support.firefox ?? "-",
    support.safari ?? "-",
  ];
  for (const n of ["chromium", "firefox", "webkit"])
    if (browsers?.[n]?.features) cells.push(mark(browsers[n].features[probe]));
  if (webview) cells.push(mark(webview.features[probe]));
  lines.push(`| ${cells.join(" | ")} |`);
}
console.log(lines.join("\n"));
if (browsers)
  console.log(
    "\nEngines: " +
      Object.entries(browsers)
        .map(([k, v]) => `${k} ${v.version ?? v.error}`)
        .join(", "),
  );
if (webview) console.log(`Tauri webview: ${webview.userAgent}`);
