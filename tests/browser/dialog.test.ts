import { showCamoDialog } from "@srctool/camouflage-core";
import type { CamoCloseDetail, CamoDialog } from "@srctool/camouflage-core";
import axe from "axe-core";
import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { box, mount, settled, SKINS } from "./helpers.ts";

const MARKUP = `
  <camo-dialog open title="Delete item?" message="This can't be undone.">
    <camo-button slot="confirm" text="Delete" tone="error"></camo-button>
    <camo-button slot="dismiss" text="Cancel" appearance="ghost"></camo-button>
  </camo-dialog>`;

async function open(
  skin: string,
  scheme = "light",
): Promise<{ root: HTMLElement; dialog: CamoDialog }> {
  const root = mount(`<camo-provider skin="${skin}" scheme="${scheme}">${MARKUP}</camo-provider>`);
  await settled(root);
  return { root, dialog: root.querySelector("camo-dialog") as CamoDialog };
}

const inner = (dialog: CamoDialog): HTMLDialogElement =>
  dialog.shadowRoot!.querySelector("dialog")!;

describe.each(SKINS)("camo-dialog under %s", (skin) => {
  it("shows unslotted children in its default slot (the contract's content)", async () => {
    const root = mount(
      `<camo-provider skin="${skin}"><camo-dialog open message="Pick one"><p id="extra">A list</p><camo-button slot="confirm" text="OK"></camo-button></camo-dialog></camo-provider>`,
    );
    await settled(root);
    const dialog = root.querySelector("camo-dialog") as CamoDialog;
    const extra = root.querySelector("#extra") as HTMLElement;
    expect(extra.assignedSlot?.getAttribute("name") ?? "").toBe("");
    expect(inner(dialog).contains(extra.assignedSlot)).toBe(true);
    expect(box(extra).height).toBeGreaterThan(0);
  });

  it("is a modal in the top layer, named and described", async () => {
    const { dialog } = await open(skin);
    const native = inner(dialog);
    expect(native.matches(":modal")).toBe(true);
    expect(native.getAttribute("aria-labelledby")).toBe("title");
    expect(dialog.shadowRoot!.querySelector("#title")!.textContent).toBe("Delete item?");
    expect(dialog.shadowRoot!.querySelector("#message")!.textContent).toBe("This can't be undone.");
  });

  it("keeps the title out of a browser tooltip: the attribute is read and removed", async () => {
    const { dialog } = await open(skin);
    expect(dialog.hasAttribute("title")).toBe(false);
    expect(dialog.title).toBe("Delete item?");
  });

  it("puts focus on an action: the dismiss action by default, the dialog itself draws no ring", async () => {
    const { dialog } = await open(skin);
    expect(document.activeElement).toBe(dialog.querySelector('[slot="dismiss"]'));
    expect(getComputedStyle(inner(dialog)).outlineStyle).toBe("none");
  });

  it("closes on Escape with no result", async () => {
    const { dialog } = await open(skin);
    const closed = new Promise<CustomEvent<CamoCloseDetail>>((resolve) =>
      dialog.addEventListener("camo-close", (e) => resolve(e), { once: true }),
    );
    await userEvent.keyboard("{Escape}");
    const event = await closed;
    expect(event.detail.result).toBeUndefined();
    expect(dialog.open).toBe(false);
    expect(inner(dialog).open).toBe(false);
  });

  it("closes on a click on the scrim, and not on a click inside", async () => {
    const { dialog } = await open(skin);
    const native = inner(dialog);
    native
      .querySelector(".d")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    await settled();
    expect(dialog.open).toBe(true);
    native.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })); // target: the dialog itself
    await settled();
    expect(dialog.open).toBe(false);
  });

  it("closes with a result from close()", async () => {
    const { dialog } = await open(skin);
    const closed = new Promise<CustomEvent<CamoCloseDetail>>((resolve) =>
      dialog.addEventListener("camo-close", (e) => resolve(e), { once: true }),
    );
    dialog.close("done");
    expect((await closed).detail.result).toBe("done");
  });

  it("opens again after it was closed", async () => {
    const { dialog } = await open(skin);
    dialog.close();
    await settled();
    dialog.open = true;
    await settled();
    expect(inner(dialog).matches(":modal")).toBe(true);
  });

  it("has no accessibility violations in light and dark (axe)", async () => {
    for (const scheme of ["light", "dark"]) {
      const { root, dialog } = await open(skin, scheme);
      const results = await axe.run(root);
      const found = results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      );
      // The Cupertino contrast finding of the button test applies to the dialog's tinted and accent actions too.
      const known = skin === "cupertino" ? ["color-contrast"] : [];
      expect(
        results.violations.map((v) => v.id),
        `${skin} ${scheme}: ${found.join(" | ")}`,
      ).toEqual(known);
      dialog.close();
    }
  });
});

