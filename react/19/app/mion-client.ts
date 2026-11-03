import {initClient} from '@mionjs/client';
import type {MyApi} from '../api/src/api.ts';

/** Module-level client: mion traces batches back to this initClient() call at build time */
export const {routes} = initClient<MyApi>({baseURL: window.location.origin, basePath: 'api/mion'});
