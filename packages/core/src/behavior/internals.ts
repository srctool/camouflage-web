/**
 * `ElementInternals` helpers. A custom element states things about itself (a name, a form value, a state like
 * "pressed") through its internals, so nothing has to be an attribute on the host or an id across a shadow root.
 */

/** Sets or clears a custom state on a host: `:state(name)` where the browser supports it, else `[data-camo-state-name]`. */
export function setCustomState(
  host: HTMLElement,
  internals: ElementInternals,
  name: string,
  on: boolean,
): void {
  const states = (internals as { states?: Set<string> }).states;
  if (states !== undefined) {
    try {
      if (on) states.add(name);
      else states.delete(name);
      return;
    } catch {
      // An older engine knows `states` but wants the `--name` form; fall through to the attribute.
    }
  }
  host.toggleAttribute(`data-camo-state-${name}`, on);
}

/** What a form-associated control reports to its form. */
export interface FormState {
  /** The value submitted with the form, or `null` to submit nothing. */
  value: string | File | FormData | null;
  required?: boolean;
  /** Whether the current value is acceptable. */
  valid?: boolean;
  /** The message a browser shows for an invalid control (also the accessible description of the problem). */
  message?: string;
  /** The element the browser should focus and anchor the message to. */
  anchor?: HTMLElement;
}

/**
 * Reports a control's value and validity to its form through `ElementInternals`. The element class must set
 * `static formAssociated = true`. A required control with an empty value is invalid by itself (`valueMissing`); a
 * custom rule is reported with `valid: false` and a message (`customError`).
 */
export function reportFormState(internals: ElementInternals, state: FormState): void {
  internals.setFormValue(state.value);
  const empty = state.value === null || state.value === "";
  if (state.required === true && empty) {
    internals.setValidity(
      { valueMissing: true },
      state.message ?? "This field is required.",
      state.anchor,
    );
  } else if (state.valid === false) {
    internals.setValidity(
      { customError: true },
      state.message ?? "This value is not valid.",
      state.anchor,
    );
  } else {
    internals.setValidity({});
  }
}
