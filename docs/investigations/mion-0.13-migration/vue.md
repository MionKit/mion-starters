# Vue 3 SPA starter: mion 0.8.10 → 0.13.2 migration spike

Spike copy: `the spike copy (its full diff is patches/vue.patch)`
Minimal repros: `repros/{edge-codegen,batch-destructure,pkgname-path}`
Environment: Node 26.13, npm 11.20, bun 1.4.4, vite 8.3.5, vitest 4.1.12, vue-tsc 3.3.14, TypeScript 6.x, Playwright 1.64.1, wrangler 4.156.1 (installed separately in scratch).
Everything uses the published `@mionjs/*@0.13.2` packages from npm. `mion main` (main) was used only to check whether each mion issue is still there; for every mion item below, main has the same code.

## TL;DR

| Area | Result |
|---|---|
| `npm install` | Clean. No peer warnings. Native binary `@mionjs/native-compiler-linux-x64` resolves (25 MB), `npx mion --version` → `mion 0.13.2 (tsgo 5a37e89)` |
| `vue-tsc --noEmit` | Clean, with ONE root tsconfig covering `app/`, `api/src`, `api/tests` |
| `eslint` | 0 errors (47 pre-existing eslint-plugin-vue formatting warnings). The mion rules can't run on `.vue` files (mion bug) |
| `vite dev` | API runs in-process under `/api/mion`, curl works, pages render, browser console is clean, a type edit hot-reloads the API, a broken API file answers 503 and recovers. **Bug:** a batch written only inside a `.vue` gets `batch-unknown-id` 404 on every fresh dev start |
| `vite build` + `server.build` | One command emits `dist/` (client) and `dist-server/` (API). The client has no server code, only the 2 routes it calls. The API bundle is self-contained with no `node:fs`. Needs a small plugin to emit 4 entries |
| Node / Bun / Vercel serverless (Node) | Work from `dist-server/*` (bun also works from source with the preload plugin) |
| **Cloudflare Workers / Vercel Edge** | **Can't work with published 0.13.2.** Two mion bugs: the router and core packages ship code-string-only compiled functions, and `@mionjs/router` reads `process.env` without a guard. Once the first bug is patched in the build output, the full SPA + API runs in workerd |
| Vitest (`api/tests`) | 8/8 pass with the new in-process `globalSetup`, including a client test (`call()`, Date, UUIDv7, batch + `inputFrom`) |
| Playwright | 5/5 pass (needed `CHROMIUM_PATH` because of this sandbox's browser build) |
| `create.mjs` + root test flow | Works after the fixes below. With the current `create.mjs`, the root test's absolute-path project name breaks the 0.13.2 build |

---

## 1. Final working shape

```
vue/3/
├── api/
│   ├── bun-preload.ts            # NEW: runtypes Bun plugin, only for `bun run` on TS source (npm run dev:bun)
│   ├── src/
│   │   ├── router.ts             # NEW: `export const mion = createMionRouter({basePath: 'api/mion'})`
│   │   ├── api.ts                # routes + `export const myApi = mion.initRoutes(routes)`; `export type MyApi = typeof myApi`
│   │   ├── models.ts
│   │   ├── features/orders/{orders-handlers,orders-models,orders-repository}.ts
│   │   ├── server.node.ts        # dev entry (mounted in-process) + node deploy
│   │   ├── server.bun.ts
│   │   ├── vercel-serverless.ts
│   │   └── cloudflare-worker.ts
│   └── tests/
│       ├── global-setup.ts       # NEW: starts the API in vitest's process
│       ├── api.test.ts           # unchanged raw-fetch tests (POST bodies still accepted for queries)
│       └── client.test.ts        # NEW: typed client, Date, UUIDv7, batch + inputFrom
├── app/
│   ├── main.ts                   # no more provide('mionClient')
│   ├── mion-client.ts
│   ├── orders-batch.ts           # NEW: the batch lives in a .ts file (see issues 3 and 4)
│   ├── router.ts, App.vue, pages/{HomePage,MionOrdersPage}.vue, assets/
│   └── (composables/useMionClient.ts DELETED)
├── deploy/wrangler.toml          # REWRITTEN: Workers + static assets (functions/ and _routes.json DELETED)
├── e2e/smoke.test.ts             # unchanged
├── vite.config.ts                # THE only build config: dev + client build + API build + vitest
├── tsconfig.json                 # THE only tsconfig
├── eslint.config.mjs, playwright.config.ts, env.d.ts, index.html, create.mjs, gitignore, .npmignore
DELETED: vite.app.build.config.ts, vitest.config.ts, vitest.globalSetup.ts, api/vite.config.ts,
         api/mion-plugin.ts, api/tsconfig.json, api/src/dev-server.ts, functions/, deploy/_routes.json,
         app/composables/
Generated (gitignored): .mion/, dist/, dist-server/, .wrangler/
```

### vite.config.ts (works for dev, build, vitest and preview)

```ts
/// <reference types="vitest/config" />
import {defineConfig, type Plugin} from 'vite';
import vue from '@vitejs/plugin-vue';
import {mionVitePlugin} from '@mionjs/devtools/vite';

/** server.build takes ONE entry: this widens the API bundle to every deploy target */
const apiEntries: Plugin = {
    name: 'api-entries',
    configEnvironment(name) {
        if (name !== 'ssr') return;
        return {
            build: {
                copyPublicDir: false, // public/ belongs to the client bundle only
                rollupOptions: {
                    input: {
                        'server.node': 'api/src/server.node.ts',
                        'server.bun': 'api/src/server.bun.ts',
                        'vercel-serverless': 'api/src/vercel-serverless.ts',
                        'cloudflare-worker': 'api/src/cloudflare-worker.ts',
                    },
                },
            },
        };
    },
};

export default defineConfig({
    plugins: [
        vue(),
        mionVitePlugin({
            server: {entry: 'api/src/server.node.ts', build: {outDir: 'dist-server'}},
            // Cloudflare Workers / Vercel Edge forbid `new Function` (does NOT fully help yet, see issue 1)
            runTypes: {emitMode: 'both'},
        }),
        apiEntries, // must come AFTER mionVitePlugin
    ],
    test: {include: ['api/tests/**/*.test.ts'], globalSetup: ['api/tests/global-setup.ts']},
    // `vite preview` serves only dist/: the API bundle runs on its own (npm run preview:api)
    preview: {proxy: {'/api/mion': 'http://localhost:3001'}},
});
```

Build output:
```
dist/index.html                   0.43 kB │ gzip:  0.28 kB
dist/assets/index-C4tQsWu2.css    5.98 kB │ gzip:  1.32 kB
dist/assets/index-Dor9gYiL.js   149.11 kB │ gzip: 54.03 kB
dist-server/vercel-serverless.js      2.33 kB
dist-server/cloudflare-worker.js      2.51 kB
dist-server/server.bun.js             5.22 kB
dist-server/server.node.js            8.80 kB      (imports only "http", "https")
dist-server/assets/api-evFHzAqK.js  213.59 kB │ gzip: 51.43 kB   (shared, no node imports, no fs)
```
The build takes about 1.9 s. Switching `emitMode` from `'code'` to `'both'` grows the API chunk from 195.6 to 213.6 kB. The client size doesn't change (148.88 vs 148.91 kB).

### tsconfig.json (one program for client and server)

```json
{
  "compilerOptions": {
    "target": "ES2023", "module": "ESNext", "moduleResolution": "bundler", "strict": true,
    "jsx": "preserve", "noEmit": true, "resolveJsonModule": true, "isolatedModules": true,
    "esModuleInterop": true, "allowImportingTsExtensions": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"], "types": ["node"], "skipLibCheck": true,
    "paths": {"@/*": ["./app/*"]}
  },
  "include": ["app/**/*.ts", "app/**/*.vue", "api/src/**/*.ts", "api/tests/**/*.ts", "env.d.ts"],
  "exclude": ["node_modules", "dist", "dist-server"]
}
```
`"reflection": true` (deepkit), NodeNext and `rewriteRelativeImportExtensions` were all dropped. Including `.vue` in the include list works: both the mion resolver and vue-tsc accept it.

### Routes

```ts
// api/src/router.ts — its own module, so feature files can import the helpers without a cycle through api.ts
import {createMionRouter} from '@mionjs/router';
export const mion = createMionRouter({basePath: 'api/mion'});

// api/src/features/orders/orders-handlers.ts
import {Routes} from '@mionjs/router';
import type {UUIDv7} from '@mionjs/run-types/formats';        // `import type` is fine in 0.13 (see issue 13)
import {mion} from '../../router.ts';
import type {Order, OrderEvent} from './orders-models.ts';
export const ordersRoutes = {
    listOrders: mion.query((): Order[] => findAllOrders()),
    getOrder: mion.query((ctx, id: UUIDv7): Order | undefined => findOrderById(id)),
    createOrder: mion.mutation((ctx, customer: string, total: number, id?: UUIDv7): Order => insertOrder(customer, total, id)),
    getOrderEvents: mion.query((ctx, orderId: UUIDv7): OrderEvent[] => findEventsByOrderId(orderId)),
    getOrdersEvents: mion.query((ctx, orderIds: UUIDv7[]): OrderEvent[] => findEventsByOrderIds(orderIds)),
} satisfies Routes;

// api/src/api.ts
const routes = {
    hello: mion.query((ctx, name: string): string => `Hello ${name}!`),
    getTime: mion.query((): Date => new Date()),
    orders: ordersRoutes,
} satisfies Routes;
export const myApi = mion.initRoutes(routes);
export type MyApi = typeof myApi;

// entries: no initApi(), no await. initRoutes is sync and runs when the module is imported
// server.node.ts
import {startNodeServer} from '@mionjs/platform-node';
import './api.ts';
await startNodeServer({port: 3001});      // under `vite dev` no port is opened
// cloudflare-worker.ts
import {createCloudflareHandler} from '@mionjs/platform-cloudflare';
import './api.ts';
export default createCloudflareHandler();
```

### Client and the batch demo (replaces routesFlow + serverMapFrom)

```ts
// app/mion-client.ts
export const mionClient = initClient<MyApi>({baseURL: window.location.origin, basePath: 'api/mion'});

// app/orders-batch.ts — a .ts file, not the .vue (issue 3), and a property read, not destructuring (issue 4)
import {batch, inputFrom} from '@mionjs/client';
import {mionClient} from './mion-client.ts';
const routes = mionClient.routes;
export function fetchOrdersWithEvents() {
    const ordersReq = routes.orders.listOrders();
    const orderIds = inputFrom(ordersReq, (list) => list!.map((o) => o.id));
    const eventsReq = routes.orders.getOrdersEvents(orderIds.asArg());
    return batch([ordersReq, eventsReq]).call();
}

// MionOrdersPage.vue <script setup>
const [[ordersData, ordersError, response], [allEvents, eventsError]] = await fetchOrdersWithEvents();
const thrown = response?.['@thrownErrors'];   // batch-level errors (e.g. batch-unknown-id) land here
```
Wire format: `POST /api/mion/mion-batch?id=b_M5CQfOE5aJ3sZo` with body `{"orders/getOrdersEvents":[null]}`. The response holds both results. Dates come back as `Date` objects (`toLocaleDateString()` works). The discriminated-union events and UUIDv7 ids render correctly.

### Vitest globalSetup

```ts
// api/tests/global-setup.ts
import type {Server} from 'node:http';
import {startNodeServer} from '@mionjs/platform-node';
import '../src/api.ts';
let server: Server | undefined;
export async function setup() { server = (await startNodeServer({port: 3001})) as Server; }
export async function teardown() { if (server) await new Promise<void>((done) => server?.close(() => done())); }
```

### package.json

```jsonc
"dependencies": {
  "@mionjs/client": "0.13.2", "@mionjs/core": "0.13.2", "@mionjs/router": "0.13.2", "@mionjs/run-types": "0.13.2",
  "@mionjs/platform-node": "0.13.2", "@mionjs/platform-bun": "0.13.2",
  "@mionjs/platform-vercel": "0.13.2", "@mionjs/platform-cloudflare": "0.13.2",
  "vue": "^3.5.44", "vue-router": "^5.4.0"
},
"devDependencies": {
  "@mionjs/devtools": "0.13.2", "@mionjs/bin-compiler": "0.13.2", "@types/node": "^24",
  "@playwright/test": "^1.64.1", "@vitejs/plugin-vue": "^6.0.10", "eslint": "^9", "eslint-plugin-vue": "^10",
  "typescript": "^6", "typescript-eslint": "^8", "vite": "^8.3.5", "vitest": "^4.1.8", "vue-tsc": "^3.3.14"
},
"scripts": {
  "dev": "vite", "build": "vite build",
  "preview": "npm run preview:api & vite preview", "preview:api": "node dist-server/server.node.js",
  "preview:bun": "bun dist-server/server.bun.js",
  "dev:bun": "bun --preload ./api/bun-preload.ts api/src/server.bun.ts",
  "typecheck": "vue-tsc --noEmit", "lint": "eslint",
  "test:unit": "vitest run", "test:e2e": "playwright test", "test": "vitest run && playwright test",
  "test:install": "playwright install chromium"
}
// "overrides" block removed
```

### eslint.config.mjs

```js
export default [
    {ignores: ['dist/**', 'dist-server/**', '.mion/**', 'test-results/**']},
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {files: ['**/*.vue'], languageOptions: {parserOptions: {parser: tseslint.parser}}},
    // NOT on .vue: the mion lint worker cannot scan SFCs (issue 5)
    {files: ['api/**/*.ts', 'app/**/*.ts'], ...mion.configs.recommended},
];
```
I checked that the mion rules fire on `.ts` files: `rpc-handler-missing-return-type`, `rpc-handler-throws`, and `rpc-batch-element-unreadable` on a client file.

### deploy/wrangler.toml (replaces Pages Functions + _routes.json)

```toml
name = "mion-vue-app"
main = "../dist-server/cloudflare-worker.js"
compatibility_date = "2025-03-01"
compatibility_flags = ["nodejs_compat"]   # needed until mion guards process.env (issue 2)

[assets]
directory = "../dist"
not_found_handling = "single-page-application"
run_worker_first = ["/api/*"]
```
With issue 1 patched in the build output, `wrangler dev -c deploy/wrangler.toml` serves the SPA on `/mion-orders` (200 text/html), runs the API on `/api/mion/*`, and the Playwright page renders all orders through the batch.

---

## 2. Migration steps (in order)

1. **Dependencies.** Remove `@mionjs/type-formats`, `vite-node`, the whole `overrides` block, and all `file:` tarball refs. Pin every `@mionjs/*` to `0.13.2`. Add `@mionjs/run-types` (dep, for the formats), `@mionjs/bin-compiler` (dev; peer of devtools), `@types/node`, and `vue-tsc`. Bump vite 7 → `^8.3.5`. Keep `typescript` on `^6`: TypeScript 7 breaks vue-tsc and typescript-eslint (issue 21). vitest 4 and 5 both work.
2. **Delete files:** `vite.app.build.config.ts`, `vitest.config.ts`, `vitest.globalSetup.ts`, `api/vite.config.ts`, `api/mion-plugin.ts`, `api/tsconfig.json`, `api/src/dev-server.ts` (the API now runs inside Vite), `app/composables/useMionClient.ts`, `functions/`, and `deploy/_routes.json`.
3. **One tsconfig.** Rewrite the root `tsconfig.json` to include `app` (ts + vue), `api/src`, `api/tests` and `env.d.ts`, with bundler resolution, `allowImportingTsExtensions` and `noEmit`.
4. **One vite.config.ts.** Change the import from `@mionjs/devtools/vite-plugin` to `@mionjs/devtools/vite`. The old options and their replacements:
   - `runTypes.tsConfig` → drop it (top-level `tsConfig` defaults to `tsconfig.json`)
   - `serverPureFunctions` → gone
   - `aotCaches` → gone
   - `server.{startScript, viteConfig, runMode}` → `server.{entry, build}`
   - Add `runTypes.emitMode: 'both'`, the `apiEntries` plugin, the `test` block and `preview.proxy`.
5. **env.d.ts.** Remove the `virtual:mion-aot/caches` module declaration.
6. **Router.** Before: `initMionRouter(routes, {basePath})` with standalone `query`/`mutation` imports and `initApi()` async. After: `createMionRouter({basePath: 'api/mion'})` in `api/src/router.ts`, `mion.query`/`mion.mutation` everywhere, and `export const myApi = mion.initRoutes(routes)` (sync). Use `export type MyApi = typeof myApi` instead of `PublicApi<typeof routes>`.
7. **Formats.** `import {FormatUUIDv7} from '@mionjs/type-formats/StringFormats'` becomes `import type {UUIDv7} from '@mionjs/run-types/formats'`.
8. **Entries.** Replace `await initApi(); startXxx()` with `import './api.ts'; await startXxx()`. Vercel and Cloudflare just `import './api.ts'` before creating the handler.
9. **Seed data.** Use fixed UUIDv7 literals instead of `randomUUID_V7()` at module scope. workerd refuses random values in global scope (issue 17).
10. **Client.**
    - `routesFlow([...]).call()` returns `[[results], [errors]]`. Replace it with `batch([...]).call()`, which returns `[[result, error, response], ...]`.
    - `serverMapFrom(req, fn, 'name').asArg()` becomes `inputFrom(req, fn).asArg()`. There's no name argument any more: the mapper becomes a pure function with a build-generated id.
    - Move the batch into `app/orders-batch.ts`. Use `mionClient.routes` directly, with no provide/inject and no destructuring.
11. **Vitest.** Add `api/tests/global-setup.ts` (in-process `startNodeServer`) and `api/tests/client.test.ts`.
12. **ESLint.** Remove the `@mionjs/enforce-type-imports` rule and the per-folder `consistent-type-imports: off`. Add the TS parser and `mion.configs.recommended` for `.ts` files only.
13. **Deploy.** Rewrite `deploy/wrangler.toml` to Workers + static assets. Add `api/bun-preload.ts` if `bun run` on source should work.
14. **create.mjs / gitignore / .npmignore** (section 3, item 18): exclude `.mion`, `dist-server` and `.wrangler`, and use `basename(targetDir)` as the package name.
15. **Playwright.** Optionally add `launchOptions.executablePath` from an env var. Not needed in CI where `playwright install` runs.

API renames used (before → after):

| 0.8.10 | 0.13.2 |
|---|---|
| `initMionRouter(routes, opts)` | `const mion = createMionRouter(opts); mion.initRoutes(routes)` |
| `query`, `mutation` (imported) | `mion.query`, `mion.mutation` |
| `PublicApi<typeof routes>` | `typeof myApi` (`PublicApi` still exists for sub-APIs) |
| `routesFlow([...])` | `batch([...])` |
| `serverMapFrom(src, fn, name)` | `inputFrom(src, fn)` |
| `@mionjs/devtools/vite-plugin` | `@mionjs/devtools/vite` |
| `serverReady` (globalSetup) | gone: start the server yourself in `globalSetup` |
| `@mionjs/type-formats` `FormatUUIDv7` | `@mionjs/run-types/formats` `UUIDv7` |
| eslint `@mionjs/enforce-type-imports` | `mion/error`, `mion/runtime-error`, `mion/warning`, `mion/info` (`rpc-client-imports-server-value` covers the old rule) |

---

## 3. Issues found

### 1. Cloudflare Workers / Vercel Edge can't run mion 0.13.2, even with `emitMode: 'both'` — mion-bug (BLOCKER for the edge targets)

**Symptom.** In real workerd (`wrangler dev`), with `nodejs_compat` enabled so issue 2 doesn't fire first:
```
✘ [ERROR] service core:user:mion-vue-spike: Uncaught Error: RuntimeCodeGenBlockedError: Route/middleware "@thrownErrors" carries build-time type information, but this runtime forbids compiling functions from strings.
Build with `mionVitePlugin({runTypes: {emitMode: 'both'}})`: the default 'code' ships each compiled fn as a source string that is turned into a function on first use, which edge runtimes (Cloudflare Workers / workerd, Vercel Edge) refuse. 'both' also emits the live factory, so nothing is compiled at runtime.
Cause: Code generation from strings disallowed for this context
  at cloudflare-worker.js:2774:50 in getHandlerReflection ... at initRoutes
```
The same error appears with `node --disallow-code-generation-from-strings`. The message tells the user to set `emitMode: 'both'`, which is already set, so it is misleading.

**Root cause.** The published packages ship precompiled type modules in `'code'` mode only (source strings, no live factory):
- `@mionjs/router/.dist/esm/.mion/types/*.js`: 116 files. They cover the built-in routes `@thrownErrors`, `platformError`, the RpcError serializers and so on.
- `@mionjs/core/.dist/esm/.mion/types/*.js`: 4 files.

The app's `emitMode: 'both'` only affects the app's own `.mion/types` (64 entries in the bundle get `function g_*` factories). The 25 entries bundled from `node_modules/@mionjs/*` stay code-only.

**Source.**
- `packages/rpc-router/vite.config.ts:16-18` calls `mionVitePlugin({tsConfig})` without `emitMode`, so it defaults to `'code'`. Core is built the same way.
- mion's own edge tests avoid the built packages on purpose: `packages/private-test-server/vite.cloudflare.config.ts:29-36` says *"the moment a `.dist` exists … this bundle silently inlined BUILT output compiled with the default emitMode: 'code' — code-only fns … exactly what this bundle must never contain"* and uses `resolve: {conditions: ['source']}`. npm consumers have no `source` condition. So CI never tests the published path.

**main:** unchanged (no `emitMode` in `packages/rpc-router/vite.config.ts`).

**Repro:** `repros/edge-codegen`. Run `npx vite build` (`src/worker.ts` is a 7-line router + `createCloudflareHandler`, built with `emitMode: 'both'`), then `node --disallow-code-generation-from-strings run.mjs`. That fails with `RuntimeCodeGenBlockedError: Route/middleware "@thrownErrors"…`. Plain `node run.mjs` prints `200 {"hello":"Hello edge"}`.

**Proof of fix.** `repros/vue-edge-tools/add-live-factories.mjs` adds the live factory slot to the 20 code-only entries in the built chunk. After that, the no-codegen Node run works, and so does real workerd with `deploy/wrangler.toml`: SPA, `/api/mion/hello`, and the batch page all work.

**Fix (mion).** Publish core, router and client built with `emitMode: 'both'` (or `'functions'`). Otherwise the app build has to re-emit package entries in the app's mode. Also make the error say which module the code-only entry came from.

**Workaround in the starter.** None that's clean. Keep the target and document it as blocked, or drop it until mion ships a fix. Vercel on the Node runtime is unaffected.

### 2. `@mionjs/router` reads `process.env` without a guard at module load — mion-bug

**Symptom** (workerd, no `nodejs_compat`):
```
✘ [ERROR] service core:user:mion-vue-spike: Uncaught ReferenceError: process is not defined
    at null.<anonymous> (cloudflare-worker.js:1712:24)
```
The bundle line is `getPublicRoutesData: process.env.GENERATE_ROUTER_SPEC === "true",`.

**Source.** `packages/rpc-router/src/constants.ts:15`. The same package already has a guarded `getENV()` helper (used in `router.ts:320`).

mion's own Workers test hides this by polyfilling: `packages/platform-cloudflare/test/cloudflareHandler.workers.spec.ts:41-42` does `globalThis.process = { env: {} }`.

**main:** unchanged.

**Workaround:** `compatibility_flags = ["nodejs_compat"]` in wrangler.toml. Vercel Edge also has no `process` by default; that wasn't tested.

**Fix:** use `getENV('GENERATE_ROUTER_SPEC')` in `constants.ts`.

### 3. Dev: a batch written only inside a `.vue` SFC gets `404 batch-unknown-id` on every fresh `vite dev` — mion-bug

**Symptom** (first and every later page load, until an API file is edited):
```
POST /api/mion/mion-batch?id=b_M5CQfOE5aJ3sZo → 404
{"@thrownErrors":{"mion@batchNotFound":{"publicMessage":"Batch id not registered on this server. Batches are compiled by the build; rebuild the client and the server together.","type":"batch-unknown-id","statusCode":404}}}
```
This happens with a clean `.mion` and also with a warm one. The existing Playwright e2e catches it: `Failed requests: [ '404 http://localhost:5173/api/mion/mion-batch?id=…' ]`, then `expect(locator).toBeVisible() failed`.

**Root cause.** I confirmed it by instrumenting the dist in the scratch copy:
1. The boot generate only knows the TS program. `.vue` files aren't in it, so `batchesModule = ''`, and `api/src/router.ts` is transformed without the batch-table import. The API is loaded at warm-up.
2. When the page is requested, the SFC transform registers the `.vue` script and the resolver writes `.mion/rpc/batches.generated.js`. Chokidar's `add` event fires **before** `onGenerate` updates `batchesModule`:
   ```
   [DBG add] …/.mion/rpc/batches.generated.js init? true stale undefined bm=          ← empty, so ignored
   [DBG onGenerate] "…/.mion/rpc/batches.generated.js" prev "" first true [ …/api/src/router.ts ]
   ```
3. `onGenerate` (`mionVitePlugin.ts:148-155`) invalidates the router-init modules in the module graph but never marks the middleware stale. The middleware (`middlewareMode.ts:176-180`) only reloads on watcher events, so the API keeps its batch-less router.

**Source:** `packages/devtools/src/vite/middlewareMode.ts:176-180` and `packages/devtools/src/vite/mionVitePlugin.ts:141-156`. **main:** both files are byte-identical to 0.13.2.

**Masking:** if any `.ts` file in the program contains the identical batch (same routes and mapper, so the same id), the bug disappears. For example, a vitest client test with the same batch hid it during my testing.

**Production `vite build`:** OK. The client environment builds first, so the batch is in `dist-server`.

**Repro:** in the spike, put `../MionOrdersPage.batch-in-sfc.vue` in place of `app/pages/MionOrdersPage.vue`, move `app/orders-batch.ts` and `api/tests/client.test.ts` aside, then run `rm -rf .mion && npx vite`. Loading `/mion-orders` gives 404 every time (3/3 runs). `touch api/src/api.ts` makes it recover.

**Fix (mion):** in `onGenerate`, when presence changes, also signal the middleware to set `staleSince`, or match the `add` event on the `rpc/batches.generated.js` suffix.

**Workaround (starter):** keep batches in a `.ts` module (`app/orders-batch.ts`). That's also what lets the linter check them (issue 5).

### 4. Batch reader rejects `const {routes} = client` (destructuring a variable) but accepts `const routes = client.routes` — mion-bug/gap

**Symptom:**
```
error rpc-batch-element-unreadable (2)
  `batch()` element is not a route call the build can read (root is not the client routes proxy); write `routes.a.b(...)` inline or bind it to a `const`/`let` in this file.
```
The message's advice ("bind it to a const") is exactly what the code already does.

Probe matrix (`mion compile --no-emit`):

| Pattern | Result |
|---|---|
| `const {routes} = initClient(...)` | OK |
| `export const {routes} = initClient(...)` imported elsewhere | OK |
| `mionClient.routes.x()` | OK |
| `const routes = mionClient.routes` | OK |
| `const {routes} = mionClient` (imported) | FAIL |
| `const client = initClient(); const {routes} = client` (same file) | FAIL |
| `const {routes} = useMionClient()` (Vue provide/inject composable, the old starter's pattern) | FAIL |

**Source.** `ts-go-runtypes/internal/compiler/requestbatch/routes.go:216-256`. `bindingElementPath` only accepts a destructuring whose initializer *is* the `initClient()` call (line 247: `!scope.isInitClientCall(initializer)`). The `KindVariableDeclaration` branch at lines 180-197 does follow access chains. **main:** identical.

**Repro:** `repros/batch-destructure`. Run `npx mion compile --no-emit --gen-dir /tmp/x`: the `ok` export passes and the `fails` export reports the error.

**Fix:** in `bindingElementPath`, resolve a non-`initClient` initializer through `accessChain` + `resolveRootPath`, like the variable branch does.

**Docs:** say plainly that a client obtained through Vue `inject()` or a composable can't batch. Idiomatic Vue apps will hit this.

### 5. The mion ESLint rules error on every `.vue` file that imports mion code — mion-bug

**Symptom** (`npx eslint`, with `mion.configs.recommended` applied to `app/**/*.vue`):
```
app/pages/MionOrdersPage.vue
  1:1  error  [mion] resolver failed: scanFiles [app/pages/MionOrdersPage.vue]: source file not in program: …/app/pages/MionOrdersPage.vue  mion/error
```
**Root cause.** `packages/devtools/src/lint/lint-worker.ts:93-105` sends the raw SFC text under its `.vue` path, and the resolver can't put a `.vue` into the TS program. The catch only swallows that error for `.js` files.

The Vite preset already solves this: `sfcTransform.ts` registers the extracted `<script>` as a virtual `Comp.vue.ts`. The linter doesn't. So the docs' promise that "the linter shows the same error in your editor" doesn't hold for SFCs. **main:** identical.

**Workaround:** apply the mion rules to `**/*.ts` only, and keep mion-marker code (batches) out of `.vue`.

### 6. `server.build` emits only ONE API entry; user `rollupOptions.input` is silently overwritten — mion-gap

The starter needs 4 entries (node, bun, vercel, cloudflare). `serverBundlePlugin` (`packages/devtools/src/vite/mionVitePlugin.ts:254-279`) returns `environments.ssr.build.rollupOptions.input = path.resolve(root, server.entry)` from a `config` hook with `order: 'post'`.

A user-level `environments.ssr.build.rollupOptions.input = {...}` loses: only `dist-server/server.node.js` is emitted, with no warning.

**Workaround:** the `apiEntries` plugin with a `configEnvironment('ssr')` hook, placed after mionVitePlugin. It emits 4 thin entries plus a shared `assets/api-*.js` chunk.

**Suggested:** `server.build.input?: string | Record<string,string>`, or don't overwrite an existing input. **main:** identical.

### 7. The server bundle copies `public/` into `dist-server/` — mion-gap (minor)

Without a fix, `dist-server/` contains `favicon.ico`, `mion-logo-dark.svg`, `robots.txt` and `vue.svg`. `serverBundlePlugin` doesn't set `copyPublicDir: false` on the ssr environment. **Workaround:** set it in `apiEntries`.

### 8. `vite preview` doesn't serve the API — mion-gap (docs/feature)

`POST localhost:4173/api/mion/hello` returns `HTTP/1.1 404 Not Found`. The plugin only implements `configureServer`, not `configurePreviewServer`.

**Workaround:** `preview.proxy` plus `node dist-server/server.node.js` (`npm run preview`, verified). The docs could say this, or the plugin could mount `dist-server` in preview.

### 9. `mion-pure-fns/` artifact lands in the PUBLIC `dist/` (and `dist-server/`) — mion-gap (minor)

`dist/mion-pure-fns/index.json` lists `{"id":"@mionjs/create-starter-vue#pf_-EIbjUu0g3e7qK","bindingName":"orderIds","file":"app/orders-batch.ts"}`. An app's static CDN output now publishes source file paths and the mapper source. It looks like a library-publishing artifact that an app build shouldn't emit, at least not into the client `outDir`.

### 10. package.json `name` is used raw as a filesystem path for pure-fn modules — mion-bug (robustness), triggered by `create.mjs`

**Symptom.** With `pkg.name = "/abs/path/.tmp-vue/e2e-vue"`, which is what the current `create.mjs` writes when given an absolute path, as the root test does:
```
[UNRESOLVED_IMPORT] Could not resolve '../.mion/types/pf/tmp/claude-0/…/.tmp-vue/e2e-vue/-EIbjUu0g3e7qK.js' in app/orders-batch.ts
```
The generated table has `import … from './pf//tmp/claude-0/…/e2e-vue/-EIbjUu0g3e7qK.js'`, with a double slash and an absolute path.

**Source.** `ts-go-runtypes/internal/compiler/marker/marker.go:822-840` (`lookupPackageUpward`) returns the name unvalidated. It becomes the pure-fn id owner (`<name>#pf_…`) and a path segment. A package with **no** `name` works (`#pf_…`, `./pf/-EIbjUu0g3e7qK.js`). **main:** identical.

**Repro:** `repros/pkgname-path`. Set `"name": "/abs/path/my-app"` and run `npx vite build`: it fails. With `"name": "my-app"` it builds.

**Fix (mion):** validate (diagnostic) or sanitize the name.

**Fix (starter):** `pkg.name = basename(targetDir)` in `create.mjs`.

### 11. `@mionjs/platform-bun` has runtime dependencies on `@mionjs/devtools` + `@mionjs/bin-compiler` (+ peer `typescript`) — mion-bug (packaging)

`npm view @mionjs/platform-bun@0.13.2 dependencies` lists `@mionjs/devtools` and `@mionjs/bin-compiler`, and peer `typescript >=6`. The published `.dist` never imports them (grep finds nothing). They exist only for the repo's own `bun-preload.ts`, `vite.config.ts` and tests (`packages/platform-bun/package.json:63-69`).

Effect: any production `npm i --omit=dev` of an app on Bun pulls the 25 MB native compiler, devtools and unplugin. **main:** identical.

### 12. 23 "Sourcemap … points to missing source files" warnings on every `vite dev` / `vitest` start — mion-bug (packaging, cosmetic)

```
Sourcemap for ".../node_modules/@mionjs/run-types/dist/runtime/index.js" points to missing source files
… (23 lines, run-types only)
```
`@mionjs/run-types/dist/*.js.map` references `../src/*.ts`, which isn't in `files` and has no `sourcesContent`. They show up because the preset forces `ssr.noExternal: [/@mionjs\//]`, so Vite processes those files. Built by `mion compile` (package.json `build` script). **main:** same `files` list. **Fix:** inline sources, or don't ship the maps.

### 13. `import type` is now fine for mion types; the starters' CLAUDE.md rule is obsolete — mion-docs / starter docs

The old rule "NEVER use `import type` for types that need mion runtime reflection" no longer applies, because the Go resolver reads the TS program. I verified it: switching to `import type {UUIDv7}` and `import type {Order, OrderEvent}` still validates UUIDv7 on the server (422 with `format: {name: "uuid", …, val: "7"}`), and all tests pass. The 0.13.2 docs themselves use `import type * as TF from '@mionjs/run-types/formats'`. Update `mion-starters/CLAUDE.md` (and the starter eslint config, which no longer needs to switch off `consistent-type-imports`).

Also, CLAUDE.md says each starter has an `api/package.json` sub-package. The Vue starter has none and doesn't need one.

### 14. Standalone `query`/`mutation` imports are gone; helpers come from the router instance — starter

`ordersRoutes` lives in another file. Creating the router in `api.ts` and importing it from `orders-handlers.ts` would make a cycle (`api.ts` imports `orders-handlers.ts`). **Fix:** `api/src/router.ts` exports `mion`. The batch transport injects the batch-table import into that module (`routerInitFiles: [.../api/src/router.ts]`), which works.

### 15. `@mionjs/type-formats` removed — starter

`FormatUUIDv7` from `@mionjs/type-formats/StringFormats` becomes `UUIDv7` from `@mionjs/run-types/formats` (also `TF.UUIDv7`).

### 16. provide/inject client composable can't be used for batches — starter (consequence of issue 4)

The first `vite dev` with the old `useMionClient()` gave:
```
error rpc-batch-element-unreadable (2) … app/pages/MionOrdersPage.vue.ts:38:90
Internal server error: @mionjs/devtools: build stopped on 2 mion errors.
```
The composable and the `app.provide` call were removed; code now imports `mionClient`.

During this same first, broken boot, Vite once also logged `Pre-transform error: Failed to resolve import "../.mion/api/lane.js" from "app/mion-client.ts"`. It recovered on the next request, and I couldn't reproduce it in later clean starts (including one with a deliberately unreadable batch). It's noted in section 4.

### 17. Seed data calls `randomUUID_V7()` at module scope — starter (already there before, but now fatal on Workers)

```
Uncaught Error: Disallowed operation called within global scope. … generating random values are not allowed within global scope.
  at cloudflare-worker.js:938:23 in randomUUID_V7
```
**Fix:** fixed UUIDv7 literals for the 3 seed orders. That also makes ids stable across dev reloads and useful in tests. Runtime-created orders still use `randomUUID_V7()` inside the handler, which is allowed.

### 18. `functions/`, `deploy/`, `create.mjs`, gitignore — starter

- `functions/api/mion/[[path]].ts` was **already broken before the migration**. It imports `../../../api/dist/cloudflare-worker.js`, but the old build wrote `dist/api/`. It also does `export const onRequest = handler.fetch`, but a Pages Function's `onRequest` gets an `EventContext` and not `(request, env, ctx)`, so `req.url` would be undefined.
- `deploy/_routes.json` and `deploy/wrangler.toml` (`pages_build_output_dir = "../dist/app"`) point at the old layout.
- **Replacement:** one Workers + static assets config (section 1), verified in workerd with the issue-1 patch. If Pages Functions are preferred, the adapter has to be `export const onRequest = (c) => worker.fetch(c.request, c.env, c)` importing `../../../dist-server/cloudflare-worker.js`. That variant wasn't tested.
- **`create.mjs`:**
  - add `.mion`, `dist-server` and `.wrangler` to `EXCLUDE`. A copied `.mion` holds pure-fn ids keyed to `@mionjs/create-starter-vue`.
  - use `pkg.name = basename(targetDir)` (issue 10)
- **`gitignore`:** add `.mion`, `dist-server`, `.wrangler`, `test-results`, `playwright-report`. Drop `api/dist`.
- **`.npmignore`:** add `dist-server/`, `.mion/`, `.wrangler/`, `playwright-report/`. Otherwise a maintainer's local `.mion` gets **published**, because `.npmignore` takes over from `.gitignore`.
- `.npmignore` and `updatelogs/` are still copied into created projects (already true before; harmless noise).
- **Root test `tests/create-vue.test.ts`:** it passes unchanged once `create.mjs` uses basename. I emulated it: `node create.mjs <abs>/.tmp-vue/e2e-vue` takes 18 s, then vitest 8/8 and Playwright 5/5. Recommended additions: run `npx vitest run`, `npm run build` (catches the two-bundle build and issue 10), and optionally `npm run typecheck` / `npm run lint`.
- The root scripts `scripts/mion-utils.mjs` (`mionlink` overrides) will need tarballs for the new packages: `bin-compiler`, `native-compiler-<platform>`, `run-types`.

### 19. ESLint config breaks immediately — starter

```
TypeError: Key "rules": Key "@mionjs/enforce-type-imports": Could not find "enforce-type-imports" in plugin "@mionjs".
```
The 0.13 plugin exposes only `error`, `runtime-error`, `warning` and `info`, registered as `mion` (not `@mionjs`). The old config also never set a TS parser for `.ts` and `<script lang="ts">`, even though it imported `typescript-eslint`. The new config is in section 1.

Remaining starter lint fixes:
- `ctx` unused in `getTime`: changed to `(): Date`
- `{}` in `env.d.ts`: use `DefineComponent` without type arguments
- `as any` in the test: changed to `as never`

### 20. Playwright browser revision — environment only (sandbox)

`@playwright/test@1.64.1` wants `chromium_headless_shell-1248`, but this sandbox has 1243:
```
Error: browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1248/...
```
**Workaround for the spike:** `launchOptions.executablePath` from `CHROMIUM_PATH`. In normal use, `npx playwright install chromium` (as the root test does) handles it.

### 21. TypeScript 7 can't be used yet — framework, plus mion-gap on the peer range

With `typescript@7.0.2`:
- `vite build`: OK (the mion resolver is Go)
- vue-tsc: `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './lib/tsc' is not defined by "exports"`
- typescript-eslint: `typescript-eslint does not support TS 7.0`

`@mionjs/devtools` declares peer `typescript >=6.0.0`, so it admits 7. But `@mionjs/devtools/vite` imports the TS JS API (`dist/vite/buildEntries.js`: `ts.getParsedCommandLineOfConfigFile`, `ts.sys`), which TS 7's package no longer exports. It's only used by `collectBuildEntries`, so the starter isn't affected. **Starter:** keep `"typescript": "^6"`. **Suggested:** peer `^6`, or lazy-import TS in `buildEntries`.

### 22. References-only tsconfig: clear message, then confusing follow-up — mion-docs/UX (minor)

Using the create-vue shape `{"files": [], "references": [...]}`:
```
program: tsconfig …/tsconfig.json includes no source files (only project references?): mion reads your client and server code as one program, so point it at the tsconfig that includes both
[@mionjs/devtools] resolver process died unexpectedly — respawned it and retrying the interrupted request.
program: tsconfig … (repeated)
[plugin @mionjs/devtools] Error: generate: resolver exited
```
The final thrown error loses the real cause. **Fix in the starter:** a single tsconfig, or `tsConfig: 'tsconfig.app.json'`.

### 23. Dev-time noise — mion UX (minor)

- Every API (re)load prints the whole `mion router initialized { routerOptions: {...} }` object.
- Each type edit prints a dozen `(ssr) page reload .mion/types/*.js` lines.
- The 503 body for a broken API file includes ANSI colour escape codes (`HTTP/1.1 503`, then `\x1b[31m[PARSE_ERROR]…`).

The behaviour itself is correct: a type edit (`hello(name: number)`, adding `note?: string` to `Order`) is live on the next request, and a parse error answers 503 and recovers after the fix.

---

## 4. What could not be verified

- **Real Cloudflare deploy / `wrangler deploy`.** I only used local `wrangler dev` (workerd). The worker only runs after patching the build output (issue 1), so an unpatched edge deploy was never going to work.
- **Vercel Edge runtime.** It has the same code-generation restriction (issue 1), confirmed with Node's `--disallow-code-generation-from-strings` but not on Vercel. **Vercel serverless deploy layout:** the handler works when called directly (200 / 422 / 200 for hello, invalid UUID, valid UUID). But nothing in the starter (before or after) maps it into Vercel's `api/` function directory or a `vercel.json`, so "deploy to Vercel" is not actually wired up for an SPA project.
- **Pages Functions variant** of the Cloudflare deploy (replaced by Workers + assets; not tested).
- **Other package managers and platforms:** pnpm/yarn peer behaviour for `@mionjs/bin-compiler`, and the native binaries on macOS, Windows and arm (only linux-x64 here).
- **`mionlink` / `mionupdate` / `publish-all` / `pre-publish-test`** root scripts against the new package set.
- **Strict CSP in the browser:** the happy path works under `script-src 'self'` with both `emitMode: 'code'` and `'both'`. Error-deserialization paths, which use `@mionjs/core`'s code-only class-serializer entries, weren't exercised under CSP.
- **Browser-side HMR of a changed route type** beyond the logged `hmr update /app/pages/MionOrdersPage.vue`. I didn't assert the bundled client metadata refresh in the browser.
- **ESLint 10:** the starter stays on eslint 9, which prints a deprecation warning.

---

## 5. Open questions for the maintainer

1. **Edge targets.** Should the Vue starter keep `cloudflare-worker` (and the edge story) while issues 1 and 2 are open? Should mion publish core, router and client with `emitMode: 'both'` in a 0.13.x patch? Without that, no npm user can deploy mion to Workers.
2. **Should `server.build` accept several entries** (issue 6), or is one config file per deploy target the intended pattern? The `configEnvironment` plugin works but is unofficial.
3. **`emitMode: 'both'` applies to the client too.** Today it costs almost nothing in client size, but is a global setting the intended way, or should edge be an API-only setting?
4. **Batches in SFCs.** Is "keep batches in `.ts` files" the recommended Vue pattern (it also makes linting work), or should issues 3, 4 and 5 be fixed so batches can live in `<script setup>` with an injected client?
5. **Dev host flag.** `server.entry` points at `server.node.ts`. Should the starter offer a Bun-hosted dev (`bunx --bun vite`, with the fetch adapter bridged), or is `dev:bun` (source + preload) enough?
6. **Deploy targets.** Should Vercel be dropped or given a real `vercel.json` + `api/` function layout? It wasn't deployable before either.
7. **`mion-pure-fns/` in the static `dist/`** (issue 9): intended?
8. **Root test scope.** OK to extend `tests/create-vue.test.ts` with `vitest run` + `npm run build` (+ typecheck/lint)?
9. **Starter CLAUDE.md.** Update the `import type` rule and the "api/ is its own package" claim for 0.13 (issue 13)?
