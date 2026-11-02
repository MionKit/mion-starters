"use client";
import {useEffect, useState} from 'react';
import {initClient} from '@mionjs/client';
import type {MyApi} from '@mion-app/api';

const {routes} = initClient<MyApi>({baseURL: typeof window !== 'undefined' ? window.location.origin : '', basePath: 'api/mion'});

/** minimal repro: a "use client" file with a mion call site */
export default function DirectiveTest() {
    const [msg, setMsg] = useState('...');
    useEffect(() => {
        routes.hello('client').call().then(([greeting]) => setMsg(greeting ?? 'error'));
    }, []);
    return <p id="msg">{msg}</p>;
}
