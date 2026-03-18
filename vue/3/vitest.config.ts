import { defineConfig } from "vitest/config";
import { mionPlugin } from "@mionjs/devtools/vite-plugin";
import { resolve } from "path";

const apiDir = resolve(import.meta.dirname, "api");

export default defineConfig({
  plugins: [
    mionPlugin({
      runTypes: { tsConfig: resolve(apiDir, "tsconfig.json") },
      serverPureFunctions: { clientSrcPath: resolve(apiDir, "../app") },
      server: {
        startScript: resolve(apiDir, "src/server.node.ts"),
        viteConfig: resolve(apiDir, "vite.config.ts"),
        runMode: "childProcess",
      },
    }),
  ],
  ssr: {
    noExternal: [/@mionjs\//],
  },
  test: {
    globals: true,
    globalSetup: "./vitest.globalSetup.ts",
    include: ["api/tests/**/*.test.ts"],
  },
});
