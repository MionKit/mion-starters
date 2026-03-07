import {defineConfig} from 'vite';
import {resolve} from 'path';
import {mionPlugin} from '@mionjs/devtools/vite-plugin';

export default defineConfig({
    plugins: [
        mionPlugin({
            runTypes: {tsConfig: resolve(__dirname, 'tsconfig.json')},
        }),
    ],
    build: {
        lib: {entry: resolve(__dirname, 'src/vercel-serverless.ts'), formats: ['es']},
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: false,
        rollupOptions: {
            external: [/^@mionjs\//, /^[^./]/],
            output: {format: 'es', entryFileNames: '[name].js'},
        },
    },
});
