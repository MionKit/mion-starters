# Spike: Next.js 16 starter, mion 0.8.10 to 0.13.2

Date: 2026-11-02. Scratch port: `the spike copy (its full diff is patches/nextjs.patch)/` (throwaway, nothing committed).
Environment: Node 26.13.0, npm 11.20.0, Next 16.2.3 (and 16.4.3 for one check), TypeScript 6.0.3, published `@mionjs/*@0.13.2` and `@mionjs/drizzle-orm*@0.45.1`.
Source of truth: the installed `node_modules/@mionjs/*` and the 0.13.2 checkout `mion-0.13.2/` (`prod`, commit `cb9d90ea4`). "main" means `mion main`.

**Bottom line:** the port works. `withMion` plus an in-process `app/api/[...mion]/route.ts` replaces the separate vite-node API server, the rewrites and the AOT shim. The batch demo (`batch` + `inputFrom`, which replaces `routesFlow` + `serverMapFrom`) works in the browser as one HTTP request. All 7 Playwright tests pass on **Turbopack dev, webpack dev, Turbopack build+start and webpack build+start**. The same holds for a project created with `create.mjs` (fresh `npm install`, renamed package). Getting there needed **4 workarounds for mion bugs** (directives, webpack dev detection, router re-init in dev, `next.config.ts` loading). Two more problems have no workaround in the starter: an intermittent dev-server breakage, and a clean-build failure on Next 16.4.

---

## 1. Final working shape

```
nextjs/16/
├── app/
│   ├── api/[...mion]/route.ts        # createVercelHandler(), imports dev-reset + routes module
│   ├── mion-orders/
│   │   ├── page.tsx                  # "use client" UI only, no mion call sites (see issue 1)
│   │   └── orders-client.ts          # initClient + batch + inputFrom (no directive)
│   ├── mion-server/                  # OPTIONAL demo: Server Component + server action via mion client
│   │   ├── page.tsx
│   │   ├── actions.ts                # 'use server', calls the helper (no own mion call site)
│   │   └── server-client.ts          # 'server-only', initClient with the request origin
│   ├── page.tsx, layout.tsx, globals.css
├── api/                              # plain source folder now: no package.json, no tsconfig, no vite config
│   ├── drizzle.config.ts             # schema: ./src/db/drizzle-schema.ts
│   └── src/
│       ├── router.ts                 # export const mion = createMionRouter({basePath: 'api/mion'})
│       ├── api.ts                    # routes + mion.initRoutes(routes) + MyApi
│       ├── dev-reset.ts              # WORKAROUND (issue 5): resetRouter() in dev
│       ├── models.ts
│       ├── features/orders/{orders-handlers,orders-models,orders-repository,orders-repository-pg-neon}.ts
│       └── db/{schema.ts (slim tables), drizzle-schema.ts (toDrizzle), client.ts (neon), seed.ts}
├── e2e/smoke.test.ts                 # 7 tests
├── next.config.mts                   # .mts, NOT .ts (issue 3)
├── tsconfig.json                     # ONE tsconfig, `api` no longer excluded
├── eslint.config.mjs                 # mion.configs.recommended
├── playwright.config.ts              # one webServer (next dev), PORT env
└── package.json, create.mjs, gitignore, .npmignore, postcss.config.mjs, public/
```

Deleted: `mion-aot-caches-shim.js`, `mion-aot-caches.d.ts`, `api/tsconfig.json`, `api/vite.config.ts`, `api/src/dev-server.ts`, `api/src/vercel-serverless.ts`, `api/src/server.node.ts`, `api/src/server.bun.ts` (see section 2, step 9).

### next.config.mts
```ts
import type {NextConfig} from 'next';
import {mkdirSync} from 'node:fs';
import {withMion} from '@mionjs/devtools/next';

// `satisfies` (not `: NextConfig`): withMion takes Record<string, unknown>, which the NextConfig interface is not
const nextConfig = {
    turbopack: {root: import.meta.dirname},
    // one instance of mion's runtime per server process (no "@mionjs/core has been loaded N times" warning)
    serverExternalPackages: ['@mionjs/core', '@mionjs/router', '@mionjs/run-types', '@mionjs/client', '@mionjs/platform-vercel'],
} satisfies NextConfig;

// WORKAROUND (Next 16.4): withMion returns before its scan creates .mion/, so a clean Turbopack build misses it
mkdirSync(new URL('./.mion', import.meta.url), {recursive: true});

// WORKAROUND: `next dev --webpack` loads this file in a forked child with no `--webpack` in argv and no TURBOPACK env
if (!process.env.TURBOPACK && !process.argv.includes('--webpack')) process.argv.push('--webpack');

export default await withMion(nextConfig);
```
Before: `typescript.ignoreBuildErrors`, `transpilePackages`, `turbopack.resolveAlias` to the shim, and dev `rewrites` to :3001. All of that is gone. Next's own build typecheck now passes with `api/` included.

### app/api/[...mion]/route.ts
```ts
import {createVercelHandler} from '@mionjs/platform-vercel';
// must come before the routes module: clears router state a previous dev module instance left behind
import '@/api/src/dev-reset';
// creates the router and registers the routes
import '@/api/src/api';

export const {GET, POST, PUT, DELETE, PATCH} = createVercelHandler();
```

