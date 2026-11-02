#!/usr/bin/env node

/**
 * Switches starters to npm-published mion packages, each on its own version line.
 *
 * Every @mionjs/* dep gets its own latest npm version (`@mionjs/drizzle-orm*` follow drizzle's line), the local
 * registry `.npmrc` line is removed, caches are cleaned and `npm install` runs.
 *
 * Usage:
 *   npm run mionupdate                # latest version of each package
 *   npm run mionupdate -- 0.13.2      # this version for every package except @mionjs/drizzle-orm*
 *   npm run mionupdate -- vue/3       # only these starter folders
 */

import path from 'node:path';
import {findStarterDirs, latestVersion, resolveVersions, switchStarters} from './mion-utils.mjs';

const args = process.argv.slice(2);
const pinned = args.find((a) => /^\d+\.\d+\.\d+/.test(a));
const dirs = args.filter((a) => a !== pinned).map((d) => path.resolve(d));
const starters = dirs.length ? dirs : findStarterDirs();
const onOwnLine = (name) => name.startsWith('@mionjs/drizzle-orm');
const versions = resolveVersions(starters, (name) => (pinned && !onOwnLine(name) ? pinned : latestVersion(name)));
switchStarters(starters, versions, false);
console.log('\nDone: starters use npm-published @mionjs/* packages.');
