import {createMionRouter, Routes} from '@mionjs/router';
import {createCloudflareHandler} from '@mionjs/platform-cloudflare';

const mion = createMionRouter();
const routes = {hello: mion.route((ctx, name: string): string => `Hello ${name}`)} satisfies Routes;
mion.initRoutes(routes);

export default createCloudflareHandler();
