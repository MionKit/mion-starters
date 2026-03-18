import {defineConfig, type Plugin} from 'vite';
import vue from '@vitejs/plugin-vue';
import {createMionPlugin} from './api/mion-plugin';

function mionDevServer(): Plugin {
    let apiInitialized = false;
    return {
        name: 'mion-dev-server',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = (req as any).url as string | undefined;
                if (!url?.startsWith('/api/mion')) return next();
                if (!apiInitialized) {
                    const {initApi} = await server.ssrLoadModule('./api/src/api.ts');
                    await initApi();
                    apiInitialized = true;
                }
                const {httpRequestHandler} = await server.ssrLoadModule('@mionjs/platform-node');
                httpRequestHandler(req, res);
            });
        },
    };
}

export default defineConfig({
    plugins: [
        vue(),
        createMionPlugin(),
        mionDevServer(),
    ],
    build: {
        outDir: 'dist',
    },
});
