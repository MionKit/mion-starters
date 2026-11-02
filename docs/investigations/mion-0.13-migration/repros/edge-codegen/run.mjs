// run with: node --disallow-code-generation-from-strings run.mjs   (same restriction as workerd / Vercel Edge)
const {default: handler} = await import('./dist/worker.js');
const res = await handler.fetch(new Request('http://x/hello', {method: 'POST', body: JSON.stringify({hello: ['edge']})}));
console.log(res.status, await res.text());
