import {startBunServer} from '@mionjs/platform-bun';
import './api.ts';

/** Bun server, built with `npm run build:bun` */
await startBunServer({port: 3001});
