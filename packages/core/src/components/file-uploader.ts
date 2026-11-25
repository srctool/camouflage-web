import { css, html } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { applyAria } from "../behavior/aria.ts";
import { CamoControl } from "../behavior/control.ts";
import type { ControlValue } from "../behavior/control.ts";
import { CamouflageController } from "../controller.ts";
import type { FileUploaderState, UploadFile } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const NO_SLOTS = {} as const;

/** The detail of `camo-files-dropped`. */
export interface CamoFilesDetail {
  files: File[];
}

/** The detail of `camo-remove` and `camo-retry`: the row's id. */
export interface CamoUploadRowDetail {
  id: string;
}

/**
 * `<camo-file-uploader label="Upload files" hint="PNG or JPG, up to 5 MB" multiple name="files">`
 *
 * A drop zone with a list of files and their progress. The zone is one button ("Upload files, button", the hint as its
 * description): Enter and Space press it, which fires the cancelable `camo-pick` (cancel it to open your own picker) and
 * otherwise opens the browser's. Files from the picker or a drop arrive in `camo-files-dropped`; they are also the element's
 * form value, so it submits with a form. The app owns the rows: set `files` to `{ id, name, sizeBytes, progress, status,
 * message }` objects and the element draws each with a progress bar and a remove button (`camo-remove`), and a failed row
 * also with a retry button (`camo-retry`; `retryable` turns it off). A failed row is announced once, as an alert. The app
 * validates types and sizes and reports a refusal as a failed row with a `message`.
 *
 * @tagname camo-file-uploader
 * @attr {string} label - The zone's title and the accessible name ("Upload files").
 * @attr {string} hint - A line under the title ("PNG or JPG, up to 5 MB").
 * @attr {boolean} multiple - More than one file can be chosen.
 * @attr {string} accept - The picker's file types (`image/*,.pdf`).
 * @attr {string} name - The name the files are submitted under.
 * @attr {boolean} disabled - Disables the zone (the contract's `enabled`, inverted).
 * @fires camo-pick - The zone was pressed; cancelable.
 * @fires {CustomEvent<CamoFilesDetail>} camo-files-dropped - Files were chosen or dropped.
 * @fires {CustomEvent<CamoUploadRowDetail>} camo-remove - A row's remove button was pressed.
 * @fires {CustomEvent<CamoUploadRowDetail>} camo-retry - A failed row's retry button was pressed.
 */
export class CamoFileUploader extends CamoControl {
  static override properties: PropertyDeclarations = {
    label: { type: String },
    hint: { type: String },
    multiple: { type: Boolean, reflect: true },
    accept: { type: String },
    files: { attribute: false },
    retryable: { type: Boolean, attribute: false },
    dragging: { state: true },
  };

  static override styles: CSSResult = css`
    .native {
      display: none;
    }
  `;

  declare label: string;
  declare hint: string | null;
  declare multiple: boolean;
  declare accept: string | null;
  /** The rows to show; a property, since it is a list. */
  declare files: UploadFile[];
  /** Show a retry button on a failed row (set it when the app listens for `camo-retry`). */
  declare retryable: boolean;
  declare protected dragging: boolean;

  readonly #cx: CamouflageController = new CamouflageController(this);
  #chosen: File[] = [];
  #depth = 0;

  constructor() {
    super();
    this.label = "Upload files";
    this.hint = null;
    this.multiple = false;
    this.accept = null;
    this.files = [];
    this.retryable = true;
    this.dragging = false;
    this.addEventListener("dragenter", this.#onDragEnter);
    this.addEventListener("dragover", this.#onDragOver);
    this.addEventListener("dragleave", this.#onDragLeave);
    this.addEventListener("drop", this.#onDrop);
    this.addEventListener("click", this.#onClick);
  }

  protected override formValue(): ControlValue {
    if (this.#chosen.length === 0) return null;
    const data = new FormData();
    for (const file of this.#chosen) data.append(this.name, file);
    return data;
  }
  protected override isEmpty(): boolean {
    return this.#chosen.length === 0;
  }
  protected override captureDefault(): void {}
  protected override resetToDefault(): void {
    this.#chosen = [];
    this.requestUpdate();
  }

  /** The files chosen with the picker or dropped on the zone, which are the element's form value. */
  get chosen(): readonly File[] {
    return this.#chosen;
  }

  #take(files: File[]): void {
    if (files.length === 0 || this.isDisabled) return;
    const next = this.multiple ? [...this.#chosen, ...files] : files.slice(0, 1);
    if (!this.beforeChange(next.map((f) => f.name))) return;
    this.#chosen = next;
    this.dispatchEvent(
      new CustomEvent<CamoFilesDetail>("camo-files-dropped", {
        detail: { files },
        bubbles: true,
        composed: true,
      }),
    );
    this.fireInput();
    this.fireChange();
    this.requestUpdate();
  }

  readonly #onDragEnter = (event: DragEvent): void => {
    if (this.isDisabled || !event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    this.#depth++;
    this.dragging = true;
  };

  readonly #onDragOver = (event: DragEvent): void => {
    if (this.isDisabled || !event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  readonly #onDragLeave = (): void => {
    this.#depth = Math.max(this.#depth - 1, 0);
    if (this.#depth === 0) this.dragging = false;
  };

  readonly #onDrop = (event: DragEvent): void => {
    event.preventDefault();
    this.#depth = 0;
    this.dragging = false;
    this.#take([...(event.dataTransfer?.files ?? [])]);
  };

  readonly #onClick = (event: Event): void => {
    const target = (event
      .composedPath()
      .find((n) => n instanceof HTMLElement && n.dataset["part"] !== undefined) ??
      null) as HTMLElement | null;
    const part = target?.dataset["part"];
    if (part === "zone") {
      if (this.isDisabled) return;
      const go = this.dispatchEvent(
        new Event("camo-pick", { bubbles: true, composed: true, cancelable: true }),
      );
      if (go) this.renderRoot.querySelector<HTMLInputElement>("input.native")?.click();
    } else if (part === "remove" || part === "retry") {
      const id = target?.dataset["id"] ?? "";
      if (part === "remove") {
        const row = this.files.find((f) => f.id === id);
        if (row !== undefined) this.#chosen = this.#chosen.filter((f) => f.name !== row.name);
      }
      this.dispatchEvent(
        new CustomEvent<CamoUploadRowDetail>(`camo-${part}`, {
          detail: { id },
          bubbles: true,
          composed: true,
        }),
      );
    }
  };

  readonly #onNativeChange = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    this.#take([...(input.files ?? [])]);
    input.value = "";
  };

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.internals, { role: "generic" });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    const input = html`<input
      class="native"
      type="file"
      tabindex="-1"
      aria-hidden="true"
      ?multiple=${this.multiple}
      accept=${this.accept ?? ""}
      @change=${this.#onNativeChange}
    />`;
    if (skin === undefined) return html`<button data-part="zone">${this.label}</button>${input}`;
    const renderer = skin.fileUploader;
    const state: FileUploaderState = {
      dragOver: this.dragging,
      disabled: this.isDisabled,
      hint: this.hint === null || this.hint === "" ? null : this.hint,
      label: this.label,
      files: this.files,
      texts: {
        title: this.label,
        remove: "Remove",
        retry: "Retry",
        waiting: "Waiting",
        done: "Done",
      },
      hasRetry: this.retryable,
    };
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state,
      slots: NO_SLOTS,
      theme: tokens,
      style: renderer.defaults(tokens),
      skin,
    })}${input}`;
  }
}
