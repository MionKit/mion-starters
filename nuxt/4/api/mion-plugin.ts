/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolve } from "path";
import { mionVitePlugin } from "@mionjs/devtools/vite-plugin";

const apiDir = import.meta.dirname;

/** Shared mion Vite plugin config — used by both nuxt.config.ts and api/vite.config.ts */
export function createMionVitePlugin(): any {
  return mionVitePlugin({
    runTypes: { tsConfig: resolve(apiDir, "tsconfig.json") },
    serverPureFunctions: {
      clientSrcPath: resolve(apiDir, "../app"),
    },
    aotCaches: true,
    server: {
      startScript: resolve(apiDir, "src/server.node.ts"),
      // Point the buildStart pre-pass child at api/vite.config.ts so it loads this very
      // mion plugin (otherwise vite-node uses an empty default config and can't resolve
      // virtual:mion-aot/caches).
      viteConfig: resolve(apiDir, "vite.config.ts"),
      runMode: "middleware",
    },
  });
}
