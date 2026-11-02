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
 */

import {findStarterDirs, latestVersion, resolveVersions, switchStarters} from './mion-utils.mjs';

const pinned = process.argv[2];
const onOwnLine = (name) => name.startsWith('@mionjs/drizzle-orm');
const starters = findStarterDirs();
const versions = resolveVersions(starters, (name) => (pinned && !onOwnLine(name) ? pinned : latestVersion(name)));
switchStarters(starters, versions, false);
console.log('\nDone: starters use npm-published @mionjs/* packages.');
