import {initClient} from '@mionjs/client';
import type {MyApi} from '../api/server.ts';
export const {routes} = initClient<MyApi>({baseURL: location.origin, basePath: 'api'});
routes.hello('web').call().then(([r]) => (document.body.textContent = String(r)));
