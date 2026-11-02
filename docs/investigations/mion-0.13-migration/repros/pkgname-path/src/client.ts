import {batch, inputFrom, initClient} from '@mionjs/client';
import type {MyApi} from './api.ts';

const {routes} = initClient<MyApi>({baseURL: 'http://localhost:3000'});
export const run = () => {
    const a = routes.a();
    const b = routes.b(inputFrom(a, (n) => n! * 2).asArg());
    return batch([a, b]).call();
};
