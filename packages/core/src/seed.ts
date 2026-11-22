// The seed builder: `fromSeed` turns a few brand colors into all 42 roles. It lives on its own entry because it needs
// `@material/material-color-utilities` (the HCT color space), which an app that ships ready-made themes never loads.
// It is for build tools and for apps that derive a theme in the browser; import it from a bundler.
export { fromSeed } from "./theme/seed.ts";
export type { SeedOptions } from "./theme/seed.ts";
