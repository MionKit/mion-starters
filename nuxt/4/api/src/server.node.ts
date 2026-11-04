import {startNodeServer} from '@mionjs/platform-node';
import './api.ts';

/** Node server; under `nuxt dev` the mion plugin mounts it in-process and no port is opened */
await startNodeServer({port: 3001});
