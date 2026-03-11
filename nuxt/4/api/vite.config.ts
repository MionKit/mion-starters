import {defineConfig} from 'vite';
import {resolve} from 'path';
import {builtinModules} from 'module';
import {createMionPlugin} from './mion-plugin';

export default defineConfig({
    plugins: [createMionPlugin()],
    build: {
        ssr: resolve(__dirname, 'src/vercel-serverless.ts'),
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: false,
        rollupOptions: {
            external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
            output: {format: 'es', entryFileNames: '[name].js'},
        },
    },
});
