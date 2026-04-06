#!/usr/bin/env node

/**
 * Updates all @mionjs/* dependencies across starters to either a version or file references.
 *
 * Usage:
 *   node scripts/update-mion-deps.mjs <version>    # set all @mionjs/* deps to <version>
 *   node scripts/update-mion-deps.mjs file          # set all @mionjs/* deps to file:../../mion-tarballs/<pkg>.tgz
 *
 * Examples:
 *   node scripts/update-mion-deps.mjs 0.8.4-alpha.0
 *   node scripts/update-mion-deps.mjs file
 */

import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {glob} from "fs/promises";
import {execSync} from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const TARBALLS_DIR = "mion-tarballs";

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/update-mion-deps.mjs <version|file>");
  console.error("  version  — npm version string (e.g. 0.8.4-alpha.0)");
  console.error("  file     — use file: references to local tarballs in mion-tarballs/");
  process.exit(1);
}

const useFile = version === "file";

/** Converts @mionjs/client → mionjs-client.tgz */
function toTarballName(pkg) {
  return pkg.replace("@mionjs/", "mionjs-") + ".tgz";
}

/** Finds all starter package.json files (skips node_modules, mion-tarballs, .tmp) */
function findStarterPackageJsons() {
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
function fileRef(pkgJsonPath, mionPkg) {
  const pkgDir = path.dirname(pkgJsonPath);
  const tarballPath = path.join(ROOT, TARBALLS_DIR, toTarballName(mionPkg));
  const rel = path.relative(pkgDir, tarballPath);
  return `file:${rel}`;
}

function hasMionDeps(pkg) {
  for (const deps of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies, pkg.optionalDependencies]) {
    if (!deps) continue;
    if (Object.keys(deps).some((d) => d.startsWith("@mionjs/"))) return true;
  }
  return false;
}

function updateDeps(deps, pkgJsonPath, label) {
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

// Validate tarballs exist when using file mode
if (useFile) {
  const tarballsPath = path.join(ROOT, TARBALLS_DIR);
  if (!fs.existsSync(tarballsPath)) {
    console.error(`Error: ${TARBALLS_DIR}/ directory not found.`);
    console.error("Run scripts/copy-mion-tarballs.sh first to create the tarballs.");
    process.exit(1);
  }
}

const packageJsons = findStarterPackageJsons();
if (packageJsons.length === 0) {
  console.error("No starter package.json files found.");
  process.exit(1);
}

console.log(`Updating @mionjs/* deps to ${useFile ? "file: references" : version}\n`);

let totalUpdated = 0;
for (const pkgPath of packageJsons) {
  const relPath = path.relative(ROOT, pkgPath);
  const content = fs.readFileSync(pkgPath, "utf-8");
  const pkg = JSON.parse(content);

  const before = totalUpdated;
  totalUpdated += updateDeps(pkg.dependencies, pkgPath, "dep");
  totalUpdated += updateDeps(pkg.devDependencies, pkgPath, "dev");
  totalUpdated += updateDeps(pkg.peerDependencies, pkgPath, "peer");
  totalUpdated += updateDeps(pkg.optionalDependencies, pkgPath, "opt");

  if (totalUpdated > before) {
    console.log(`  ✓ ${relPath}\n`);
    // Preserve original formatting (detect indent)
    const indent = content.match(/^(\s+)"/m)?.[1] || "  ";
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + "\n");
  } else if (hasMionDeps(pkg)) {
    console.log(`  – ${relPath} (already up to date)\n`);
  } else {
    console.log(`  – ${relPath} (no @mionjs/* deps)\n`);
  }

  // In file mode, always clean cached @mionjs packages and stale lockfile integrity
  // hashes so npm install picks up fresh tarballs (filenames no longer contain hashes).
  if (useFile && hasMionDeps(pkg)) {
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
    const lockPath = path.join(pkgDir, "package-lock.json");
    if (fs.existsSync(lockPath)) {
      const lockContent = fs.readFileSync(lockPath, "utf-8");
      const lock = JSON.parse(lockContent);
      let stripped = 0;
      for (const [key, entry] of Object.entries(lock.packages || {})) {
        if (!key.includes("@mionjs/")) continue;
        if (entry.integrity) { delete entry.integrity; stripped++; }
      }
      if (stripped > 0) {
        const lockIndent = lockContent.match(/^(\s+)"/m)?.[1] || "  ";
        fs.writeFileSync(lockPath, JSON.stringify(lock, null, lockIndent) + "\n");
        console.log(`  🗑 stripped ${stripped} integrity hashes from ${path.relative(ROOT, lockPath)}`);
      }
    }
  }
}

// Validate tarball files exist for all referenced packages
if (useFile) {
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

// Run npm install in each starter that has @mionjs/* deps
if (useFile) {
  const starterRoots = new Set();
  for (const pkgPath of packageJsons) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (!hasMionDeps(pkg)) continue;
    // Find the starter root (parent of api/ sub-packages)
    const pkgDir = path.dirname(pkgPath);
    const starterRoot = pkgDir.endsWith("/api") ? path.dirname(pkgDir) : pkgDir;
    starterRoots.add(starterRoot);
  }
  for (const dir of starterRoots) {
    const relDir = path.relative(ROOT, dir);
    console.log(`\n📦 npm install in ${relDir}...`);
    try {
      execSync("npm install", {cwd: dir, stdio: "inherit"});
    } catch {
      console.error(`  ❌ npm install failed in ${relDir}`);
      process.exit(1);
    }
  }
}

console.log(`\nDone: ${totalUpdated} dependencies updated.`);
