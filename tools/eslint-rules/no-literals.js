// Rejects color, size and duration literals in skin renderers (Skin Contract, rule 2: tokens only).
//
// A renderer's CSS and markup may name only `var(--camo-…)` tokens and the fields of its resolved style. Literals
// belong in `defaults()`, where the skin sets a complete component theme, so that method is exempt. The skin's
// surface and feedback files are materials with constants of their own and are not checked.

const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch|oklab|hwb|lab|lch)a?\(/;
const UNIT = /(?<![\w.-])\d+(?:\.\d+)?(?:px|rem|em|ms|s|vh|vw)\b/;
const NAMED = /:\s*(?:white|black|red|blue|green|gray|grey|orange|yellow|purple)\b/i;

function strip(text) {
  // What sits inside var(...) is a token reference and its fallback chain; the fallback of a skin default is a
  // literal by design, but it only appears in defaults(), which is exempt.
  return text.replace(/var\([^)]*\)/g, "");
}

function inDefaults(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (
      (p.type === "Property" || p.type === "MethodDefinition") &&
      p.key &&
      (p.key.name === "defaults" || p.key.value === "defaults")
    ) {
      return true;
    }
  }
  return false;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: { description: "Disallow color, size and duration literals in skin renderers." },
    schema: [],
    messages: {
      literal:
        "A renderer must not contain the literal {{ text }}: use a token (var(--camo-…)) or a field of the resolved style. Literals belong in defaults().",
    },
  },
  create(context) {
    function check(node, text) {
      if (inDefaults(node)) return;
      const clean = strip(text);
      const hit = COLOR.exec(clean) ?? UNIT.exec(clean) ?? NAMED.exec(clean);
      if (hit)
        context.report({ node, messageId: "literal", data: { text: JSON.stringify(hit[0]) } });
    }
    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
    };
  },
};
