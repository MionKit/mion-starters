import type {Server} from 'node:http';
import {startNodeServer} from '@mionjs/platform-node';
// registers the router in this (vitest's main) process
import '../src/api.ts';

let server: Server | undefined;

export async function setup() {
    server = await startNodeServer({port: 3001});
}

export async function teardown() {
    if (server) await new Promise<void>((done) => server?.close(() => done()));
}
