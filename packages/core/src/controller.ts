import type { ReactiveController, ReactiveControllerHost } from "lit";
import { ContextConsumer } from "@lit/context";
import { environmentContext, skinContext } from "./context.ts";
import { fallbackSkin } from "./skin/registry.ts";
import type { CamoEnvironment, CamoSkin } from "./skin/types.ts";

const warned = new Set<string>();

/** Logs a development warning once per message. */
export function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[camouflage] ${message}`);
}

/** The server's defaults for what can only be measured in a browser (the Provider note, section 3.3). */
export const defaultEnvironment: CamoEnvironment = {
  windowSize: "expanded",
  input: "pointer",
  platform: "web",
  capabilities: {
    backdropBlur: false,
    runtimeShaders: false,
    windowMaterial: false,
    reduceTransparency: false,
  },
};

/**
 * Reads the skin and the environment from the nearest `camo-provider` (the notes' `camouflage(host)`). With no
 * provider it uses the registered fallback skin and warns once, so a lone component in plain HTML still works.
 */
export class CamouflageController implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #skin: ContextConsumer<typeof skinContext, ReactiveControllerHost & HTMLElement>;
  readonly #environment: ContextConsumer<
    typeof environmentContext,
    ReactiveControllerHost & HTMLElement
  >;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.#host = host;
    host.addController(this);
    this.#skin = new ContextConsumer(host, { context: skinContext, subscribe: true });
    this.#environment = new ContextConsumer(host, { context: environmentContext, subscribe: true });
  }

  hostConnected(): void {}

  /** The skin to draw with, or `undefined` when there is no provider and no fallback is registered. */
  get skin(): CamoSkin | undefined {
    const provided = this.#skin.value?.skin;
    if (provided !== undefined) return provided;
    const fallback = fallbackSkin();
    if (fallback !== undefined) {
      warnOnce(
        `<${this.#host.localName}> has no <camo-provider> above it: using the "${fallback.name}" fallback skin.`,
      );
      return fallback;
    }
    warnOnce(
      `<${this.#host.localName}> has no <camo-provider> above it and no fallback skin is registered: ` +
        `import a skin's "register" entry, or wrap the page in <camo-provider skin="…">.`,
    );
    return undefined;
  }

  get environment(): CamoEnvironment {
    return this.#environment.value ?? defaultEnvironment;
  }
}
