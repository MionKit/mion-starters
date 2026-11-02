import {defineConfig} from 'vite';
import {mionVitePlugin} from '@mionjs/devtools/vite';

export default defineConfig({
    plugins: [mionVitePlugin({runTypes: {emitMode: 'both'}})],
    build: {lib: {entry: 'src/worker.ts', formats: ['es'], fileName: 'worker'}, rollupOptions: {output: {inlineDynamicImports: true}}},
    resolve: {noExternal: true} as any,
});
