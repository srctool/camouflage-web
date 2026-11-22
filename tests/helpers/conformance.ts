// The conformance rules every renderer follows (Skin Contract, 3.6), as checks a test can call on any renderer. They
// read text only (a render's output, a renderer's styles), so they run in Node, on the server's side of the line.

// A color, a size or a duration written into a renderer instead of coming from a token or a style field.
const LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch|hwb|lab)a?\(|\b\d+(?:\.\d+)?(?:px|rem|em|ms|s)\b/;

/** The first color, size or duration literal in `text`, ignoring what is inside `var(...)`, or `undefined`. */
export function findLiteral(text: string): string | undefined {
  return LITERAL.exec(text.replace(/var\([^)]*\)/g, ""))?.[0];
}

// A property that names a physical side. Logical properties (`inset-inline-start`, `margin-block`) mirror in
// right-to-left by themselves.
const PHYSICAL = [
  /\b(?:margin|padding|border|scroll-margin|scroll-padding)-(?:left|right)\b/,
  /\bborder-(?:top|bottom)-(?:left|right)-radius\b/,
  /(?:^|[;{\s])(?:left|right)\s*:/,
  /\btext-align\s*:\s*(?:left|right)\b/,
  /\bfloat\s*:\s*(?:left|right)\b/,
  /\bclear\s*:\s*(?:left|right)\b/,
  /\bbackground-position(?:-x)?\s*:\s*(?:left|right)\b/,
];

/** The first physical-side property in `css`, or `undefined` (a renderer must use logical properties). */
export function findPhysicalProperty(css: string): string | undefined {
  for (const pattern of PHYSICAL) {
    const hit = pattern.exec(css);
    if (hit !== null) return hit[0].trim();
  }
  return undefined;
}

/**
 * A render is pure when it gives the same output for the same arguments and needs no browser: it runs here (no
 * `window`, no `document`) and twice. `render` is called twice and the outputs, as text, must match.
 */
export function assertPure(render: () => string): void {
  if (typeof (globalThis as { window?: unknown }).window !== "undefined")
    throw new Error("assertPure must run where there is no window (the node project).");
  const [first, second] = [render(), render()];
  if (first !== second)
    throw new Error("A renderer gave two different outputs for the same arguments.");
}
