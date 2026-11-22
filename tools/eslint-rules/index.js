import noLiterals from "./no-literals.js";

/** The repository's own rules, as a plugin named `camo`. */
export default { meta: { name: "camo" }, rules: { "no-literals": noLiterals } };
