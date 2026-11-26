// The main entry: types, math, styles and the element classes. Importing it defines nothing and touches no browser API.
// Import "@srctool/camouflage-charts/define" to register the elements.
export type {} from "./elements.ts";
export { CamoChartsProvider } from "./components/charts-provider.ts";
export { CamoChartFrame } from "./components/chart-frame.ts";
export { CamoChartDataTable } from "./components/chart-data-table.ts";
export { CamoSparkline } from "./components/sparkline.ts";
export { CamoLineChart } from "./components/line-chart.ts";
export { CamoBarChart, barDomain } from "./components/bar-chart.ts";
export { CamoPieChart } from "./components/pie-chart.ts";
export {
  CamoCharts,
  resolveChartStyle,
  themePalette,
  styleFromTokens,
  seriesColor,
} from "./style.ts";
export type { ChartColor, ChartStyle, ResolvedChartStyle } from "./style.ts";
export { defaultChartRenderer, chartRendererContext } from "./renderer.ts";
export type {
  BarChartSpec,
  ChartRenderer,
  LineChartSpec,
  LineSeriesSpec,
  PieChartSpec,
  SparklineHighlight,
  SparklineKind,
  SparklineSpec,
} from "./renderer.ts";
export type { LegendItem } from "./shared/frame.ts";
export {
  DEFAULT_TICK_COUNT,
  formatChartNumber,
  niceTicks,
  valueDomain,
  fraction,
} from "./math/scale.ts";
export type { ChartAxis, ValueDomain } from "./math/scale.ts";
export { chartSummary, noChartData, walkTarget } from "./math/summary.ts";
export type { ChartSeries } from "./math/summary.ts";
export {
  dataRange,
  downsample,
  extremes,
  sparklinePoints,
  sparklineSummary,
} from "./math/spark.ts";
export type { Point } from "./math/spark.ts";
export { curvePieces, gapRuns, nearestIndex, pathData, stack, stepPoints } from "./math/line.ts";
export type { Cubic, LineCurve, LineKind, MarkerVisibility, StackBand } from "./math/line.ts";
export { barRects, nearestBar } from "./math/bar.ts";
export type { BarMode, BarOrientation, BarRect } from "./math/bar.ts";
export {
  PIE_TOP,
  pieSummary,
  polar,
  sectorPath,
  shareText,
  sliceAngles,
  sliceAt,
} from "./math/pie.ts";
export type { PieSlice, SliceAngle } from "./math/pie.ts";
export { TIME_STEPS, formatChartTime, timeTicks, validTimes } from "./math/time.ts";
export type { TimeStep, TimeTicks } from "./math/time.ts";