### api/src/router.ts, api.ts, dev-reset.ts
```ts
// router.ts — feature files need the router instance for mion.query/mion.mutation
import {createMionRouter} from '@mionjs/router';
export const mion = createMionRouter({basePath: 'api/mion'});

// api.ts
import {PublicApi, Routes} from '@mionjs/router';
import {mion} from './router.ts';
import {ordersRoutes} from './features/orders/orders-handlers.ts';
const routes = {
    hello: mion.query((ctx, name: string): string => `Hello ${name}!`),
    getTime: mion.query((ctx): Date => new Date()),
    orders: ordersRoutes,
} satisfies Routes;
export const myApi = mion.initRoutes(routes);
export type MyApi = PublicApi<typeof routes>;

// dev-reset.ts (WORKAROUND, issue 5)
import {resetRouter} from '@mionjs/router';
if (process.env.NODE_ENV !== 'production') resetRouter();
```
Orders handlers: `query(...)` becomes `mion.query(...)`, and `FormatUUIDv7` from `@mionjs/type-formats/StringFormats` becomes `TF.UUIDv7` with `import type * as TF from '@mionjs/run-types/formats'`. `import type` works, and a v4 UUID is rejected with `formatPath: ["version"], val: "7"`.

### app/mion-orders/orders-client.ts (batch demo)
```ts
// No "use client" here on purpose (issue 1). Imported from the client page, so it lands in the client bundle.
import {initClient, batch, inputFrom} from '@mionjs/client';
import type {MyApi} from '@mion-app/api';
import type {Order, OrderEvent} from '@/api/src/features/orders/orders-models';

const {routes} = initClient<MyApi>({
    baseURL: typeof window !== 'undefined' ? window.location.origin : '',
    basePath: 'api/mion',
});

export async function loadOrdersWithEvents() {
    const ordersList = routes.orders.listOrders();
    const orderIds = inputFrom(ordersList, (orders) => orders!.map((o) => o.id));
    const ordersEvents = routes.orders.getOrdersEvents(orderIds.asArg());
    const [[orders, ordersError, response], [allEvents, eventsError]] = await batch([ordersList, ordersEvents]).call();
    if (ordersError || eventsError || response['@thrownErrors'])
        throw new Error(ordersError?.publicMessage ?? eventsError?.publicMessage ?? response['@thrownErrors']?.[0]?.publicMessage);
    const eventsByOrder: Record<string, OrderEvent[]> = {};
    for (const event of allEvents ?? []) (eventsByOrder[event.orderId] ??= []).push(event);
    return {orders: (orders ?? []) as Order[], eventsByOrder};
}
```
On the wire this is one request: `POST /api/mion/mion-batch?id=b_G6bhm0zZNvs8yX` with body `{"orders/getOrdersEvents":[null]}`. The build writes `.mion/rpc/batches.generated.js`, and the mapper is copied to `.mion/rpc/pf/<pkg-name>/<hash>.js`. Dates come back as `Date` and the union events render. The pure-function id contains the package name (`@mionjs/create-starter-nextjs#pf_…`, `my-app#pf_…` after `create.mjs`) and regenerates fine.

### app/mion-server/server-client.ts (optional, Server Component / server action)
```ts
import 'server-only';
import {headers} from 'next/headers';
import {initClient} from '@mionjs/client';
import type {MyApi} from '@mion-app/api';

// return the client, never `routes` itself: the routes proxy answers `then`, so awaiting it hangs (issue 7)
async function serverClient() {
    const h = await headers();
    return initClient<MyApi>({baseURL: `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`, basePath: 'api/mion'});
}
export async function helloFromServer(name: string) {
    const {routes} = await serverClient();
    const [greeting, error] = await routes.hello(name).call();
    return error ? `error: ${error.publicMessage}` : greeting;
}
```

### api/src/db/schema.ts + drizzle-schema.ts
```ts
// schema.ts (slim, no drizzle import: passes the drizzle-mixed-types lint)
import * as DZ from '@mionjs/drizzle-orm-pg-core';
import {tableRef, $type} from '@mionjs/drizzle-orm';
import * as TF from '@mionjs/run-types/formats';
export const orders = DZ.pgTable('orders', {
    id: DZ.uuid('id', {primaryKey: true, $type: $type<TF.UUIDv7>()}),
    customer: DZ.text('customer', {notNull: true}),
    total: DZ.doublePrecision('total', {notNull: true}),
    status: DZ.text('status', {enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], notNull: true}),
    createdAt: DZ.timestamp('created_at', {defaultNow: true, notNull: true}),
});
export const orderEvents = DZ.pgTable('order_events', {
    id: DZ.uuid('id', {primaryKey: true, defaultRandom: true}),
    type: DZ.text('type', {enum: ['placed', 'paid', 'shipped', 'delivered', 'cancelled'], notNull: true}),
    orderId: DZ.uuid('order_id', {notNull: true, $type: $type<TF.UUIDv7>(), references: [() => tableRef(orders, 'id')]}),
    at: DZ.timestamp('at', {defaultNow: true, notNull: true}),
    method: DZ.text('method'), carrier: DZ.text('carrier'), tracking: DZ.text('tracking'), reason: DZ.text('reason'),
});

// drizzle-schema.ts (what drizzle-kit and queries use)
import {toDrizzle} from '@mionjs/drizzle-orm-pg-core/drizzle';
import {orders, orderEvents} from './schema.ts';
export const ordersTable = toDrizzle(orders);
export const orderEventsTable = toDrizzle(orderEvents);
```

