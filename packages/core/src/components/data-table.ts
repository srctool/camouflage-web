import { LitElement, css, html, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { applyAria } from "../behavior/aria.ts";
import type { CamoBeforeChangeDetail } from "../behavior/control.ts";
import { CamouflageController } from "../controller.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";

const SLOTS = { empty: "empty", footer: "footer" } as const;

/** A column of a `camo-data-table`. */
export interface TableColumn<Row = Record<string, unknown>> {
  /** Names the column; the default cell shows `row[key]`. */
  key: string;
  header: string;
  /** A CSS length (`"120px"`, `"20%"`); absent columns share what the others leave. */
  width?: string;
  align?: "start" | "center" | "end";
  sortable?: boolean;
  /** What a cell shows: text or a template. The default is `row[key]` as text. */
  cell?: (row: Row) => unknown;
}

/** The sort the table shows: the app sorts the rows. */
export interface TableSort {
  columnKey: string;
  ascending: boolean;
}

/** The detail of `camo-sort-change`. */
export type CamoSortChangeDetail = TableSort;

/** The detail of `camo-row-click`. */
export interface CamoRowClickDetail<Row = unknown> {
  row: Row;
  key: string;
}

/**
 * `<camo-data-table caption="Orders" selectable>` with `table.columns = […]; table.rows = […]`
 *
 * A table of records. Set `columns` (`{ key, header, width, align, sortable, cell }`), `rows` and, if the key is not `id`,
 * `rowKey` (a field name or a function). It is a grid: a caption, column headers (a sortable one is a button announcing
 * "Name, sorted ascending"), rows with their index and selection. Sorting is the app's: a click on a sortable header fires
 * `camo-sort-change` (a new column sorts ascending, the sorted one flips) and the table shows the arrow for `sort`. With
 * `selectable`, a checkbox column selects rows (and all of them), the `selection` property is a `Set` of keys, and a change
 * asks first with the cancelable `camo-before-change`, then fires `change`. One Tab stop into the body; Up, Down, Home and End
 * move between rows, Space toggles selection and Enter or a click fires `camo-row-click` (cancel it to keep a click from
 * selecting). The header sticks while the rows scroll: give the table a height. All rows are drawn; for very long data page
 * it with `camo-pagination`.
 *
 * @tagname camo-data-table
 * @slot empty - Shown in the body when there are no rows.
 * @slot footer - Under the table: a pagination.
 * @attr {string} caption - Names the table for screen readers (required).
 * @attr {boolean} selectable - A checkbox column selects rows (the contract's non-null `selection`).
 * @attr {boolean} loading - Shows a progress circle, and the table is busy.
 * @fires {CustomEvent<CamoSortChangeDetail>} camo-sort-change - A sortable header was pressed.
 * @fires {CustomEvent<CamoBeforeChangeDetail>} camo-before-change - Cancelable, before the selection changes.
 * @fires change - The selection changed; read `selection`.
 * @fires {CustomEvent<CamoRowClickDetail>} camo-row-click - A row was clicked or Enter pressed on it; cancelable.
 */
export class CamoDataTable extends LitElement {
  static override properties: PropertyDeclarations = {
    caption: { type: String },
    selectable: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    columns: { attribute: false },
    rows: { attribute: false },
    rowKey: { attribute: false },
    sort: { attribute: false },
    selection: { attribute: false },
  };

  static override styles: CSSResult = css``;

  declare caption: string;
  declare selectable: boolean;
  declare loading: boolean;
  declare columns: readonly TableColumn[];
  declare rows: readonly unknown[];
  /** A field name or a function giving each row's key; `id` by default. */
  declare rowKey: string | ((row: never) => string);
  declare sort: TableSort | null;
  declare selection: Iterable<string>;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  #active = 0;

  constructor() {
    super();
    this.caption = "";
    this.selectable = false;
    this.loading = false;
    this.columns = [];
    this.rows = [];
    this.rowKey = "id";
    this.sort = null;
    this.selection = new Set();
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKey);
    this.addEventListener("focusin", this.#onFocusIn);
  }

  #key(row: unknown, index: number): string {
    const k = this.rowKey;
    const value =
      typeof k === "function"
        ? (k as (row: unknown) => string)(row)
        : (row as Record<string, unknown>)[k];
    return value === undefined || value === null ? String(index) : String(value);
  }

  /** The selected keys as a set: the property takes a `Set` or any list of keys (JSON, an attribute binding). */
  #sel(): ReadonlySet<string> {
    return this.selection instanceof Set ? this.selection : new Set(this.selection);
  }

  #rowEls(): HTMLElement[] {
    return [...(this.renderRoot?.querySelectorAll<HTMLElement>("tbody tr") ?? [])];
  }

  /** Asks to change the selection; false when the app cancelled it. */
  #select(next: Set<string>): void {
    const proceed = this.dispatchEvent(
      new CustomEvent<CamoBeforeChangeDetail<ReadonlySet<string>>>("camo-before-change", {
        detail: { value: next },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    if (!proceed) return;
    this.selection = next;
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  #toggle(key: string): void {
    const next = new Set(this.#sel());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.#select(next);
  }

  #toggleAll(): void {
    const keys = this.rows.map((row, i) => this.#key(row, i));
    const all = keys.length > 0 && keys.every((k) => this.#sel().has(k));
    this.#select(all ? new Set() : new Set(keys));
  }

  readonly #onClick = (event: Event): void => {
    const path = event.composedPath() as HTMLElement[];
    const part = path.find((n) => n instanceof HTMLElement && n.dataset?.["part"] !== undefined);
    const row = path.find(
      (n) => n instanceof HTMLElement && n.tagName === "TR" && n.dataset["key"] !== undefined,
    );
    switch (part?.dataset["part"]) {
      case "sort": {
        const columnKey = part.dataset["key"] ?? "";
        const ascending = this.sort?.columnKey === columnKey ? !this.sort.ascending : true;
        this.dispatchEvent(
          new CustomEvent<CamoSortChangeDetail>("camo-sort-change", {
            detail: { columnKey, ascending },
            bubbles: true,
            composed: true,
          }),
        );
        return;
      }
      case "select-all":
        this.#toggleAll();
        return;
      case "select":
        if (row !== undefined) this.#toggle(row.dataset["key"] ?? "");
        return;
    }
    if (row !== undefined) this.#rowClick(row);
  };

  /** A click on a row (or Enter): the app hears it, and unless it cancels the event a selectable table toggles the row. */
  #rowClick(row: HTMLElement): void {
    const key = row.dataset["key"] ?? "";
    const index = Number(row.dataset["index"]);
    const proceed = this.dispatchEvent(
      new CustomEvent<CamoRowClickDetail>("camo-row-click", {
        detail: { row: this.rows[index], key },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    if (proceed && this.selectable) this.#toggle(key);
  }

  readonly #onFocusIn = (event: FocusEvent): void => {
    const row = (event.composedPath() as HTMLElement[]).find(
      (n) => n instanceof HTMLElement && n.tagName === "TR" && n.dataset["key"] !== undefined,
    );
    if (row !== undefined) this.#active = Number(row.dataset["index"]);
  };

  readonly #onKey = (event: KeyboardEvent): void => {
    const rows = this.#rowEls();
    const at = rows.findIndex((r) => r === (event.composedPath()[0] as HTMLElement));
    if (at < 0) return; // a key on a header button or a checkbox is theirs
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = Math.min(at + 1, rows.length - 1);
        break;
      case "ArrowUp":
        next = Math.max(at - 1, 0);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = rows.length - 1;
        break;
      case " ":
        if (this.selectable) {
          event.preventDefault();
          this.#toggle(rows[at]!.dataset["key"] ?? "");
        }
        return;
      case "Enter":
        event.preventDefault();
        this.#rowClick(rows[at]!);
        return;
      default:
        return;
    }
    event.preventDefault();
    rows[next]?.focus();
  };

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, {
      role: "generic",
      busy: this.loading,
    });
  }

  override updated(): void {
    // One row is in the tab order: the one that had focus, or the first.
    const rows = this.#rowEls();
    rows.forEach((row, i) =>
      row.setAttribute("tabindex", i === Math.min(this.#active, rows.length - 1) ? "0" : "-1"),
    );
  }

  #cell(column: TableColumn, row: unknown): unknown {
    if (column.cell !== undefined) return column.cell(row as Record<string, unknown>);
    const value = (row as Record<string, unknown>)[column.key];
    return value === undefined || value === null ? "" : String(value);
  }

  #table(sortIcon: TemplateResult): TemplateResult {
    const keys = this.rows.map((row, i) => this.#key(row, i));
    const selectedCount = keys.filter((k) => this.#sel().has(k)).length;
    const all = keys.length > 0 && selectedCount === keys.length;
    const some = selectedCount > 0 && !all;
    return html`<table
      role="grid"
      aria-label=${this.caption === "" ? nothing : this.caption}
      aria-rowcount=${this.rows.length + 1}
      aria-colcount=${this.columns.length + (this.selectable ? 1 : 0)}
      aria-multiselectable=${this.selectable ? "true" : nothing}
      aria-busy=${this.loading ? "true" : nothing}
    >
      <caption>
        ${this.caption}
      </caption>
      <colgroup>
        ${this.selectable ? html`<col style="width: 48px" />` : nothing}
        ${this.columns.map((c) => html`<col style=${c.width === undefined ? "" : `width: ${c.width}`} />`)}
      </colgroup>
      <thead>
        <tr>
          ${
            this.selectable
              ? html`<th class="select" scope="col">
                  <input
                    type="checkbox"
                    data-part="select-all"
                    aria-label="Select all rows"
                    .checked=${all}
                    .indeterminate=${some}
                  />
                </th>`
              : nothing
          }
          ${this.columns.map((c) => {
            const sorted = this.sort?.columnKey === c.key ? this.sort : null;
            return html`<th
              scope="col"
              class=${c.align ?? "start"}
              aria-sort=${sorted === null ? (c.sortable ? "none" : nothing) : sorted.ascending ? "ascending" : "descending"}
            >
              ${
                c.sortable === true
                  ? html`<button class="sortable" type="button" data-part="sort" data-key=${c.key}>
                      ${c.header}${sortIcon}
                    </button>`
                  : c.header
              }
            </th>`;
          })}
        </tr>
      </thead>
      <tbody>
        ${repeat(
          this.rows,
          (row, i) => this.#key(row, i),
          (row, i) => {
            const key = this.#key(row, i);
            const selected = this.#sel().has(key);
            return html`<tr
              data-key=${key}
              data-index=${i}
              aria-rowindex=${i + 2}
              aria-selected=${this.selectable ? (selected ? "true" : "false") : nothing}
              tabindex="-1"
            >
              ${
                this.selectable
                  ? html`<td class="select">
                      <input
                        type="checkbox"
                        data-part="select"
                        aria-label="Select row"
                        .checked=${selected}
                      />
                    </td>`
                  : nothing
              }
              ${this.columns.map((c) => html`<td class=${c.align ?? "start"}>${this.#cell(c, row)}</td>`)}
            </tr>`;
          },
        )}
      </tbody>
    </table>`;
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    if (skin === undefined) return html`${this.#table(html``)}`;
    const renderer = skin.dataTable;
    const style = renderer.defaults(tokens);
    const sortIcon = html`<svg viewBox=${style.sortIcon.viewBox} aria-hidden="true"><path d=${/d="([^"]+)"/.exec(style.sortIcon.svg)?.[1] ?? ""}></path></svg>`;
    return html`${cssBlock(renderer.styles)}${renderer.render({
      state: {
        columnCount: this.columns.length,
        rowCount: this.rows.length,
        selectable: this.selectable,
        loading: this.loading,
        empty: this.rows.length === 0,
        caption: this.caption,
      },
      slots: SLOTS,
      theme: tokens,
      style,
      skin,
      nodes: {
        table: this.#table(sortIcon),
        loading: html`<camo-progress-circle label="Loading"></camo-progress-circle>`,
      },
    })}`;
  }
}
