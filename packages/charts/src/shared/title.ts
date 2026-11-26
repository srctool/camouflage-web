import { isServer } from "lit";

/**
 * A `title` attribute would also show the browser's tooltip over the whole chart, so an element reads it into its
 * `title` property and takes the attribute off. Call from `attributeChangedCallback`; `true` means "handled".
 */
export function takeTitle(
  host: HTMLElement,
  name: string,
  value: string | null,
  state: { stripping: boolean },
): boolean {
  if (name !== "title") return false;
  if (value === null) return state.stripping;
  if (isServer) return false;
  host.title = value;
  state.stripping = true;
  host.removeAttribute("title");
  state.stripping = false;
  return true;
}
