// Numbers and axes, shared by every chart. Pure; the same results as the Kotlin and Dart charts.

/** How many ticks an axis aims for unless it says otherwise. */
export const DEFAULT_TICK_COUNT = 5;

/** A number as a person reads it: whole numbers without a decimal point, otherwise one decimal. */
export function formatChartNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value) >= 1e15) return String(Math.trunc(value));
  const tenths = Math.round(Math.abs(value) * 10);
  const sign = value < 0 && tenths !== 0 ? "-" : "";
  const whole = Math.floor(tenths / 10);
  const fraction = tenths % 10;
  return fraction === 0 ? `${sign}${whole}` : `${sign}${whole}.${fraction}`;
}

// The nearest "nice" step (1, 2, 5 times a power of ten) to `range`.
function niceNumber(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const power = 10 ** exponent;
  const fraction = range / power;
  const nice = round
    ? fraction < 1.5
      ? 1
      : fraction < 3
        ? 2
        : fraction < 7
          ? 5
          : 10
    : fraction <= 1
      ? 1
      : fraction <= 2
        ? 2
        : fraction <= 5
          ? 5
          : 10;
  return nice * power;
}

/**
 * Tick values for an axis over `min`..`max`, about `count` of them, at steps of 1, 2 or 5 times a power of ten. The first
 * tick is at or below `min` and the last at or above `max`. A zero-height range widens around its value.
 */
export function niceTicks(min: number, max: number, count: number = DEFAULT_TICK_COUNT): number[] {
  if (count < 2) throw new RangeError("A scale needs at least 2 ticks");
  let low = Math.min(min, max);
  let high = Math.max(min, max);
  if (low === high) {
    const pad = low === 0 ? 1 : Math.abs(low) * 0.1;
    low -= pad;
    high += pad;
  }
  const range = niceNumber(high - low, false);
  const step = niceNumber(range / (count - 1), true);
  const first = Math.floor(low / step) * step;
  const last = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  // Multiplying (not adding) keeps 0.1 + 0.2 style drift out of the ticks; rounding clears what is left.
  for (let i = 0; first + i * step <= last + step / 10; i++)
    ticks.push(Number((first + i * step).toPrecision(12)));
  return ticks;
}

/** An axis: an optional title, a fixed `min` or `max` (absent reads the data), the tick count and the tick format. */
export interface ChartAxis {
  title?: string;
  min?: number;
  max?: number;
  tickCount?: number;
  /** A function, so only a property can set it (`el.yAxis = { format }`). */
  format?: (value: number) => string;
}

/** The value axis of a chart: its ticks and the `low`..`high` it covers. */
export interface ValueDomain {
  ticks: number[];
  low: number;
  high: number;
}

/**
 * The value axis for data between `dataLow` and `dataHigh` (`null` for no data): the bounds the axis fixes, else nice
 * ticks around the data, widened to include zero when `includeZero`.
 */
export function valueDomain(
  dataLow: number | null,
  dataHigh: number | null,
  includeZero: boolean,
  axis: ChartAxis = {},
): ValueDomain {
  let low = dataLow ?? 0;
  let high = dataHigh ?? 1;
  if (includeZero) {
    low = Math.min(low, 0);
    high = Math.max(high, 0);
  }
  const ticks = niceTicks(axis.min ?? low, axis.max ?? high, axis.tickCount ?? DEFAULT_TICK_COUNT);
  const from = axis.min ?? ticks[0]!;
  const to = axis.max ?? ticks[ticks.length - 1]!;
  return { ticks: ticks.filter((t) => t >= from && t <= to), low: from, high: to };
}

/** Where `value` sits in a domain, as a fraction of it: 0 at the low end, 1 at the high end. */
export function fraction(domain: { low: number; high: number }, value: number): number {
  const span = domain.high - domain.low;
  return span === 0 ? 0 : (value - domain.low) / span;
}
