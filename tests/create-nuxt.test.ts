import {execSync} from 'node:child_process';
import {rmSync, mkdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {describe, it, beforeAll, afterAll} from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');
const TMP_DIR = resolve(ROOT, '.tmp-nuxt');
const PROJECT_DIR = join(TMP_DIR, 'e2e-nuxt');
const STARTER_DIR = resolve(ROOT, 'nuxt/4');
const CREATE_SCRIPT = resolve(STARTER_DIR, 'create.mjs');

const env = {...process.env, NODE_ENV: 'development'};
const run = (cmd: string, cwd = PROJECT_DIR) =>
    execSync(cmd, {cwd, stdio: 'inherit', timeout: 180_000, env});

describe('create-starter-nuxt e2e', () => {
    beforeAll(() => {
        rmSync(TMP_DIR, {recursive: true, force: true});
        mkdirSync(TMP_DIR, {recursive: true});

        // 1. Create project (runs pnpm install)
        run(`node ${CREATE_SCRIPT} ${PROJECT_DIR}`, TMP_DIR);

        // 2. Install playwright browser
        run('pnpm exec playwright install chromium');
    }, 600_000);

    afterAll(() => {
        rmSync(TMP_DIR, {recursive: true, force: true});
    });

    it('passes playwright e2e tests', () => {
        run('pnpm exec playwright test');
    }, 120_000);
});
