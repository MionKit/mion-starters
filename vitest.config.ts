import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        name: 'create-starters',
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        testTimeout: 300_000,
    },
});
