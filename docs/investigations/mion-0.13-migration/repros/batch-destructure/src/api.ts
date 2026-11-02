import {createMionRouter, Routes} from '@mionjs/router';
const mion = createMionRouter();
const routes = {
    a: mion.query((): number => 1),
    b: mion.query((ctx, n: number): number => n + 1),
} satisfies Routes;
export const myApi = mion.initRoutes(routes);
export type MyApi = typeof myApi;
