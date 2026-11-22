# Adding a component

A checklist, in order. Each step is checked by something that fails if it is skipped.

1. **The contract.** Add the component to `contract/camouflage-contract.json`: parameters (with enum values and defaults)
   and theme fields, from the component's base note. A default-true boolean needs an entry in `INVERTED`
   (`tools/contract.ts`). _Fails:_ the manifest test, if the element lacks anything the contract names.
2. **The types.** In `packages/core/src/skin/types.ts` add the state, style and slot types and the renderer's line in
   `SkinComponents`; add the theme type and its fields in `theme/types.ts` and `theme/schema.ts`. _Fails:_ `tsc`, for every
   skin that has no renderer yet, naming the missing one; `defineSkin` and `pnpm skins` fail the same way at run time.
   Add the name to `names` in `skin/define.ts` (it will not compile otherwise).
3. **The element.** In `packages/core/src/components/<name>.ts`: a Lit element with `static properties` and `declare` fields, state
   in properties, accessibility through `applyAria`, behavior from `core/src/behavior`, and the JSDoc the manifest reads
   (`@tagname`, `@attr`, `@slot`, `@fires`). Register it in `define.ts`. Server rendering needs nothing more: read state from attributes only.
4. **The renderers.** One per skin: `defaults(theme)` returning a complete style (a field reads `var(--camo-<name>-<field>, fallback)`),
   and a pure `render`. Use logical properties, tokens only, and set `--camo-content-color` and `--camo-icon-size` before a slot.
   Export each renderer on its own so other skins can borrow it.
5. **The scenarios.** Add entries to `scenarios/scenarios.json`: one per appearance and state. No code: the harness, the
   screenshot runner and the conformance checks pick them up.
6. **Generate.** `pnpm typings` (tag map, event map, React and Vue), `pnpm manifest`.
7. **Check.** `pnpm check`, then the Storybook screenshots (`docs/testing.md`) and commit the `-linux.png` baselines from CI.
8. **Size.** If `pnpm size` fails, raise the budget in the same pull request, and say the new size.
9. **Docs.** The component's note: what the spike or the milestone settled, and any gap in the contract (a theme field the web
   cannot carry).
