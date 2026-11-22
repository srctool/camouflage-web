/** The contract of a component as the base notes name it, with the web conventions applied (names in kebab-case). */
export interface ComponentContract {
  tag: string;
  className: string;
  /** Attribute name and, for an enum, the values it must accept. */
  attributes: Record<string, readonly string[] | null>;
  /** Slot names; `""` is the default slot. */
  slots: readonly string[];
  events: readonly string[];
  /** Contract parameter names that must NOT appear (a default-true boolean is inverted: `enabled` is `disabled`). */
  forbidden?: readonly string[];
}

interface Manifest {
  modules: {
    declarations?: {
      kind: string;
      name: string;
      tagName?: string;
      attributes?: { name: string; type?: { text: string } }[];
      slots?: { name: string }[];
      events?: { name: string }[];
    }[];
  }[];
}

/** Reads `type Name = "a" | "b"` aliases out of a source text, so an enum's values can be checked by name. */
export function unionAliases(source: string): Map<string, string[]> {
  const aliases = new Map<string, string[]>();
  for (const [, name, body] of source.matchAll(
    /export type (\w+) =\s*\|?\s*((?:"[\w-]+"\s*\|?\s*)+);/g,
  )) {
    aliases.set(
      name!,
      [...body!.matchAll(/"([\w-]+)"/g)].map((m) => m[1]!),
    );
  }
  return aliases;
}

/** Every way the manifest differs from the contract; an empty list means it matches. */
export function checkManifest(
  manifest: Manifest,
  contracts: readonly ComponentContract[],
  aliases: Map<string, string[]>,
): string[] {
  const problems: string[] = [];
  const classes = manifest.modules.flatMap((m) => m.declarations ?? []).filter((d) => d.tagName);
  for (const c of contracts) {
    const found = classes.find((d) => d.tagName === c.tag);
    if (found === undefined) {
      problems.push(`${c.tag}: missing from the manifest`);
      continue;
    }
    if (found.name !== c.className)
      problems.push(`${c.tag}: class is ${found.name}, not ${c.className}`);
    const attributes = found.attributes ?? [];
    for (const [name, values] of Object.entries(c.attributes)) {
      const attribute = attributes.find((a) => a.name === name);
      if (attribute === undefined) {
        problems.push(`${c.tag}: attribute "${name}" is missing`);
        continue;
      }
      if (values === null) continue;
      const names = (attribute.type?.text ?? "").match(/[A-Za-z]\w*/g) ?? [];
      const accepted = new Set(names.flatMap((n) => aliases.get(n) ?? []));
      for (const value of values) {
        if (!accepted.has(value))
          problems.push(`${c.tag}: attribute "${name}" does not accept "${value}"`);
      }
    }
    const slots = new Set((found.slots ?? []).map((s) => s.name));
    for (const slot of c.slots) {
      if (!slots.has(slot))
        problems.push(`${c.tag}: slot "${slot === "" ? "(default)" : slot}" is missing`);
    }
    const events = new Set((found.events ?? []).map((e) => e.name));
    for (const event of c.events) {
      if (!events.has(event)) problems.push(`${c.tag}: event "${event}" is missing`);
    }
    for (const name of c.forbidden ?? []) {
      if (attributes.some((a) => a.name === name))
        problems.push(`${c.tag}: "${name}" must be inverted`);
    }
    for (const attribute of attributes) {
      if (!/^[a-z]+(-[a-z]+)*$/.test(attribute.name) && !attribute.name.startsWith("data-")) {
        problems.push(`${c.tag}: attribute "${attribute.name}" is not kebab-case`);
      }
    }
  }
  return problems;
}
