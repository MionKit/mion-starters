const mod = await import(process.argv[2]);
const handler = mod.default;
const req = new Request('http://x/api/mion/hello', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({hello: ['Edge']})});
const res = await handler.fetch(req, {}, {waitUntil() {}, passThroughOnException() {}});
console.log(res.status, await res.text());
const req2 = new Request('http://x/api/mion/orders/listOrders', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({'orders/listOrders': []})});
const res2 = await handler.fetch(req2, {}, {waitUntil() {}});
console.log(res2.status, (await res2.text()).slice(0, 150));
