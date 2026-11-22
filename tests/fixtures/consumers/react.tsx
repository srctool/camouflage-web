// What a React 19 consumer gets from `@srctool/camouflage-core/react`.
import "@srctool/camouflage-core/react";

export const ok = (
  <camo-provider skin="minimal" scheme="dark">
    <camo-button text="Save" appearance="soft" tone="success" disabled />
    <camo-dialog open title="Delete?" message="This can't be undone." />
  </camo-provider>
);

// @ts-expect-error not an appearance
export const badAppearance = <camo-button text="x" appearance="huge" />;
// @ts-expect-error not a scheme
export const badScheme = <camo-provider scheme="blue" />;
