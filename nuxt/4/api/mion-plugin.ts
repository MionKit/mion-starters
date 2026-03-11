import {resolve} from 'path';
import {mionPlugin} from '@mionjs/devtools/vite-plugin';

const apiDir = import.meta.dirname;

/** Shared mion Vite plugin config — used by both nuxt.config.ts and api/vite.config.ts */
export function createMionPlugin(): any {
    return mionPlugin({
        runTypes: {tsConfig: resolve(apiDir, 'tsconfig.json')},
        serverPureFunctions: {
            clientSrcPath: resolve(apiDir, '../app'),
        },
        aotCaches: {
            startServerScript: resolve(apiDir, 'src/server.node.ts'),
        },
    });
}