### eslint.config.mjs (mion part)
```js
import mion from "@mionjs/devtools/eslint";
// ...nextVitals, ...nextTs,
mion.configs.recommended,
// globalIgnores([... ".mion/**"])
```

### Results matrix

| Check | Result |
|---|---|
| `npm install` | OK, no peer warnings. `@mionjs/native-compiler-linux-x64` resolves, and `npx mion --version` reports `mion 0.13.2 (tsgo 5a37e89)`. npm 11 prints `install-scripts … not yet covered by allowScripts` for esbuild and sharp, which is harmless here |
| `tsc --noEmit` | 0 errors, after the drizzle `$type` fix, the seed fix and the `satisfies` fix |
| `npm run lint` | 0 errors, 1 warning (`'ctx' is defined but never used` in api.ts). Mion rules verified to fire (see issue 15) |
| `next dev` (Turbopack) | Works, needs workarounds 1, 3 and 5. Issue 8 is intermittent |
| `next dev --webpack` | Works only with workaround 2 |
| `next build` / `next start` (Turbopack) | OK, 7/7 e2e |
| `next build --webpack` / `next start` | OK, 7/7 e2e. Webpack *build* detection works without the workaround |
| Playwright e2e (7 tests) | 7/7 on all four lanes, and on a `create.mjs`-generated project |
| Type edit during `next dev` | Recompiles. Changing `CustomerName` from `string` to `TF.String<{maxLength: 5}>` in the models file was enforced on the next request (422) without a restart, but only with `dev-reset.ts` (issue 5) |
| Next 16.4.3 | Dev OK. A **clean** Turbopack build fails (issue 9) unless `.mion/` exists first |

---

## 2. Migration steps (in order)

1. **Dependencies** (all pinned, no `overrides`):
   - Remove: `@mionjs/type-formats`, `@mionjs/drizzle`, `@mionjs/platform-node`, `@mionjs/platform-bun`, `vite`, `vite-node`, `npm-run-all2`, and the whole `overrides` block.
   - Keep or bump: `@mionjs/client`, `@mionjs/core`, `@mionjs/router`, `@mionjs/platform-vercel` to `0.13.2`.
   - Add deps: `@mionjs/run-types@0.13.2` (type formats live here now), `@mionjs/drizzle-orm@0.45.1`, `@mionjs/drizzle-orm-pg-core@0.45.1`, `drizzle-orm@^0.45.1` (got 0.45.4), and `@neondatabase/serverless@^1` (got 1.2.0). The old starter imported drizzle-orm and neon but never declared them.
   - Add devDeps: `@mionjs/devtools@0.13.2`, `@mionjs/bin-compiler@0.13.2` (a required peer of devtools; npm 7+ would auto-install it, but pin it explicitly), `drizzle-kit@^0.31` (got 0.31.11). Keep `typescript@^6`, since devtools' peer is `typescript >=6`.
2. **Scripts**: `dev: next dev`, `build: next build`, `start: next start`, plus `dev:webpack` / `build:webpack`, `typecheck: tsc --noEmit`. Drop `dev:api`, `build:api` and the `npm-run-all2` parallel runs.
3. **Config files**: delete `mion-aot-caches-shim.js`, `mion-aot-caches.d.ts`, `api/tsconfig.json`, `api/vite.config.ts`. **Rename `next.config.ts` to `next.config.mts`** (issue 3) and rewrite it with `withMion` (section 1).
4. **tsconfig.json**: remove `"api"` from `exclude`, so there is one program for client and server. Keep `paths` (`@/*`, `@mion-app/api`); the resolver and Turbopack both honour them.
5. **Router and routes**:
   - Before: `initMionRouter(routes, {basePath: 'api/mion'})` inside `async initApi()`, and `query(...)` / `mutation(...)` imported from `@mionjs/router`.
   - After: `const mion = createMionRouter({basePath: 'api/mion'})` in `api/src/router.ts`, `mion.query(...)` / `mion.mutation(...)`, and `export const myApi = mion.initRoutes(routes)`, which is synchronous and has no `initApi()`. The standalone `query` / `mutation` are no longer exported from the package index.
   - `createMionRouter` and `initRoutes` each throw on a second call, which is why issue 5 matters.
6. **Route handler**: `app/api/[...mion]/route.ts` now creates the handler itself (`createVercelHandler()` after importing the routes module) instead of re-exporting from `api/dist/vercel-serverless.js`. Add `api/src/dev-reset.ts`, imported first (issue 5).
7. **Type formats**: `import {FormatUUIDv7} from '@mionjs/type-formats/StringFormats'` becomes `import type * as TF from '@mionjs/run-types/formats'`, and `FormatUUIDv7` becomes `TF.UUIDv7` (models, handlers, repositories).
8. **Client**:
   - `routesFlow([...]).call()` with `serverMapFrom(req, fn, 'name').asArg()` becomes `batch([...]).call()` with `inputFrom(req, fn).asArg()`. There is no hand-written mapper name: the id is compiled.
   - Results changed from `[[a, b]]` to `[[a, errA, resp], [b, errB]]`.
   - **Move every mion call site out of `"use client"` and `"use server"` files** (issue 1).
