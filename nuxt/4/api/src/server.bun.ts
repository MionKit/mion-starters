import {startBunServer} from '@mionjs/platform-bun';
import './api.ts';

await startBunServer({port: 3001});
