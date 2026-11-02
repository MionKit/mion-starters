const {GET, POST} = await import(process.argv[2]);
const r1 = await POST(new Request('http://x/api/mion/hello', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({hello: ['Vercel']})}));
console.log(r1.status, await r1.text());
const r2 = await POST(new Request('http://x/api/mion/orders/getOrder', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({'orders/getOrder': ['not-a-uuid']})}));
console.log(r2.status, (await r2.text()).slice(0, 300));
const r3 = await POST(new Request('http://x/api/mion/orders/getOrder', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({'orders/getOrder': ['0195546a-5c00-7000-8000-000000000001']})}));
console.log(r3.status, (await r3.text()).slice(0, 300));