9. **Entry points**: delete `api/src/dev-server.ts` (Next is the dev server) and `api/src/vercel-serverless.ts` (`route.ts` *is* the Vercel handler).
   - `server.node.ts` / `server.bun.ts` have no role in this starter. Delete them, or keep a separate optional "standalone" recipe. I verified one: `vite build` with `mionVitePlugin()` from `@mionjs/devtools/vite` and `ssr: {noExternal: [/@mionjs\//]}` on `api/src/server.node.ts` (`import './api.ts'; startNodeServer({port})`).
   - That standalone build ran with node and answered `hello` and the **same batch id** `b_G6bhm0zZNvs8yX`, because both builds read one program. Files: `standalone-variant/` in the scratchpad.
   - Caveats for the standalone build: it needs `vite` and `@mionjs/platform-node` added; set `publicDir: false`, or Vite copies `public/` into the API dist; `@mionjs/platform-bun@0.13.2` has `@mionjs/devtools` + `@mionjs/bin-compiler` as **hard dependencies** (heavy for a runtime install).
10. **Drizzle**:
    - `toDrizzlePGTable<Order>(...)` becomes explicit `DZ.pgTable` in `db/schema.ts` and `toDrizzle` in `db/drizzle-schema.ts`.
    - Point `drizzle.config.ts` at `drizzle-schema.ts`.
    - `db/client.ts` imports `./drizzle-schema.ts`.
    - Add `id` to the seed inserts: `orders.id` has no default; the old seed would have failed typecheck too.
11. **ESLint**: rule `@mionjs/enforce-type-imports` no longer exists and fails with `Could not find "enforce-type-imports" in plugin "@mionjs"`. Use `mion.configs.recommended`; its `rpc-client-imports-server-value` diagnostic replaces it.
12. **Playwright**: there is one `webServer` (`next dev`), no port 3001. The test "responds through Next.js rewrite" is renamed. New tests: UUIDv7 validation (422), batch-is-one-request, union fields, Date rendering, and the RSC page.
13. **gitignore / .npmignore / create.mjs**: add `.mion` handling (issues 11 and 17).
14. **Repo docs** (`CLAUDE.md`): the "NEVER use `import type`" rule and the `query`/`mutation` route pattern are obsolete for 0.13.

---

## 3. Issues found

### Issue 1: mion's rewrite prepends imports above `"use client"` / `"use server"`
- **Symptom** (Turbopack dev, on a page with `"use client"` and a mion call site):
  ```
  ./app/mion-orders/page.tsx:1:1
  The "use client" directive must be placed before other expressions. Move it to the top of the file to resolve this issue.
  Generated code of loaders [@mionjs/devtools/runtypes/next/loader] transform of file content of app/mion-orders/page.tsx:
    1 | import {__rt_s$2Fb_0$2DzL5o$2DUcVjggv} from '../../.mion/api/s/b_0-zL5o-UcVjggv.js'; import...
  > 2 | "use client";
  You're importing a module that depends on `useEffect` into a React Server Component module.
  ```
  Webpack shows the same: `x The "use client" directive must be placed before other expressions`. A module-level `'use server'` file with a call site fails the same way: `The "use server" directive must be at the top of the file.`
- **Root cause**: the import block is always spliced in at offset 0, before the directive prologue.
  - Go side: `ts-go-runtypes/internal/compiler/sourcerewrite/transform.go:55-57` (`editBuffer.prepend(importBlock)`).
  - Edits mode, which Turbopack and webpack use: `packages/devtools/src/core/apply-edits.ts:17` (`buffer.prepend(importBlock)`), and the contract is documented at `sourcerewrite/edits.go:17-19`.
- **Category**: mion-bug. It blocks the most natural Next usage: calling the client from a client component.
- **Main**: unchanged (same lines).
- **Workaround**: keep mion call sites in a directive-free module imported by the client component (`orders-client.ts`). Server actions should call a helper.
- **Fix suggestion**: insert after the directive prologue (and after any `#!`).
- **Repro**: `repros/use-client-directive-page.tsx` and `repros/use-server-directive-actions-direct.ts`. Drop either into `app/` and load it.

### Issue 2: `withMion` uses no transform under `next dev --webpack`
- **Symptom**: the log says `▲ Next.js 16.2.3 (webpack)` but `[@mionjs/devtools:next] buildStart done` (the Turbopack broker starts). Then:
  ```
  Error: inputFrom() requires the mion build plugin: no pure-fn id was injected at build time, ...
  ⨯ Error [MissingRtFnsError]: Route/middleware "hello" has no build-time type information.
  Cause: RunTypes: no type id injected for 'hello#params'.
  ```
