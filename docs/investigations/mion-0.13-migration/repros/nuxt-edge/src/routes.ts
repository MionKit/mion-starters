import {createMionRouter, Routes} from '@mionjs/router';

const mion = createMionRouter();
const routes = {
  sayHello: mion.route((ctx, name: string): string => `Hello ${name}!`),
} satisfies Routes;
export const myApi = mion.initRoutes(routes);
