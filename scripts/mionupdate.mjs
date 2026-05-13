#!/usr/bin/env node

/**
 * Switches all starters to use npm-published mion packages.
 *
 * Fetches the latest @mionjs/core version (or uses an explicit version
 * argument), updates all @mionjs/* deps, cleans caches, and runs
 * pnpm install. Starters return to the locked-down posture
 * (allowNonRegistryProtocols: false) used for publishing.
 *
 * Usage:
 *   pnpm run mionupdate              # uses latest published version
 *   pnpm run mionupdate -- 0.8.4     # uses explicit version
 *   node scripts/mionupdate.mjs 0.8.4
 */

import {execSync} from "child_process";
import {updateAllStarters} from "./mion-utils.mjs";

let version = process.argv[2];

if (!version) {
  console.log("No version specified, fetching latest from npm...");
  try {
    version = execSync("npm view @mionjs/core version", {encoding: "utf-8"}).trim();
  } catch {
    console.error("Error: failed to fetch latest @mionjs/core version from npm.");
    console.error("Check your network connection or specify a version explicitly:");
    console.error("  pnpm run mionupdate -- 0.8.4");
    process.exit(1);
  }
  console.log(`Latest @mionjs/core version: ${version}`);
}

// Switch deps to npm version, clean caches, and pnpm install.
// useFile=false → runPnpmInstall leaves allowNonRegistryProtocols at its
// hardened default (false), no toggling needed.
updateAllStarters(false, version);
