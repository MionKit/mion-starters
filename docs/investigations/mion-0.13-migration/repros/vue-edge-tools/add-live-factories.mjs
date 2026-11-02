// Spike-only: simulates publishing @mionjs/core + router with emitMode 'both' by adding the live factory slot
// to every code-only compiled entry in a built chunk. Usage: node add-live-factories.mjs <chunk.js>
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(process.argv[2]);
const acorn = require('acorn');
const file = process.argv[2];
let src = fs.readFileSync(file, 'utf8');
const ast = acorn.parse(src, {ecmaVersion: 'latest', sourceType: 'module'});
const edits = [];
const walk = (node) => {
  if (!node || typeof node.type !== 'string') return;
  if (node.type === 'VariableDeclarator' && node.id.name?.startsWith('__rt_') && node.init?.type === 'ArrayExpression') {
    const el = node.init.elements;
    const isPf = el[0]?.type === 'Literal' && el[0].value === 2;
    const factoryIdx = isPf ? 7 : 9;
    const code = el[5];
    if (code?.type === 'Literal' && typeof code.value === 'string' && !el[factoryIdx]) {
      const params = isPf ? (el[4]?.elements ?? []).map((p) => p.value).join(',') : 'utl';
      const parts = [];
      for (let i = 0; i < Math.max(el.length, factoryIdx); i++) parts.push(el[i] ? src.slice(el[i].start, el[i].end) : '');
      parts[factoryIdx] = `function(${params}){${code.value}\n}`;
      edits.push([node.init.start, node.init.end, `[${parts.join(',')}]`]);
    }
  }
  for (const k in node) { const v = node[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
};
walk(ast);
for (const [s, e, t] of edits.sort((a, b) => b[0] - a[0])) src = src.slice(0, s) + t + src.slice(e);
fs.writeFileSync(file, src);
console.log(`added live factories to ${edits.length} code-only entries`);
