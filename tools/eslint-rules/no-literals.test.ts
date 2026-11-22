import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";
import rule from "./no-literals.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { ecmaVersion: 2022, sourceType: "module" } });

tester.run("camo/no-literals", rule, {
  valid: [
    // tokens and style fields
    { code: "const a = `color: var(--camo-color-primary); height: ${style.height}`;" },
    { code: 'const a = "padding: var(--camo-spacing-l, 16px)";' },
    { code: "const a = `animation: spin calc(var(--camo-motion-duration-medium) * 3) linear`;" },
    // literals are allowed in defaults(), where a skin sets its complete component theme
    {
      code: 'export const r = { defaults(theme) { return { height: "40px", color: "#ff0000", d: "120ms" }; } };',
    },
    { code: 'class R { defaults() { return "8px"; } }' },
    // unitless numbers, percentages and keywords are not sizes or colors
    { code: "const a = `opacity: 0; flex: 1 1 auto; width: 50%; z-index: 2`;" },
  ],
  invalid: [
    { code: 'const a = "color: #1b1b1b";', errors: [{ messageId: "literal" }] },
    { code: "const a = `background: rgb(0 0 0 / 0.4)`;", errors: [{ messageId: "literal" }] },
    { code: "const a = `border: 1px solid ${c}`;", errors: [{ messageId: "literal" }] },
    { code: 'const a = "transition: opacity 120ms";', errors: [{ messageId: "literal" }] },
    { code: 'const a = "gap: 0.5rem";', errors: [{ messageId: "literal" }] },
    { code: "const a = `color: red`;", errors: [{ messageId: "literal" }] },
    // outside defaults(), even in the same object
    {
      code: 'export const r = { defaults() { return "8px"; }, render() { return "margin: 8px"; } };',
      errors: [{ messageId: "literal" }],
    },
  ],
});
