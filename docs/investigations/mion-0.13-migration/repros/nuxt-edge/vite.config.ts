import {defineConfig} from 'vite';
import {resolve} from 'path';
import {mionVitePlugin} from '@mionjs/devtools/vite';

export default defineConfig({
  // workaround: @mionjs/router reads process.env at module scope (rpc-router/src/constants.ts:15)
  define: {'process.env': '{}'},
  plugins: [
    mionVitePlugin({
      tsConfig: resolve(import.meta.dirname, 'tsconfig.json'),
      runTypes: {
        // required on Workers: no `new Function` at runtime
        emitMode: 'both',
      },
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'worker',
    },
    rollupOptions: {
      // Workers do not support dynamic code splitting, so bundle everything into one file
      output: {inlineDynamicImports: true},
    },
  },
});
