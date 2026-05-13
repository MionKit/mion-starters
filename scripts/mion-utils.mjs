#!/usr/bin/env node

/**
 * Shared utilities for managing @mionjs/* dependencies across starters.
 * Used by mionlink.mjs and mionupdate.mjs.
 */

import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {execSync} from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT = path.join(__dirname, "..");
export const TARBALLS_DIR = "mion-tarballs";

/** Converts @mionjs/client → mionjs-client.tgz */
export function toTarballName(pkg) {
  return pkg.replace("@mionjs/", "mionjs-") + ".tgz";
}

/** Converts mionjs-client.tgz → @mionjs/client */
export function fromTarballName(file) {
  return "@mionjs/" + file.slice("mionjs-".length, -".tgz".length);
}

/** Lists every @mionjs/* package available as a local tarball */
export function listLocalMionPackages() {
  const tarballsPath = path.join(ROOT, TARBALLS_DIR);
  if (!fs.existsSync(tarballsPath)) return [];
  return fs
    .readdirSync(tarballsPath)
    .filter((f) => f.startsWith("mionjs-") && f.endsWith(".tgz"))
    .map(fromTarballName)
    .sort();
}

/** Finds all starter package.json files (skips node_modules, mion-tarballs, .tmp) */
export function findStarterPackageJsons() {
  const starters = [];
  const starterDirs = ["nextjs", "nuxt", "vue", "standalone"];
  for (const dir of starterDirs) {
    const dirPath = path.join(ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;
    for (const entry of fs.readdirSync(dirPath)) {
      const pkgPath = path.join(dirPath, entry, "package.json");
      if (fs.existsSync(pkgPath)) starters.push(pkgPath);
      // Also check api/ sub-package
      const apiPkgPath = path.join(dirPath, entry, "api", "package.json");
      if (fs.existsSync(apiPkgPath)) starters.push(apiPkgPath);
    }
  }
  return starters;
}

/** Returns the file: reference path relative from a package.json location to the tarballs dir */
export function fileRef(pkgJsonPath, mionPkg) {
  const pkgDir = path.dirname(pkgJsonPath);
  const tarballPath = path.join(ROOT, TARBALLS_DIR, toTarballName(mionPkg));
  const rel = path.relative(pkgDir, tarballPath);
  return `file:${rel}`;
}

/** Checks if a parsed package.json has any @mionjs/* dependencies */
export function hasMionDeps(pkg) {
  for (const deps of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies, pkg.optionalDependencies]) {
    if (!deps) continue;
    if (Object.keys(deps).some((d) => d.startsWith("@mionjs/"))) return true;
  }
  return false;
}

/** Checks whether starters are currently using file: references (true) or npm versions (false) */
export function isCurrentlyFileMode(packageJsons) {
  for (const pkgPath of packageJsons) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    for (const deps of [pkg.dependencies, pkg.devDependencies]) {
      if (!deps) continue;
      for (const [name, value] of Object.entries(deps)) {
        if (!name.startsWith("@mionjs/")) continue;
        return String(value).startsWith("file:");
      }
    }
  }
  return false;
}

/** Updates @mionjs/* entries in a single dependency block */
export function updateDeps(deps, pkgJsonPath, label, useFile, version) {
  if (!deps) return 0;
  let count = 0;
  for (const dep of Object.keys(deps)) {
    if (!dep.startsWith("@mionjs/")) continue;
    const newValue = useFile ? fileRef(pkgJsonPath, dep) : version;
    if (deps[dep] !== newValue) {
      console.log(`  ${label} ${dep}: ${deps[dep]} → ${newValue}`);
      deps[dep] = newValue;
      count++;
    }
  }
  return count;
}

/**
 * Manages the `pnpm.overrides` block so transitive @mionjs/* deps also resolve correctly.
 * In file mode: adds overrides for all known mion packages.
 * In version mode: removes @mionjs/* override entries.
 *
 * Note: pnpm reads `pnpm.overrides` (not the top-level `overrides` used by npm).
 */
