import "@srctool/camouflage-core/define";
import "@srctool/camouflage-skin-minimal/register";
import "@srctool/camouflage-skin-cupertino/register";
import "@srctool/camouflage-skin-material/register";
import "@srctool/camouflage-skin-fluent/register";
import "@srctool/camouflage-skin-carbon/register";
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

/** The five skins, in the order the notes list them. */
export const SKINS = ["minimal", "material", "cupertino", "fluent", "carbon"];

/** What differs by dialect, so one test holds every skin to its own (the dialect alignment tables). */
export interface Traits {
  buttonHeight: number;
  /** Keyboard focus is an outline, or Fluent's and Carbon's strokes drawn as a box shadow. */
  ring: "outline" | "shadow";
  /** The time picker is wheels, the tabs segmented, list sections inset, the top bar's title large: Apple's anatomy. */
  apple: boolean;
  snackbar: ["top" | "bottom", "center" | "end"];
  popoverArrow: boolean;
  sheetHandle: boolean;
  stopMarks: boolean;
  stepNumbers: boolean;
  tabsDivider: boolean;
  /** The corners of surfaces, bars, groups and avatars are rounded (Carbon is square). */
  rounded: boolean;
  /** A connected group's inner corners are rounded a little (M3), not square. */
  roundedInner: boolean;
  /** The icon button's icon size. */
  iconSize: string;
  /** The top bar's bottom rule, at rest and once content is under it. */
  topRule: [string, string];
  floatingLabel: boolean;
}

const BASE: Traits = {
  buttonHeight: 40,
  ring: "outline",
  apple: false,
  snackbar: ["bottom", "center"],
  popoverArrow: false,
  sheetHandle: true,
  stopMarks: true,
  stepNumbers: true,
  tabsDivider: true,
  rounded: true,
  roundedInner: false,
  iconSize: "24px",
  topRule: ["0px", "1px"],
  floatingLabel: false,
};

const TRAITS: Record<string, Partial<Traits>> = {
  minimal: {},
  material: { roundedInner: true, topRule: ["0px", "0px"], floatingLabel: true },
  cupertino: { buttonHeight: 44, apple: true, snackbar: ["top", "center"], popoverArrow: true },
  fluent: {
    buttonHeight: 32,
    ring: "shadow",
    snackbar: ["bottom", "end"],
    popoverArrow: true,
    sheetHandle: false,
    stopMarks: false,
    tabsDivider: false,
    iconSize: "20px",
  },
  carbon: {
    ring: "shadow",
    snackbar: ["top", "end"],
    popoverArrow: true,
    sheetHandle: false,
    stopMarks: false,
    stepNumbers: false,
    rounded: false,
    iconSize: "16px",
    topRule: ["1px", "1px"],
  },
};

export function traits(skin: string): Traits {
  return { ...BASE, ...TRAITS[skin] };
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
