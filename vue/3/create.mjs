#!/usr/bin/env node

import {existsSync, mkdirSync, cpSync, renameSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, basename, dirname} from 'node:path';
import {execSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const projectName = process.argv[2];
if (!projectName) {
    console.log(`
Usage: npm create @mionjs/starter-vue <project-name>

Creates a new mion + Vue project.
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

const EXCLUDE = new Set([
    'create.mjs',
    'node_modules',
    'dist',
    '.dist',
    'build',
    'test-results',
    'coverage',
    '.coverage',
    'package-lock.json',
    '.DS_Store',
]);

cpSync(__dirname, targetDir, {
    recursive: true,
    filter: (src) => {
        const name = basename(src);
        if (EXCLUDE.has(name)) return false;
        if (name.startsWith('debug-')) return false;
        if (name.endsWith('.tsbuildinfo')) return false;
        if (name.startsWith('.env')) return false;
        if (name.endsWith('.pem')) return false;
        return true;
    },
});

// Rename gitignore to .gitignore (npm strips dotfiles from published packages)
renameSync(resolve(targetDir, 'gitignore'), resolve(targetDir, '.gitignore'));

// Clean up the copied package.json
const pkgPath = resolve(targetDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

pkg.name = projectName;
pkg.private = true;
delete pkg.bin;
delete pkg.files;
delete pkg.publishConfig;
delete pkg.repository;
delete pkg.keywords;
delete pkg.bugs;

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

if (!skipInstall) {
    console.log('\nInstalling dependencies...\n');
    execSync('npm install', {cwd: targetDir, stdio: 'inherit'});
}

console.log(`
Done! Your mion + Vue project is ready.

  cd ${projectName}
  npm run dev

Happy coding!
`);
