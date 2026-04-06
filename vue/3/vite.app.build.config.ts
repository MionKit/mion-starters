import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import { mionPlugin } from "@mionjs/devtools/vite-plugin";

const apiDir = resolve(import.meta.dirname, "api");

/** Vite config for building the Vue SPA (production) */
export default defineConfig({
  plugins: [
    vue(),
    mionPlugin({
      runTypes: { tsConfig: resolve(apiDir, "tsconfig.json") },
      serverPureFunctions: { clientSrcPath: resolve(apiDir, "../app") },
      aotCaches: { isClient: true },
      server: {
        startScript: resolve(apiDir, "src/server.node.ts"),
        viteConfig: resolve(apiDir, "vite.config.ts"),
        runMode: "middleware",
      },
    }),
  ],
  ssr: {
    noExternal: [/@mionjs\//],
  },
  server: {
    proxy: {
      "/api/mion": "http://localhost:3001",
    },
  },
  preview: {
    proxy: {
      "/api/mion": "http://localhost:3001",
    },
  },
  build: { outDir: "dist/app" },
});
