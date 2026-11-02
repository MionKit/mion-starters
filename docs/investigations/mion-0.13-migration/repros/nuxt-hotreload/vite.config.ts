import {defineConfig} from 'vite';
import {mionVitePlugin} from '@mionjs/devtools/vite';

// ROOT=web reproduces Nuxt's layout (vite root = srcDir, API entry outside it); ROOT=. is the control
const root = process.env.ROOT ?? 'web';
export default defineConfig({
  root,
  plugins: [mionVitePlugin({tsConfig: new URL('./tsconfig.json', import.meta.url).pathname, server: {entry: new URL('./api/server.ts', import.meta.url).pathname}})],
});
