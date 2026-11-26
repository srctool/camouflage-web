import { readFileSync } from "node:fs";
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

// A local check, not a CI gate: it renders every story and leaves a screenshot of each to look at, and the scenario
// screenshots and the component tests are what CI holds. One test per story, so a growing catalogue never runs one test
// past its timeout (it did at W4 and W5, in the slower engines). The index is read from the built Storybook.
const built = JSON.parse(readFileSync(new URL("../dist/index.json", import.meta.url), "utf8")) as {
  entries: Record<string, Entry>;
};
const ids = Object.values(built.entries)
  .filter((e) => e.type === "story" && !e.id.startsWith("harness-"))
  .map((e) => e.id);

for (const skin of process.env["CI"] === undefined
  ? ["minimal", "material", "cupertino", "fluent", "carbon"]
  : []) {
  for (const scheme of ["light", "dark"]) {
    for (const id of ids) {
      test(`story ${id} renders under ${skin}, ${scheme}`, async ({ page }, info) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
        await page.goto(
          `/web/iframe.html?id=${id}&viewMode=story&globals=skin:${skin};scheme:${scheme}`,
        );
        await page.waitForSelector("camo-provider");
        await page.evaluate(() => customElements.whenDefined("camo-button"));
        await page.waitForTimeout(150);
        await page.screenshot({ path: info.outputPath(`${id}-${skin}-${scheme}.png`) });
        expect(errors).toEqual([]);
      });
    }
  }
}
