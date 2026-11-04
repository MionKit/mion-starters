import {startBunServer} from '@mionjs/platform-bun';
import './api.ts';

/** Bun server */
await startBunServer({port: 3001});
