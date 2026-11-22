// Bundles the client entry (hydration support, the elements and both skins) for the browser.
import { rolldown } from "rolldown";

const bundle = await rolldown({
  input: new URL("./src/client.ts", import.meta.url).pathname,
  resolve: { conditionNames: ["import", "default"] },
  logLevel: "warn",
});
await bundle.write({
  file: new URL("./dist/client.js", import.meta.url).pathname,
  format: "esm",
  minify: true,
});
await bundle.close();
console.log("client bundle written to dist/client.js");
