import {createCloudflareHandler} from '@mionjs/platform-cloudflare';
import './api.ts';

/** Cloudflare Worker, built with `npm run build:cloudflare`; wrangler.toml serves dist/ next to it */
export default createCloudflareHandler();
