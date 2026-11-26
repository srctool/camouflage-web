// Material's paper is core's shared Classic treatment: a fill with a soft shadow that grows with elevation. Material
// draws no blur, so it reads none of the platform's capabilities and needs no fallback chain (ADR-42).
export { classic as paper } from "@srctool/camouflage-core";
