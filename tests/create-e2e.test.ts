import {execSync, spawn, spawnSync} from 'node:child_process';
import {readFileSync, rmSync, mkdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {ROOT, isLocalMode, localModeEnv} from '../scripts/mion-utils.mjs';

/** create.mjs installs too, so it needs the local-mode env */
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
        // A new project is its own repo; else oxlint obeys this repo's .gitignore, which ignores .tmp-*
        run('git init -q');
        run('npx playwright install chromium');
    }, 600_000);

    afterAll(() => rmSync(tmpDir, {recursive: true, force: true}));

    it('builds', () => run('npm run build'), 300_000);
    // before the per-target builds below, which may overwrite this build's output
    it('passes playwright e2e tests on the build', ({skip}) => (hasScript('test:e2e:build') ? run('npm run test:e2e:build') : skip()), 300_000);
    it('typechecks', ({skip}) => (hasScript('typecheck') ? run('npm run typecheck') : skip()), 300_000);
    it('passes unit tests', ({skip}) => (hasScript('test:unit') ? run('npm run test:unit') : skip()), 300_000);
    it('lints', ({skip}) => (hasScript('lint') ? run('npm run lint') : skip()), 300_000);
    it.for([
        ['node', 'build', 'preview:api', 3001],
        ['bun', 'build:bun', 'preview:bun', 3001],
        ['Cloudflare workerd', 'build:cloudflare', 'preview:cloudflare', 8787],
    ] as const)('serves the built API with %s', async ([target, build, serve, port], {skip}) => {
        if (!hasScript(serve) || (target === 'bun' && spawnSync('bun', ['--version']).status !== 0)) return skip();
        if (build !== 'build') run(`npm run ${build}`); // plain `build` already ran in 'builds'
        const api = spawn('npm', ['run', serve], {cwd: projectDir, env, detached: true, stdio: 'inherit'});
        try {
            const hello = () =>
                fetch(`http://localhost:${port}/api/mion/hello`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({hello: ['mion']}),
                })
                    .then((res) => res.json())
                    .catch(() => undefined);
            await expect.poll(hello, {timeout: 60_000, interval: 500}).toEqual({hello: 'Hello mion!'});
            // a Worker serves the SPA too
            if (port === 8787) expect((await fetch(`http://localhost:${port}/mion-orders`)).headers.get('content-type')).toContain('text/html');
        } finally {
            if (api.exitCode === null) process.kill(-api.pid!);
        }
    }, 300_000);
    it('passes playwright e2e tests', () => run('npx playwright test'), 300_000);
});