- **Root cause**: `packages/devtools/src/runtypes/next/index.ts:44-48` `isTurbopack()` defaults to `true` unless argv has `--webpack` or `TURBOPACK==='0'`.
  - Next 16 `next dev` forks `start-server.js` (`next/dist/cli/next-dev.js:253-262`). That child's argv has no `--webpack`, and it gets `TURBOPACK` only in Turbopack mode.
  - So in the child the config sets up Turbopack rules and no webpack plugin.
  - `next build --webpack` works because it runs in-process with argv intact (verified without the workaround).
  - `TURBOPACK=0 next dev --webpack` is not a way out: Next reads any non-empty `TURBOPACK` as a Turbopack flag and exits with "Multiple bundler flags set".
- **Category**: mion-bug.
- **Main**: unchanged.
- **Workaround**: in next.config, `if (!process.env.TURBOPACK && !process.argv.includes('--webpack')) process.argv.push('--webpack');`
- **Fix suggestion**: in Next ≥16, treat "`TURBOPACK` unset" as webpack. Next always sets `TURBOPACK` to `auto` or `1` when it uses Turbopack (`next/dist/lib/bundler.js` `parseBundlerArgs`).
- **Repro**: any app with `withMion`; run `next dev --webpack` and call a route.

### Issue 3: `next.config.ts` (the documented filename) cannot load `@mionjs/devtools/next`
- **Symptom**:
  ```
  ⨯ Failed to load next.config.ts
  Error: Package subpath './next' is not defined by "exports" in .../node_modules/@mionjs/devtools/package.json
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
  ```
  The same happens on Next 16.4.3.
- **Root cause**: by default (without `--experimental-next-config-strip-types`) Next compiles `next.config.ts` to **CommonJS** with SWC and `require`s it (`next/dist/build/next-config-ts/transpile-config.js`, `handleCJS`). `packages/devtools/package.json:35-39` exports `./next` with only a `types` and an `import` condition. The documented `export default await withMion(...)` (top-level await) could not work in CJS anyway.
- **Category**: mion-docs plus mion-gap.
  - The docs page `01.rpc/07.devtools/03.nextjs.md` labels the example `next.config.ts`.
  - mion's own e2e app uses `next.config.mjs` and `withRunTypes`, not `withMion` (`container/pre-publish-e2e/apps/smoke-next/next.config.mjs`), so the documented path is untested.
- **Main**: same exports and same docs.
- **Workaround**: name it **`next.config.mts`**. Next loads it as native ESM when `process.features.typescript` is available (Node ≥22.18 / 23.6). `next.config.mjs` also works, and so does `next.config.ts` with `next dev|build --experimental-next-config-strip-types`. All three verified.
- **Fix suggestion**: change the docs to `.mts` or `.mjs`, add a `withMion` lane to the smoke app, and possibly add a clear error.

### Issue 4: `withMion(nextConfig)` rejects a `NextConfig`-typed object
- **Symptom**:
  ```
  next.config.ts(9,31): error TS2345: Argument of type 'NextConfig' is not assignable to parameter of type 'NextConfigLike'.
    Index signature for type 'string' is missing in type 'NextConfig'.
  ```
- **Root cause**: `packages/devtools/src/next/index.ts:32` `type NextConfigLike = Record<string, unknown>` (used at :45). Interfaces have no implicit index signature. The return type is also widened to `Record<string, unknown>`.
- **Category**: mion-bug (types).
- **Main**: unchanged.
- **Workaround**: `const nextConfig = {...} satisfies NextConfig`.
- **Fix suggestion**: `withMion<C extends object>(nextConfig: C, ...): Promise<C>`.

### Issue 5: after an edit in `next dev`, every API call fails (router re-init)
- **Symptom**: after any edit that makes Next re-evaluate the route handler (edit a type, a handler or a client file):
  ```
  ⨯ Error: Invalid route: @thrownErrors. Naming collision, duplicated route
      at module evaluation (api/src/api/src/api.ts:11:27)
  > 11 | export const myApi = mion.initRoutes(routes);
  ```
  The API returns 500 HTML until the server restarts, and the browser shows `Unsupported response content-type: 'text/html; charset=utf-8'`. With `serverExternalPackages` for `@mionjs/*`, the error becomes `createMionRouter has already been called: create the router once per app (resetRouter() clears it in tests)`.
- **Root cause**: `packages/rpc-router/src/router.ts` keeps its tables on `globalThis` via `getOrCreateGlobal`:
  - `flatRouter`, `routesById`, `routeNames`, …, at `:87-99`.
  - The `isRouterCreated` / `isRouterInitialized` flags are module-scoped `let`s (`:102-103`).
  - A new module instance has fresh flags but sees the old tables, so `initRouter` throws when it re-registers `mionErrorsRoutes` (`:258`).
  - When the router module itself is external (one instance), the flag survives instead, and `createMionRouter` throws (`:221`).
  - The Vite dev host calls `resetRouter()` before reloading the entry (comment at `:161`). Next has no such hook.
- **Category**: mion-bug, or a mion-gap for Next.
- **Main**: same split (globals `:93-105`, flags `:108-109`).
- **Workaround**: `api/src/dev-reset.ts` (`if (NODE_ENV !== 'production') resetRouter()`), imported in `route.ts` **before** the routes module. It must not live in `router.ts`: the injected batch-table import is hoisted above it, and `resetRouter()` would clear the batches.
- **Repro** (no build needed), `repros/router-dual-instance.mjs`:
  ```
  cp -r node_modules/@mionjs/router node_modules/@mionjs/router-copy && node router-dual-instance.mjs
  router -> Invalid route: *. Can Not define empty routes
  router-copy -> Invalid route: @thrownErrors. Naming collision, duplicated route
  ```
