import {inject} from 'vue';
import type {mionClient} from '../mion-client';

export function useMionClient() {
    return inject('mionClient') as typeof mionClient;
}
