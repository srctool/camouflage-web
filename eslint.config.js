import js from "@eslint/js";
import globals from "globals";
import lit from "eslint-plugin-lit";
import wc from "eslint-plugin-wc";
import tseslint from "typescript-eslint";
import camo from "./tools/eslint-rules/index.js";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/storybook-static/**",
      "**/node_modules/**",
      "**/test-results/**",
      "**/playwright-report/**",
      "**/.vitest/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { lit, wc },
    rules: {
      ...lit.configs["flat/recommended"].rules,
      "wc/guard-super-call": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  // The probe and scenario scripts run inside a page (a browser engine or a Tauri webview).
  {
    files: ["apps/tauri-sample/web/*.js"],
    languageOptions: { globals: { ...globals.browser } },
  },
  // Skin renderers: tokens only. The surface, material, feedback, theme and theme-factory files hold the skin's own
  // materials and values.
  {
    files: ["packages/skin-*/src/*.ts"],
    ignores: [
      "packages/skin-*/src/index.ts",
      "packages/skin-*/src/register.ts",
      "packages/skin-*/src/theme.ts",
      "packages/skin-*/src/accent.ts",
      "packages/skin-*/src/surface.ts",
      "packages/skin-*/src/material.ts",
      "packages/skin-*/src/factory.ts",
      "packages/skin-*/src/feedback.ts",
    ],
    plugins: { camo },
    rules: { "camo/no-literals": "error" },
  },
  // Renderers are pure: no browser globals at all (a second guard next to the test that runs them in Node).
  {
    files: ["packages/skin-*/src/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...[
          "window",
          "document",
          "navigator",
          "localStorage",
          "fetch",
          "setTimeout",
          "setInterval",
          "requestAnimationFrame",
        ].map((name) => ({
          name,
          message: "Renderers are pure and run on the server: no browser or timer access.",
        })),
      ],
    },
  },
  {
    files: ["tools/**/*.{js,mjs,ts}", "**/*.config.{js,ts,mjs}", "apps/*/*.mjs"],
    languageOptions: { globals: { ...globals.node } },
  },
);
