import {describe, it, expect} from 'vitest';
import {initClient, batch, inputFrom} from '@mionjs/client';
import type {MyApi} from '../src/api.ts';

const {routes} = initClient<MyApi>({baseURL: 'http://localhost:3001', basePath: 'api/mion'});

describe('mion client', () => {
    it('call() returns [result, error, response]', async () => {
        const [greeting, error] = await routes.hello('Client').call();
        expect(error).toBeUndefined();
        expect(greeting).toBe('Hello Client!');
    });

    it('Date round trip', async () => {
        const [time] = await routes.getTime().call();
        expect(time).toBeInstanceOf(Date);
    });

    it('UUIDv7 format is validated in the client before sending', async () => {
        const [order, error] = await routes.orders.getOrder('not-a-uuid' as never).call();
        expect(order).toBeUndefined();
        expect(error?.type).toBe('validation-error');
    });

    it('batch + inputFrom resolves orders and their events in one request', async () => {
        const ordersReq = routes.orders.listOrders();
        const ids = inputFrom(ordersReq, (list) => list!.map((o) => o.id));
        const eventsReq = routes.orders.getOrdersEvents(ids.asArg());
        const [[orders, ordersError], [events, eventsError]] = await batch([ordersReq, eventsReq]).call();
        expect(ordersError).toBeUndefined();
        expect(eventsError).toBeUndefined();
        expect(orders!.length).toBeGreaterThanOrEqual(3);
        expect(events!.some((e) => e.type === 'shipped' && e.carrier === 'FedEx')).toBe(true);
        expect(events![0].at).toBeInstanceOf(Date);
    });
});
