#!/usr/bin/env node

/**
 * Switches starters to a locally built ../mion on a local registry that keeps running: `npm run mionstop` stops it.
 * Usage: `npm run mionlink [-- --no-build] [starter folders]`; `--no-build` reuses mion's last packed tarballs.
 */

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {parseArgs} from 'node:util';
import {LOCAL_REGISTRY, MION_REPO, latestVersion, resolveVersions, starterDirs, switchStarters} from './mion-utils.mjs';
import {publishMion, startRegistry} from './local-registry.mjs';

const {values, positionals} = parseArgs({options: {'no-build': {type: 'boolean'}}, allowPositionals: true});
const starters = starterDirs(positionals);

if (!fs.existsSync(path.join(MION_REPO, 'scripts', 'release', 'pack.mjs'))) {
    console.error(`Error: no mion checkout at ${MION_REPO} (clone mion as a sibling of mion-starters).`);
    process.exit(1);
}

if (!values['no-build']) {
    const run = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, {cwd: MION_REPO, stdio: 'inherit'});
    console.log('Building mion (resolver binary for this machine, JS packages, tarballs)...');
    // the JS build runs mion's dev resolver and devtools dist, stale after ../mion moves to new commits
    run('node', ['scripts/miondevx.mjs', 'core', 'build']);
    run('node', ['scripts/release/build-binaries.mjs', '--host-only']);
    run('pnpm', ['run', 'build']);
    run('node', ['scripts/release/pack.mjs']);
}

await startRegistry();
publishMion();

const versions = resolveVersions(starters, (name) => latestVersion(name, LOCAL_REGISTRY));
switchStarters(starters, versions, true);
console.log(`\nDone: starters install @mionjs/* from ${LOCAL_REGISTRY}. Stop it with: npm run mionstop`);
