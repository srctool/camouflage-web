import { expect, test } from "@playwright/test";

type Entry = { id: string; type: string };

// Every story renders under each skin and scheme with no console errors and a painted component; the screenshots
// are the visual record (reviewed by eye, not a pixel gate: fonts differ per machine).
test("the index lists the stories under /web/", async ({ request }) => {
  const index = (await (await request.get("/web/index.json")).json()) as {
    entries: Record<string, Entry>;
  };
  expect(Object.keys(index.entries).length).toBeGreaterThanOrEqual(8);
});

for (const skin of ["minimal", "cupertino"]) {
  for (const scheme of ["light", "dark"]) {
    test(`every story renders under ${skin}, ${scheme}`, async ({ page, request }, info) => {
      const index = (await (await request.get("/web/index.json")).json()) as {
        entries: Record<string, Entry>;
      };
      const ids = Object.values(index.entries)
        .filter((e) => e.type === "story" && !e.id.startsWith("harness-"))
        .map((e) => e.id);
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      for (const id of ids) {
        await page.goto(
          `/web/iframe.html?id=${id}&viewMode=story&globals=skin:${skin};scheme:${scheme}`,
        );
        await page.waitForSelector("camo-provider");
        await page.evaluate(() => customElements.whenDefined("camo-button"));
        await page.waitForTimeout(150);
        await page.screenshot({ path: info.outputPath(`${id}-${skin}-${scheme}.png`) });
      }
      expect(errors).toEqual([]);
    });
  }
}
