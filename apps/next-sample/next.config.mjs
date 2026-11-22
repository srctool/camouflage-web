/** @type {import("next").NextConfig} */
export default {
  // Lit's server package patches globals and must run as plain Node, not bundled into the server build.
  serverExternalPackages: [
    "@lit-labs/ssr",
    "@lit-labs/ssr-client",
    "lit",
    "@lit/reactive-element",
    "lit-html",
    "lit-element",
  ],
  // The workspace packages ship TypeScript sources under the `source` condition and JavaScript under `default`.
  transpilePackages: [],
};
