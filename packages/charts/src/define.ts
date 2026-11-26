// Defines the chart elements, and the core elements they use (chips, skeleton).
import "@srctool/camouflage-core/define";
import { defineElement } from "@srctool/camouflage-core";
import { CamoBarChart } from "./components/bar-chart.ts";
import { CamoChartDataTable } from "./components/chart-data-table.ts";
import { CamoChartFrame } from "./components/chart-frame.ts";
import { CamoChartsProvider } from "./components/charts-provider.ts";
import { CamoLineChart } from "./components/line-chart.ts";
import { CamoPieChart } from "./components/pie-chart.ts";
import { CamoSparkline } from "./components/sparkline.ts";

defineElement("camo-charts-provider", CamoChartsProvider);
defineElement("camo-chart-frame", CamoChartFrame);
defineElement("camo-chart-data-table", CamoChartDataTable);
defineElement("camo-sparkline", CamoSparkline);
defineElement("camo-line-chart", CamoLineChart);
defineElement("camo-bar-chart", CamoBarChart);
defineElement("camo-pie-chart", CamoPieChart);
