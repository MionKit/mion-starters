import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "module";
import { mionVitePlugin } from "@mionjs/devtools/vite-plugin";

export default defineConfig({
  plugins: [
    mionVitePlugin({
      runTypes: { tsConfig: resolve(__dirname, "tsconfig.json") },
      serverPureFunctions: {
        clientSrcPath: resolve(__dirname, "../app"),
        noViteClient: true,
      },
      aotCaches: true,
      // Pre-pass at buildStart populates AOT caches so virtual:mion-aot/caches returns
      // populated data at import time. runMode: 'buildOnly' spawns a short-lived child
      // that runs dev-server.ts with MION_COMPILE=buildOnly (platform adapters skip
      // server.listen()), captures the caches, and exits. The actual API server is still
      // launched separately by `npm run dev:api` via vite-node --watch.
      server: {
        startScript: resolve(__dirname, "src/dev-server.ts"),
        // Point the pre-pass child at this same vite config so the mion plugin loads
        // there too (and resolves virtual:mion-aot/caches).
        viteConfig: resolve(__dirname, "vite.config.ts"),
        runMode: "buildOnly",
      },
    }),
  ],
  build: {
    ssr: resolve(__dirname, "src/vercel-serverless.ts"),
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      // Bundle @mionjs/* so the output is self-contained for Next.js route handler
      external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
      output: { format: "es", entryFileNames: "[name].js" },
    },
  },
});
