// The shared drawing of the calendar and the time picker's panel. The renderer binds the buttons to `state.actions` and
// decides nothing: which days exist, which are enabled and what a click means all come from core.
import { css, html, nothing } from "lit";
import type { TemplateResult } from "lit";
import { ref } from "lit/directives/ref.js";
import type {
  CalendarSlots,
  CalendarState,
  CalendarStyle,
  Renderer,
  TimePickerSlots,
  TimePickerState,
  TimePickerStyle,
} from "./types.ts";

type Base<State, Slots extends string, Style> = Pick<
  Renderer<State, Slots, Style>,
  "render" | "styles"
>;

const CHEVRON = "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z";

export const calendarBase: Base<CalendarState, CalendarSlots, CalendarStyle> = {
  styles: css`
    :host {
      display: inline-block;
    }
    .cal {
      display: inline-flex;
      flex-direction: column;
      gap: var(--camo-spacing-s);
      color: var(--k-text);
    }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--camo-spacing-s);
    }
    .month {
      font: var(--k-title-font);
      text-align: center;
      flex: 1 1 auto;
    }
    .nav {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 48px;
      block-size: 48px;
      border-radius: 50%;
      cursor: pointer;
      color: var(--k-text);
    }
    .nav svg {
      inline-size: 24px;
      block-size: 24px;
      fill: currentColor;
    }
    .nav.next svg {
      transform: scaleX(-1);
    }
    :host(:dir(rtl)) .nav svg {
      transform: scaleX(-1);
    }
    :host(:dir(rtl)) .nav.next svg {
      transform: none;
    }
    .nav[disabled] {
      cursor: default;
      opacity: 0.38;
    }
    .nav:focus-visible,
    .day:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
    }
    table {
      border-collapse: collapse;
      table-layout: fixed;
    }
    th {
      font: var(--k-label-font);
      color: var(--k-weekday);
      font-weight: 500;
      padding: 0;
      block-size: var(--k-day);
    }
    td {
      padding: 0;
      text-align: center;
      position: relative;
    }
    .day {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: max(var(--k-day), 48px);
      block-size: max(var(--k-day), 48px);
      position: relative;
      cursor: pointer;
      font: var(--k-body-font);
      font-variant-numeric: tabular-nums;
      color: var(--k-text);
    }
    .day::before {
      content: "";
      position: absolute;
      inset: 50% auto auto 50%;
      translate: -50% -50%;
      inline-size: var(--k-day);
      block-size: var(--k-day);
      border-radius: var(--k-shape);
      background: transparent;
      z-index: -1;
    }
    td {
      isolation: isolate;
    }
    .day.today::before {
      box-shadow: inset 0 0 0 1px var(--camo-color-primary);
    }
    .day.selected {
      color: var(--camo-color-on-primary);
    }
    .day.selected::before {
      background: var(--camo-color-primary);
    }
    .day.start,
    .day.end {
      color: var(--camo-color-on-primary);
    }
    .day.start::before,
    .day.end::before {
      background: var(--camo-color-primary);
    }
    .day.middle::before {
      background: var(--camo-color-primary-container);
      inline-size: 100%;
      border-radius: 0;
    }
    .day.middle {
      color: var(--camo-color-on-primary-container);
    }
    .day.outside {
      color: var(--k-weekday);
    }
    .day[aria-disabled="true"] {
      cursor: default;
      color: color-mix(in srgb, var(--camo-color-on-surface) 38%, transparent);
    }
  `,

  render({ state, style, theme }) {
    const t = theme.typography;
    const font = (x: typeof t.bodyLarge): string =>
      `${x.weight} ${x.size}/${x.lineHeight} ${x.family}`;
    const vars = [
      `--k-day: ${style.daySize}`,
      `--k-shape: ${style.shape}`,
      `--k-text: ${theme.colors.onSurface}`,
      `--k-weekday: ${theme.colors.onSurfaceVariant}`,
      `--k-title-font: ${font(t.titleSmall)}`,
      `--k-label-font: ${font(t.labelMedium)}`,
      `--k-body-font: ${font(t.bodyMedium)}`,
    ].join("; ");
    const a = state.actions;
    const nav = (
      kind: "prev" | "next",
      label: string,
      enabled: boolean,
      go: () => void,
    ): TemplateResult =>
      html`<button
        class="nav ${kind === "prev" ? "prev" : "next"}"
        type="button"
        aria-label=${label}
        ?disabled=${!enabled}
        @click=${go}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d=${CHEVRON} /></svg>
      </button>`;
    const day = (d: CalendarState["weeks"][number][number]): TemplateResult | typeof nothing => {
      if (!d.inMonth && !style.showOutsideDays) return nothing;
      const classes = [
        "day",
        d.selected ? "selected" : "",
        d.today ? "today" : "",
        d.range !== "none" ? d.range : "",
        d.inMonth ? "" : "outside",
      ]
        .filter((c) => c !== "")
        .join(" ");
      return html`<button
        class=${classes}
        type="button"
        data-date=${d.iso}
        tabindex=${d.tabbable ? 0 : -1}
        aria-label=${d.label}
        aria-pressed=${d.selected ? "true" : "false"}
        aria-disabled=${d.enabled ? "false" : "true"}
        aria-current=${d.today ? "date" : nothing}
        @click=${() => d.enabled && a.select(d.iso)}
      >
        ${d.day}
      </button>`;
    };
    return html`<div class="cal" part="calendar" style=${vars}>
      <div class="head">
        ${nav("prev", state.previousLabel, state.canPrevious, a.previous)}
        <div class="month" id="month" aria-live="polite" part="month">${state.monthLabel}</div>
        ${nav("next", state.nextLabel, state.canNext, a.next)}
      </div>
      <table role="grid" aria-labelledby="month">
        <thead>
          <tr role="row">
            ${state.weekdays.map(
              (w) =>
                html`<th role="columnheader" scope="col" abbr=${w.long} aria-label=${w.long}>${w.short}</th>`,
            )}
          </tr>
        </thead>
        <tbody>
          ${state.weeks.map(
            (week) =>
              html`<tr role="row">
                ${week.map(
                  (d) =>
                    html`<td role="gridcell" aria-selected=${d.selected ? "true" : "false"}>${day(d)}</td>`,
                )}
              </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  },
};

