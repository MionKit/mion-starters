import {defineConfig} from 'vite';
import {mionVitePlugin} from '@mionjs/devtools/vite';
export default defineConfig({plugins: [mionVitePlugin()], build: {lib: {entry: 'src/client.ts', formats: ['es']}}});