- **Fix suggestion**: keep the flags in the same global as the tables, and/or make a re-init in a dev process replace the tables.

### Issue 6: Server Components cannot call the API in-process
- **Symptom**: a Server Component that imports `POST` from `app/api/[...mion]/route` and calls it works in dev (with dev-reset), but production `next start` fails:
  ```
  ⨯ Error: Invalid route: @thrownErrors. Naming collision, duplicated route
      at Object.initRoutes (.next/server/chunks/ssr/app_mion-inproc_page_tsx_0.fh2op._.js:5:41503)
  ```
- **Root cause**: each Next server entry bundles its own copy of the routes module, so `initRoutes` runs twice in one process (issue 5). Mion has no "server caller" API that skips HTTP.
- **Category**: mion-gap/feature.
- **What works**:
  - The mion client in a Server Component or server action, pointed at the request origin (`/mion-server` demo). Dates are revived.
  - Calling the repository functions directly.
  - A `'use server'` module that calls a helper. A module-level `'use server'` file with its own call site hits issue 1.

### Issue 7: awaiting `routes` hangs forever (the proxy is a thenable)
- **Symptom**: `async function f() { return initClient<MyApi>(...).routes }` followed by `await f()` never settles. In a Server Component the page hung for 4.7 min (`GET /mion-server 200 in 4.7min (application-code: 4.7min)`), with no error.
- **Root cause**: `packages/rpc-client/src/client.ts:123` `MethodProxy.handler.get` returns a callable proxy for **any** property, including `then`. `await` and Promise resolution call `routes.then(resolve, reject)`, which only builds a `MionSubRequest` and never calls `resolve`.
- **Category**: mion-bug (footgun).
- **Main**: unchanged.
- **Workaround**: return the client object and destructure `{routes}` after the await.
- **Fix suggestion**: return `undefined` for `then` (and maybe for `catch`, `finally` and symbols) in `get`.
- **Repro**: `repros/thenable-routes.mjs` prints `typeof routes.then = function` and `TIMED OUT: awaiting the routes proxy never settles`.

### Issue 8 (intermittent): `next dev` breaks with "source file not in program" after edits
- **Symptom**: after a series of edits and file creations or deletions, the dev server stays broken until restart:
  ```
  Module not found: Can't resolve '../../.mion/types/pf/@mionjs/create-starter-nextjs/XBZsPeA8mNt9d4.js'
  Error: Error: transform [app/mion-orders/orders-client.ts]: source file not in program: /…/spike-nextjs/app/mion-orders/orders-client.ts
      at ResolverClient.transform (…/@mionjs/devtools/dist/core/resolver-client.js:133:19)
      at async transformViaEdits (…/dist/core/unplugin.js:168:22)
      at async handle (…/dist/runtypes/next/broker.js:247:29)
  ```
  The debug log showed `generated modules now: 50` (normally 65) and stamp entries dropping from 79 to 59. Every page and the API then return 500.
- **How often**: seen in 2 dev sessions. Replaying the edit sequence reproduced it once out of 4 replays (`repros/dev-program-collapse.sh`, logs `dev-repro.log`, `dev-turbo2.log`).
- **Suspected root cause** (not proven):
  - `packages/devtools/src/core/unplugin.ts:477-481`: when the code Turbopack hands the loader differs from what the resolver has (the "source drift" path), it calls `resolver.setSources({[rel]: code})` with **one file**.
  - That breaks the invariant written in the same file at `:736-739`: "setSources gets the WHOLE overlay … pushing one file collapses the Program to that file. The next generate() then DELETES every other entry's module".
  - In Next the loader can run before the broker's 30 ms debounced watcher has absorbed the edit. `handle` awaits whatever `hotUpdate` promise exists at that moment (`broker.ts:339`), and `flushDirty` has not reassigned it yet. So drift is reachable.
  - Drift was observed in `dev-turbo3.log`: `Error: @mionjs/devtools: transform 'edits' source drift on app/mion-server/server-client.ts — re-syncing via setSources.`
- **Category**: mion-bug (suspected).
- **Main**: the same line exists (`unplugin.ts:481`).
- **Workaround**: restart `next dev`.

### Issue 9: clean `next build` fails on Next 16.4.3
- **Symptom** (fresh checkout with no `.mion/`):
  ```
  ✓ Running next.config.mts took 98ms
  Error: Turbopack build failed with 69 errors:
  Error: Module not found: Can't resolve '../../../../.mion/types/A0Qb_GPOGolr.js'
  Path .mion/types/A0Qb_GPOGolr.js could not be resolved because a component does not exist
  ```
  A second build passes. Next 16.2.3 passes the first build.
