import type { ReactNode } from "react";
import { CamoClient } from "./camo-client";

export const metadata = { title: "Camouflage on Next.js" };

const CSS = `
  body { margin: 0; font-family: system-ui, sans-serif; }
  camo-provider.page > h1, camo-provider.panel > h1 { font-size: 16px; margin: 0 0 12px; }
  .row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  camo-provider.page { display: block; padding: 24px; background: var(--camo-color-surface); color: var(--camo-color-on-surface); min-height: 100vh; box-sizing: border-box; }
  camo-provider.panel { display: block; padding: 16px; margin-top: 16px; border-radius: 12px; background: var(--camo-color-surface); color: var(--camo-color-on-surface); }
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{CSS}</style>
      </head>
      <body>
        {children}
        <CamoClient />
      </body>
    </html>
  );
}
