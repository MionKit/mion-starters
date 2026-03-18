import {serverReady} from '@mionjs/devtools/vite-plugin';

export async function setup() {
    await serverReady;
}
