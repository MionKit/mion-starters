import {defineConfig} from 'vite';
import {resolve} from 'path';
import {mionPlugin} from '@mionjs/devtools/vite-plugin';

export default defineConfig({
    plugins: [
        mionPlugin({
            runTypes: {tsConfig: resolve(__dirname, 'tsconfig.json')},
            serverPureFunctions: {
                clientSrcPath: resolve(__dirname, '../app'),
                noViteClient: true,
            },
        }),
    ],
    resolve: {conditions: ['source']},
    ssr: {resolve: {conditions: ['source']}},
    build: {
        ssr: resolve(__dirname, 'src/vercel-serverless.ts'),
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: false,
        rollupOptions: {
            // Bundle @mionjs/* so the output is self-contained for Next.js route handler
            // Only externalize Node.js builtins (both node: and bare names)
            external: [/^node:/, /^(fs|path|os|crypto|http|https|url|stream|events|util|buffer|net|tls|zlib|child_process|worker_threads)(\/|$)/],
            output: {format: 'es', entryFileNames: '[name].js'},
        },
    },
});
