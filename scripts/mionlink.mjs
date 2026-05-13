#!/usr/bin/env node

/**
 * Switches all starters to use local mion tarballs (file: references).
 *
 * Packs mion packages from ../mion, copies tarballs to ./mion-tarballs/,
 * updates all @mionjs/* deps to file: references, cleans caches, and
 * runs pnpm install.
 *
 * During install, each starter's `allowNonRegistryProtocols` setting is
 * temporarily flipped from `false` to `true` so pnpm will accept file:
 * specifiers, then restored. This keeps the published starter posture
 * locked down for end-users while letting local dev resolve tarballs.
 *
 * Usage:
 *   pnpm run mionlink
 *   node scripts/mionlink.mjs
 */

import fs from "fs";
import path from "path";
import {execSync} from "child_process";
import {ROOT, TARBALLS_DIR, updateAllStarters} from "./mion-utils.mjs";

const MION_REPO = path.join(ROOT, "..", "mion");
const MION_TARBALLS_SRC = path.join(MION_REPO, "test-publish", "tarballs");
const TARBALLS_DEST = path.join(ROOT, TARBALLS_DIR);

// Verify mion repo exists
if (!fs.existsSync(path.join(MION_REPO, "scripts", "pack-packages.sh"))) {
  console.error("Error: ../mion repo not found (expected ../mion/scripts/pack-packages.sh).");
  console.error("Make sure the mion repo is cloned as a sibling directory.");
  process.exit(1);
}

// 1. Pack mion packages
console.log("Packing mion packages...");
execSync("bash scripts/pack-packages.sh", {cwd: MION_REPO, stdio: "inherit"});

// 2. Copy tarballs
console.log("\nCopying tarballs to ./mion-tarballs/...");
fs.mkdirSync(TARBALLS_DEST, {recursive: true});
// Clear existing tarballs
for (const f of fs.readdirSync(TARBALLS_DEST)) {
  if (f.endsWith(".tgz")) fs.rmSync(path.join(TARBALLS_DEST, f));
}
// Copy new ones
const tarballs = fs.readdirSync(MION_TARBALLS_SRC).filter((f) => f.endsWith(".tgz"));
for (const f of tarballs) {
  fs.copyFileSync(path.join(MION_TARBALLS_SRC, f), path.join(TARBALLS_DEST, f));
  console.log(`  copied ${f}`);
}
console.log(`Copied ${tarballs.length} tarballs.`);

// 3. Switch deps to file: references, clean caches, and pnpm install
//    (allowNonRegistryProtocols is toggled per-starter inside runPnpmInstall)
updateAllStarters(true, null);
