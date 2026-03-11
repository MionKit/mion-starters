// @ts-check
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
    // Enforce type-only imports from backend in frontend code
    files: ["app/**/*.ts", "app/**/*.vue"],
    plugins: { "@mionjs": mionPlugin },
    rules: {
      "@mionjs/enforce-type-imports": [
        "error",
        { backendSources: ["api/src/"] },
      ],
    },
  },
);
