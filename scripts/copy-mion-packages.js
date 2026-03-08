#!/usr/bin/env node

/**
 * Copies mion packages from the local mion repository over npm-linked symlinks in node_modules.
 *
 * Turbopack (Next.js) and Bun cannot reliably resolve npm-linked (symlinked) packages.
 * This script replaces symlinks with real copies so bundlers work correctly.
 *
 * Usage: node scripts/copy-mion-packages.js <project-dir> <pkg1> <pkg2> ...
 *   e.g. node scripts/copy-mion-packages.js nextjs/16 client core type-formats
 */

const fs = require("fs");
const path = require("path");

// Files/folders to remove after copying (TS sources that bundlers might pick up incorrectly)
const FILES_TO_REMOVE = ["index.ts", "src"];

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node scripts/copy-mion-packages.js <project-dir> <pkg1> <pkg2> ...");
  process.exit(1);
}

const projectDir = path.resolve(__dirname, "..", args[0]);
const packages = args.slice(1);

const SCRIPTS_ROOT = path.join(__dirname, "..");
const MION_ROOT = path.join(SCRIPTS_ROOT, "..", "mion");
const MION_PACKAGES_DIR = path.join(MION_ROOT, "packages");
const NODE_MODULES_MIONJS = path.join(projectDir, "node_modules", "@mionjs");

function isSymlink(filePath) {
  try {
    return fs.lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyDirRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function removeIfExists(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const stats = fs.statSync(filePath);
  if (stats.isDirectory()) {
    fs.rmSync(filePath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(filePath);
  }
  return true;
}

function main() {
  console.log(`=== Copy mion packages into ${args[0]} ===\n`);

  if (!fs.existsSync(MION_PACKAGES_DIR)) {
    console.error(`Error: Mion packages not found at ${MION_PACKAGES_DIR}`);
    console.error("Expected mion repository at ../mion relative to mion-starters");
    process.exit(1);
  }

  if (!fs.existsSync(NODE_MODULES_MIONJS)) {
    fs.mkdirSync(NODE_MODULES_MIONJS, { recursive: true });
  }

  let success = 0, errors = 0;

  for (const pkg of packages) {
    const sourcePath = path.join(MION_PACKAGES_DIR, pkg);
    const destPath = path.join(NODE_MODULES_MIONJS, pkg);

    if (!fs.existsSync(sourcePath)) {
      console.error(`  ✗ Source not found: ${sourcePath}`);
      errors++;
      continue;
    }

    // Check that built output exists
    if (!fs.existsSync(path.join(sourcePath, ".dist")) && !fs.existsSync(path.join(sourcePath, "build"))) {
      console.error(`  ✗ No .dist or build folder in ${sourcePath} — build mion first`);
      errors++;
      continue;
    }

    // Remove existing symlink or directory
    if (isSymlink(destPath)) {
      fs.unlinkSync(destPath);
    } else if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true, force: true });
    }

    // Copy
    copyDirRecursive(sourcePath, destPath);

    // Remove TS source files from the copy to avoid bundler confusion
    for (const f of FILES_TO_REMOVE) {
      removeIfExists(path.join(destPath, f));
    }

    // Add {"type":"commonjs"} to .dist/cjs/ if missing
    const cjsDir = path.join(destPath, ".dist", "cjs");
    const cjsPkg = path.join(cjsDir, "package.json");
    if (fs.existsSync(cjsDir) && !fs.existsSync(cjsPkg)) {
      fs.writeFileSync(cjsPkg, '{"type": "commonjs"}\n');
    }

    console.log(`  ✓ ${pkg}`);
    success++;
  }

  console.log(`\nDone: ${success} copied, ${errors} errors`);
  if (errors > 0) process.exit(1);
}

main();
