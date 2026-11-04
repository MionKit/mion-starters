import { fileURLToPath } from "node:url";
import { mionVitePlugin } from "@mionjs/devtools/vite";

// Nuxt's Vite root is app/, so relative paths would resolve from there
const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// the built app proxies /api/mion here, so the browser only talks to the app's own origin
const apiURL = (process.env.MION_API_URL || "http://localhost:3001").replace(/\/$/, "");

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  // SPA: the browser loads all data from the mion API
  ssr: false,
  devtools: { enabled: true },
  modules: ["@nuxt/eslint"],
  css: ["~/assets/css/main.css"],

  $production: {
    routeRules: { "/api/mion/**": { proxy: `${apiURL}/api/mion/**` } },
  },

  vite: {
    // the API runs inside `nuxt dev`, on the same origin as the app
    plugins: [
      mionVitePlugin({
        tsConfig: fromRoot("./tsconfig.mion.json"),
        server: { entry: fromRoot("./api/src/server.node.ts") },
      }),
    ],
    // bundled up front, so the first page load is not cut by a dependency reload
    optimizeDeps: {
      include: ["@mionjs/client", "@mionjs/core", "@mionjs/run-types"],
    },
  },
});