- **Root cause**:
  - `withMion` resolves before the scan: a `console.error` around the `await` showed it returning in 13 ms.
  - `startBroker` starts `buildStart` in a `ready` promise it does not await (`packages/devtools/src/runtypes/next/broker.ts:155`; by design, AGENTS invariant 2). So `.mion/` is created *after* Next continues.
  - Turbopack 16.4 caches "directory does not exist" for it; 16.2 did not.
  - The docs and the doc comment ("await is required: the whole-program scan must finish before Turbopack hands files over") do not match this behaviour.
- **Category**: mion-bug, triggered by a framework change.
- **Main**: `ready` is still not awaited.
- **Workaround**: `mkdirSync('.mion', {recursive: true})` at the top of `next.config.mts` (verified on 16.4.3: clean build passes, 7/7 e2e).
- **Fix suggestion**: create `genDir` and `types/` synchronously before returning, or await `ready` in `withRunTypes`.

### Issue 10: misleading "@mionjs/core has been loaded N times" warning in every Next app
- **Symptom**: `[mion] @mionjs/core has been loaded 2 times in this process. … mion requires ssr.noExternal: [/@mionjs\//] …`, in dev and in builds.
- **Root cause**: `packages/core/index.ts:13-22`. Next bundles a copy per server entry (page SSR plus the route handler), and the advice refers to a Vite option.
- **Category**: mion-gap / mion-docs.
- **Workaround**: `serverExternalPackages: ['@mionjs/core','@mionjs/router','@mionjs/run-types','@mionjs/client','@mionjs/platform-vercel']`. Verified: the warning is gone and 7/7 e2e pass on all four lanes. dev-reset is still required. `MION_SUPPRESS_DUAL_LOAD_WARN=1` also silences it.

### Issue 11: the generated `.mion/api` and `.mion/rpc` trees are not gitignored
- **Symptom**: only `.mion/types/.gitignore` exists. `.mion/api/` (client manifest, bundled route metadata) and `.mion/rpc/` (batch table, mappers) would be committed. `.mion/README.md` only describes `types/` and `enriched/`.
- **Pointer**: `ts-go-runtypes/internal/compiler/resolver/generate.go:172-185`.
- **Category**: mion-gap.
- **Main**: unchanged.
- **Starter fix**: in `gitignore` add `/.mion/*` and `!/.mion/enriched/`. In `.npmignore` and `create.mjs` EXCLUDE add `.mion`.

### Issue 12: the router logs its full options on every init
- **Symptom**: `mion router initialized { routerOptions: {...} }` prints on every init: dev, each build worker and production.
- **Pointer**: `packages/rpc-router/src/router.ts:259`.
- **Category**: mion-gap (minor noise).

### Issue 13: drizzle `uuid` columns do not accept `TF.UUIDv7`, and there is no table-from-model path
- **Symptom**:
  ```
  Argument of type 'UUIDv7' is not assignable to parameter of type 'SQLWrapper | (string & FormatBrand<"uuid", { version: "any"; }>)'.
    Types of property '[__rtFormatParams]' are incompatible. Type '"7"' is not assignable to type '"any"'.
  Type 'string & FormatBrand<"uuid", { version: "any"; }>' is not assignable to type 'UUIDv7'.
  ```
- **Root cause**: `DZ.uuid` is typed `UUID` (version any), and `PgUuidIn` has no version option (`drizzle-orm-pg-core/.dist/esm/src/types.d.ts`).
- **Workaround**: `$type: $type<TF.UUIDv7>()` on the column (verified: tsc clean, drizzle-kit OK).
- **Also**: the old `toDrizzlePGTable<Order>(name, overrides)` derived a table from a model. That has no equivalent: `tableFromType<T>` takes a `PgTable<…>` type, not a model. Tables and models are now written twice. `OrderEvent` (a discriminated union) cannot be inferred from a single table.
- **Category**: mion-gap/feature plus starter.

### Issue 14: old starter problems that were hidden
- `api/` was excluded from tsc, so the old seed's missing `id` and the undeclared `drizzle-orm` / `@neondatabase/serverless` deps never surfaced.
- `typescript.ignoreBuildErrors` hid everything.
- **Category**: starter.

### Issue 15: ESLint rule rename
- **Symptom**: `TypeError: Key "rules": Key "@mionjs/enforce-type-imports": Could not find "enforce-type-imports" in plugin "@mionjs".`
- **Category**: starter.
- **Fix**: `mion.configs.recommended`. Verified on a probe file:
  ```
  [rpc-client-imports-server-value] `MyApi` is passed to `initClient` but imported as a value from "@/api/src/api" … use `import type`  mion/runtime-error
  [purefn-reads-outer-variable] `multiplier` is captured from outer scope inside a pure-fn factory  mion/runtime-error
  ```
  Lint takes about 7 s.

### Issue 16: `mionupdate` would break the drizzle packages
- `scripts/mion-utils.mjs` `updateDeps` sets **every** `@mionjs/*` dep to one version. `@mionjs/drizzle-orm*` follow drizzle's line (0.45.1), so `npm run mionupdate` would write `0.13.2` for them and `npm install` would fail.
- **Category**: starter (repo scripts). Skip `@mionjs/drizzle-orm*`, or resolve their versions separately.

