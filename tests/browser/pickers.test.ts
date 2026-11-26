import { inspectAria } from "@srctool/camouflage-core";
import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { mount, settled, SKINS } from "./helpers.ts";

type El = HTMLElement & Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function page(skin: string, body: string, dir = "ltr", width = ""): Promise<HTMLElement> {
  const root = mount(
    `<div dir="${dir}"><camo-provider skin="${skin}" scheme="light" style="display:block;padding:24px;${width}">${body}</camo-provider></div>`,
  );
  await settled(root);
  return root;
}
const q = (root: ParentNode, selector: string): El => root.querySelector(selector) as El;
const day = (cal: Element, iso: string): HTMLElement =>
  cal.shadowRoot!.querySelector<HTMLElement>(`[data-date="${iso}"]`)!;
const TODAY = 'today="2026-11-22" locale="en-US"';
const data = (form: HTMLFormElement): [string, string][] =>
  [...new FormData(form).entries()].map(([k, v]) => [k, String(v)]);
const tick = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe.each(SKINS)("camo-calendar under %s", (skin) => {
  it("shows the month of the value, with names and the first weekday from the locale", async () => {
    const root = await page(
      skin,
      `<camo-calendar value="2026-11-18" ${TODAY}></camo-calendar><camo-calendar id="uk" value="2026-11-18" today="2026-11-22" locale="en-GB"></camo-calendar>`,
    );
    const cal = q(root, "camo-calendar");
    expect(cal.shadowRoot!.querySelector(".month")!.textContent).toBe("November 2026");
    const heads = (c: Element): string[] =>
      [...c.shadowRoot!.querySelectorAll("th")].map((t) => t.getAttribute("aria-label")!);
    expect(heads(cal)[0]).toBe("Sunday");
    expect(heads(q(root, "#uk"))[0]).toBe("Monday");
    expect(inspectAria(cal)).toMatchObject({ role: "group", label: "November 2026" });
  });

  it("announces each day with its full date and state", async () => {
    const root = await page(
      skin,
      `<camo-calendar value="2026-11-18" min="2026-11-05" ${TODAY}></camo-calendar>`,
    );
    const cal = q(root, "camo-calendar");
    expect(day(cal, "2026-11-18").getAttribute("aria-label")).toBe("Wednesday, November 18, 2026");
    expect(day(cal, "2026-11-18").getAttribute("aria-pressed")).toBe("true");
    expect(day(cal, "2026-11-22").getAttribute("aria-current")).toBe("date");
    expect(day(cal, "2026-11-03").getAttribute("aria-disabled")).toBe("true");
    expect(day(cal, "2026-11-20").getAttribute("aria-disabled")).toBe("false");
  });

  it("selects a day by click, fires before-change then input and change, and can be cancelled", async () => {
    const root = await page(skin, `<camo-calendar value="2026-11-18" ${TODAY}></camo-calendar>`);
    const cal = q(root, "camo-calendar");
    const log: string[] = [];
    for (const t of ["camo-before-change", "input", "change"])
      cal.addEventListener(t, () => log.push(t));
    day(cal, "2026-11-20").click();
    expect(cal.value).toBe("2026-11-20");
    expect(log).toEqual(["camo-before-change", "input", "change"]);
    cal.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    day(cal, "2026-11-21").click();
    expect(cal.value).toBe("2026-11-20");
  });

  it("does not select a disabled day: outside min and max, not selectable, or disabled", async () => {
    const root = await page(
      skin,
      `<camo-calendar value="2026-11-18" min="2026-11-10" max="2026-11-25" ${TODAY}></camo-calendar>`,
    );
    const cal = q(root, "camo-calendar");
    cal.isSelectable = (iso: string) => ![0, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay());
    await settled(root);
    day(cal, "2026-11-08").click();
    day(cal, "2026-11-28").click();
    day(cal, "2026-11-21").click(); // a Saturday
    expect(cal.value).toBe("2026-11-18");
    day(cal, "2026-11-20").click();
    expect(cal.value).toBe("2026-11-20");
  });

  it("pages by month, disables paging past min and max, and announces the month", async () => {
    const root = await page(
      skin,
      `<camo-calendar value="2026-11-18" min="2026-10-15" max="2026-12-10" ${TODAY}></camo-calendar>`,
    );
    const cal = q(root, "camo-calendar");
    const button = (kind: string): HTMLButtonElement =>
      cal.shadowRoot!.querySelector(`.nav.${kind}`) as HTMLButtonElement;
    button("next").click();
    await settled(root);
    expect(cal.shadowRoot!.querySelector(".month")!.textContent).toBe("December 2026");
    expect(button("next").disabled).toBe(true);
    expect(cal.shadowRoot!.querySelector(".month")!.getAttribute("aria-live")).toBe("polite");
    button("prev").click();
    button("prev").click();
    await settled(root);
    expect(cal.shadowRoot!.querySelector(".month")!.textContent).toBe("October 2026");
    expect(button("prev").disabled).toBe(true);
  });

  it("is one tab stop, and moves by day, week, month and year with the keys", async () => {
    const root = await page(skin, `<camo-calendar value="2026-11-18" ${TODAY}></camo-calendar>`);
    const cal = q(root, "camo-calendar");
    const stops = [...cal.shadowRoot!.querySelectorAll<HTMLElement>("button.day")].filter(
      (b) => b.tabIndex === 0,
    );
    expect(stops).toHaveLength(1);
    expect(stops[0]!.dataset["date"]).toBe("2026-11-18");
    const focused = (): string | undefined =>
      (cal.shadowRoot!.activeElement as HTMLElement | null)?.dataset["date"];
    day(cal, "2026-11-18").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(focused()).toBe("2026-11-19");
    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("2026-11-26");
    await userEvent.keyboard("{ArrowLeft}{ArrowUp}");
    expect(focused()).toBe("2026-11-18");
    await userEvent.keyboard("{Home}");
    expect(focused()).toBe("2026-11-15"); // a Sunday
    await userEvent.keyboard("{End}");
    expect(focused()).toBe("2026-11-21");
    await userEvent.keyboard("{PageDown}");
    expect(focused()).toBe("2026-12-21");
    expect(cal.shadowRoot!.querySelector(".month")!.textContent).toBe("December 2026");
    await userEvent.keyboard("{Shift>}{PageUp}{/Shift}");
    expect(focused()).toBe("2025-12-21");
    await userEvent.keyboard("{Enter}");
    expect(cal.value).toBe("2025-12-21");
  });

  it("arrow keys follow the reading direction in right-to-left", async () => {
    const root = await page(
      skin,
      `<camo-calendar value="2026-11-18" ${TODAY}></camo-calendar>`,
      "rtl",
    );
    const cal = q(root, "camo-calendar");
    day(cal, "2026-11-18").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect((cal.shadowRoot!.activeElement as HTMLElement).dataset["date"]).toBe("2026-11-17");
  });

  it("chooses a range: start, then end; a day before the start restarts; the middle days are marked", async () => {
    const root = await page(skin, `<camo-calendar range ${TODAY} month="2026-11"></camo-calendar>`);
    const cal = q(root, "camo-calendar");
    day(cal, "2026-11-10").click();
    expect([cal.start, cal.end]).toEqual(["2026-11-10", null]);
    day(cal, "2026-11-05").click(); // before the start: restart
    expect([cal.start, cal.end]).toEqual(["2026-11-05", null]);
    day(cal, "2026-11-09").click();
    expect([cal.start, cal.end]).toEqual(["2026-11-05", "2026-11-09"]);
    await settled(root);
    expect(day(cal, "2026-11-05").getAttribute("aria-label")).toContain("start of range");
    expect(day(cal, "2026-11-09").getAttribute("aria-label")).toContain("end of range");
    expect(day(cal, "2026-11-07").classList.contains("middle")).toBe(true);
    day(cal, "2026-11-20").click(); // a third tap starts over
    expect([cal.start, cal.end]).toEqual(["2026-11-20", null]);
  });

  it("limits a range to max-length days once a start is chosen", async () => {
    const root = await page(
      skin,
      `<camo-calendar range max-length="3" ${TODAY} month="2026-11"></camo-calendar>`,
    );
    const cal = q(root, "camo-calendar");
    day(cal, "2026-11-10").click();
    await settled(root);
    expect(day(cal, "2026-11-12").getAttribute("aria-disabled")).toBe("false");
    expect(day(cal, "2026-11-13").getAttribute("aria-disabled")).toBe("true");
    day(cal, "2026-11-13").click();
    expect(cal.end).toBeNull();
  });

  it("submits its date or its range, and resets", async () => {
    const root = await page(
      skin,
      `<form><camo-calendar name="d" value="2026-11-18" ${TODAY}></camo-calendar>
        <camo-calendar name="r" range start="2026-11-10" end="2026-11-12" ${TODAY}></camo-calendar></form>`,
    );
    const form = q(root, "form") as unknown as HTMLFormElement;
    expect(data(form)).toEqual([
      ["d", "2026-11-18"],
      ["r", "2026-11-10/2026-11-12"],
    ]);
    day(q(root, "[name=d]"), "2026-11-20").click();
    await settled(root);
    expect(data(form)[0]).toEqual(["d", "2026-11-20"]);
    form.reset();
    await settled(root);
    expect(q(root, "[name=d]").value).toBe("2026-11-18");
  });
});

