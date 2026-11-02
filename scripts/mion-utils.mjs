#!/usr/bin/env node

/** Shared helpers for switching the starters' @mionjs/* deps between npm and the local registry. */

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const MION_REPO = path.join(ROOT, '..', 'mion');
export const LOCAL_REGISTRY = 'http://127.0.0.1:4873/';
/** Dedicated npm cache for local mode: a local build shares its version with the npmjs one */
const LOCAL_CACHE = path.join(ROOT, '.mion-local-cache');

const STARTER_DIRS = ['nextjs', 'nuxt', 'vue', 'standalone'];
const DEP_BLOCKS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const SCOPE_LINE = `@mionjs:registry=${LOCAL_REGISTRY}`;

/** The starter folders named on the command line, or every starter; exits on a folder without package.json */
export function starterDirs(args) {
    const dirs = args.length ? args.map((d) => path.resolve(d)) : findStarterDirs();
    const bad = dirs.filter((d) => !fs.existsSync(path.join(d, 'package.json')));
    if (bad.length) {
        console.error(`Error: no package.json in:\n  ${bad.join('\n  ')}`);
        process.exit(1);
    }
    return dirs;
}

/** Every starter folder (`<framework>/<major>`) that has a package.json */
export function findStarterDirs() {
    const dirs = [];
    for (const dir of STARTER_DIRS) {
        const dirPath = path.join(ROOT, dir);
        if (!fs.existsSync(dirPath)) continue;
        for (const entry of fs.readdirSync(dirPath)) {
            const starterDir = path.join(dirPath, entry);
            if (fs.existsSync(path.join(starterDir, 'package.json'))) dirs.push(starterDir);
        }
    }
    return dirs;
}

/** The @mionjs/* package names a starter depends on, sorted */
function mionDeps(starterDir) {
    const pkg = JSON.parse(fs.readFileSync(path.join(starterDir, 'package.json'), 'utf-8'));
    const names = new Set();
    for (const block of DEP_BLOCKS) {
        for (const name of Object.keys(pkg[block] ?? {})) if (name.startsWith('@mionjs/')) names.add(name);
    }
    return [...names].sort();
}

/** Latest version of `pkg` (or of a `pkg@range` spec) on `registry`, npm's default when omitted; null when missing */
export function latestVersion(pkg, registry) {
    const args = ['view', pkg, 'version', '--prefer-online'];
    if (registry) args.push('--registry', registry, '--cache', LOCAL_CACHE);
    try {
        return execFileSync('npm', args, {encoding: 'utf-8', stdio: ['ignore', 'pipe', 'inherit']}).trim() || null;
    } catch {
        return null;
    }
}

/** True when a starter installs @mionjs/* from the local registry (`.npmrc` line or lockfile URLs) */
export function isLocalMode(starterDir) {
    const read = (file) => {
        const filePath = path.join(starterDir, file);
        return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
    };
    return read('.npmrc').split('\n').includes(SCOPE_LINE) || read('package-lock.json').includes(LOCAL_REGISTRY);
}

/** npm env that makes a copy of a local-mode starter install from the local registry too */
export function localModeEnv() {
    return {'npm_config_@mionjs:registry': LOCAL_REGISTRY, npm_config_cache: LOCAL_CACHE};
}

/** Resolves every @mionjs/* dep of the starters with `resolve`; exits naming any package it lacks */
export function resolveVersions(dirs, resolve) {
    const versions = {};
    const missing = [];
    for (const dir of dirs) {
        for (const name of mionDeps(dir)) {
            if (!(name in versions)) versions[name] = resolve(name);
            if (!versions[name]) missing.push(`${name} (${path.relative(ROOT, dir)})`);
        }
    }
    if (missing.length) {
        console.error(`Error: no published version found for:\n  ${missing.join('\n  ')}`);
        process.exit(1);
    }
    return versions;
}

/**
 * Writes `versions` (package name → version) into the starters, cleans caches and installs.
 * `local` adds or removes the `.npmrc` line that points @mionjs/* at the local registry.
 */
export function switchStarters(dirs, versions, local) {
    for (const dir of dirs) {
        console.log(`\n${path.relative(ROOT, dir)}`);
        writeVersions(dir, versions);
        setScopeLine(dir, local);
        cleanMionCaches(dir);
        const args = ['install'];
        if (local) args.push('--cache', LOCAL_CACHE);
        console.log(`  npm ${args.join(' ')}`);
        execFileSync('npm', args, {cwd: dir, stdio: 'inherit'});
    }
}

/** Writes exact versions to every @mionjs/* dep and drops @mionjs/* overrides */
export function writeVersions(starterDir, versions) {
    const pkgPath = path.join(starterDir, 'package.json');
    const content = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    for (const block of DEP_BLOCKS) {
        for (const name of Object.keys(pkg[block] ?? {})) {
            if (!name.startsWith('@mionjs/') || pkg[block][name] === versions[name]) continue;
            console.log(`  ${name}: ${pkg[block][name]} → ${versions[name]}`);
            pkg[block][name] = versions[name];
        }
    }
    if (pkg.overrides) {
        for (const key of Object.keys(pkg.overrides)) if (key.startsWith('@mionjs/')) delete pkg.overrides[key];
        if (Object.keys(pkg.overrides).length === 0) delete pkg.overrides;
    }
    const indent = content.match(/^(\s+)"/m)?.[1] || '  ';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + '\n');
}

/** Adds or removes the local scope line, deleting `.npmrc` once nothing else is left in it */
export function setScopeLine(starterDir, local) {
    const npmrc = path.join(starterDir, '.npmrc');
    const old = fs.existsSync(npmrc) ? fs.readFileSync(npmrc, 'utf-8').split('\n') : [];
    const lines = old.filter((line) => line !== SCOPE_LINE);
    if (local) lines.unshift(SCOPE_LINE);
    const text = lines.join('\n').trim();
    if (text) fs.writeFileSync(npmrc, text + '\n');
    else fs.rmSync(npmrc, {force: true});
}

/** Removes installed @mionjs packages, the .vite cache and the lockfile's @mionjs/* entries */
export function cleanMionCaches(starterDir) {
    for (const sub of ['node_modules/@mionjs', 'node_modules/.vite']) {
        fs.rmSync(path.join(starterDir, sub), {recursive: true, force: true});
    }
    const lockPath = path.join(starterDir, 'package-lock.json');
    if (!fs.existsSync(lockPath)) return;
    const lockContent = fs.readFileSync(lockPath, 'utf-8');
    const lock = JSON.parse(lockContent);
    let removed = 0;
    for (const key of Object.keys(lock.packages ?? {})) {
        if (!key.includes('node_modules/@mionjs/') && !key.endsWith('node_modules/@mionjs')) continue;
        delete lock.packages[key];
        removed++;
    }
    if (!removed) return;
    const indent = lockContent.match(/^(\s+)"/m)?.[1] || '  ';
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, indent) + '\n');
    console.log(`  removed ${removed} @mionjs/* lockfile entries`);
}
