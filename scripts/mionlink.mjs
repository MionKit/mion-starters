#!/usr/bin/env node

/**
 * Switches starters to a locally built mion served from a local registry.
 *
 * Builds ../mion with its own release scripts, starts the local registry, publishes mion there, then points
 * each starter's @mionjs/* deps at it (`.npmrc` scope line) and installs with a dedicated npm cache.
 * The registry keeps running for later installs: stop it with `npm run mionstop`.
 *
 * Usage:
 *   npm run mionlink                          # build mion, every starter
 *   npm run mionlink -- --no-build            # reuse mion's last packed tarballs
 *   npm run mionlink -- vue/3 path/to/copy    # only these starter folders
 */

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {LOCAL_REGISTRY, MION_REPO, findStarterDirs, latestVersion, resolveVersions, switchStarters} from './mion-utils.mjs';
import {publishMion, startRegistry} from './local-registry.mjs';

const args = process.argv.slice(2);
const build = !args.includes('--no-build');
const dirs = args.filter((a) => !a.startsWith('--')).map((d) => path.resolve(d));
const starters = dirs.length ? dirs : findStarterDirs();

if (!fs.existsSync(path.join(MION_REPO, 'scripts', 'release', 'pack.mjs'))) {
    console.error(`Error: no mion checkout at ${MION_REPO} (clone mion as a sibling of mion-starters).`);
    process.exit(1);
}

if (build) {
    const run = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, {cwd: MION_REPO, stdio: 'inherit'});
    console.log('Building mion (resolver binary for this machine, JS packages, tarballs)...');
    run('node', ['scripts/release/build-binaries.mjs', '--host-only']);
    run('pnpm', ['run', 'build']);
    run('node', ['scripts/release/pack.mjs']);
}

await startRegistry();
publishMion();

const versions = resolveVersions(starters, (name) => latestVersion(name, LOCAL_REGISTRY));
switchStarters(starters, versions, true);
console.log(`\nDone: starters install @mionjs/* from ${LOCAL_REGISTRY}. Stop it with: npm run mionstop`);
