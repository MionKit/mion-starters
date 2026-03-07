import {initApi} from './api.ts';
import {startBunServer} from '@mionjs/platform-bun';

await initApi();
startBunServer({port: 3001});
