# The contract, the manifest and the typings

Three generated artifacts keep the web library honest against the base notes.

## `camouflage-contract.json`

`contract/camouflage-contract.json` (schema: `contract/schema.json`) lists each component by its base-note names: every
**parameter** (a value, a slot or a callback; enums with their values and defaults) and every **component-theme field**.
It is a draft shared with srctool/camouflage#64 (the MCP server reads it) and the generator; the web mapping is derived
from it by the rules of the Components note, in one place, `tools/contract.ts`:

| Contract                                                                                                      | Web                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| component `Button`                                                                                            | `<camo-button>`, class `CamoButton`                                                                                                                                                     |
| value `supportingText`                                                                                        | attribute `supporting-text`                                                                                                                                                             |
| enum `Appearance.Solid`                                                                                       | `appearance="solid"`                                                                                                                                                                    |
| `enabled: Boolean = true`                                                                                     | `disabled` (a default-true boolean is **inverted**; each inversion is listed in `INVERTED`: `enabled`, `singleLine` to `multiline`, `allowTyping` to `readonly`, `visible` to `hidden`) |
| widget `prefixIcon`                                                                                           | `slot="prefix-icon"`                                                                                                                                                                    |
| layout `content`                                                                                              | the default slot                                                                                                                                                                        |
| `onClick`, `onFocusChanged`, `onValueChange`, `onValueChangeFinished`, `onCheckedChange`, `onSelectionChange` | the native event (`click`, `focus`, `input`, `change`)                                                                                                                                  |
| any other `onFoo`                                                                                             | the `camo-foo` event                                                                                                                                                                    |
| theme field `height`                                                                                          | `--camo-button-height`                                                                                                                                                                  |

A theme field can be carried three ways (`web` in the schema): `variable` (the default), `tokens` (a text style or a set of
colors, which the web takes from the global typography and color tokens) or `gap`. A **gap** is a value that changes
structure or behavior (`actionsLayout`, `titleAlign`, `defaultAppearance`): the renderer is a pure function that reads no
styles, so a CSS variable cannot reach it. The gaps are listed, and tested, in `tests/node/contract.test.ts`; a field
leaves the list when the web carries it.

## The Custom Elements Manifest

The analyzer reads the elements' JSDoc (`@tagname`, `@attr`, `@slot`, `@fires`; it does not follow our `defineElement()`
helper). `pnpm manifest` writes `packages/core/custom-elements.json`, which the package publishes and names in its
`customElements` field. Skin packages define no elements, so they have no manifest.

`tests/node/manifest.test.ts` generates it fresh and checks it against the contract: every parameter, enum value, slot,
event and component exists, an inverted boolean is inverted, and attribute names are kebab-case. Take a slot out of the
class, or an enum value out of its type, and the test fails by name.

## Typings

`pnpm typings` generates, from the manifest:

| File                               | For                                                                                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/elements.ts`    | `HTMLElementTagNameMap` and `HTMLElementEventMap` (`document.createElement("camo-button")`, `addEventListener("camo-close")`), loaded with the main entry |
| `packages/core/typings/react.d.ts` | JSX for React 19: `import "@srctool/camouflage-core/react"`                                                                                               |
| `packages/core/typings/vue.d.ts`   | Vue's `GlobalComponents`, with typed props and events: `import "@srctool/camouflage-core/vue"`                                                            |

CI runs `pnpm typings:check`, which fails when a committed file is out of date. `tests/node/typings.test.ts` compiles a DOM, a
React and a Vue consumer (`tests/fixtures/consumers`) and checks that a wrong value (a tone that does not exist) is an error.
Angular needs `CUSTOM_ELEMENTS_SCHEMA` and no generated typing; Svelte reads the tag map.
