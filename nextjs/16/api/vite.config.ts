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
