"use client";

import { useEffect } from "react";

/**
 * Defines the elements in the browser, after the server-rendered shadow roots are in the page. The hydration support
 * must be imported before the elements are defined. Renders nothing.
 */
export function CamoClient(): null {
  useEffect(() => {
    void (async () => {
      await import("@lit-labs/ssr-client/lit-element-hydrate-support.js");
      // The skins first, the elements last: defining an element upgrades it at once, and its first render must find
      // its skin registered, or it renders differently from the server and hydration fails.
      await import("@srctool/camouflage-skin-minimal/register");
      await import("@srctool/camouflage-skin-cupertino/register");
      await import("@srctool/camouflage-core/define");
    })();
  }, []);
  return null;
}