describe.each(SKINS)("camo-date-picker under %s", (skin) => {
  const popup = (p: Element): HTMLElement =>
    p.shadowRoot!.querySelector<HTMLElement>(".camo-popup")!;
  const buttons = (p: Element): HTMLElement[] => [
    ...p.shadowRoot!.querySelectorAll<HTMLElement>("camo-button"),
  ];
  const calendar = (p: Element): El => p.shadowRoot!.querySelector("camo-calendar") as El;

  it("shows the date in the locale's format and announces itself as a pop-up", async () => {
    const root = await page(
      skin,
      `<camo-date-picker label="Birth date" value="2026-11-18" locale="en-US"></camo-date-picker><camo-date-picker id="e" label="Empty" placeholder="Pick a date" locale="en-US"></camo-date-picker>`,
    );
    const p = q(root, "camo-date-picker");
    const input = p.shadowRoot!.querySelector<HTMLInputElement>(".camo-input")!;
    expect(input.value).toBe("Nov 18, 2026");
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-haspopup")).toBe("dialog");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(input.getAttribute("aria-labelledby")).toBe("label");
    expect(
      (q(root, "#e").shadowRoot!.querySelector(".camo-input") as HTMLInputElement).placeholder,
    ).toBe("Pick a date");
  });

  it("opens a popup on click, Enter, Space or the Down arrow, and Escape closes it and returns focus", async () => {
    const root = await page(
      skin,
      `<camo-date-picker label="D" value="2026-11-18" locale="en-US"></camo-date-picker>`,
    );
    const p = q(root, "camo-date-picker");
    const input = p.shadowRoot!.querySelector<HTMLInputElement>(".camo-input")!;
    for (const open of [
      () => userEvent.click(input),
      () => userEvent.keyboard("{Enter}"),
      () => userEvent.keyboard(" "),
      () => userEvent.keyboard("{ArrowDown}"),
    ]) {
      input.focus();
      await open();
      await tick();
      expect(popup(p).matches(":popover-open")).toBe(true);
      expect(input.getAttribute("aria-expanded")).toBe("true");
      await userEvent.keyboard("{Escape}");
      await tick();
      expect(popup(p).matches(":popover-open")).toBe(false);
      expect(p.shadowRoot!.activeElement).toBe(input);
    }
  });

  it("confirms with OK, and discards with Cancel and on Escape", async () => {
    const root = await page(
      skin,
      `<camo-date-picker label="D" value="2026-11-18" ${TODAY}></camo-date-picker>`,
    );
    const p = q(root, "camo-date-picker");
    const changes: string[] = [];
    p.addEventListener("change", () => changes.push(p.value));
    await p.show();
    day(calendar(p), "2026-11-20").click();
    await settled(root);
    expect(p.value).toBe("2026-11-18"); // not yet
    buttons(p)[0]!.click(); // Cancel
    await tick();
    expect(p.value).toBe("2026-11-18");
    await p.show();
    day(calendar(p), "2026-11-20").click();
    await settled(root);
    buttons(p)[1]!.click(); // OK
    await tick();
    expect(p.value).toBe("2026-11-20");
    expect(changes).toEqual(["2026-11-20"]);
    expect(popup(p).matches(":popover-open")).toBe(false);
    await p.show();
    day(calendar(p), "2026-11-21").click();
    await userEvent.keyboard("{Escape}");
    await tick();
    expect(p.value).toBe("2026-11-20");
  });

  it("with instant, a tap chooses and closes", async () => {
    const root = await page(
      skin,
      `<camo-date-picker label="D" instant ${TODAY}></camo-date-picker>`,
    );
    const p = q(root, "camo-date-picker");
    await p.show();
    expect(buttons(p)).toHaveLength(0);
    day(calendar(p), "2026-11-20").click();
    await tick();
    expect(p.value).toBe("2026-11-20");
    expect(popup(p).matches(":popover-open")).toBe(false);
    expect((p.shadowRoot!.querySelector(".camo-input") as HTMLInputElement).value).toBe(
      "Nov 20, 2026",
    );
  });

  it("is cancelable: a rejected change keeps the value", async () => {
    const root = await page(
      skin,
      `<camo-date-picker label="D" instant value="2026-11-18" ${TODAY}></camo-date-picker>`,
    );
    const p = q(root, "camo-date-picker");
    p.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    await p.show();
    day(calendar(p), "2026-11-20").click();
    await tick();
    expect(p.value).toBe("2026-11-18");
  });

  it("chooses a range with Done and Clear, and submits start/end", async () => {
    const root = await page(
      skin,
      `<form><camo-date-picker name="stay" range label="Stay" max-length="14" ${TODAY}></camo-date-picker></form>`,
    );
    const p = q(root, "camo-date-picker");
    await p.show();
    const [clear, done] = buttons(p);
    expect(done!.hasAttribute("disabled")).toBe(true);
    day(calendar(p), "2026-11-10").click();
    day(calendar(p), "2026-11-14").click();
    await settled(root);
    expect(done!.hasAttribute("disabled")).toBe(false);
    clear!.click();
    await settled(root);
    expect(calendar(p).start).toBeNull();
    day(calendar(p), "2026-11-10").click();
    day(calendar(p), "2026-11-14").click();
    await settled(root);
    buttons(p)[1]!.click();
    await tick();
    expect([p.start, p.end]).toEqual(["2026-11-10", "2026-11-14"]);
    expect((p.shadowRoot!.querySelector(".camo-input") as HTMLInputElement).value).toBe(
      "Nov 10, 2026 – Nov 14, 2026",
    );
    expect(data(q(root, "form") as unknown as HTMLFormElement)).toEqual([
      ["stay", "2026-11-10/2026-11-14"],
    ]);
  });

  it("opens below the field on a wide window and from the bottom on a compact one", async () => {
    const wide = await page(
      skin,
      `<camo-date-picker label="D" ${TODAY} presentation="popup"></camo-date-picker>`,
    );
    const a = q(wide, "camo-date-picker");
    await a.show();
    const box = a.getBoundingClientRect();
    const pop = popup(a).getBoundingClientRect();
    expect(pop.top).toBeGreaterThanOrEqual(box.bottom);
    expect(popup(a).classList.contains("sheet")).toBe(false);
    await userEvent.keyboard("{Escape}");
    const compact = await page(
      skin,
      `<camo-date-picker label="D" ${TODAY} presentation="sheet"></camo-date-picker>`,
    );
    const b = q(compact, "camo-date-picker");
    await b.show();
    expect(popup(b).classList.contains("sheet")).toBe(true);
    expect(Math.round(popup(b).getBoundingClientRect().bottom)).toBe(window.innerHeight);
    await userEvent.keyboard("{Escape}");
  });

  it("submits its date, is required-invalid until chosen, resets, and shows its error", async () => {
    const root = await page(
      skin,
      `<form><camo-date-picker name="d" label="D" required ${TODAY}></camo-date-picker></form>`,
    );
    const form = q(root, "form") as unknown as HTMLFormElement;
    const p = q(root, "camo-date-picker");
    expect(form.checkValidity()).toBe(false);
    p.value = "2026-11-20";
    await settled(root);
    expect(form.checkValidity()).toBe(true);
    expect(data(form)).toEqual([["d", "2026-11-20"]]);
    form.reset();
    await settled(root);
    expect(p.value).toBeNull();
    p.error = "Pick a date";
    await settled(root);
    expect(p.shadowRoot!.querySelector("#error")!.textContent).toBe("Pick a date");
  });
});

