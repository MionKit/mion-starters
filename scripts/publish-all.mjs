#!/usr/bin/env node

/**
 * Publishes all starter packages to npm.
 *
 * Runs `npm publish` interactively in each starter dir so npm can prompt
 * for the 2FA OTP each time (passing --otp as a flag fails — the code
 * expires before the second package goes through).
 *
 * Usage:
 *   node scripts/publish-all.mjs              publish all
 *   node scripts/publish-all.mjs nextjs nuxt  publish a subset
 *   node scripts/publish-all.mjs --dry-run    npm publish --dry-run for each
 *   node scripts/publish-all.mjs --skip-test  skip pre-publish-test
 */

import path from 'node:path';
import {execSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {stdin, stdout} from 'node:process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STARTERS = [
    {name: 'nextjs', dir: 'nextjs/16', pkg: '@mionjs/create-starter-nextjs'},
    {name: 'nuxt', dir: 'nuxt/4', pkg: '@mionjs/create-starter-nuxt'},
    {name: 'vue', dir: 'vue/3', pkg: '@mionjs/create-starter-vue'},
];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipTest = args.includes('--skip-test');
const selected = args.filter((a) => !a.startsWith('--'));
const targets = selected.length ? STARTERS.filter((s) => selected.includes(s.name)) : STARTERS;

if (!targets.length) {
    console.error(`No matching starters. Available: ${STARTERS.map((s) => s.name).join(', ')}`);
    process.exit(1);
}

function header(title) {
    const bar = '='.repeat(60);
    console.log(`\n${bar}\n  ${title}\n${bar}\n`);
}

function getPublishedVersion(pkg) {
    try {
        return execSync(`npm view ${pkg} version`, {encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
    } catch {
        return null;
    }
}

function getLocalVersion(dir) {
    const pkgJson = JSON.parse(execSync(`cat ${path.join(ROOT, dir, 'package.json')}`, {encoding: 'utf-8'}));
    return pkgJson.version;
}

async function confirm(question) {
    const rl = createInterface({input: stdin, output: stdout});
    const answer = (await rl.question(`${question} (y/N) `)).trim().toLowerCase();
    rl.close();
    return answer === 'y' || answer === 'yes';
}

function publishOne({name, dir, pkg}) {
    header(`Publishing ${pkg} (${dir})`);

    const cmd = 'npm';
    const cmdArgs = ['publish'];
    if (dryRun) cmdArgs.push('--dry-run');

    console.log(`  $ ${cmd} ${cmdArgs.join(' ')}\n`);

    // stdio: 'inherit' lets npm prompt interactively for the OTP on this terminal
    const result = spawnSync(cmd, cmdArgs, {cwd: path.join(ROOT, dir), stdio: 'inherit'});

    if (result.status !== 0) throw new Error(`npm publish failed for ${pkg} (exit ${result.status})`);
    console.log(`\n  ${pkg}: PUBLISHED\n`);
}

async function main() {
    header('Publish plan');
    const plan = targets.map((s) => {
        const local = getLocalVersion(s.dir);
        const published = getPublishedVersion(s.pkg);
        const status = !published ? 'new' : local === published ? 'SAME (will fail)' : 'bump';
        return {...s, local, published, status};
    });

    for (const p of plan) {
        console.log(`  ${p.pkg.padEnd(34)}  ${String(p.published || '—').padEnd(10)} -> ${p.local}  [${p.status}]`);
    }
    if (dryRun) console.log('\n  (--dry-run: npm publish --dry-run will run for each)');

    const blocked = plan.filter((p) => p.status === 'SAME (will fail)');
    if (blocked.length && !dryRun) {
        console.error(`\nError: these packages already publish at the local version:`);
        blocked.forEach((p) => console.error(`  - ${p.pkg}@${p.local}`));
        console.error(`Bump the version in their package.json before publishing.`);
        process.exit(1);
    }

    if (!skipTest && !dryRun) {
        header('Running pre-publish-test');
        const r = spawnSync('node', ['scripts/pre-publish-test.mjs'], {cwd: ROOT, stdio: 'inherit'});
        if (r.status !== 0) {
            console.error('\npre-publish-test failed. Aborting publish.');
            process.exit(1);
        }
    } else if (skipTest) {
        console.log('\n  (--skip-test: skipping pre-publish-test)');
    }

    const ok = await confirm(`\nProceed with publishing ${plan.length} package(s)?`);
    if (!ok) {
        console.log('Aborted.');
        process.exit(0);
    }

    console.log('\nnpm will prompt for an OTP for each package. Enter a fresh code each time.\n');

    for (const s of plan) {
        publishOne(s);
    }

    header('All publishes succeeded');
}

main().catch((err) => {
    console.error(`\n${err.message}`);
    process.exit(1);
});
