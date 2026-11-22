import { expect, test } from "@playwright/test";

test("hydrating in the App Router raises no errors or warnings", async ({ page }) => {
  const messages: string[] = [];
  page.on("pageerror", (e) => messages.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) messages.push(`${m.type()}: ${m.text()}`);
  });
  await page.goto("/");
  await page.evaluate(() => customElements.whenDefined("camo-button"));
  await page.waitForTimeout(300);
  expect(messages).toEqual([]);
});
