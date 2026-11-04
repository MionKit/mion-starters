/// <reference types="vitest/config" />
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {mionVitePlugin} from '@mionjs/devtools/vite';

/** Keyed by `vite build --mode <target>`; dev and plain `vite build` use node */
const API_ENTRIES: Record<string, string> = {
    bun: 'api/src/server.bun.ts',
    cloudflare: 'api/src/cloudflare-worker.ts',
};

export default defineConfig(({mode}) => ({
    plugins: [
        vue(),
        mionVitePlugin({
            server: {entry: API_ENTRIES[mode] ?? 'api/src/server.node.ts', build: {outDir: 'dist-server'}},
            // Workers refuse `new Function`, so that build ships every compiled function ready to run
            runTypes: mode === 'cloudflare' ? {emitMode: 'both'} : undefined,
        }),
    ],
    test: {include: ['api/tests/**/*.test.ts'], globalSetup: ['api/tests/global-setup.ts']},
    // `vite preview` serves only dist/: the API bundle runs on its own (npm run preview:api)
    preview: {proxy: {'/api/mion': 'http://localhost:3001'}},
}));
