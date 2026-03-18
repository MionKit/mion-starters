import {initApi} from './api.ts';
import {startVercelDevServer} from '@mionjs/platform-vercel/dev-server';

await initApi();
await startVercelDevServer({port: 3001});
