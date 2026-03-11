import {initApi} from './api.ts';
import {createCloudflareHandler} from '@mionjs/platform-cloudflare';

await initApi();
export default createCloudflareHandler();