export function updateOverrides(pkg, pkgJsonPath, allMionPkgs, useFile, version) {
  let count = 0;
  pkg.pnpm = pkg.pnpm || {};
  if (useFile) {
    pkg.pnpm.overrides = pkg.pnpm.overrides || {};
    for (const mionPkg of allMionPkgs) {
      const newValue = fileRef(pkgJsonPath, mionPkg);
      if (pkg.pnpm.overrides[mionPkg] !== newValue) {
        console.log(`  override ${mionPkg}: ${pkg.pnpm.overrides[mionPkg] ?? "(none)"} → ${newValue}`);
        pkg.pnpm.overrides[mionPkg] = newValue;
        count++;
      }
    }
  } else if (pkg.pnpm.overrides) {
    for (const key of Object.keys(pkg.pnpm.overrides)) {
      if (!key.startsWith("@mionjs/")) continue;
      console.log(`  override ${key}: ${pkg.pnpm.overrides[key]} → (removed)`);
      delete pkg.pnpm.overrides[key];
      count++;
    }
    if (Object.keys(pkg.pnpm.overrides).length === 0) delete pkg.pnpm.overrides;
    if (Object.keys(pkg.pnpm).length === 0) delete pkg.pnpm;
  }
  return count;
}

/** Removes cached @mionjs packages, .vite cache, and the pnpm lockfile for a starter */
export function cleanMionCaches(pkgPath) {
  const pkgDir = path.dirname(pkgPath);

  const mionNodeModules = path.join(pkgDir, "node_modules", "@mionjs");
  if (fs.existsSync(mionNodeModules)) {
    fs.rmSync(mionNodeModules, {recursive: true});
    console.log(`  🗑 removed ${path.relative(ROOT, mionNodeModules)}`);
  }

  const viteCache = path.join(pkgDir, "node_modules", ".vite");
  if (fs.existsSync(viteCache)) {
    fs.rmSync(viteCache, {recursive: true});
    console.log(`  🗑 removed ${path.relative(ROOT, viteCache)}`);
  }

  // Surgically pruning @mionjs entries from pnpm-lock.yaml is brittle; the
  // file references resolve in milliseconds, so we just delete the lockfile
  // and let `pnpm install` rebuild it. The starter's hardened pnpm config
  // (minimumReleaseAge, allowBuilds, etc.) still gates which packages can
  // resolve, so this is no looser than a normal install.
  const lockPath = path.join(pkgDir, "pnpm-lock.yaml");
  if (fs.existsSync(lockPath)) {
    fs.rmSync(lockPath);
    console.log(`  🗑 removed ${path.relative(ROOT, lockPath)}`);
  }
}

/** Validates that all referenced tarballs exist in the tarballs directory */
export function validateTarballs(packageJsons) {
  const tarballsPath = path.join(ROOT, TARBALLS_DIR);
  const existing = new Set(fs.readdirSync(tarballsPath));
  const missing = [];
  for (const pkgPath of packageJsons) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    for (const deps of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies, pkg.optionalDependencies]) {
      if (!deps) continue;
      for (const dep of Object.keys(deps)) {
        if (!dep.startsWith("@mionjs/")) continue;
        const tarball = toTarballName(dep);
        if (!existing.has(tarball)) missing.push(tarball);
      }
    }
  }
  if (missing.length > 0) {
    console.warn(`Warning: missing tarballs: ${[...new Set(missing)].join(", ")}`);
    console.warn("These packages will fail to install until tarballs are available.");
  }
}

/**
 * Runs `pnpm install` in each starter root that has @mionjs/* deps.
 *
 * Security model around `allowNonRegistryProtocols`:
 *   Starters ship with `allowNonRegistryProtocols: false` in their
 *   `pnpm-workspace.yaml`, so file:/git:/http: specifiers in any
 *   dependency are rejected. pnpm doesn't expose a per-package
 *   allowlist for this setting, so the "@mionjs/* may come from a
 *   tarball" exception is enforced by workflow instead: the
 *   `mionlink` script — the only flow that intentionally introduces
 *   file: refs — runs this function with `allowFileRefs: true`,
 *   which passes the flag for this command only. The
 *   pnpm-workspace.yaml on disk is never modified, so an interrupted
 *   install can't leave the starter in a relaxed posture.
 *
 *   At the moment `mionlink` runs, the only file: refs that exist in
 *   any starter's package.json are the @mionjs/* ones that mionlink
 *   itself just wrote — so in practice the exception applies only to
 *   @mionjs/* tarballs.
 */
