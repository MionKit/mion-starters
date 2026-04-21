import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "module";
import { mionVitePlugin } from "@mionjs/devtools/vite-plugin";

const apiDir = import.meta.dirname;

export default defineConfig({
  plugins: [
    mionVitePlugin({
      runTypes: { tsConfig: resolve(apiDir, "tsconfig.json") },
      serverPureFunctions: { clientSrcPath: resolve(apiDir, "../app") },
      aotCaches: true,
    }),
  ],
  ssr: {
    noExternal: [/@mionjs\//],
  },
  build: {
    ssr: true,
    outDir: resolve(apiDir, "../dist/api"),
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: {
        "cloudflare-worker": resolve(apiDir, "src/cloudflare-worker.ts"),
        "server.node": resolve(apiDir, "src/server.node.ts"),
        "server.bun": resolve(apiDir, "src/server.bun.ts"),
        "vercel-serverless": resolve(apiDir, "src/vercel-serverless.ts"),
      },
      external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
      },
    },
  },
});