### Issue 17: `create.mjs` copies generated output
- Simulated with `node create.mjs my-app --no-install`. It copied `.mion/` (stale, with the old package name inside the pure-fn ids), `next-env.d.ts`, `api/drizzle/` (migrations output) and any `dist-api/`.
- After deleting those, a real `npm install`, `next build` and `next start` of `my-app` passed 7/7 e2e. The pure-fn ids regenerated as `my-app#pf_…`.
- **Category**: starter. Details in section 5.

### Issue 18: framework notes (Next / Turbopack / npm)
- Next 16's `next dev` and `next start` rename the server process to `next-server (v16.x)`, which matters for any cleanup scripts.
- npm 11 `allowScripts` warnings for esbuild and sharp are harmless. drizzle-kit worked through the prebuilt `@esbuild/*`.
- One e2e failure on Next 16.4 came from the playwright fallback `webServer` after the failed build. A clean rebuild then gave 7/7. I did not investigate further.

---

## 4. What could not be verified

- **Neon repository at runtime**: there was no database. What was verified:
  - It typechecks.
  - drizzle-kit generates the right SQL (2 tables, FK, `gen_random_uuid()`, `now()`).
  - The `toDrizzle` tables build correct SQL through `drizzle-orm/pg-proxy` (select, `inArray`, insert … returning).
  - The repository is still *viable*, but it is not wired in: handlers import the in-memory repository.
  - Risk (unverified): event rows come back with `method/carrier/tracking/reason: null` and are cast to the `OrderEvent` union. How the clone JSON encoder handles extra `null` keys on a union member was not exercised.
- **`drizzle-kit migrate` / `push`**: they need a live Postgres.
- **Vercel deploy and the Edge runtime**: there was no account. Per the docs, Edge needs `runTypes: {emitMode: 'both'}` on `withMion`; not tested.
- **Standalone Bun entry** (`server.bun.ts`): not run. Only the Node standalone variant was built and run.
- **Issue 8 root cause**: intermittent; reproduced once out of 4 replays (plus once in normal use). The suspected cause is from code reading plus one observed drift warning.
- **Next 16.4.3**: only build, start, dev smoke and e2e were checked, not every lane. The webpack lanes were not rerun on 16.4.
- **Windows and macOS** native binary resolution: only linux-x64.
- **pnpm / yarn**: only npm 11 was used. pnpm's handling of the `bin-compiler` peer was not tested.

## 5. Open questions for the maintainer

1. **Directive handling (issue 1)**: should the starter keep the `orders-client.ts` split even after a fix? It is arguably cleaner. Or should a fix land in mion first, so the page can call the client directly as the 0.8 starter did?
2. **dev-reset (issue 5)**: the `dev-reset.ts` workaround is acceptable in a spike. For the real starter, should this be fixed in the router or in `withMion`/platform-vercel (an automatic dev reset) before publishing?
3. **Config filename**: `next.config.mts` needs Node ≥22.18 / 23.6 for native TS. Should `package.json` gain `"engines": {"node": ">=22.18"}`, or should the starter use `next.config.mjs` (no types)?
4. **`serverExternalPackages`**: should it be the recommended Next setup in the docs (single instance, no warning)? Or should mion keep bundled copies and fix the warning text?
5. **Server-side calls**: should the starter showcase a Server Component calling the API (the `/mion-server` demo over HTTP to its own origin)? Or recommend calling the repository directly and skip it? Is an in-process server caller planned (issue 6)?
6. **Next version**: keep `next@16.2.3`, or update to 16.4.3? 16.4 also needs the `mkdirSync('.mion')` workaround until issue 9 is fixed.
7. **Drizzle models (issue 13)**: keep handwritten `Order` / `OrderEvent` models next to slim tables (current port), or derive `Order` from `InferSelectModel<typeof orders>` and accept the branded `string & FormatBrand<'stringFormat'>` / `Float` types in the UI?
8. **Standalone entry points**: should the Next starter keep an optional `vite.api.config.ts` + `server.node.ts` "deploy the API elsewhere" recipe (verified working), or leave that to the planned `standalone/` starter?
9. **create.mjs and the root test** (`tests/create-nextjs.test.ts`):
   - The root test needs no structural change: still one `npx playwright test`, now with one webServer.
   - Bump the 120 s e2e timeout if CI is slow; the first Turbopack compile plus scan took about 5 s here.
   - `create.mjs` needs EXCLUDE additions: `.mion`, `next-env.d.ts`, `dist-api`, `drizzle` (or `api/drizzle`).
   - Also: should `create.mjs` strip `description`, `homepage`, `author`, `version` and `license` from `package.json`? They are copied as-is today, which was already true before this port.
10. **`CLAUDE.md`**: the "never use `import type`" rule and the `query`/`mutation` route pattern should be updated for 0.13. Should that happen together with the starter port?

## Artifacts
- Ported scratch app: `the spike copy (its full diff is patches/nextjs.patch)/`
- Repros: `repros/` (`use-client-directive-page.tsx`, `use-server-directive-actions-direct.ts`, `router-dual-instance.mjs`, `thenable-routes.mjs`, `dev-program-collapse.sh`)
- Standalone variant: `repros/nextjs-standalone-api/`
- Logs: `<spike scratch>/*.log` (`dev-turbo*.log`, `dev-webpack*.log`, `build-*.log`, `dev-repro.log`, `build164*.log`)
