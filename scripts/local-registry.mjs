#!/usr/bin/env node

/**
 * The throwaway local registry (verdaccio) that serves a locally built mion to the starters.
 * Runs mion's own `.github/verdaccio.yaml`, with storage moved into `.mion-registry/`.
 */

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawn} from 'node:child_process';
import {LOCAL_REGISTRY, MION_REPO, ROOT} from './mion-utils.mjs';

const VERDACCIO = 'verdaccio@6.7.2';
const STATE_DIR = path.join(ROOT, '.mion-registry');
const STORAGE = path.join(STATE_DIR, 'storage');
const CONFIG = path.join(STATE_DIR, 'verdaccio.yaml');
const PID_FILE = path.join(STATE_DIR, 'verdaccio.pid');
const LOG_FILE = path.join(STATE_DIR, 'verdaccio.log');
/** npm user config used only for publishing: holds the token verdaccio wants, keeps ~/.npmrc untouched */
const PUBLISH_NPMRC = path.join(STATE_DIR, 'publish.npmrc');

/** Starts a fresh, empty registry, stopping any previous one first */
export async function startRegistry() {
    stopRegistry();
    fs.rmSync(STORAGE, {recursive: true, force: true});
    fs.mkdirSync(STORAGE, {recursive: true});
    const mionConfig = fs.readFileSync(path.join(MION_REPO, '.github', 'verdaccio.yaml'), 'utf-8');
    if (!/^storage: .*$/m.test(mionConfig)) throw new Error('mion .github/verdaccio.yaml has no `storage:` line');
    fs.writeFileSync(CONFIG, mionConfig.replace(/^storage: .*$/m, `storage: ${JSON.stringify(STORAGE)}`));

    console.log(`Starting ${VERDACCIO} on ${LOCAL_REGISTRY} (log: ${path.relative(ROOT, LOG_FILE)})`);
    const log = fs.openSync(LOG_FILE, 'w');
    const {host, port} = new URL(LOCAL_REGISTRY);
    const child = spawn('npx', ['--yes', VERDACCIO, '--config', CONFIG, '--listen', host], {
        cwd: STATE_DIR,
        stdio: ['ignore', log, log],
        detached: true,
    });
    child.unref();
    fs.writeFileSync(PID_FILE, String(child.pid));
    if (!(await waitPing(180))) {
        stopRegistry();
        throw new Error(`registry did not answer on port ${port}:\n${fs.readFileSync(LOG_FILE, 'utf-8')}`);
    }
}

/** Publishes mion's packed `tarballs/` into the running registry */
export function publishMion() {
    const authKey = LOCAL_REGISTRY.replace(/^https?:/, '');
    fs.writeFileSync(PUBLISH_NPMRC, `${authKey}:_authToken=local-starters\n`);
    execFileSync('node', ['scripts/release/publish-tarballs.mjs', '--registry', LOCAL_REGISTRY], {
        cwd: MION_REPO,
        stdio: 'inherit',
        env: {...process.env, npm_config_userconfig: PUBLISH_NPMRC},
    });
}

/** Stops the registry started by `startRegistry`; a no-op when none is running */
export function stopRegistry() {
    if (!fs.existsSync(PID_FILE)) return false;
    const pid = Number(fs.readFileSync(PID_FILE, 'utf-8'));
    fs.rmSync(PID_FILE);
    try {
        process.kill(-pid);
        return true;
    } catch {
        return false;
    }
}

async function waitPing(timeoutS) {
    const deadline = Date.now() + timeoutS * 1000;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(new URL('-/ping', LOCAL_REGISTRY))).ok) return true;
        } catch {
            // not listening yet
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    return false;
}
