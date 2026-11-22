/**
 * The two variables a container sets before it places a slot (Skin Contract, 3.2): `--camo-content-color`, which text
 * reads by default, and `--camo-icon-size`, which icons read. Set on a wrapper, they reach everything inside it,
 * through shadow roots, so `<camo-text>Save</camo-text>` in a solid button is `onPrimary` with no argument.
 */
export function contentVariables(content: { color?: string; iconSize?: string }): string {
  return [
    content.color === undefined ? "" : `--camo-content-color: ${content.color};`,
    content.iconSize === undefined ? "" : `--camo-icon-size: ${content.iconSize};`,
  ]
    .filter((part) => part !== "")
    .join(" ");
}
