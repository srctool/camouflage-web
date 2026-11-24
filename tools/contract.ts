// `camouflage-contract.json` for the web: reads the contract (the base notes' names) and says what the web library
// must have for each component, by the naming rules of the Components note (3.1 to 3.4). The manifest check and the
// typings generator both start here, so the rules live in one place.

export interface ContractParameter {
  name: string;
  kind: "value" | "slot" | "callback";
  type?: "string" | "number" | "boolean" | "enum";
  values?: string[];
  default?: string | number | boolean | null;
  required?: boolean;
  defaultSlot?: boolean;
}

export interface ContractComponent {
  name: string;
  parameters: ContractParameter[];
  themeFields?: { name: string; type?: string; web?: "variable" | "tokens" | "gap" }[];
}

export interface Contract {
  version: 1;
  components: ContractComponent[];
}

/** What the web must provide for a component. */
export interface WebExpectation {
  tag: string;
  className: string;
  /** Attribute name and, for an enum, the values it must accept (lowercase kebab-case). */
  attributes: Record<string, string[] | null>;
  /** Slot names; `""` is the default slot. */
  slots: string[];
  /** Custom events a callback becomes (a native one, like `click`, needs nothing). */
  events: string[];
  /** Contract names that must NOT be an attribute: a default-true boolean is inverted. */
  forbidden: string[];
  /** The fields the web carries as `--camo-<component>-<field>` variables. */
  themeFields: string[];
  /** Fields a CSS variable cannot carry, so the web does not offer them yet. */
  themeGaps: string[];
}

/** `PrefixIcon` or `prefixIcon` → `prefix-icon`. */
export function kebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

// A parameter that defaults to true cannot be a bare HTML boolean, so it is inverted (Components note, 3.2). A new
// inversion is a decision, so it is listed here and an unlisted one fails.
const INVERTED: Record<string, string> = {
  enabled: "disabled",
  singleLine: "multiline",
  allowTyping: "readonly",
  visible: "hidden",
  expanded: "collapsed",
};

// A callback that is a native event, and so needs no custom one (Components note, 3.4).
const NATIVE_EVENTS = new Set([
  "onClick",
  "onFocusChanged",
  "onValueChange",
  "onValueChangeFinished",
  "onCheckedChange",
  "onSelectionChange",
]);

/** What the web must provide for one contract component. */
export function expectation(component: ContractComponent): WebExpectation {
  const attributes: Record<string, string[] | null> = {};
  const slots: string[] = [];
  const events: string[] = [];
  const forbidden: string[] = [];
  for (const p of component.parameters) {
    if (p.kind === "slot") {
      slots.push(p.defaultSlot === true ? "" : kebab(p.name));
    } else if (p.kind === "callback") {
      if (!NATIVE_EVENTS.has(p.name)) events.push(`camo-${kebab(p.name.replace(/^on/, ""))}`);
    } else {
      let name = kebab(p.name);
      if (p.type === "boolean" && p.default === true) {
        const inverted = INVERTED[p.name];
        if (inverted === undefined)
          throw new Error(
            `${component.name}.${p.name} defaults to true: add its inversion to INVERTED in tools/contract.ts.`,
          );
        forbidden.push(name);
        name = inverted;
      }
      attributes[name] = p.type === "enum" ? (p.values ?? []).map(kebab) : null;
    }
  }
  return {
    tag: `camo-${kebab(component.name)}`,
    className: `Camo${component.name}`,
    attributes,
    slots,
    events,
    forbidden,
    themeFields: (component.themeFields ?? [])
      .filter((f) => (f.web ?? "variable") === "variable")
      .map((f) => f.name),
    themeGaps: (component.themeFields ?? []).filter((f) => f.web === "gap").map((f) => f.name),
  };
}
