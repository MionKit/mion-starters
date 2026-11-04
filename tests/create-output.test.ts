import {execFileSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {basename, join, resolve} from 'node:path';
import {describe, it, expect, beforeAll, afterAll} from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');
const TMP_DIR = resolve(ROOT, '.tmp-create-output');
const STARTERS = ['nuxt/4', 'react/19', 'vue/3'];

/** Generated state a maintainer's starter folder holds after a dev run or build */
const GENERATED = [
    '.mion/types/x.js',
    '.mion/api/x.json',
    'dist/x.js',
    'dist-server/x.js',
    'test-results/x',
    '.wrangler/x',
    '.data/kv/x',
    '.nuxt/x',
    '.output/x',
    '.npmrc',
];

afterAll(() => rmSync(TMP_DIR, {recursive: true, force: true}));

describe.each(STARTERS)('%s create.mjs', (starterDir) => {
    const name = starterDir.replace('/', '-');
    const sourceCopy = join(TMP_DIR, name, 'package');
    const projectDir = join(TMP_DIR, name, 'out', 'my-app');

    beforeAll(() => {
        rmSync(join(TMP_DIR, name), {recursive: true, force: true});
        cpSync(resolve(ROOT, starterDir), sourceCopy, {recursive: true, filter: (src) => basename(src) !== 'node_modules'});
        for (const file of [...GENERATED, '.mion/enriched/texts.ts']) {
            mkdirSync(resolve(sourceCopy, file, '..'), {recursive: true});
            writeFileSync(join(sourceCopy, file), '');
        }
        // an absolute path, as the e2e tests pass it
        execFileSync('node', [join(sourceCopy, 'create.mjs'), projectDir, '--no-install'], {stdio: 'pipe'});
    });

    it('names the package after the folder and drops starter-only fields', () => {
        const pkg = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf-8'));
        expect(pkg.name).toBe('my-app');
        expect(pkg.private).toBe(true);
        for (const key of ['description', 'homepage', 'author', 'version', 'license', 'bin', 'files', 'repository']) {
            expect(pkg).not.toHaveProperty(key);
        }
    });

    it('links the published package to the real repository', () => {
        const pkg = JSON.parse(readFileSync(resolve(ROOT, starterDir, 'package.json'), 'utf-8'));
        expect(pkg.repository).toEqual({type: 'git', url: 'git+https://github.com/MionKit/mion-starters.git', directory: starterDir});
        expect(pkg.bugs).toEqual({url: 'https://github.com/MionKit/mion-starters/issues'});
    });

    it('copies no generated state but keeps .mion/enriched', () => {
        for (const file of GENERATED) expect(existsSync(join(projectDir, file)), file).toBe(false);
        expect(existsSync(join(projectDir, '.mion/enriched/texts.ts'))).toBe(true);
        expect(existsSync(join(projectDir, 'create.mjs'))).toBe(false);
    });

    it('ignores mion generated state and host output in git and npm', () => {
        const lines = (file: string) => readFileSync(file, 'utf-8').split('\n');
        // `.data` and `/.data` both cover the starter root
        const covers = (file: string, patterns: string[]) =>
            expect(patterns.filter((p) => !lines(file).some((l) => l === p || l === p.replace(/^\//, '')))).toEqual([]);
        covers(join(projectDir, '.gitignore'), ['/.mion/*', '!/.mion/enriched/', '/dist-server', '/.wrangler', '/.data', '/test-results']);
        covers(resolve(ROOT, starterDir, '.npmignore'), ['.mion/*', '!.mion/enriched/', 'dist-server/', '.wrangler/', '.data/', 'test-results/']);
    });
});

describe('create.mjs arguments', () => {
    it('takes the first non-flag argument as the project name', () => {
        const projectDir = join(TMP_DIR, 'flag-first', 'my-app');
        rmSync(join(TMP_DIR, 'flag-first'), {recursive: true, force: true});
        mkdirSync(join(TMP_DIR, 'flag-first'), {recursive: true});
        execFileSync('node', [resolve(ROOT, 'react/19/create.mjs'), '--no-install', projectDir], {cwd: join(TMP_DIR, 'flag-first'), stdio: 'pipe'});
        expect(existsSync(join(projectDir, 'package.json'))).toBe(true);
        expect(existsSync(join(TMP_DIR, 'flag-first', '--no-install'))).toBe(false);
    });
});

describe('create.mjs without .mion/enriched', () => {
    it('copies no .mion folder at all', () => {
        const sourceCopy = join(TMP_DIR, 'no-enriched', 'package');
        const projectDir = join(TMP_DIR, 'no-enriched', 'out', 'my-app');
        rmSync(join(TMP_DIR, 'no-enriched'), {recursive: true, force: true});
        cpSync(resolve(ROOT, 'vue/3'), sourceCopy, {recursive: true, filter: (src) => basename(src) !== 'node_modules'});
        rmSync(join(sourceCopy, '.mion'), {recursive: true, force: true});
        mkdirSync(join(sourceCopy, '.mion/types'), {recursive: true});
        writeFileSync(join(sourceCopy, '.mion/types/x.js'), '');
        execFileSync('node', [join(sourceCopy, 'create.mjs'), projectDir, '--no-install'], {stdio: 'pipe'});
        expect(existsSync(join(projectDir, '.mion'))).toBe(false);
    });
});
