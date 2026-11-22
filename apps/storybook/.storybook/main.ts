import type { StorybookConfig } from "@storybook/web-components-vite";

// The usage site serves this build under `/web/`, so every asset URL is relative to that base.
const config: StorybookConfig = {
  framework: "@storybook/web-components-vite",
  core: { disableTelemetry: true },
  stories: ["../stories/*.stories.ts"],
  async viteFinal(config) {
    config.base = "/web/";
    config.resolve = {
      ...config.resolve,
      conditions: ["source", "module", "browser", "development|production"],
    };
    return config;
  },
};
export default config;
