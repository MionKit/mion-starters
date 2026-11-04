import {defineConfig} from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:3000',
    },
    webServer: {
        command: 'npm run dev',
        // url, not port: nuxi answers its "Starting Nuxt..." page on the port before the app is ready
        url: 'http://localhost:3000/',
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
    },
});
