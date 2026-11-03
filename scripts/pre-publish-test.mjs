#!/usr/bin/env node

/** Simulates the full `npm create @mionjs/starter-*` flow before publishing. */

import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';
import {ROOT, findStarterDirs, isLocalMode} from './mion-utils.mjs';

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

function hasFileDeps(dir) {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
    const blocks = [pkg.dependencies, pkg.devDependencies, pkg.overrides];
    return blocks.some((deps) => Object.entries(deps ?? {}).some(([n, v]) => n.startsWith('@mionjs/') && String(v).startsWith('file:')));
}

function validateNpmMode() {
    const local = findStarterDirs().filter((dir) => isLocalMode(dir) || hasFileDeps(dir));
    if (local.length) {
        console.error('Error: these starters do not install @mionjs/* from npm:');
        for (const dir of local) console.error(`  ${path.relative(ROOT, dir)}`);
        console.error("Run 'npm run mionupdate' first to switch to npm versions.");
        process.exit(1);
    }
    console.log('All starters use npm-published @mionjs/* packages.\n');
}

function testStarter({name, dir}) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${name} starter (${dir})`);
    console.log(`${'='.repeat(60)}\n`);

    const starterDir = path.join(ROOT, dir);
    const tmpDir = path.join(TMP_ROOT, name);
    const projectDir = path.join(tmpDir, `test-${name}`);

    console.log('--- npm pack ---');
    const tarballName = execSync('npm pack', {cwd: starterDir, env, encoding: 'utf-8'}).trim();
    const tarballPath = path.join(starterDir, tarballName);

    try {
        console.log('--- extract tarball ---');
        fs.mkdirSync(tmpDir, {recursive: true});
        run(`tar xzf ${tarballPath} -C ${tmpDir}`, ROOT);

        const extractedDir = path.join(tmpDir, 'package');
        const createScript = path.join(extractedDir, 'create.mjs');
        console.log('--- run create.mjs ---');
        run(`node ${createScript} ${projectDir}`, tmpDir);

        console.log('--- build ---');
        run('npm run build', projectDir);

        console.log('--- install playwright ---');
        run('npx playwright install chromium', projectDir);

        console.log('--- run e2e tests ---');
        run('npx playwright test', projectDir);

        console.log(`\n  ${name} starter: PASSED\n`);
    } finally {
        if (fs.existsSync(tarballPath)) fs.rmSync(tarballPath);
    }
}

// Main
console.log('Pre-publish test: simulating npm create flow\n');

validateNpmMode();

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
