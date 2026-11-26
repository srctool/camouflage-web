// Cupertino's materials (ADR-42). Bars, sheets, menus, popovers and snackbars let what is behind show through a blur;
// everything else stays opaque, as on iOS. The chain is decided by CSS the provider feeds (`--camo-blur-supported`,
// `--camo-glass-refraction`): Liquid Glass with refraction, glass with its edge alone, the Classic blur, then an opaque
// fill, which is also what Reduce Transparency, no `backdropBlur` and the server's first paint draw.
import { cssBlock } from "@srctool/camouflage-core";
import type { CamoSkin, Renderer, RenderArgs } from "@srctool/camouflage-core";
import { html } from "lit";
import { svg } from "lit";

/** The two materials: system blur (Classic) and Liquid Glass. */
export type CupertinoSurface = "classic" | "liquid-glass";

const ON = "var(--camo-blur-supported, 0)";

// How much of the color is given up to what is behind, and the blur's radius.
const LOOK = {
  classic: { through: 20, blur: "var(--camo-material-blur-radius, 25px)" },
  "liquid-glass": { through: 45, blur: "var(--camo-material-blur-radius, 16px)" },
} as const;

/** The declarations that turn a region of `color` into the material. */
function paint(kind: CupertinoSurface, color: string): string {
  const { through, blur } = LOOK[kind];
  const refraction = kind === "liquid-glass" ? "var(--camo-glass-refraction,) " : "";
  const filter = `${refraction}blur(calc(${ON} * ${blur})) saturate(180%)`;
  // Glass has a bright specular edge, a faint dark rim and a short shadow, so it shows on a light page too.
  const light = (share: number): string =>
    `color-mix(in srgb, var(--camo-glass-highlight, white) calc(${ON} * ${share}%), transparent)`;
  const dark = (share: number): string =>
    `color-mix(in srgb, var(--camo-color-scrim) calc(${ON} * ${share}%), transparent)`;
  const hair = "var(--camo-spacing-xxs)";
  const edge =
    kind === "liquid-glass"
      ? ` box-shadow: inset 0 calc(${hair} / 2) 0 ${light(55)}, inset 0 0 0 calc(${hair} / 2) ${light(18)}, 0 0 0 calc(${hair} / 4) ${dark(12)}, 0 ${hair} calc(${hair} * 3) ${dark(12)} !important;`
      : "";
  return `background: color-mix(in srgb, ${color} calc(100% - ${ON} * ${through}%), transparent) !important; -webkit-backdrop-filter: ${filter}; backdrop-filter: ${filter};${edge}`;
}

// The lens: the backdrop displaced by a smooth field. Referenced from the same shadow root.
const LENS = html`<svg width="0" height="0" style="position: absolute" aria-hidden="true" focusable="false">
  ${svg`<filter id="camo-glass" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="1" seed="4" result="field" />
    <feDisplacementMap in="SourceGraphic" in2="field" scale="28" xChannelSelector="R" yChannelSelector="G" />
  </filter>`}
</svg>`;

/** `renderer` drawn on the material: `colorOf` is the fill it would have had, `selector` the region that has it. */
function material<State, Slots extends string, Style>(
  kind: CupertinoSurface,
  renderer: Renderer<State, Slots, Style>,
  colorOf: (args: RenderArgs<State, Slots, Style>) => string | null,
  selector: string = ".camo-surface",
): Renderer<State, Slots, Style> {
  return {
    ...renderer,
    defaults: (theme) => renderer.defaults(theme),
    render(args) {
      const color = colorOf(args);
      if (color === null) return renderer.render(args);
      return html`${cssBlock(`${selector} { ${paint(kind, color)} }`)}${renderer.render(args)}${
        kind === "liquid-glass" ? LENS : ""
      }`;
    },
  };
}

/** The renderers of `skin` that are materials, drawn with `kind`. */
export function materials(kind: CupertinoSurface, skin: CamoSkin): Partial<CamoSkin> {
  return {
    topBar: material(kind, skin.topBar, () => "var(--tb-bg)", ".bar"),
    navigationBar: material(kind, skin.navigationBar, ({ style }) => style.container),
    toolbar: material(kind, skin.toolbar, ({ style }) => style.container),
    bottomSheet: material(kind, skin.bottomSheet, ({ theme }) => theme.colors.surfaceContainerLow),
    sideSheet: material(kind, skin.sideSheet, ({ state, style }) =>
      state.modal ? style.modalContainer : style.container,
    ),
    menu: material(kind, skin.menu, ({ theme }) => theme.colors.surfaceContainer),
    popover: material(kind, skin.popover, ({ style }) => style.container),
    dialog: material(kind, skin.dialog, ({ style }) => style.container),
    snackbar: material(kind, skin.snackbar, ({ style }) => style.container),
    // Glass controls: the quiet buttons are glass too, and every button is a capsule.
    ...(kind === "liquid-glass"
      ? {
          button: material(
            kind,
            {
              ...skin.button,
              defaults: (theme) => ({
                ...skin.button.defaults(theme),
                shape: `var(--camo-button-shape, ${theme.shapes.full})`,
              }),
            },
            ({ state, style }) =>
              state.disabled || !["soft", "raised", "outline"].includes(state.appearance)
                ? null
                : style.soft.container,
          ),
        }
      : {}),
  };
}
