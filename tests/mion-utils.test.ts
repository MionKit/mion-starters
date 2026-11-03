import {mkdirSync, readFileSync, rmSync, writeFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {describe, it, expect, beforeEach, afterAll, vi} from 'vitest';
import {
    ROOT,
    LOCAL_REGISTRY,
    cleanMionCaches,
    findStarterDirs,
    isLocalMode,
    resolveVersions,
    setScopeLine,
    writeVersions,
} from '../scripts/mion-utils.mjs';

const DIR = resolve(ROOT, '.tmp-mion-utils');
const SCOPE_LINE = `@mionjs:registry=${LOCAL_REGISTRY}`;
const read = (file: string) => readFileSync(join(DIR, file), 'utf-8');
const writeJson = (file: string, value: unknown) => writeFileSync(join(DIR, file), JSON.stringify(value, null, 4) + '\n');

beforeEach(() => {
    rmSync(DIR, {recursive: true, force: true});
    mkdirSync(DIR, {recursive: true});
});
afterAll(() => rmSync(DIR, {recursive: true, force: true}));

describe('writeVersions', () => {
    it('sets every @mionjs/* dep, drops @mionjs/* overrides and keeps the indent', () => {
        writeJson('package.json', {
            dependencies: {'@mionjs/core': 'file:../x.tgz', vue: '^3'},
            devDependencies: {'@mionjs/devtools': '0.12.0'},
            overrides: {'@mionjs/core': 'file:../x.tgz', esbuild: '1'},
        });
        writeVersions(DIR, {'@mionjs/core': '0.13.2', '@mionjs/devtools': '0.13.2'});
        const pkg = JSON.parse(read('package.json'));
        expect(pkg.dependencies).toEqual({'@mionjs/core': '0.13.2', vue: '^3'});
        expect(pkg.devDependencies).toEqual({'@mionjs/devtools': '0.13.2'});
        expect(pkg.overrides).toEqual({esbuild: '1'});
        expect(read('package.json')).toMatch(/^ {4}"dependencies"/m);
    });

    it('removes an overrides block left empty', () => {
        writeJson('package.json', {dependencies: {'@mionjs/core': '0'}, overrides: {'@mionjs/core': 'file:x'}});
        writeVersions(DIR, {'@mionjs/core': '0.13.2'});
        expect(JSON.parse(read('package.json'))).not.toHaveProperty('overrides');
    });
});

describe('setScopeLine and isLocalMode', () => {
    it('adds the line, then removes it and deletes an emptied .npmrc', () => {
        setScopeLine(DIR, true);
        expect(read('.npmrc')).toBe(SCOPE_LINE + '\n');
        expect(isLocalMode(DIR)).toBe(true);
        setScopeLine(DIR, false);
        expect(existsSync(join(DIR, '.npmrc'))).toBe(false);
        expect(isLocalMode(DIR)).toBe(false);
    });

    it('keeps other .npmrc lines', () => {
        writeFileSync(join(DIR, '.npmrc'), 'save-exact=true\n');
        setScopeLine(DIR, true);
        setScopeLine(DIR, false);
        expect(read('.npmrc')).toBe('save-exact=true\n');
    });

    it('sees local mode in a lockfile with local registry URLs', () => {
        writeJson('package-lock.json', {packages: {'node_modules/@mionjs/core': {resolved: `${LOCAL_REGISTRY}@mionjs/core/-/core-0.13.2.tgz`}}});
        expect(isLocalMode(DIR)).toBe(true);
    });
});

describe('cleanMionCaches', () => {
    it('removes installed @mionjs packages and every @mionjs/* lockfile entry, nested ones too', () => {
        mkdirSync(join(DIR, 'node_modules/@mionjs/core'), {recursive: true});
        mkdirSync(join(DIR, 'node_modules/vue'), {recursive: true});
        writeJson('package-lock.json', {
            packages: {
                '': {},
                'node_modules/@mionjs/core': {},
                'node_modules/x/node_modules/@mionjs/router': {},
                'node_modules/vue': {},
            },
        });
        cleanMionCaches(DIR);
        expect(existsSync(join(DIR, 'node_modules/@mionjs'))).toBe(false);
        expect(existsSync(join(DIR, 'node_modules/vue'))).toBe(true);
        expect(Object.keys(JSON.parse(read('package-lock.json')).packages)).toEqual(['', 'node_modules/vue']);
    });
});

describe('resolveVersions', () => {
    it('resolves each package once and exits naming the ones it cannot find', () => {
        writeJson('package.json', {dependencies: {'@mionjs/core': '0', '@mionjs/gone': '0', vue: '^3'}});
        const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('exit');
        }) as never);
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => resolveVersions([DIR], (name: string) => (name === '@mionjs/core' ? '0.13.2' : null))).toThrow('exit');
        expect(error.mock.calls[0][0]).toContain('@mionjs/gone');
        exit.mockRestore();
        error.mockRestore();
    });

    it('returns one version per package across starters', () => {
        writeJson('package.json', {dependencies: {'@mionjs/core': '0'}, devDependencies: {'@mionjs/devtools': '0'}});
        const resolve = vi.fn((name: string) => `1.0.0-${name.split('/')[1]}`);
        expect(resolveVersions([DIR, DIR], resolve)).toEqual({'@mionjs/core': '1.0.0-core', '@mionjs/devtools': '1.0.0-devtools'});
        expect(resolve).toHaveBeenCalledTimes(2);
    });
});

describe('findStarterDirs', () => {
    it('finds every starter folder', () => {
        const dirs = findStarterDirs();
        for (const starter of ['nuxt/4', 'react/19', 'vue/3']) expect(dirs).toContain(resolve(ROOT, starter));
    });
});
