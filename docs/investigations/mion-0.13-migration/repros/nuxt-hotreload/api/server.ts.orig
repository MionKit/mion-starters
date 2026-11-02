import {createMionRouter, Routes} from '@mionjs/router';
import {startNodeServer} from '@mionjs/platform-node';

const mion = createMionRouter({basePath: 'api'});
const routes = {
  hello: mion.query((ctx, name: string): string => `Hello ${name}!`),
} satisfies Routes;
export const myApi = mion.initRoutes(routes);
export type MyApi = typeof myApi;
await startNodeServer({port: 3999});
