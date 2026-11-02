'use server';
import {initClient} from '@mionjs/client';
import type {MyApi} from '@mion-app/api';

/** 'use server' module with a mion call site of its own */
export async function greetDirect(name: string) {
    const {routes} = initClient<MyApi>({baseURL: 'http://localhost:4317', basePath: 'api/mion'});
    const [greeting] = await routes.hello(name).call();
    return greeting;
}
