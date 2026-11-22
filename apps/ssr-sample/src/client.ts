// The hydration support must be the first import: it patches Lit so elements attach to the server-rendered shadow roots.
import "@lit-labs/ssr-client/lit-element-hydrate-support.js";
import "@srctool/camouflage-core/define";
import "@srctool/camouflage-skin-minimal/register";
import "@srctool/camouflage-skin-cupertino/register";
