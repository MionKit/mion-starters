/// <reference types="vitest/config" />
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {mionVitePlugin} from '@mionjs/devtools/vite';

export default defineConfig({
    plugins: [react(), mionVitePlugin({server: {entry: 'api/src/server.node.ts', build: {outDir: 'dist-server'}}})],
    test: {include: ['api/tests/**/*.test.ts'], globalSetup: ['api/tests/global-setup.ts']},
    // `vite preview` serves only dist/: the API bundle runs on its own (npm run preview:api)
    preview: {proxy: {'/api/mion': 'http://localhost:3001'}},
});
