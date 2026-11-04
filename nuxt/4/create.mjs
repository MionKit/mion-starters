#!/usr/bin/env node

import {existsSync, mkdirSync, cpSync, renameSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, basename, dirname, relative, sep} from 'node:path';
import {execSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const projectName = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
if (!projectName) {
    console.log(`
Usage: npm create @mionjs/starter-nuxt <project-name>

Creates a new mion + Nuxt project.
`);
    process.exit(1);
}

const skipInstall = process.argv.includes('--no-install');
const targetDir = resolve(process.cwd(), projectName);

if (existsSync(targetDir)) {
    console.error(`Error: Directory "${projectName}" already exists.`);
    process.exit(1);
}

mkdirSync(targetDir, {recursive: true});

/** Starter-only files and generated state; .mion/ is filtered below */
const EXCLUDE = new Set([
    'create.mjs',
    'node_modules',
    'dist',
    '.dist',
    'dist-server',
    'build',
    '.nuxt',
    '.output',
    '.data',
    '.wrangler',
    'test-results',
    'coverage',
    '.coverage',
    'package-lock.json',
    '.npmrc',
    '.DS_Store',
]);

cpSync(__dirname, targetDir, {
    recursive: true,
    filter: (src) => {
        const name = basename(src);
        const rel = relative(__dirname, src).split(sep).join('/');
        if (EXCLUDE.has(name)) return false;
        // .mion/ is generated, except .mion/enriched/ which holds hand-written texts
        if (rel === '.mion') return existsSync(resolve(src, 'enriched'));
        if (rel.startsWith('.mion/') && rel !== '.mion/enriched' && !rel.startsWith('.mion/enriched/')) return false;
        if (name.startsWith('debug-')) return false;
        if (name.endsWith('.tsbuildinfo')) return false;
        if (name.startsWith('.env')) return false;
        if (name.endsWith('.pem')) return false;
        return true;
    },
});

// npm strips .gitignore from published packages, so the starter ships it as gitignore
renameSync(resolve(targetDir, 'gitignore'), resolve(targetDir, '.gitignore'));

const pkgPath = resolve(targetDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

// The folder name, never the raw argument: mion uses the package name as a path segment in generated files
pkg.name = basename(targetDir);
pkg.private = true;
delete pkg.bin;
delete pkg.files;
delete pkg.publishConfig;
delete pkg.repository;
delete pkg.keywords;
delete pkg.bugs;
delete pkg.description;
delete pkg.homepage;
delete pkg.author;
delete pkg.version;
delete pkg.license;

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

if (!skipInstall) {
    console.log('\nInstalling dependencies...\n');
    execSync('npm install', {cwd: targetDir, stdio: 'inherit'});
}

console.log(`
Done! Your mion + Nuxt project is ready.

  cd ${projectName}
  npm run dev

Happy coding!
`);
