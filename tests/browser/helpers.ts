import "@srctool/camouflage-core/define";
import "@srctool/camouflage-skin-minimal/register";
import "@srctool/camouflage-skin-cupertino/register";
import "@srctool/camouflage-charts/define";
import { afterEach } from "vitest";

const mounted: HTMLElement[] = [];

/** Puts markup in the page; removed after each test. Returns the container. */
export function mount(markup: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = markup;
  document.body.append(container);
  mounted.push(container);
  return container;
}

afterEach(() => {
  for (const el of mounted.splice(0)) el.remove();
});

interface Updatable extends Element {
  updateComplete: Promise<boolean>;
}

/** Waits until every camo element under [root] (and the ones their updates create) has rendered, then a frame. */
export async function settled(root: ParentNode = document): Promise<void> {
  for (let round = 0; round < 3; round++) {
    const all = [...root.querySelectorAll("*")].filter(
      (e): e is Updatable => "updateComplete" in e,
    );
    await Promise.all(all.map((e) => e.updateComplete));
  }
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
}

/** A custom property's computed value, trimmed. */
export function cssVar(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** The element's box in the viewport. */
export function box(el: Element): DOMRect {
  return el.getBoundingClientRect();
}
