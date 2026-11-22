# W0 spike findings

What the spike (srctool/camouflage-web#1, #4, #5, #6) learned. The decisions are ADR-46 (amended), ADR-47 and ADR-48 in the Camouflage design notes; this file keeps the evidence and the gaps.

## What was built

- `core`: `camo-provider`, `camo-button`, `camo-dialog`, the skin contract (button and dialog renderers only), the behavior layer (ARIA, activation), `showCamoDialog`.
- `skin-minimal` and `skin-cupertino`: renderers, generated starter themes, side-effect-free main entry, opt-in `register` entry.
- `apps/ssr-sample`: a plain Node server rendering with `@lit-labs/ssr`, a hydrating client, Playwright tests.
- `apps/tauri-sample`: a Tauri 2 host that runs the feature probe and the spike scenario in the platform webview, and the baseline table generator.
- `apps/next-sample`: Next.js 16 (App Router) with the same spike page and dialog, rendered by a Server Component through Lit's server package, with the same hydration tests.
- `apps/storybook`: Storybook 10 with base `/web/`, a skin and scheme toolbar, a screenshot run.
- Checks: layers, side effects, size budget, `camo/no-literals`, the manifest against the contract.

## Results

| Question                                                       | Result                                                                                                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same markup under Minimal and Cupertino with no element change | Yes. Cupertino stacks the dialog actions, Minimal puts them side by side, from one markup.                                                                                 |
| Server-rendered page correct with scripts off                  | Yes (declarative shadow DOM, theme and scheme in the first bytes).                                                                                                         |
| Hydration moves nothing                                        | Yes, under 50 differing pixels in Chromium and WebKit for the buttons page and for the dialog under both skins. Firefox runs in CI only (it cannot launch in the sandbox). |
| Skin renderers pure                                            | Yes, tested in Node with no DOM.                                                                                                                                           |
| Lit SSR or our own renderer                                    | Lit's server package (ADR-47).                                                                                                                                             |

## What went wrong, and the fix

| Problem                                             | Fix                                                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Context did not reach elements on the server        | `LitElementRenderer.renderOptions` with `connectedCallback: true`.                                                                |
| Elements were undefined on the server               | The DOM shim must load first, so `define` and `register` are `await import`ed after it.                                           |
| Role and name missing from server HTML              | Set in `willUpdate`, mirrored as `data-camo-ssr-aria` attributes that the client removes.                                         |
| A server-rendered dialog closed itself on hydration | `showModal()` needs it closed first; that `close` is ignored once (`#reopening`).                                                 |
| A server-rendered dialog sat at the top of the page | A frame style centres a non-modal open dialog like the modal it becomes; the skin paints the scrim with a `box-shadow`.           |
| WebKit drew a focus ring around the hydrated modal  | No outline on the dialog frame, and focus goes to an action (`autofocus`, else `dismiss`, else `confirm`) after its first update. |
| `title` attribute shows a native tooltip            | Read into the property and removed.                                                                                               |
| `<html>` in a Lit template                          | The shell is a string around the streamed template.                                                                               |
| The manifest analyzer ignores `defineElement()`     | `@tagname` JSDoc on each class; enum values resolved from `skin/types.ts` by the check.                                           |

## Next.js (App Router)

Works on Next 16.4 with React 19.3, in a production build, in Chromium and WebKit: the server HTML carries declarative shadow DOM, the page is correct with scripts off, hydration moves under 50 pixels, the dialog becomes modal in place, and hydration logs no error or warning (12 Playwright tests).

How (the pattern for apps):

- A **Server Component** renders a Lit template with `@lit-labs/ssr` (`lib/camo-ssr.ts`, the same shim-first order as the Node sample) and places the HTML with `dangerouslySetInnerHTML`. React does not hydrate that subtree, so it cannot disturb the shadow roots.
- A **Client Component** (`app/camo-client.tsx`) defines the elements in `useEffect` with dynamic imports in this order: the hydration support, then the skins' `register` entries, then `define` **last**. Defining an element upgrades it at once, so a skin registered after it makes the first client render differ from the server's and Lit throws "Hydration value mismatch".
- `@lit-labs/ssr` and Lit are `serverExternalPackages`, so Next does not bundle them (the shim patches globals).
- `@lit-labs/nextjs` is **not used**: its peer range is Next 13 to 15 and it is a webpack plugin, while Next 16 builds with Turbopack by default.

Limits to know:

- Plain JSX tags (`<camo-button text="Save">`) in a Server Component render the host element only, with no shadow content, so the page flashes unstyled until the elements are defined. Apps that want server-rendered shadow DOM use the Lit-template boundary above. A React wrapper (generated from the manifest, W10) can hide the boundary.
- Only a production build and `next start` were tested; `next dev` (Turbopack) was not.
- Pages that use it are dynamic (`force-dynamic`): the Lit render runs per request. Static generation was not tried.

## Not proven yet (named, with a place)

- The spike page in a Tauri window on Windows and Linux (macOS is done and matches); the WebKitGTK row of the browser baseline is unverified. See `browser-baseline.md`.
- The full skin contract: `CamoSkin` has only `button` and `dialog`; one required renderer per component arrives with W1.
- npm trusted publishing (#7) needs the owner's npm settings.
