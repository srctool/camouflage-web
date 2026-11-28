// The shared drawing of the W9 renderers: the split pane's divider and the scrollbar. A skin supplies `defaults(theme)`
// and spreads the base. The elements own geometry, drag and keys; these only draw.
import { css, html } from "lit";
import type {
  Renderer,
  ScrollbarSlots,
  ScrollbarState,
  ScrollbarStyle,
  SplitDividerState,
  SplitPaneSlots,
  SplitPaneStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

export const splitPaneBase: Base<SplitDividerState, SplitPaneSlots, SplitPaneStyle> = {
  styles: css`
    /* The divider is as thick as the style says and runs across the panes: the line fills it. */
    .line {
      position: absolute;
      inset: 0;
      background: var(--sp-line);
      transition: background var(--camo-motion-duration-short);
    }
    .divider:hover .line {
      background: var(--sp-hover);
    }
    .divider .line.dragging {
      background: var(--sp-dragging);
    }
    /* A small bar along the line: --camo-split-row is 1 for panes side by side and 0 stacked. */
    .grip {
      position: absolute;
      inset: 0;
      margin: auto;
      z-index: 1;
      inline-size: calc(
        var(--camo-split-row, 1) * var(--camo-spacing-xs) + (1 - var(--camo-split-row, 1)) *
          var(--camo-spacing-xl)
      );
      block-size: calc(
        var(--camo-split-row, 1) * var(--camo-spacing-xl) + (1 - var(--camo-split-row, 1)) *
          var(--camo-spacing-xs)
      );
      border-radius: var(--camo-shape-full);
      background: var(--sp-hover);
    }
    @media (forced-colors: active) {
      .line,
      .grip {
        background: CanvasText;
      }
    }
  `,
  render({ state, style }) {
    const vars = [
      `--sp-line: ${style.line}`,
      `--sp-hover: ${style.hover}`,
      `--sp-dragging: ${style.dragging}`,
    ].join("; ");
    return html`<span class="line ${state.dragging ? "dragging" : ""}" part="line" style=${vars}></span
      >${style.grip ? html`<span class="grip" part="grip" style=${vars}></span>` : ""}`;
  },
};

export const scrollbarBase: Base<ScrollbarState, ScrollbarSlots, ScrollbarStyle> = {
  styles: css`
    .track {
      position: absolute;
      display: block;
      background: transparent;
      opacity: 0;
      transition:
        opacity var(--camo-motion-duration-long),
        inline-size var(--camo-motion-duration-short),
        block-size var(--camo-motion-duration-short);
      pointer-events: auto;
      touch-action: none;
    }
    .track.visible {
      opacity: 1;
      transition-duration: var(--camo-motion-duration-short);
    }
    .track.vertical {
      inset-block: 0;
      inset-inline-end: 0;
      inline-size: var(--sc-hover-thickness);
    }
    .track.horizontal {
      inset-inline: 0;
      inset-block-end: 0;
      block-size: var(--sc-hover-thickness);
    }
    .track:hover,
    .track.dragging {
      background: var(--sc-track);
      opacity: 1;
    }
    .thumb {
      position: absolute;
      box-sizing: border-box;
      border-radius: var(--camo-shape-full);
      background: var(--sc-thumb);
      transition:
        inline-size var(--camo-motion-duration-short),
        block-size var(--camo-motion-duration-short);
    }
    .vertical .thumb {
      inset-inline-end: 0;
      inset-block-start: var(--sc-start);
      block-size: var(--sc-length);
      inline-size: var(--sc-thickness);
    }
    .horizontal .thumb {
      inset-block-end: 0;
      inset-inline-start: var(--sc-start);
      inline-size: var(--sc-length);
      block-size: var(--sc-thickness);
    }
    .track:hover .thumb {
      background: var(--sc-thumb-hover);
    }
    .vertical:hover .thumb,
    .vertical.dragging .thumb {
      inline-size: var(--sc-hover-thickness);
    }
    .horizontal:hover .thumb,
    .horizontal.dragging .thumb {
      block-size: var(--sc-hover-thickness);
    }
    .track.dragging .thumb {
      background: var(--sc-thumb-drag);
    }
    /* High contrast: the system's own colors, so the thumb never disappears. */
    @media (forced-colors: active) {
      .thumb {
        background: CanvasText !important;
      }
    }
  `,
  render({ state, style }) {
    const vars = [
      `--sc-thickness: ${style.thickness}`,
      `--sc-hover-thickness: ${style.hoverThickness}`,
      `--sc-thumb: ${style.thumb}`,
      `--sc-thumb-hover: ${style.thumbHover}`,
      `--sc-thumb-drag: ${style.thumbDrag}`,
      `--sc-track: ${style.track}`,
      `--sc-start: ${state.thumbStart * 100}%`,
      `--sc-length: ${state.thumbLength * 100}%`,
    ].join("; ");
    return html`<span
      class="track ${state.orientation} ${state.visible ? "visible" : ""} ${state.dragging ? "dragging" : ""}"
      part="track"
      data-part="track"
      data-key=${state.orientation}
      style=${vars}
      ><span class="thumb" part="thumb" data-part="thumb"></span
    ></span>`;
  },
};
