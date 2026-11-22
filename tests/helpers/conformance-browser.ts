import axe from "axe-core";
import type { RunOptions } from "axe-core";
import { scenarioMarkup } from "../../scenarios/expand.ts";
import type { Variant } from "../../scenarios/expand.ts";
import { mount, settled } from "../browser/helpers.ts";

/** Mounts a scenario variant as the harness does (provider, scheme, direction, text scale) and waits until it settled. */
export async function mountVariant(
  variant: Variant,
): Promise<{ root: HTMLElement; element: HTMLElement }> {
  document.documentElement.style.fontSize = `${variant.textScale * 100}%`;
  const root = mount(
    `<div dir="${variant.direction}"><camo-provider skin="${variant.skin}" scheme="${variant.mode}" style="display:block;padding:24px;background:var(--camo-color-surface);color:var(--camo-color-on-surface)">${scenarioMarkup(variant.scenario)}</camo-provider></div>`,
  );
  await settled(root);
  const element = root.querySelector<HTMLElement>(`camo-${variant.scenario.component}`)!;
  return { root, element };
}

/** Puts the page's font size back after a text-scale variant. */
export function resetTextScale(): void {
  document.documentElement.style.removeProperty("font-size");
}

/**
 * The accessibility violations axe finds under `root`. Cupertino keeps Apple's published system colors, several of
 * which are below WCAG AA contrast (the Dart skin documents the same list), so `color-contrast` is left out for it;
 * every other rule applies to every skin.
 */
export async function axeViolations(root: HTMLElement, skin: string): Promise<string[]> {
  const options: RunOptions =
    skin === "cupertino" ? { rules: { "color-contrast": { enabled: false } } } : {};
  // An inactive component is exempt from the contrast rule (WCAG 1.4.3), and axe cannot see a component's disabled
  // state (it is on `ElementInternals`), so a `[disabled]` host and what is inside it are left out.
  const results = await axe.run({ include: [root], exclude: ["[disabled]"] }, options);
  return results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

/**
 * Whether a pointer within `size` px of the element's center, on both axes, still hits the element. A control whose
 * look is smaller than 48 px keeps a 48 px touch area (WCAG 2.5.8 and the platform guidelines).
 */
export function reachesTouchTarget(element: HTMLElement, size = 48): boolean {
  const box = element.getBoundingClientRect();
  const [cx, cy] = [box.left + box.width / 2, box.top + box.height / 2];
  const half = size / 2 - 1;
  const hits = (x: number, y: number): boolean => {
    const found = document.elementFromPoint(x, y);
    return (
      found === element || element.contains(found) || found?.getRootNode() === element.shadowRoot
    );
  };
  const horizontal = box.width >= size || (hits(cx - half, cy) && hits(cx + half, cy));
  const vertical = box.height >= size || (hits(cx, cy - half) && hits(cx, cy + half));
  return horizontal && vertical;
}
