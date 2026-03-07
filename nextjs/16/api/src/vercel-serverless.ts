import {initApi} from './api.ts';
import {createVercelHandler, setVercelHandlerOpts} from '@mionjs/platform-vercel';

await initApi();
setVercelHandlerOpts({basePath: '/api/mion'});
export const {GET, POST, PUT, DELETE, PATCH} = createVercelHandler();

// Dev: start standalone Node server
if (process.env.NODE_ENV !== 'production') {
    const {startNodeServer} = await import('@mionjs/platform-node');
    startNodeServer({port: 3001});
}
