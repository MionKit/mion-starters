/// <reference types="vite/client" />

declare module '*.vue' {
    import type {DefineComponent} from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module 'virtual:mion-aot/caches' {
    export const aotCaches: {
        jitFnsCache: Record<string, any>;
        pureFnsCache: Record<string, any>;
        routerCache: Record<string, any>;
    };
    export const jitFnsCache: Record<string, any>;
    export const pureFnsCache: Record<string, any>;
    export const routerCache: Record<string, any>;
}
