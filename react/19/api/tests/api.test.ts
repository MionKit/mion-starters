import {describe, it, expect} from 'vitest';

const API_BASE = 'http://localhost:3001/api/mion';

describe('mion API', () => {
    it('hello route returns greeting', async () => {
        const res = await fetch(`${API_BASE}/hello`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({hello: ['World']}),
        });
        expect(res.ok).toBe(true);
        const json = await res.json();
        expect(json.hello).toBe('Hello World!');
    });

    it('getTime returns a valid date', async () => {
        const res = await fetch(`${API_BASE}/getTime`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({getTime: []}),
        });
        expect(res.ok).toBe(true);
        const json = await res.json();
        expect(new Date(json.getTime).getTime()).not.toBeNaN();
    });

    it('orders.listOrders returns seed data', async () => {
        const res = await fetch(`${API_BASE}/orders/listOrders`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({'orders/listOrders': []}),
        });
        expect(res.ok).toBe(true);
        const json = await res.json();
        const orders = json['orders/listOrders'];
        expect(orders).toHaveLength(3);
        expect(orders[0].customer).toBe('Alice Johnson');
    });

    it('orders.createOrder creates a new order', async () => {
        const res = await fetch(`${API_BASE}/orders/createOrder`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({'orders/createOrder': ['Test Customer', 99.99]}),
        });
        expect(res.ok).toBe(true);
        const json = await res.json();
        const order = json['orders/createOrder'];
        expect(order.customer).toBe('Test Customer');
        expect(order.status).toBe('pending');
    });
    it('orders.createOrder takes no client-chosen id', async () => {
        const seedId = '0195546a-5c00-7000-8000-000000000001';
        const res = await fetch(`${API_BASE}/orders/createOrder`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({'orders/createOrder': ['Eve', 10, seedId]}),
        });
        const json = await res.json();
        expect(json['orders/createOrder']?.id).not.toBe(seedId);
        const list = await fetch(`${API_BASE}/orders/listOrders`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({'orders/listOrders': []}),
        });
        const orders: {id: string}[] = (await list.json())['orders/listOrders'];
        expect(orders.filter((o) => o.id === seedId)).toHaveLength(1);
    });
});
