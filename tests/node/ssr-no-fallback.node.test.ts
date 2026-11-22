import { html } from "lit";
import { describe, expect, it, vi } from "vitest";
import { renderToString, squash } from "../helpers/ssr.ts";

await import("@srctool/camouflage-core/define");
// No skin's `register` entry is imported here: nothing is registered, so there is no fallback.

describe("a component with no provider and no registered skin", () => {
  it("renders an unstyled but working button and warns, instead of throwing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = squash(renderToString(html`<camo-button text="Alone"></camo-button>`));
    expect(out).toContain("Alone");
    expect(out).toContain('<slot name="prefix-icon">');
    expect(out).not.toContain("--b-height");
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0]?.[0])).toContain("no <camo-provider>");
    warn.mockRestore();
  });

  it("names the skin that is not registered when a provider asks for one", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderToString(
      html`<camo-provider skin="nope"><camo-button text="x"></camo-button></camo-provider>`,
    );
    expect(warn.mock.calls.map((c) => String(c[0])).join("\n")).toContain('skin="nope"');
    warn.mockRestore();
  });
});
