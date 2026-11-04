import {startNodeServer} from '@mionjs/platform-node';
import './api.ts';

/** Under `nuxt dev` the mion plugin mounts this in-process and opens no port */
await startNodeServer({port: 3001});
