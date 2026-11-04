import {createCloudflareHandler} from '@mionjs/platform-cloudflare';
import './api.ts';

/** Built with `npm run build:cloudflare`; wrangler.toml serves dist/ next to it */
export default createCloudflareHandler();
