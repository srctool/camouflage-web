// Compiled by tests/node/skin-contract.test.ts, which expects the error below. It is excluded from the normal typecheck.
import { minimalSkin } from "@srctool/camouflage-skin-minimal";
import { defineSkin } from "@srctool/camouflage-core";

const { dialog: _dropped, ...withoutDialog } = minimalSkin;
void _dropped;

export const broken = defineSkin({ ...withoutDialog, name: "broken" });
