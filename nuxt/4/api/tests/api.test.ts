import {describe, it, expect} from 'vitest';

/** Raw mion request: the body maps the route path to its params */
const post = (route: string, params: unknown[]) =>
    fetch(`http://localhost:3001/api/mion/${route}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({[route]: params}),
    });

describe('mion API', () => {
    it('hello route returns greeting', async () => {
        const res = await post('hello', ['World']);
        expect(res.ok).toBe(true);
        expect((await res.json()).hello).toBe('Hello World!');
    });

    it('getTime returns a valid date', async () => {
        const res = await post('getTime', []);
        expect(res.ok).toBe(true);
        expect(new Date((await res.json()).getTime).getTime()).not.toBeNaN();
    });

    it('orders.listOrders returns seed data', async () => {
        const res = await post('orders/listOrders', []);
        expect(res.ok).toBe(true);
        const orders = (await res.json())['orders/listOrders'];
        expect(orders[0].customer).toBe('Alice Johnson');
        expect(orders.length).toBeGreaterThanOrEqual(3);
    });

    it('orders.createOrder creates a new order', async () => {
        const res = await post('orders/createOrder', ['Test Customer', 99.99]);
        expect(res.ok).toBe(true);
        const order = (await res.json())['orders/createOrder'];
        expect(order.customer).toBe('Test Customer');
        expect(order.status).toBe('pending');
    });

    it('orders.createOrder rejects a client-chosen id', async () => {
        const res = await post('orders/createOrder', ['Eve', 10, '0195546a-5c00-7000-8000-000000000001']);
        expect(res.ok).toBe(false);
        expect(JSON.stringify(await res.json())).toContain('"type":"validation-error"');
    });
});