describe("the same markup under two skins", () => {
  it("lays the actions out side by side under Minimal and stacked under Cupertino", async () => {
    const minimal = await open("minimal");
    const m = [...minimal.dialog.querySelectorAll("camo-button")].map((b) => box(b));
    const [mConfirm, mDismiss] = [m[0]!, m[1]!];
    expect(Math.abs(mConfirm.top - mDismiss.top)).toBeLessThan(1); // one row
    expect(mDismiss.left).toBeLessThan(mConfirm.left); // cancel first, confirm at the end

    const cupertino = await open("cupertino");
    const c = [...cupertino.dialog.querySelectorAll("camo-button")].map((b) => box(b));
    const [cConfirm, cDismiss] = [c[0]!, c[1]!];
    expect(cConfirm.top).toBeLessThan(cDismiss.top); // confirm on top
    expect(Math.abs(cConfirm.left - cDismiss.left)).toBeLessThan(1); // one column
    expect(Math.abs(cConfirm.width - cDismiss.width)).toBeLessThan(1); // full width
  });

  it("uses each skin's own container: a hairline and 12 px corners, a 270 px alert with 14 px corners", async () => {
    const minimal = await open("minimal");
    const mSurface = minimal.dialog.shadowRoot!.querySelector(".camo-surface") as HTMLElement;
    expect(getComputedStyle(mSurface).borderTopWidth).toBe("1px");
    expect(getComputedStyle(mSurface).borderTopLeftRadius).toBe("12px");
    const cupertino = await open("cupertino");
    const cSurface = cupertino.dialog.shadowRoot!.querySelector(".camo-surface") as HTMLElement;
    expect(getComputedStyle(cSurface).borderTopWidth).toBe("0px");
    expect(getComputedStyle(cSurface).borderTopLeftRadius).toBe("14px");
    expect(box(inner(cupertino.dialog)).width).toBe(270);
  });
});

describe("a dialog that arrives open, as from the server", () => {
  it("becomes a modal and stays open (the queued close of the non-modal copy is ignored)", async () => {
    // Parsed inert and adopted, so the element upgrades with its attributes already there, like hydration.
    const parsed = new DOMParser().parseFromString(
      `<camo-provider skin="minimal"><camo-dialog open message="Hello"><camo-button slot="confirm" text="OK"></camo-button></camo-dialog></camo-provider>`,
      "text/html",
    );
    const root = mount("");
    root.append(document.adoptNode(parsed.body.firstElementChild!));
    await settled(root);
    await new Promise((resolve) => setTimeout(resolve, 100)); // let a queued close event, if any, fire
    const dialog = root.querySelector("camo-dialog") as CamoDialog;
    expect(dialog.open).toBe(true);
    expect(inner(dialog).matches(":modal")).toBe(true);
  });
});

describe("showCamoDialog", () => {
  async function show(
    skin: string,
  ): Promise<{ result: Promise<boolean | undefined>; dialog: CamoDialog }> {
    const root = mount(`<camo-provider skin="${skin}"></camo-provider>`);
    await settled(root);
    const result = showCamoDialog<boolean>({
      title: "Delete item?",
      message: "This can't be undone.",
      confirm: { text: "Delete", tone: "error", result: true },
      dismiss: { text: "Cancel", appearance: "ghost", result: false },
      host: root.firstElementChild!,
    });
    await settled(root);
    return { result, dialog: root.querySelector("camo-dialog") as CamoDialog };
  }

  it.each(SKINS)("resolves with the confirm action's result under %s", async (skin) => {
    const { result, dialog } = await show(skin);
    (dialog.querySelector('[slot="confirm"]') as HTMLElement).click();
    expect(await result).toBe(true);
    expect(document.querySelector("camo-dialog")).toBeNull(); // removed again
  });

  it("resolves with the dismiss action's result", async () => {
    const { result, dialog } = await show("minimal");
    (dialog.querySelector('[slot="dismiss"]') as HTMLElement).click();
    expect(await result).toBe(false);
  });

  it("resolves undefined when it is dismissed with Escape", async () => {
    const { result } = await show("cupertino");
    await userEvent.keyboard("{Escape}");
    expect(await result).toBeUndefined();
  });
});
