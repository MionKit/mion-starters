import {Routes} from '@mionjs/router';
import {mion} from './router.ts';
import {ordersRoutes} from './features/orders/orders-handlers.ts';

const routes = {
    hello: mion.query((ctx, name: string): string => `Hello ${name}!`),
    getTime: mion.query((): Date => new Date()),
    orders: ordersRoutes,
} satisfies Routes;

export const myApi = mion.initRoutes(routes);
export type MyApi = typeof myApi;
