// standalone deploy of the same API (no Next): `vite build -c vite.api.config.ts && node dist-api/server.node.js`
import './api.ts';
import {startNodeServer} from '@mionjs/platform-node';

startNodeServer({port: Number(process.env.PORT ?? 3001)});
