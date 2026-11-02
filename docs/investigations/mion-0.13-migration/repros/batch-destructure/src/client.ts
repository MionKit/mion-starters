import {batch, initClient} from '@mionjs/client';
import type {MyApi} from './api.ts';

export const client = initClient<MyApi>({baseURL: 'http://localhost:3000'});

// OK: property read of the client
const routesOk = client.routes;
export const ok = () => batch([routesOk.a(), routesOk.b(1)]).call();

// FAILS (rpc-batch-element-unreadable): destructuring the same client
const {routes} = client;
export const fails = () => batch([routes.a(), routes.b(1)]).call();