describe.each(SKINS)("camo-time-picker under %s", (skin) => {
  const popup = (p: Element): HTMLElement =>
    p.shadowRoot!.querySelector<HTMLElement>(".camo-popup")!;
  const buttons = (p: Element): HTMLElement[] => [
    ...p.shadowRoot!.querySelectorAll<HTMLElement>("camo-button"),
  ];
  const text = (p: Element): string =>
    (p.shadowRoot!.querySelector(".camo-input") as HTMLInputElement).value;

  it("shows the time in the locale's format, 12 or 24 hours", async () => {
    const root = await page(
      skin,
      `<camo-time-picker id="a" label="T" value="14:30" locale="en-US"></camo-time-picker>
       <camo-time-picker id="b" label="T" value="14:30" locale="en-GB"></camo-time-picker>
       <camo-time-picker id="c" label="T" value="14:30" locale="en-US" hour-cycle="24"></camo-time-picker>`,
    );
    expect(text(q(root, "#a"))).toMatch(/^2:30\s?PM$/);
    expect(text(q(root, "#b"))).toBe("14:30");
    expect(text(q(root, "#c"))).toBe("14:30");
  });

  it("opens a panel with the skin's form: fields in Minimal, wheels in Cupertino; each part is adjustable", async () => {
    const root = await page(
      skin,
      `<camo-time-picker label="T" value="14:30" locale="en-US"></camo-time-picker>`,
    );
    const p = q(root, "camo-time-picker");
    await p.show();
    const spins = [...p.shadowRoot!.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
    expect(spins.length).toBe(skin !== "cupertino" ? 2 : 3);
    expect(spins[0]!.getAttribute("aria-label")).toBe("Hour");
    expect(spins[0]!.getAttribute("aria-valuenow")).toBe("2");
    expect(spins[1]!.getAttribute("aria-label")).toBe("Minute");
    expect(spins[1]!.getAttribute("aria-valuenow")).toBe("30");
    expect(p.shadowRoot!.querySelector(skin !== "cupertino" ? ".digits" : ".wheel")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
  });

  it("scrolls a wheel to the current value when the panel opens", async () => {
    const root = await page(
      skin,
      `<camo-time-picker label="T" value="14:30" locale="en-US"></camo-time-picker>`,
    );
    const p = q(root, "camo-time-picker");
    await p.show();
    await tick(100);
    const wheel = p.shadowRoot!.querySelector<HTMLElement>(".wheel");
    if (skin !== "cupertino") {
      expect(wheel).toBeNull();
      return;
    }
    const item = wheel!.querySelector<HTMLElement>(".opt")!.offsetHeight;
    expect(Math.round(wheel!.scrollTop / item)).toBe(1); // 2 PM is the second hour of 1 to 12
    await userEvent.keyboard("{Escape}");
  });

  it("changes the hour and minute with Up and Down, in steps of minute-step, and OK commits", async () => {
    const root = await page(
      skin,
      `<camo-time-picker label="T" value="14:30" minute-step="15" locale="en-GB"></camo-time-picker>`,
    );
    const p = q(root, "camo-time-picker");
    await p.show();
    const [hour, minute] = [
      ...p.shadowRoot!.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
    ] as [HTMLElement, HTMLElement];
    hour.focus();
    await userEvent.keyboard("{ArrowUp}");
    minute.focus();
    await userEvent.keyboard("{ArrowUp}");
    await settled(root);
    expect(p.value).toBe("14:30"); // a draft until OK
    buttons(p)[1]!.click();
    await tick();
    expect(p.value).toBe("15:45");
    expect(text(p)).toBe("15:45");
    expect(popup(p).matches(":popover-open")).toBe(false);
  });

  it("converts through AM and PM in 12 hours, and Cancel discards", async () => {
    const root = await page(
      skin,
      `<camo-time-picker label="T" value="09:05" locale="en-US"></camo-time-picker>`,
    );
    const p = q(root, "camo-time-picker");
    await p.show();
    if (skin !== "cupertino") {
      const pm = [...p.shadowRoot!.querySelectorAll<HTMLElement>(".period button")][1]!;
      pm.click();
    } else {
      const period = [...p.shadowRoot!.querySelectorAll<HTMLElement>('[role="spinbutton"]')][2]!;
      period.focus();
      await userEvent.keyboard("{ArrowUp}");
    }
    await settled(root);
    buttons(p)[1]!.click();
    await tick();
    expect(p.value).toBe("21:05");
    await p.show();
    const hour = p.shadowRoot!.querySelector<HTMLElement>('[role="spinbutton"]')!;
    hour.focus();
    await userEvent.keyboard("{ArrowUp}");
    await settled(root);
    buttons(p)[0]!.click(); // Cancel
    await tick();
    expect(p.value).toBe("21:05");
  });

  it("with instant, each change commits at once", async () => {
    const root = await page(
      skin,
      `<camo-time-picker label="T" instant value="10:00" locale="en-GB"></camo-time-picker>`,
    );
    const p = q(root, "camo-time-picker");
    await p.show();
    expect(buttons(p)).toHaveLength(0);
    const hour = p.shadowRoot!.querySelector<HTMLElement>('[role="spinbutton"]')!;
    hour.focus();
    await userEvent.keyboard("{ArrowUp}");
    await tick();
    expect(p.value).toBe("11:00");
    await userEvent.keyboard("{Escape}");
  });

  it("submits its time, is cancelable, flags a time outside min and max, and resets", async () => {
    const root = await page(
      skin,
      `<form><camo-time-picker name="t" label="T" value="10:00" min="09:00" max="17:00" locale="en-GB"></camo-time-picker></form>`,
    );
    const form = q(root, "form") as unknown as HTMLFormElement;
    const p = q(root, "camo-time-picker");
    expect(data(form)).toEqual([["t", "10:00"]]);
    expect(form.checkValidity()).toBe(true);
    p.value = "18:30";
    await settled(root);
    expect(form.checkValidity()).toBe(false);
    expect(p.shadowRoot!.querySelector("#error")!.textContent).toBe("This time is not available.");
    form.reset();
    await settled(root);
    expect(p.value).toBe("10:00");
    p.addEventListener("camo-before-change", (e: Event) => e.preventDefault());
    await p.show();
    buttons(p)[1]!.click();
    await tick();
    expect(p.value).toBe("10:00");
  });
});