const pad = (n: number): string => String(n).padStart(2, "0");

export const timePickerBase: Base<TimePickerState, TimePickerSlots, TimePickerStyle> = {
  styles: css`
    :host {
      display: inline-block;
    }
    .tp {
      display: inline-flex;
      align-items: center;
      gap: var(--camo-spacing-s);
      color: var(--tp-text);
    }
    .tp .sep {
      font: var(--tp-digit-font);
    }
    .digits {
      box-sizing: border-box;
      inline-size: 2.2em;
      padding: var(--camo-spacing-s);
      border: 1px solid var(--camo-color-outline);
      border-radius: var(--tp-shape);
      background: var(--camo-color-surface);
      color: inherit;
      font: var(--tp-digit-font);
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .digits:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      border-color: var(--camo-color-primary);
    }
    .period {
      display: inline-flex;
      flex-direction: column;
      border: 1px solid var(--camo-color-outline);
      border-radius: var(--tp-shape);
      overflow: hidden;
    }
    .period button {
      all: unset;
      box-sizing: border-box;
      padding: var(--camo-spacing-s) var(--camo-spacing-m);
      min-block-size: 48px;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      font: var(--tp-label-font);
    }
    .period button[aria-pressed="true"] {
      background: var(--camo-color-secondary-container);
      color: var(--camo-color-on-secondary-container);
    }
    .period button:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
    .wheel {
      position: relative;
      block-size: calc(var(--tp-item) * 5);
      overflow-y: auto;
      scroll-snap-type: y mandatory;
      scrollbar-width: none;
      min-inline-size: 3.5em;
      text-align: center;
      font: var(--tp-digit-font);
      outline: none;
      mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent);
    }
    .wheel::-webkit-scrollbar {
      display: none;
    }
    .wheel:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: 2px;
    }
    .wheel .pad {
      block-size: calc(var(--tp-item) * 2);
    }
    .wheel .opt {
      block-size: var(--tp-item);
      line-height: var(--tp-item);
      scroll-snap-align: center;
      font-variant-numeric: tabular-nums;
    }
    .band {
      position: absolute;
      inset-inline: 0;
      inset-block-start: calc(var(--tp-item) * 2);
      block-size: var(--tp-item);
      border-radius: var(--tp-shape);
      background: color-mix(in srgb, var(--camo-color-on-surface) 8%, transparent);
      pointer-events: none;
    }
    .col {
      position: relative;
    }
  `,

  render({ state, style, theme }) {
    const t = theme.typography;
    const font = (x: typeof t.bodyLarge): string =>
      `${x.weight} ${x.size}/${x.lineHeight} ${x.family}`;
    const vars = [
      `--tp-text: ${theme.colors.onSurface}`,
      `--tp-shape: ${style.shape}`,
      `--tp-item: ${style.digitSize}`,
      `--tp-digit-font: ${font(t.headlineMedium)}`,
      `--tp-label-font: ${font(t.labelLarge)}`,
    ].join("; ");
    const a = state.actions;
    const shownHour = state.is24Hour ? state.hour : state.hour % 12 === 0 ? 12 : state.hour % 12;
    const hour12To24 = (h: number): number => {
      const base = h % 12;
      return state.period === "pm" ? base + 12 : base;
    };
    const setHourShown = (h: number): void => a.setHour(state.is24Hour ? h : hour12To24(h));
    const wheelOptions = state.is24Hour ? state.hours : state.hours;

    if (style.style === "fields") {
      const field = (
        label: string,
        value: number,
        options: number[],
        set: (v: number) => void,
      ): TemplateResult => html`<input
        class="digits"
        type="text"
        inputmode="numeric"
        role="spinbutton"
        aria-label=${label}
        aria-valuenow=${value}
        aria-valuemin=${options[0] ?? 0}
        aria-valuemax=${options.at(-1) ?? 0}
        .value=${pad(value)}
        @change=${(e: Event) => {
          const n = Number((e.target as HTMLInputElement).value);
          if (options.includes(n)) set(n);
          else (e.target as HTMLInputElement).value = pad(value);
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          const at = options.indexOf(value);
          const next =
            options[(at + (e.key === "ArrowUp" ? 1 : -1) + options.length) % options.length];
          if (next !== undefined) set(next);
        }}
      />`;
      return html`<div class="tp" part="picker" style=${vars}>
        ${field(state.hourLabel, shownHour, wheelOptions, setHourShown)}<span class="sep">:</span>${field(
          state.minuteLabel,
          state.minute,
          state.minutes,
          a.setMinute,
        )}
        ${
          state.is24Hour
            ? nothing
            : html`<span class="period" role="group">
              <button type="button" aria-pressed=${state.period === "am"} @click=${() => a.setPeriod("am")}>
                ${state.periodLabels.am}
              </button>
              <button type="button" aria-pressed=${state.period === "pm"} @click=${() => a.setPeriod("pm")}>
                ${state.periodLabels.pm}
              </button>
            </span>`
        }
      </div>`;
    }

    // Wheels: a scrolling column per part, snapped to its item; each is one adjustable control.
    const wheel = (
      label: string,
      value: number,
      options: number[],
      text: (v: number) => string,
      set: (v: number) => void,
    ): TemplateResult => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const index = Math.max(options.indexOf(value), 0);
      return html`<div class="col">
        <div class="band"></div>
        <div
          class="wheel"
          role="spinbutton"
          tabindex="0"
          aria-label=${label}
          aria-valuenow=${value}
          aria-valuemin=${options[0] ?? 0}
          aria-valuemax=${options.at(-1) ?? 0}
          aria-valuetext=${text(value)}
          ${ref((el) => {
            if (!(el instanceof HTMLElement)) return;
            const item = el.querySelector<HTMLElement>(".opt");
            const height = item?.offsetHeight ?? 0;
            if (height > 0 && Math.abs(el.scrollTop - index * height) > 1)
              el.scrollTop = index * height;
          })}
          @scroll=${(e: Event) => {
            const el = e.currentTarget as HTMLElement;
            clearTimeout(timer);
            timer = setTimeout(() => {
              const height = el.querySelector<HTMLElement>(".opt")?.offsetHeight ?? 0;
              const picked = options[Math.round(el.scrollTop / Math.max(height, 1))];
              if (picked !== undefined && picked !== value) set(picked);
            }, 120);
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
            e.preventDefault();
            const next =
              options[
                Math.min(Math.max(index + (e.key === "ArrowUp" ? 1 : -1), 0), options.length - 1)
              ];
            if (next !== undefined) set(next);
          }}
        >
          <div class="pad"></div>
          ${options.map((o) => html`<div class="opt" aria-hidden="true">${text(o)}</div>`)}
          <div class="pad"></div>
        </div>
      </div>`;
    };
    return html`<div class="tp" part="picker" style=${vars}>
      ${wheel(state.hourLabel, shownHour, wheelOptions, (v) => (state.is24Hour ? pad(v) : String(v)), setHourShown)}
      ${wheel(state.minuteLabel, state.minute, state.minutes, pad, a.setMinute)}
      ${
        state.is24Hour
          ? nothing
          : wheel(
              "AM/PM",
              state.period === "am" ? 0 : 1,
              [0, 1],
              (v) => (v === 0 ? state.periodLabels.am : state.periodLabels.pm),
              (v) => a.setPeriod(v === 0 ? "am" : "pm"),
            )
      }
    </div>`;
  },
};
