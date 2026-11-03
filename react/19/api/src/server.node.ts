import {startNodeServer} from '@mionjs/platform-node';
import './api.ts';

/** Node server; under `vite dev` the plugin mounts it in-process and no port is opened */
await startNodeServer({port: 3001});
