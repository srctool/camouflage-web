const CSS = `
  body { margin: 0; font-family: system-ui, sans-serif; }
  camo-provider.page > h1, camo-provider.panel > h1 { font-size: 16px; margin: 0 0 12px; }
  .row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  svg[slot] { width: 16px; height: 16px; }
  /* The provider paints nothing, so a page takes the theme's surface color from its variables. */
  camo-provider.page { display: block; padding: 24px; background: var(--camo-color-surface); color: var(--camo-color-on-surface); min-height: 100vh; box-sizing: border-box; }
  camo-provider.panel { display: block; padding: 16px; margin-top: 16px; border-radius: 12px; background: var(--camo-color-surface); color: var(--camo-color-on-surface); }
`;

/**
 * The document around a rendered body, as plain strings: a Lit template is parsed inside a `<template>` element, which
 * drops `<html>`, `<head>` and `<body>`, so the page shell is not a template.
 */
export function documentShell(title: string, script: boolean): { head: string; tail: string } {
  return {
    head: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${CSS}</style></head><body>`,
    tail: `${script ? '<script type="module" src="/client.js"></script>' : ""}</body></html>`,
  };
}
