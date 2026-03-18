import handler from '../../../api/dist/cloudflare-worker.js';

export const onRequest = handler.fetch;
