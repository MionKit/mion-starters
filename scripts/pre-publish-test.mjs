#!/usr/bin/env node

/**
 * Simulates the full `npm create @mionjs/starter-*` flow before publishing.
 * Packs each starter, extracts the tarball, runs create.mjs, and verifies e2e tests pass.
 */

import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';
import {findStarterPackageJsons, isCurrentlyFileMode} from './mion-utils.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const TMP_ROOT = path.join(ROOT, '.tmp-pre-publish');

const STARTERS = [
    {name: 'nextjs', dir: 'nextjs/16'},
    {name: 'nuxt', dir: 'nuxt/4'},
    {name: 'vue', dir: 'vue/3'},
];

const keepTmp = process.argv.includes('--keep-tmp');
const env = {...process.env, NODE_ENV: 'development'};

function run(cmd, cwd) {
    console.log(`  $ ${cmd}`);
    execSync(cmd, {cwd, stdio: 'inherit', timeout: 300_000, env});
}

function validateNoDeps() {
    const packageJsons = findStarterPackageJsons();
    if (isCurrentlyFileMode(packageJsons)) {
        console.error('Error: Starters are using file: references for @mionjs/* deps.');
        console.error("Run 'pnpm run mionupdate' first to switch to npm versions.");
        process.exit(1);
    }
    console.log('All starters using npm versions (no file: references).\n');
}

function testStarter({name, dir}) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${name} starter (${dir})`);
    console.log(`${'='.repeat(60)}\n`);

    const starterDir = path.join(ROOT, dir);
    const tmpDir = path.join(TMP_ROOT, name);
    const projectDir = path.join(tmpDir, `test-${name}`);

    // 1. pnpm pack
    console.log('--- pnpm pack ---');
    const tarballName = execSync('pnpm pack', {cwd: starterDir, env, encoding: 'utf-8'})
        .trim()
        .split('\n')
        .pop();
    const tarballPath = path.isAbsolute(tarballName) ? tarballName : path.join(starterDir, tarballName);

    try {
        // 2. Extract tarball
        console.log('--- extract tarball ---');
        fs.mkdirSync(tmpDir, {recursive: true});
        run(`tar xzf ${tarballPath} -C ${tmpDir}`, ROOT);

        // 3. Run create.mjs from the extracted package (simulates npm create)
        const extractedDir = path.join(tmpDir, 'package');
        const createScript = path.join(extractedDir, 'create.mjs');
        console.log('--- run create.mjs ---');
        run(`node ${createScript} ${projectDir}`, tmpDir);

        // 4. Install playwright and run e2e tests
        console.log('--- install playwright ---');
        run('pnpm exec playwright install chromium', projectDir);

        console.log('--- run e2e tests ---');
        run('pnpm exec playwright test', projectDir);

        console.log(`\n  ${name} starter: PASSED\n`);
    } finally {
        // Clean up tarball from starter directory
        if (fs.existsSync(tarballPath)) fs.rmSync(tarballPath);
    }
}

// Main
console.log('Pre-publish test: simulating npm create flow\n');

validateNoDeps();

try {
    // Clean any previous run
    fs.rmSync(TMP_ROOT, {recursive: true, force: true});

    for (const starter of STARTERS) {
        testStarter(starter);
    }

    console.log('\n' + '='.repeat(60));
    console.log('  All starters passed pre-publish test!');
    console.log('='.repeat(60) + '\n');
} finally {
    if (keepTmp) {
        console.log(`Temp directory kept at: ${TMP_ROOT}\n`);
    } else {
        fs.rmSync(TMP_ROOT, {recursive: true, force: true});
    }
}
