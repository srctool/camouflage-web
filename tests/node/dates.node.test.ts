import { dates } from "@srctool/camouflage-core";
import { describe, expect, it } from "vitest";

describe("calendar dates", () => {
  it("parses only real dates", () => {
    expect(dates.parseDate("2026-11-22")).toEqual({ year: 2026, month: 11, day: 22 });
    expect(dates.parseDate("2026-02-30")).toBeNull();
    expect(dates.parseDate("2024-02-29")).not.toBeNull();
    expect(dates.parseDate("2026-13-01")).toBeNull();
    expect(dates.parseDate("22/11/2026")).toBeNull();
    expect(dates.parseDate(null)).toBeNull();
  });
  it("adds days and months across ends, keeping the last day of a short month", () => {
    const d = dates.parseDate("2026-01-31")!;
    expect(dates.toIso(dates.addMonths(d, 1))).toBe("2026-02-28");
    expect(dates.toIso(dates.addMonths(d, -2))).toBe("2025-11-30");
    expect(dates.toIso(dates.addDays(d, 1))).toBe("2026-02-01");
    expect(dates.toIso(dates.addDays(dates.parseDate("2026-03-01")!, -1))).toBe("2026-02-28");
    expect(dates.compareDates(dates.parseDate("2026-11-22")!, dates.parseDate("2026-11-20")!)).toBe(
      2,
    );
  });
  it("lays a month out in whole weeks, from the locale's first day", () => {
    const sundayFirst = dates.monthGrid(2026, 11, 0);
    expect(sundayFirst[0]![0]).toEqual({ year: 2026, month: 11, day: 1 }); // 1 Nov 2026 is a Sunday
    expect(sundayFirst.every((w) => w.length === 7)).toBe(true);
    const mondayFirst = dates.monthGrid(2026, 11, 1);
    expect(mondayFirst[0]![0]).toEqual({ year: 2026, month: 10, day: 26 });
    expect(mondayFirst[0]![6]).toEqual({ year: 2026, month: 11, day: 1 });
  });
  it("knows the first day of the week by locale", () => {
    expect(dates.firstDayOfWeek("en-US")).toBe(0);
    expect(dates.firstDayOfWeek("en-GB")).toBe(1);
    expect(dates.firstDayOfWeek("de-DE")).toBe(1);
  });
  it("names the month, the weekdays and a full date with Intl", () => {
    expect(dates.monthLabel(2026, 11, "en-US")).toBe("November 2026");
    expect(dates.weekdayNames("en-US", 1).map((w) => w.long)[0]).toBe("Monday");
    expect(dates.fullDate({ year: 2026, month: 11, day: 22 }, "en-US")).toBe(
      "Sunday, November 22, 2026",
    );
    expect(dates.mediumDate({ year: 2026, month: 11, day: 22 }, "en-US")).toBe("Nov 22, 2026");
  });
  it("reads a typed date in the locale's order", () => {
    expect(dates.parseTypedDate("22/11/2026", "en-GB")).toBe("2026-11-22");
    expect(dates.parseTypedDate("11/22/2026", "en-US")).toBe("2026-11-22");
    expect(dates.parseTypedDate("31/02/2026", "en-GB")).toBeNull();
    expect(dates.parseTypedDate("nope", "en-GB")).toBeNull();
  });
});

describe("times", () => {
  it("parses and formats HH:mm", () => {
    expect(dates.parseTime("13:45")).toEqual({ hour: 13, minute: 45 });
    expect(dates.parseTime("24:00")).toBeNull();
    expect(dates.parseTime("9:05")).toBeNull();
    expect(dates.toIsoTime({ hour: 9, minute: 5 })).toBe("09:05");
  });
  it("chooses 12 or 24 hours by locale, and writes the time that way", () => {
    expect(dates.uses24Hour("en-US")).toBe(false);
    expect(dates.uses24Hour("en-GB")).toBe(true);
    expect(dates.timeText({ hour: 14, minute: 30 }, "en-US", false)).toMatch(/^2:30\s?PM$/);
    expect(dates.timeText({ hour: 14, minute: 30 }, "en-GB", true)).toBe("14:30");
    expect(dates.periodNames("en-US")).toEqual({ am: "AM", pm: "PM" });
  });
});
