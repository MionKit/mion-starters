import {execSync, spawn} from 'node:child_process';
import {readFileSync, rmSync, mkdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {ROOT, isLocalMode, localModeEnv} from '../scripts/mion-utils.mjs';

/** create.mjs installs too: from the local registry when the starter is in local mode */
describe.each([
    ['nuxt', 'nuxt/4'],
    ['react', 'react/19'],
    ['vue', 'vue/3'],
])('create-starter-%s e2e', (name, starterDir) => {
    const tmpDir = resolve(ROOT, `.tmp-${name}`);
    const projectDir = join(tmpDir, `e2e-${name}`);
    const starter = resolve(ROOT, starterDir);
    const env = {...process.env, NODE_ENV: 'development', ...(isLocalMode(starter) ? localModeEnv() : {})};
    const run = (cmd: string, cwd = projectDir) => execSync(cmd, {cwd, stdio: 'inherit', timeout: 300_000, env});
    const hasScript = (script: string) =>
        script in (JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf-8')).scripts ?? {});

    beforeAll(() => {
        rmSync(tmpDir, {recursive: true, force: true});
        mkdirSync(tmpDir, {recursive: true});
        run(`node ${join(starter, 'create.mjs')} ${projectDir}`, tmpDir);
        run('npx playwright install chromium');
    }, 600_000);

    afterAll(() => rmSync(tmpDir, {recursive: true, force: true}));

    it('builds', () => run('npm run build'), 300_000);
    it('typechecks', ({skip}) => (hasScript('typecheck') ? run('npm run typecheck') : skip()), 300_000);
    it('passes unit tests', ({skip}) => (hasScript('test:unit') ? run('npm run test:unit') : skip()), 300_000);
    it('serves the built API with node', async ({skip}) => {
        if (!hasScript('preview:api')) return skip();
        const api = spawn('npm', ['run', 'preview:api'], {cwd: projectDir, env, detached: true, stdio: 'ignore'});
        try {
            const hello = () =>
                fetch('http://localhost:3001/api/mion/hello', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({hello: ['Node']}),
                })
                    .then((res) => res.json())
                    .catch(() => undefined);
            await expect.poll(hello, {timeout: 30_000, interval: 500}).toEqual({hello: 'Hello Node!'});
        } finally {
            process.kill(-api.pid!);
        }
    }, 60_000);
    it('passes playwright e2e tests', () => run('npx playwright test'), 300_000);
});
