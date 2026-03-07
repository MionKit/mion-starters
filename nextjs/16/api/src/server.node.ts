import {initApi} from './api.ts';
import {startNodeServer} from '@mionjs/platform-node';

await initApi();
startNodeServer({port: 3001});
