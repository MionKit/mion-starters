import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {mionVitePlugin} from '@mionjs/devtools/vite';

/** standalone API bundle from the same program (batches written in app/ are compiled in too) */
export default defineConfig({
    plugins: [mionVitePlugin()],
    build: {
        ssr: resolve(import.meta.dirname, 'api/src/server.node.ts'),
        outDir: 'dist-api',
        emptyOutDir: true,
        target: 'node22',
        rollupOptions: {output: {format: 'es', entryFileNames: '[name].js'}},
    },
    ssr: {noExternal: [/@mionjs\//]},
});
