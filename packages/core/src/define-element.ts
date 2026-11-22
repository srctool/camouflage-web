/**
 * Defines a custom element once. Importing the same package twice, or two copies of it, never throws
 * (Project Setup, section 3.2).
 */
export function defineElement(tag: string, element: CustomElementConstructor): void {
  if (typeof customElements === "undefined") return;
  if (!customElements.get(tag)) customElements.define(tag, element);
}
