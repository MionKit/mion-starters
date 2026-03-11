import 'virtual:mion-aot/caches';
import {initClient} from '@mionjs/client';
import type {MyApi} from '../../api/src/api.ts';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const client = initClient<MyApi>({
    baseURL: config.public.mionApiUrl || (import.meta.server ? 'http://localhost:3000' : window.location.origin),
    basePath: 'api/mion',
  });

  return {provide: {mionClient: client}};
});
