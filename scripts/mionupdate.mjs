#!/usr/bin/env node

/**
 * Switches starters to npm-published mion, each @mionjs/* dep on its own latest version.
 * Usage: `npm run mionupdate [-- 0.13.2] [starter folders]`.
 */

import {parseArgs} from 'node:util';
import {latestVersion, resolveVersions, starterDirs, switchStarters} from './mion-utils.mjs';

const {positionals} = parseArgs({allowPositionals: true});
const pinned = positionals.find((a) => /^\d+\.\d+\.\d+/.test(a));
const starters = starterDirs(positionals.filter((a) => a !== pinned));
// a pin resolves through npm too, so a version that does not exist fails before anything is written
const versions = resolveVersions(starters, (name) => latestVersion(pinned ? `${name}@${pinned}` : name));
switchStarters(starters, versions, false);
console.log('\nDone: starters use npm-published @mionjs/* packages.');
