/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { resolve } from "node:path";
import { builtinModules } from "node:module";
import { mionVitePlugin } from "@mionjs/devtools/vite";

const root = resolve(import.meta.dirname, "..");
const targets = ["server.node", "server.bun", "cloudflare-worker"];

/** The API bundle, one target per run: `vite build --config api/vite.config.ts --mode <target>` */
export default defineConfig(({ mode }) => {
  const target = targets.includes(mode) ? mode : "server.node";
  const isWorker = target === "cloudflare-worker";
  return {
    root,
    // public/ belongs to the Nuxt app, not the API bundle
    publicDir: false,
    plugins: [
      mionVitePlugin({
        // the same program as Nuxt, so the API knows the batches the app sends
        tsConfig: resolve(root, "tsconfig.mion.json"),
        // Workers forbid runtime code generation
        runTypes: isWorker ? { emitMode: "both" } : undefined,
      }),
    ],
    ssr: isWorker ? { noExternal: true, target: "webworker" } : { noExternal: [/^@mionjs\//] },
    build: {
      ssr: resolve(root, `api/src/${target}.ts`),
      outDir: resolve(root, "api/dist"),
      emptyOutDir: false,
      sourcemap: true,
      minify: false,
      target: "es2023",
      rollupOptions: {
        external: isWorker ? [] : [...builtinModules, ...builtinModules.map((m) => `node:${m}`), "bun"],
        output: { format: "es", entryFileNames: "[name].js" },
      },
    },
    test: { root, include: ["api/tests/**/*.test.ts"], globalSetup: ["api/tests/global-setup.ts"] },
  };
});
