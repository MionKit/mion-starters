#!/usr/bin/env node

/** Stops the local registry started by `npm run mionlink`. */

import {stopRegistry} from './local-registry.mjs';

console.log(stopRegistry() ? 'Local registry stopped.' : 'No local registry running.');
