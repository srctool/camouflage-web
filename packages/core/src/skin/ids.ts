/**
 * The ids a field's pieces have inside its shadow root. Core builds the editable node (`<input>`) and the renderer
 * draws the label and the helper text; they meet through these ids, which are local to the shadow root, so no id ever
 * has to cross one. A renderer puts `id=${FIELD_IDS.label}` on its label, and so on.
 */
export const FIELD_IDS = {
  input: "input",
  label: "label",
  supporting: "supporting",
  error: "error",
} as const;
