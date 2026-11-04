import {defineConfig} from '@playwright/test';
import base from './playwright.config.ts';

/** The e2e suite against `npm run build` output: the built API, and the built app forwarding /api/mion to it */
export default defineConfig({
    ...base,
    webServer: [
        {command: 'npm run preview:api', url: 'http://localhost:3001/api/mion/getTime', reuseExistingServer: false},
        {command: 'npm run preview', url: 'http://localhost:3000/', reuseExistingServer: false},
    ],
});
