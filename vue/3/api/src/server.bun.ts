import {startBunServer} from '@mionjs/platform-bun';
import './api.ts';

/** Built with `npm run build:bun` */
await startBunServer({port: 3001});
