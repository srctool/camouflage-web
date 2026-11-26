import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { expandScenarios, scenarioMarkup } from "../../scenarios/expand.ts";
import type { ScenarioFile } from "../../scenarios/expand.ts";

const file = JSON.parse(
  readFileSync(new URL("../../scenarios/scenarios.json", import.meta.url), "utf8"),
) as ScenarioFile;
const schema = JSON.parse(
  readFileSync(new URL("../../scenarios/schema.json", import.meta.url), "utf8"),
) as { $defs: { scenario: { properties: Record<string, unknown>; required: string[] } } };

describe("the scenario list", () => {
  const variants = expandScenarios(file);

  it("expands every scenario over its axes into uniquely named variants", () => {
    expect(new Set(variants.map((v) => v.id)).size).toBe(variants.length);
    expect(variants.length).toBeGreaterThan(100);
    const solid = variants.filter((v) => v.scenario.name === "button-solid");
    expect(solid).toHaveLength(5 * 2 * 2 * 2); // skins x modes x text scales x directions
    expect(solid[0]!.id).toBe("button-solid_minimal_light_fs1_ltr");
    expect(solid.at(-1)!.id).toBe("button-solid_carbon_dark_fs2_rtl");
  });

  it("lets a scenario narrow an axis, and falls back to one light, 1x, LTR capture", () => {
    const error = variants.filter((v) => v.scenario.name === "button-solid-error");
    expect(error).toHaveLength(5 * 2); // skins x modes
    const bare = expandScenarios({ version: 1, scenarios: [{ name: "x", component: "button" }] });
    expect(bare.map((v) => v.id)).toEqual(["x_minimal_light_fs1_ltr"]);
    expect(
      expandScenarios({
        version: 1,
        scenarios: [{ name: "x", component: "button", textScales: [1.5] }],
      })[0]!.id,
    ).toBe("x_minimal_light_fs1p5_ltr");
  });

  it("rejects a duplicate name", () => {
    expect(() =>
      expandScenarios({
        version: 1,
        scenarios: [
          { name: "a", component: "button" },
          { name: "a", component: "dialog" },
        ],
      }),
    ).toThrow('Duplicate scenario name "a".');
  });

  it("uses only fields the schema knows, with names the schema accepts", () => {
    const known = new Set(Object.keys(schema.$defs.scenario.properties));
    for (const scenario of file.scenarios) {
      for (const key of Object.keys(scenario))
        expect(known.has(key), `${scenario.name}.${key}`).toBe(true);
      for (const required of schema.$defs.scenario.required)
        expect(scenario, scenario.name).toHaveProperty(required);
      expect(scenario.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("turns a scenario into markup: props are attributes, content fills the slots", () => {
    const button = file.scenarios.find((s) => s.name === "button-icons")!;
    expect(scenarioMarkup(button)).toBe(
      '<camo-button text="Next" appearance="outline"><span slot="prefix-icon">◀</span><span slot="suffix-icon">▶</span></camo-button>',
    );
    expect(
      scenarioMarkup({
        name: "d",
        component: "dialog",
        props: { open: true, closed: false, title: 'A "b"' },
      }),
    ).toBe('<camo-dialog open title="A &quot;b&quot;"></camo-dialog>');
    expect(
      scenarioMarkup({
        name: "t",
        component: "card",
        content: { "": "<p>body</p>", header: "Title", footer: "<b>x</b>" },
      }),
    ).toBe(
      '<camo-card><p>body</p><span slot="header">Title</span><b slot="footer">x</b></camo-card>',
    );
  });

  it("adds a component with one entry: no code names the element", () => {
    const entry = {
      name: "text-body",
      component: "text",
      props: { style: "body" },
      content: { "": "Hello" },
    };
    expect(scenarioMarkup(entry)).toBe('<camo-text style="body">Hello</camo-text>');
    expect(
      expandScenarios({ version: 1, defaults: file.defaults!, scenarios: [entry] }),
    ).toHaveLength(40);
  });
});
