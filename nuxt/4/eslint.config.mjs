// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import mion from "@mionjs/devtools/eslint";

export default withNuxt(
  { ignores: ["api/dist/**", ".mion/**"] },
  {
    files: ["api/**/*.ts", "app/**/*.ts", "app/**/*.vue"],
    ...mion.configs.recommended,
    settings: { mion: { tsconfig: "tsconfig.mion.json" } },
  },
);