export function runPnpmInstall(packageJsons, {allowFileRefs = false} = {}) {
  const starterRoots = new Set();
  for (const pkgPath of packageJsons) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (!hasMionDeps(pkg)) continue;
    const pkgDir = path.dirname(pkgPath);
    const starterRoot = pkgDir.endsWith("/api") ? path.dirname(pkgDir) : pkgDir;
    starterRoots.add(starterRoot);
  }
  // Force regen rather than --frozen-lockfile because mionlink/mionupdate
  // rewrites deps and we want pnpm to resolve fresh.
  const flags = ["--no-frozen-lockfile"];
  if (allowFileRefs) flags.push("--config.allowNonRegistryProtocols=true");
  const cmd = ["pnpm install", ...flags].join(" ");
  for (const dir of starterRoots) {
    const relDir = path.relative(ROOT, dir);
    console.log(`\n📦 ${cmd} in ${relDir}...`);
    try {
      execSync(cmd, {cwd: dir, stdio: "inherit"});
    } catch {
      console.error(`  ❌ pnpm install failed in ${relDir}`);
      process.exit(1);
    }
  }
}

/**
 * Main orchestrator: rewrites deps + overrides → cleans caches → validates (file mode) → pnpm install.
 * @param {boolean} useFile - true for file: references, false for npm version
 * @param {string|null} version - npm version string (ignored when useFile is true)
 */
export function updateAllStarters(useFile, version) {
  if (useFile) {
    const tarballsPath = path.join(ROOT, TARBALLS_DIR);
    if (!fs.existsSync(tarballsPath)) {
      console.error(`Error: ${TARBALLS_DIR}/ directory not found.`);
      console.error("Run pnpm run mionlink to create the tarballs first.");
      process.exit(1);
    }
  }

  const packageJsons = findStarterPackageJsons();
  if (packageJsons.length === 0) {
    console.error("No starter package.json files found.");
    process.exit(1);
  }

  console.log(`\nUpdating @mionjs/* deps to ${useFile ? "file: references" : version}\n`);

  const allMionPkgs = listLocalMionPackages();

  let totalUpdated = 0;
  for (const pkgPath of packageJsons) {
    const content = fs.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(content);
    const relPath = path.relative(ROOT, pkgPath);

    const before = totalUpdated;
    totalUpdated += updateDeps(pkg.dependencies, pkgPath, "dep", useFile, version);
    totalUpdated += updateDeps(pkg.devDependencies, pkgPath, "dev", useFile, version);
    totalUpdated += updateDeps(pkg.peerDependencies, pkgPath, "peer", useFile, version);
    totalUpdated += updateDeps(pkg.optionalDependencies, pkgPath, "opt", useFile, version);
    if (hasMionDeps(pkg)) totalUpdated += updateOverrides(pkg, pkgPath, allMionPkgs, useFile, version);

    if (totalUpdated > before) {
      console.log(`  ✓ ${relPath}\n`);
      const indent = content.match(/^(\s+)"/m)?.[1] || "  ";
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + "\n");
    } else if (hasMionDeps(pkg)) {
      console.log(`  – ${relPath} (already up to date)\n`);
    } else {
      console.log(`  – ${relPath} (no @mionjs/* deps)\n`);
    }

    // Clean cached @mionjs packages and the lockfile
    if (hasMionDeps(pkg)) cleanMionCaches(pkgPath);
  }

  if (useFile) validateTarballs(packageJsons);

  runPnpmInstall(packageJsons, {allowFileRefs: useFile});

  console.log(`\nDone: ${totalUpdated} dependencies updated.`);
}
