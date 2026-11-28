// The scenario format (see schema.json) and the expansion every runner shares: one scenario becomes one variant per
// skin, mode, text scale and direction, each with a stable file name (`button-solid_minimal_dark_fs2_rtl`).

export type Mode = "light" | "dark";
export type Direction = "ltr" | "rtl";
export type PropValue = string | number | boolean;

/** The axes a scenario can narrow. */
export interface Axes {
  skins?: string[];
  modes?: Mode[];
  textScales?: number[];
  directions?: Direction[];
}

export interface Scenario extends Axes {
  name: string;
  component: string;
  props?: Record<string, PropValue>;
  /** Values that are not text (a list, an object), assigned as element properties after it renders. */
  properties?: Record<string, unknown>;
  content?: Record<string, string>;
  frame?: "element" | "page";
  /** The provider's control density (`xs`, `sm`, `md`, `lg`). */
  density?: string;
  /** A skin's surface material (`liquid-glass`, `classic`, `acrylic`), drawn over a patterned page so it shows. */
  surface?: string;
}

export interface ScenarioFile {
  $schema?: string;
  version: 1;
  defaults?: Axes;
  scenarios: Scenario[];
}

/** One capture: a scenario at one point of the matrix. */
export interface Variant {
  /** The file name without extension: `<scenario>_<skin>_<mode>_fs<scale>_<direction>`. */
  id: string;
  scenario: Scenario;
  skin: string;
  mode: Mode;
  textScale: number;
  direction: Direction;
}

const FALLBACK: Required<Axes> = {
  skins: ["minimal"],
  modes: ["light"],
  textScales: [1],
  directions: ["ltr"],
};

/** The scale as it appears in a file name: `1`, `2`, `1.5` (the dot kept out of file names). */
function scaleName(scale: number): string {
  return `fs${String(scale).replace(".", "p")}`;
}

/** Expands every scenario over its axes (its own, else the file's defaults, else a single light, 1x, LTR capture). */
export function expandScenarios(file: ScenarioFile): Variant[] {
  const seen = new Set<string>();
  const variants: Variant[] = [];
  for (const scenario of file.scenarios) {
    if (seen.has(scenario.name)) throw new Error(`Duplicate scenario name "${scenario.name}".`);
    seen.add(scenario.name);
    const axis = <K extends keyof Axes>(key: K): NonNullable<Axes[K]> =>
      (scenario[key] ?? file.defaults?.[key] ?? FALLBACK[key]) as NonNullable<Axes[K]>;
    for (const skin of axis("skins"))
      for (const mode of axis("modes"))
        for (const textScale of axis("textScales"))
          for (const direction of axis("directions"))
            variants.push({
              id: `${scenario.name}_${skin}_${mode}_${scaleName(textScale)}_${direction}`,
              scenario,
              skin,
              mode,
              textScale,
              direction,
            });
  }
  return variants;
}

/** What a component element looks like in HTML: props become attributes, content fills the slots. Pure. */
export function scenarioMarkup(scenario: Scenario): string {
  const esc = (value: string): string =>
    value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const attributes = Object.entries(scenario.props ?? {})
    .filter(([, value]) => value !== false)
    .map(([name, value]) => (value === true ? name : `${name}="${esc(String(value))}"`))
    .join(" ");
  const slotted = Object.entries(scenario.content ?? {})
    .map(([slot, html]) => {
      if (slot === "") return html;
      // A slot's content is one element carrying `slot="name"`; plain text is wrapped in a span.
      return /^\s*</.test(html)
        ? html.replace(/^\s*<(\w[\w-]*)/, `<$1 slot="${slot}"`)
        : `<span slot="${slot}">${html}</span>`;
    })
    .join("");
  const tag = `camo-${scenario.component}`;
  return `<${tag}${attributes === "" ? "" : ` ${attributes}`}>${slotted}</${tag}>`;
}

/** Assigns a scenario's `properties` to its element (the web's way of passing a list or an object). */
export function applyProperties(root: ParentNode, scenario: Scenario): void {
  if (scenario.properties === undefined) return;
  const element = root.querySelector(`camo-${scenario.component}`);
  if (element !== null) Object.assign(element, scenario.properties);
}
