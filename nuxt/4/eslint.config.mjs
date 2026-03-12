// @ts-check
import { ESLint } from "eslint";
import withNuxt from "./.nuxt/eslint.config.mjs";
import mionPlugin from "@mionjs/devtools/eslint";

export default withNuxt(
  {
    ignores: ["api/dist/**"],
  },
  {
    // mion rules for backend API code
    files: ["api/**/*.ts"],
    ...mionPlugin.configs.recommended,
  },
  {
    // Disable consistent-type-imports for API code as it conflicts with mion's runtime reflection
    files: ["api/**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    // Enforce type-only imports from backend in frontend code
    files: ["app/**/*.ts", "app/**/*.vue"],
    plugins: { "@mionjs": /** @type {any} */ (mionPlugin) },
    rules: {
      "@mionjs/enforce-type-imports": [
        "error",
        { backendSources: ["api/src/"] },
      ],
    },
  },
);
