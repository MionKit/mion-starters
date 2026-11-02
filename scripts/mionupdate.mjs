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

import {parseArgs} from 'node:util';
import {latestVersion, resolveVersions, starterDirs, switchStarters} from './mion-utils.mjs';

const {positionals} = parseArgs({allowPositionals: true});
const pinned = positionals.find((a) => /^\d+\.\d+\.\d+/.test(a));
const starters = starterDirs(positionals.filter((a) => a !== pinned));
const onOwnLine = (name) => name.startsWith('@mionjs/drizzle-orm');
// a pin resolves through npm too, so a version that does not exist fails before anything is written
const versions = resolveVersions(starters, (name) => latestVersion(pinned && !onOwnLine(name) ? `${name}@${pinned}` : name));
switchStarters(starters, versions, false);
console.log('\nDone: starters use npm-published @mionjs/* packages.');
