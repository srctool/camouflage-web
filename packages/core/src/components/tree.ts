import { LitElement, css, html, nothing } from "lit";
import type { CSSResult, PropertyDeclarations, PropertyValues, TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { applyAria } from "../behavior/aria.ts";
import { CamouflageController } from "../controller.ts";
import { resolveIcon } from "../icons.ts";
import type { IconArtwork } from "../skin/types.ts";
import { cssBlock } from "../style.ts";
import { tokens } from "../theme/shape.ts";
import { flattenTree } from "./tree-rows.ts";
import type { CamoTreeNode, TreeRow } from "./tree-rows.ts";

const NO_SLOTS = {} as const;

/** The detail of `camo-expanded-change` and `camo-selected-change`: the keys now. */
export interface CamoKeysDetail {
  keys: string[];
}

/** The detail of `camo-load-children`: the node whose children are wanted. */
export interface CamoLoadChildrenDetail {
  node: CamoTreeNode;
}

/**
 * `<camo-tree caption="Files">` with `tree.nodes = [{ key, label, icon, children }]`
 *
 * A tree of nodes: documents, folders, a hierarchy. Set `nodes` (the roots; `children: null` is a leaf, `[]` loaded and
 * empty, and `hasChildren: true` with no children is not loaded yet) and, optionally, `expanded` and `selected` (`Set`s of
 * keys; the tree also updates them as the user acts, and says so in `camo-expanded-change` and `camo-selected-change`).
 * Expanding a node that is not loaded fires `camo-load-children` once and shows a spinner until the app sets its `children`
 * and assigns `nodes` again. It is a `tree`: items announce their level, their place ("2 of 5") and expanded or collapsed.
 * One Tab stop; Down and Up move, Right expands (then enters the first child), Left collapses (then goes to the parent), Home
 * and End jump, a letter jumps to the next label starting with it, Enter and Space select (toggle, with `multi-select`). In
 * right-to-left Left and Right swap. Stale keys are ignored. Give it a height if the tree is long.
 *
 * @tagname camo-tree
 * @attr {string} caption - Names the tree for screen readers (required).
 * @attr {boolean} multi-select - Any number of nodes can be selected; a click or Space toggles.
 * @fires {CustomEvent<CamoKeysDetail>} camo-expanded-change - A node expanded or collapsed.
 * @fires {CustomEvent<CamoKeysDetail>} camo-selected-change - The selection changed.
 * @fires {CustomEvent<CamoLoadChildrenDetail>} camo-load-children - A node that is not loaded was expanded, once.
 */
export class CamoTree extends LitElement {
  static override properties: PropertyDeclarations = {
    caption: { type: String },
    multiSelect: { type: Boolean, attribute: "multi-select", reflect: true },
    nodes: { attribute: false },
    expanded: { attribute: false },
    selected: { attribute: false },
    focused: { state: true },
  };

  static override styles: CSSResult = css`
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      outline: none;
    }
    li:focus-visible {
      outline: 2px solid var(--camo-color-primary);
      outline-offset: -2px;
    }
  `;

  declare caption: string;
  declare multiSelect: boolean;
  declare nodes: readonly CamoTreeNode[];
  declare expanded: Iterable<string>;
  declare selected: Iterable<string>;
  declare protected focused: string | null;

  readonly #internals: ElementInternals = this.attachInternals();
  readonly #cx: CamouflageController = new CamouflageController(this);
  readonly #requested = new Set<string>();
  #typed = "";
  #typedAt = 0;

  constructor() {
    super();
    this.caption = "";
    this.multiSelect = false;
    this.nodes = [];
    this.expanded = new Set();
    this.selected = new Set();
    this.focused = null;
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKey);
  }

  #exp(): ReadonlySet<string> {
    return this.expanded instanceof Set ? this.expanded : new Set(this.expanded);
  }

  #selSet(): ReadonlySet<string> {
    return this.selected instanceof Set ? this.selected : new Set(this.selected);
  }

  #rows(): TreeRow[] {
    return flattenTree(this.nodes, this.#exp());
  }

  #setExpanded(keys: Set<string>): void {
    this.expanded = keys;
    this.dispatchEvent(
      new CustomEvent<CamoKeysDetail>("camo-expanded-change", {
        detail: { keys: [...keys] },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #setSelected(keys: Set<string>): void {
    this.selected = keys;
    this.dispatchEvent(
      new CustomEvent<CamoKeysDetail>("camo-selected-change", {
        detail: { keys: [...keys] },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #expand(row: TreeRow): void {
    if (!row.expandable || this.#exp().has(row.node.key)) return;
    this.#setExpanded(new Set(this.#exp()).add(row.node.key));
    // An unloaded node asks for its children once.
    if ((row.node.children ?? null) === null && !this.#requested.has(row.node.key)) {
      this.#requested.add(row.node.key);
      this.dispatchEvent(
        new CustomEvent<CamoLoadChildrenDetail>("camo-load-children", {
          detail: { node: row.node },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  #collapse(row: TreeRow): void {
    if (!this.#exp().has(row.node.key)) return;
    const next = new Set(this.#exp());
    next.delete(row.node.key);
    this.#setExpanded(next);
  }

  #choose(row: TreeRow): void {
    const key = row.node.key;
    if (this.multiSelect) {
      const next = new Set(this.#selSet());
      if (next.has(key)) next.delete(key);
      else next.add(key);
      this.#setSelected(next);
    } else if (!this.#selSet().has(key) || this.#selSet().size !== 1)
      this.#setSelected(new Set([key]));
  }

  #rowOf(event: Event): TreeRow | undefined {
    const item = (event.composedPath() as HTMLElement[]).find(
      (n) => n instanceof HTMLElement && n.getAttribute("role") === "treeitem",
    );
    const key = item?.dataset["key"];
    return key === undefined ? undefined : this.#rows().find((r) => r.node.key === key);
  }

  #focus(key: string | undefined): void {
    if (key === undefined) return;
    this.focused = key;
    void this.updateComplete.then(() =>
      this.renderRoot.querySelector<HTMLElement>(`li[data-key="${CSS.escape(key)}"]`)?.focus(),
    );
  }

  readonly #onClick = (event: Event): void => {
    const row = this.#rowOf(event);
    if (row === undefined) return;
    const toggle = (event.composedPath() as HTMLElement[]).some(
      (n) => n instanceof HTMLElement && n.dataset?.["part"] === "toggle",
    );
    this.focused = row.node.key;
    if (toggle && row.expandable) {
      if (this.#exp().has(row.node.key)) this.#collapse(row);
      else this.#expand(row);
      return;
    }
    this.#choose(row);
  };

  readonly #onKey = (event: KeyboardEvent): void => {
    const rows = this.#rows();
    const at = rows.findIndex((r) => r.node.key === this.#rowOf(event)?.node.key);
    if (at < 0) return;
    const row = rows[at]!;
    const rtl = getComputedStyle(this).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    let handled = true;
    // Any key but a letter ends the letters typed so far.
    if (event.key.length > 1) this.#typed = "";
    switch (event.key) {
      case "ArrowDown":
        this.#focus(rows[Math.min(at + 1, rows.length - 1)]?.node.key);
        break;
      case "ArrowUp":
        this.#focus(rows[Math.max(at - 1, 0)]?.node.key);
        break;
      case "Home":
        this.#focus(rows[0]?.node.key);
        break;
      case "End":
        this.#focus(rows.at(-1)?.node.key);
        break;
      case forward:
        if (row.expandable && !row.expanded) this.#expand(row);
        else if (row.expanded)
          this.#focus(rows[at + 1]?.parent === row.node.key ? rows[at + 1]?.node.key : undefined);
        break;
      case back:
        if (row.expanded) this.#collapse(row);
        else if (row.parent !== null) this.#focus(row.parent);
        break;
      case "Enter":
      case " ":
        this.#choose(row);
        break;
      default:
        handled = false;
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const now = performance.now();
          this.#typed =
            now - this.#typedAt > 700
              ? event.key.toLowerCase()
              : this.#typed + event.key.toLowerCase();
          this.#typedAt = now;
          const ordered = [...rows.slice(at + 1), ...rows.slice(0, at + 1)];
          const hit = ordered.find((r) => r.node.label.toLowerCase().startsWith(this.#typed));
          if (hit !== undefined) {
            this.#focus(hit.node.key);
            handled = true;
          }
        }
    }
    if (handled) event.preventDefault();
  };

  #icon(row: TreeRow): IconArtwork | null {
    const icon = row.node.icon;
    if (icon === undefined || icon === null) return null;
    const name = typeof icon === "string" ? icon : row.expanded ? icon[0] : icon[1];
    return resolveIcon(name);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    void changed;
    applyAria(this, this.#internals, { role: "generic" });
  }

  override render(): TemplateResult {
    const skin = this.#cx.skin;
    const rows = this.#rows();
    const active =
      this.focused !== null && rows.some((r) => r.node.key === this.focused)
        ? this.focused
        : rows[0]?.node.key;
    const renderer = skin?.tree;
    const style = renderer?.defaults(tokens);
    return html`${renderer === undefined ? html`` : cssBlock(renderer.styles)}<ul
        role="tree"
        aria-label=${this.caption === "" ? "Tree" : this.caption}
        aria-multiselectable=${this.multiSelect ? "true" : "false"}
      >
        ${repeat(
          rows,
          (r) => r.node.key,
          (row) => {
            const selected = this.#selSet().has(row.node.key);
            const loading = row.expanded && (row.node.children ?? null) === null;
            return html`<li
              role="treeitem"
              data-key=${row.node.key}
              aria-level=${row.level}
              aria-posinset=${row.index + 1}
              aria-setsize=${row.size}
              aria-expanded=${row.expandable ? (row.expanded ? "true" : "false") : nothing}
              aria-selected=${selected ? "true" : "false"}
              aria-busy=${loading ? "true" : nothing}
              tabindex=${row.node.key === active ? "0" : "-1"}
            >
              ${
                renderer === undefined || style === undefined || skin === undefined
                  ? row.node.label
                  : renderer.render({
                      state: {
                        level: row.level,
                        expanded: row.expanded,
                        hasChildren: row.expandable,
                        loading,
                        selected,
                        label: row.node.label,
                        icon: this.#icon(row),
                      },
                      slots: NO_SLOTS,
                      theme: tokens,
                      style,
                      skin,
                    })
              }
            </li>`;
          },
        )}
      </ul>`;
  }
}
