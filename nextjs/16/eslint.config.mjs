import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import mionPlugin from "@mionjs/devtools/eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "api/dist/**",
  ]),
  // Enforce type-only imports from backend in frontend code
  {
    files: ["app/**/*.ts", "app/**/*.tsx"],
    // Exclude Next.js API routes (server-side, allowed to import backend code)
    ignores: ["app/api/**"],
    plugins: {
      "@mionjs": mionPlugin,
    },
    rules: {
      "@mionjs/enforce-type-imports": ["error", { backendSources: ["api/src/", "@mion-app/api"] }],
    },
  },
]);

export default eslintConfig;
