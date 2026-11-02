# Nuxt 4 starter: migration spike from mion 0.8.10 to 0.13.2

- Spike copy (throwaway): `the spike copy (its full diff is patches/nuxt.patch)` (it has its own scratch `git` repo, so `git diff HEAD` shows the whole port against the original starter).
- Helpers, logs and repros: `<spike scratch>/tools-nuxt/` (`logs/`, `repro-hotreload/`, `repro-edge/`, `visit.mjs`, `nav.mjs`, `static-proxy.mjs`).
- Versions tested: `@mionjs/*` 0.13.2 from npm, Nuxt 4.6.3 (Nitro 2.13.5, Vite 8.3.5, Vue 3.5.44), vue-tsc 3.3.14, TypeScript 6.0.3, Node 26.13, npm 11.20, bun 1.4.4, wrangler 4.156.1 (workerd).
- Ports 3100 to 3105 were used instead of 3000/3001, to avoid sibling spikes.

## Bottom line

The port works for Node, Bun and Vercel (Node runtime). It does **not** work for Cloudflare Workers, and nothing a starter can change fixes that. Final state of the spike:

| Check | Result |
|---|---|
| `npm install` (incl. `postinstall: nuxt prepare`) | ✅ |
| `npm run typecheck` (`nuxi typecheck && tsc -p api`) | ✅ |
| `npm run lint` | ✅ 0 errors (3 Vue style warnings that were already there) |
| `nuxt dev` with the API inside the Nuxt dev server | ✅ with workarounds (see issues 1 to 3) |
| SSR (`useAsyncData` on the server) in dev and in `nuxt build` + preview | ✅ |
| `nuxt build` | ✅ |
| `nuxt generate` | ✅ only when an API is running and `MION_API_URL` points at it. Otherwise it exits 0 with the error baked into the HTML (issue 10) |
| API builds for node, bun, vercel, cloudflare | ✅ they all build |
| Running node, bun and vercel bundles, batch included | ✅ |
| Running the cloudflare bundle on workerd | ❌ mion bug (issues 4 and 5) |
| Playwright e2e (6 tests) | ✅ 3 cold runs + 1 warm run in a row |

Short answers to the six questions:

1. **Does `mionVitePlugin` work in Nuxt's `vite.plugins`?** Yes, and `server.entry` middleware mode does receive requests in `nuxt dev`. Nuxt sends every Nitro dev request through the client Vite server's middleware stack (the `server:devHandler` hook in `@nuxt/vite-builder`), and mion's middleware mounts on that server. The transform runs in both Nuxt builds (client and SSR), and both bundles carry the batch id. You do not need a Nuxt module, `addVitePlugin` or `vite:extendConfig`. But:
   - API hot reload is broken unless the Vite root is moved to the project root (issue 1).
   - Hot reload has a race that answers 422 during a reload (issue 2).
   - `server.build` silently breaks Nuxt's production SSR (issue 6).
2. **SSR and the one-tsconfig rule.** SSR works in dev and in production, including the batch, and Dates survive Nuxt's payload. The one-tsconfig rule is met with an extra `tsconfig.mion.json` that extends `.nuxt/tsconfig.app.json` and adds `api/src`. Nuxt's references-only root tsconfig is refused, as the docs say. `nuxt generate` prerenders real data only with a live API.
3. **SFC transform.** It works in dev and build for `batch` / `inputFrom` written inline in a `.vue` page. But:
   - A server-only API build cannot see a batch written in a `.vue` file, so production answers `batch-unknown-id` (issue 7).
   - The mion lint plugin crashes on `.vue` files (issue 8).
   - `routes` must come from a module-level `initClient()`, so Nuxt's `provide` / `useNuxtApp()` pattern breaks batches (issue 9).
   - **Recommendation:** keep batches in `.ts` modules.
4. **Production API.** One `api/vite.config.ts` with `--mode <entry>` builds all four bundles. Node, Bun and Vercel run correctly. Cloudflare cannot boot (issues 4 and 5). `deploy/` needs review (issue 19).
5. **Toolchain.** All green after the changes listed in section 2.
6. **`create.mjs` and the root test.** Small changes only (section 2, step 12).

---

## 1. Final working shape

```
nuxt/4/
├── nuxt.config.ts            # mionVitePlugin in vite.plugins; vite.root = project root (workaround, issue 1)
├── tsconfig.json             # unchanged: Nuxt references (used by nuxi typecheck)
├── tsconfig.mion.json        # NEW: one program for mion = .nuxt/tsconfig.app.json + api/src
├── eslint.config.mjs         # mion.configs.recommended on .ts only, settings.mion.tsconfig
├── playwright.config.ts      # url readiness, PORT, optional PW_CHROMIUM
├── package.json
├── api/
│   ├── tsconfig.json         # REWRITTEN: editor + `tsc -p api` only (no `reflection`)
│   ├── vite.config.ts        # REWRITTEN: one config, `--mode server.node|server.bun|vercel-serverless|cloudflare-worker`
│   └── src/
│       ├── mion.ts           # NEW: `export const mion = createMionRouter({basePath: 'api/mion'})`
│       ├── api.ts            # routes + `export const myApi = mion.initRoutes(routes)`
│       ├── models.ts
│       ├── server.node.ts / server.bun.ts / vercel-serverless.ts / cloudflare-worker.ts
│       └── features/orders/{orders-handlers,orders-models,orders-repository}.ts
│   (deleted: api/mion-plugin.ts, api/src/dev-server.ts)
├── app/
│   ├── lib/
│   │   ├── mion-client.ts    # NEW: module-level initClient (replaces app/plugins/mion.ts)
│   │   └── orders.ts         # NEW: the batch + inputFrom demo (a .ts file, so API builds see it)
│   ├── pages/{index.vue, mion-orders.vue}
│   └── (deleted: app/plugins/mion.ts)
├── deploy/                   # unchanged (see issue 19)
└── e2e/smoke.test.ts         # 6 tests
```

### `nuxt.config.ts`

```ts
import { fileURLToPath } from "node:url";
import { mionVitePlugin } from "@mionjs/devtools/vite";

const apiEntry = fileURLToPath(new URL("./api/src/server.node.ts", import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  ssr: true,
  devtools: { enabled: true },
  modules: ["@nuxt/eslint"],
  css: ["~/assets/css/main.css"],
  runtimeConfig: { public: { mionApiUrl: "" } },
  vite: {
    // mion hot reload only tracks files under the Vite root; Nuxt's default root is srcDir (app/)
    root: fileURLToPath(new URL(".", import.meta.url)),
    plugins: [mionVitePlugin({
      tsConfig: fileURLToPath(new URL("./tsconfig.mion.json", import.meta.url)),
      server: { entry: apiEntry },
    })],
    // pre-bundled up front, so the first page load is not interrupted by a dep-discovery reload
    optimizeDeps: { include: ["@mionjs/client", "@mionjs/core", "@mionjs/run-types", "@vue/devtools-core"] },
  },
});
```

### `tsconfig.mion.json`

```jsonc
{
  // ONE program for mion: the Nuxt app (client + SSR) and the API it calls
  "extends": "./.nuxt/tsconfig.app.json",
  "include": [".nuxt/nuxt.d.ts", "app/**/*", "app/**/*.vue", "shared/**/*.d.ts", "api/src/**/*"]
}
```

### API

```ts
// api/src/mion.ts
import {createMionRouter} from '@mionjs/router';
export const mion = createMionRouter({basePath: 'api/mion'});

// api/src/api.ts
import type {Routes} from '@mionjs/router';
import {mion} from './mion.ts';
import {ordersRoutes} from './features/orders/orders-handlers.ts';
const routes = {
  hello: mion.query((ctx, name: string): string => `Hello ${name}!`),
  getTime: mion.query((): Date => new Date()),
  orders: ordersRoutes,
} satisfies Routes;
export const myApi = mion.initRoutes(routes);
export type MyApi = typeof myApi;

// api/src/features/orders/orders-handlers.ts (excerpt)
import type {UUIDv7} from '@mionjs/run-types/formats';
import {mion} from '../../mion.ts';
export const ordersRoutes = {
  listOrders: mion.query((): Order[] => findAllOrders()),
  getOrder: mion.query((ctx, id: UUIDv7): Order | undefined => findOrderById(id)),
  createOrder: mion.mutation((ctx, customer: string, total: number, id?: UUIDv7): Order => insertOrder(customer, total, id)),
  getOrderEvents: mion.query((ctx, orderId: UUIDv7): OrderEvent[] => findEventsByOrderId(orderId)),
  getOrdersEvents: mion.query((ctx, orderIds: UUIDv7[]): OrderEvent[] => findEventsByOrderIds(orderIds)),
} satisfies Routes;

// api/src/server.node.ts (bun is the same shape with startBunServer)
import './api.ts';
import {startNodeServer} from '@mionjs/platform-node';
await startNodeServer({port: Number(process.env.PORT ?? 3001)});

// api/src/vercel-serverless.ts
import './api.ts';
import {createVercelHandler} from '@mionjs/platform-vercel';
export const {GET, POST, PUT, DELETE, PATCH} = createVercelHandler();

// api/src/cloudflare-worker.ts
import './api.ts';
import {createCloudflareHandler} from '@mionjs/platform-cloudflare';
export default createCloudflareHandler();
```

`orders-repository.ts` now uses fixed UUIDv7 seed ids (`'0195515c-6c00-7000-8000-00000000000N'`) instead of calling `randomUUID_V7()` at module scope (issue 15).

### Client

```ts
// app/lib/mion-client.ts
import {initClient} from '@mionjs/client';
import type {MyApi} from '../../api/src/api.ts';

/** Browser: public runtime config, else same origin (proxy mode).
 *  SSR / prerender: MION_API_URL (server-only, never shipped), else this Nuxt server's own port (dev middleware). */
function apiBaseURL(): string {
  if (import.meta.client) return useRuntimeConfig().public.mionApiUrl || window.location.origin;
  const env = (globalThis as {process?: {env: Record<string, string | undefined>}}).process?.env ?? {};
  return env.MION_API_URL || `http://localhost:${env.PORT || env.NITRO_PORT || 3000}`;
}

/** Module-level on purpose: batch() and inputFrom() compile only when `routes` traces back to initClient() */
export const {client, routes} = initClient<MyApi>({baseURL: apiBaseURL(), basePath: 'api/mion'});
```

```ts
// app/lib/orders.ts (replaces routesFlow + serverMapFrom)
import {batch, inputFrom} from '@mionjs/client';
import type {Order, OrderEvent} from '../../api/src/models.ts';
import {routes} from './mion-client.ts';

export async function loadOrdersWithEvents() {
  const ordersReq = routes.orders.listOrders();
  const orderIds = inputFrom(ordersReq, (orders) => orders!.map((o) => o.id));
  const eventsReq = routes.orders.getOrdersEvents(orderIds.asArg());
  const [[orders, ordersError, response], [events, eventsError]] = await batch([ordersReq, eventsReq]).call();
  const apiErrors: string[] = [];
  if (ordersError) apiErrors.push(`listOrders: ${ordersError.publicMessage} (${ordersError.type})`);
  if (eventsError) apiErrors.push(`getOrdersEvents: ${eventsError.publicMessage} (${eventsError.type})`);
  for (const thrown of response['@thrownErrors'] ?? []) apiErrors.push(`${thrown.type}: ${thrown.publicMessage}`);
  const eventsByOrder: Record<string, OrderEvent[]> = {};
  for (const event of events ?? []) (eventsByOrder[event.orderId] ??= []).push(event);
  return {orders: orders ?? ([] as Order[]), eventsByOrder, apiErrors};
}
```

```ts
// app/pages/mion-orders.vue <script setup>
import type {OrderEvent} from '../../api/src/models';
import {loadOrdersWithEvents} from '../lib/orders';
const {data, status, error: asyncError} = await useAsyncData('orders', loadOrdersWithEvents);
const orders = computed(() => data.value?.orders ?? []);
const eventsByOrder = computed(() => data.value?.eventsByOrder ?? {});
const apiErrors = computed(() => data.value?.apiErrors ?? []);
```

On the wire this is one request, `POST /api/mion/mion-batch?id=b_OmpEKjLsJLKwbL`, with body `{"orders/getOrdersEvents":[null]}`. The client, the SSR bundle and all four API bundles carry the same id.

### `api/vite.config.ts`

```ts
import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {builtinModules} from 'node:module';
import {mionVitePlugin} from '@mionjs/devtools/vite';

const root = resolve(import.meta.dirname, '..');
const entries = ['server.node', 'server.bun', 'vercel-serverless', 'cloudflare-worker'];

export default defineConfig(({mode}) => {
  const entry = entries.includes(mode) ? mode : 'server.node';
  const isEdge = entry === 'cloudflare-worker';
  return {
    root,
    publicDir: false, // with root = project root, public/ would otherwise be copied into api/dist
    plugins: [mionVitePlugin({
      tsConfig: resolve(root, 'tsconfig.mion.json'), // SAME program as Nuxt, so the client's batches are compiled in
      runTypes: isEdge ? {emitMode: 'both'} : undefined,
    })],
    ssr: isEdge ? {noExternal: true, target: 'webworker'} : {noExternal: [/@mionjs\//]},
    build: {
      ssr: resolve(root, `api/src/${entry}.ts`),
      outDir: resolve(root, 'api/dist'), emptyOutDir: false, sourcemap: true, minify: false, target: 'es2023',
      rollupOptions: {
        external: isEdge ? [] : [...builtinModules, ...builtinModules.map((m) => `node:${m}`), 'bun'],
        output: {format: 'es', entryFileNames: '[name].js', ...(isEdge ? {codeSplitting: false} : {})},
      },
    },
  };
});
```

Bundle sizes (unminified): node 197.7 kB (50.3 kB gzip), bun 197.2 kB, vercel 193.1 kB, cloudflare 211.3 kB (51.1 kB gzip, `emitMode: 'both'`). Each run also writes an `api/dist/mion-pure-fns/` artifact (issue 22).

### `eslint.config.mjs`

```js
// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import mion from "@mionjs/devtools/eslint";

export default withNuxt(
  { ignores: ["api/dist/**", ".mion/**"] },
  {
    // .ts only: the mion lint worker cannot read .vue files (issue 8)
    files: ["api/**/*.ts", "app/**/*.ts"],
    ...mion.configs.recommended,
    settings: { mion: { tsconfig: "tsconfig.mion.json" } },
  },
);
```

### `playwright.config.ts` (key parts)

```ts
const port = Number(process.env.PORT ?? 3000);
use: { baseURL: `http://localhost:${port}`, launchOptions: process.env.PW_CHROMIUM ? {executablePath: process.env.PW_CHROMIUM} : undefined },
webServer: { command: `npx nuxt dev --port ${port}`, env: {PORT: String(port)}, url: `http://localhost:${port}/`, timeout: 120_000, reuseExistingServer: !process.env.CI },
```

E2E tests:
1. The homepage loads.
2. `hello` answers through the dev middleware.
3. `getTime` returns a valid date.
4. A UUIDv4 id is refused with 422 `validation-error` (proves UUIDv7 validation).
5. The SSR HTML of `/mion-orders` contains the orders and no API error.
6. Client-side navigation from `/` produces exactly one `mion-batch` request and shows the discriminated-union events, their Dates, and no console errors.

### `package.json`

```jsonc
"scripts": {
  "dev": "nuxt dev", "build": "nuxt build", "generate": "nuxt generate", "preview": "nuxt preview",
  "build:api": "vite build --config api/vite.config.ts --mode server.node",
  "build:api:node": "vite build --config api/vite.config.ts --mode server.node",
  "build:api:bun": "vite build --config api/vite.config.ts --mode server.bun",
  "build:api:vercel": "vite build --config api/vite.config.ts --mode vercel-serverless",
  "build:api:cloudflare": "vite build --config api/vite.config.ts --mode cloudflare-worker",
  "typecheck": "nuxi typecheck && tsc -p api",
  "test": "playwright test", "test:install": "playwright install chromium",
  "lint": "eslint", "postinstall": "nuxt prepare"
},
"dependencies": {
  "@mionjs/client": "0.13.2", "@mionjs/core": "0.13.2", "@mionjs/router": "0.13.2", "@mionjs/run-types": "0.13.2",
  "@mionjs/platform-node": "0.13.2", "@mionjs/platform-bun": "0.13.2",
  "@mionjs/platform-vercel": "0.13.2", "@mionjs/platform-cloudflare": "0.13.2",
  "@nuxt/eslint": "^1.15.2", "nuxt": "^4.4.2", "vue": "^3.5.32", "vue-router": "^5.0.4"
},
"devDependencies": {
  "@mionjs/bin-compiler": "0.13.2", "@mionjs/devtools": "0.13.2", "@playwright/test": "^1.59.1",
  "@types/node": "^24.19.2", "eslint": "^10", "typescript": "^6", "vite": "^8.3.5", "vue-tsc": "^3.3.14"
}
// "overrides" removed
```

---

## 2. Migration steps, in order

1. **Dependencies**
   - Remove `@mionjs/type-formats` (formats now live in `@mionjs/run-types/formats`).
   - Remove `vite-node`: `dev-server.ts` is gone, and running API source without the transform fails, see issue 18.
   - Remove the whole `overrides` block.
   - Set every `@mionjs/*` to `0.13.2`.
   - Add `@mionjs/run-types` (imported directly for `UUIDv7`).
   - Add `@mionjs/bin-compiler` (a peer of devtools; npm auto-installs it, but an explicit entry pins the native binary version).
   - Add `vite` (the scripts call it; today it is only present as a peer), `vue-tsc` (for `nuxi typecheck`) and `@types/node` (for `nuxt.config.ts` / the node tsconfig and `api/tsconfig.json`).
   - No drizzle packages are needed.
2. **Delete `api/mion-plugin.ts`.** `@mionjs/devtools/vite-plugin` no longer exists. Import `mionVitePlugin` from `@mionjs/devtools/vite`. The old options (`aotCaches`, `serverPureFunctions`, `server.startScript`, `runMode`) no longer exist; the new ones are `tsConfig`, `server: {entry}` and `runTypes`.
3. **Add `tsconfig.mion.json`**, the one program, and pass it as `tsConfig` in both `nuxt.config.ts` and `api/vite.config.ts`. Leave the root `tsconfig.json` alone.
4. **Change `nuxt.config.ts`** as in section 1:
   - `vite.root` set to the project root (workaround for issues 1 and 2).
   - `optimizeDeps.include` adds `@vue/devtools-core`; `@mionjs/type-formats` is removed from it.
5. **Router**
   - `initMionRouter(routes, {basePath})` becomes `createMionRouter({basePath})` (in the new `api/src/mion.ts`) plus `mion.initRoutes(routes)` (sync, at module level, in `api.ts`).
   - The `query` / `mutation` imports become `mion.query` / `mion.mutation`.
   - `PublicApi<typeof routes>` becomes `typeof myApi`.
   - The async `initApi()` disappears; each entry does `import './api.ts'`.
   - `getTime` drops its unused `ctx`, which Nuxt's lint config flagged.
6. **Formats:** `FormatUUIDv7` from `@mionjs/type-formats/StringFormats` becomes `UUIDv7` from `@mionjs/run-types/formats`.
7. **Type-only imports** must use `import type`, because Nuxt's `verbatimModuleSyntax` applies to `api/` files pulled in by the client. This is safe in 0.13.2, which was verified (UUIDv7 validation still refuses a v4 id). The starters' CLAUDE.md rule "NEVER use `import type`" is obsolete (issue 16).
8. **Client**
   - Delete `app/plugins/mion.ts`.
   - Add the module-level `app/lib/mion-client.ts` and import `routes` explicitly. It must not be in an auto-imported folder, see issue 9.
   - `routesFlow([...]).call()` with `serverMapFrom(src, fn, 'name').asArg()` becomes `batch([...]).call()` with `inputFrom(src, fn).asArg()`. The mapper must be pure and inline, and no name string is needed.
   - The result shape changes from `[[results...], [errors...]]` to `[[r, e, response], [r, e]]`, one tuple per route. Thrown errors are in `response['@thrownErrors']`.
   - Move the batch into `app/lib/orders.ts` (issue 7).
9. **Page:** use `useAsyncData`'s returned `data` (SSR-safe) instead of mutating refs inside the handler. Decide between SSR and `server: false` (issue 10). The spike uses SSR.
10. **Entries:**
    - Node and bun use `await start*Server({port: Number(process.env.PORT ?? 3001)})`.
    - Vercel and Cloudflare keep the same handlers.
    - Delete `dev-server.ts`; `nuxt dev` now hosts the API.
    - Replace the module-level `randomUUID_V7()` seed ids with constants (issue 15).
11. **Tooling files**
    - Rewrite `api/vite.config.ts` as in section 1, rewrite `api/tsconfig.json` (drop `reflection`), and rewrite `eslint.config.mjs`.
    - The `@mionjs/enforce-type-imports` rule no longer exists; the plugin now has the rules `mion/error|runtime-error|warning|info`.
    - Update `playwright.config.ts` and `e2e/smoke.test.ts`.
12. **Repo hygiene**
    - `gitignore`: add `.mion`.
    - `.npmignore`: add `.mion/`, `.data/`, `.wrangler/`.
    - `create.mjs` `EXCLUDE`: add `.mion`, `.data` (Nitro dev KV) and `.wrangler`. Without these, a scaffold made from a starter dir that has been run copies 0.5 MB of generated `.mion` state, `.data/kv` and `deploy/.wrangler` (verified).
    - `tests/create-nuxt.test.ts` needs no change: `postinstall: nuxt prepare` now works, and the e2e uses port 3000 by default. It still uses `npx playwright install chromium`, which is fine in CI. One quirk was already there: it passes an absolute path as `projectName`, so `pkg.name` becomes that absolute path.
    - `scripts/mionupdate.mjs` works unchanged (it sets all `@mionjs/*` to one version).
    - `scripts/mionlink.mjs` would now also have to pack `@mionjs/bin-compiler` and a platform `@mionjs/native-compiler-*` tarball (open question 6).

API renames at a glance:

| 0.8.10 | 0.13.2 |
|---|---|
| `initMionRouter(routes, opts)` (async) | `const mion = createMionRouter(opts); const api = mion.initRoutes(routes)` (sync) |
| `query(fn)` / `mutation(fn)` imports | `mion.query(fn)` / `mion.mutation(fn)` |
| `PublicApi<typeof routes>` | `typeof api` |
| `@mionjs/type-formats/StringFormats` `FormatUUIDv7` | `@mionjs/run-types/formats` `UUIDv7` |
| `routesFlow([...]).call()` | `batch([...]).call()` |
| `serverMapFrom(src, fn, 'id').asArg()` | `inputFrom(src, fn).asArg()` |
| `[[results], [errors]]` | `[[result, error, response], ...]` |
| `@mionjs/devtools/vite-plugin` `mionVitePlugin({runTypes:{tsConfig}, aotCaches, serverPureFunctions, server:{startScript, runMode}})` | `@mionjs/devtools/vite` `mionVitePlugin({tsConfig, server:{entry, build?, exclude?, hotReload?}, client?:{routes}, runTypes?:{emitMode,...}})` |
| `@mionjs/enforce-type-imports` lint rule | removed; `mion/error`, `mion/runtime-error`, `mion/warning`, `mion/info` |
| "never `import type`" | `import type` is fine and required under `verbatimModuleSyntax` |

---

## 3. Issues found

Severity order: 1 to 9 are blockers or high, 10 to 17 are medium, 18 to 24 are low or informational.

### 1. API hot reload silently does nothing when `server.entry` is outside the Vite root, which is always the case in Nuxt
- **Category:** mion-bug (made visible by Nuxt's layout).
- **Symptom:** after editing `api/src/api.ts` (adding a `ping` route) in `nuxt dev`, the edit is never picked up:
  ```
  {"@thrownErrors":{"mion@notFound":{"publicMessage":"Route not found","mion@isΣrrθr":true,"type":"route-not-found","statusCode":404}}}
  ```
- **Root cause:** Nuxt sets `vite.root = srcDir` (`app/`; `@nuxt/schema` `root: get("srcDir")`). `isOwnFile()` only accepts files under `server.config.root`.
  - The `change` watcher drops every API file: `packages/devtools/src/vite/middlewareMode.ts:183-185` and `:280-285`.
  - `invalidateOwnModules()` stops at the entry: `:289-303`.
- **Workaround (verified):** in `nuxt.config.ts`, set `vite: { root: <project root> }`.
  - API hot reload and batch add/remove then work.
  - Nuxt still works: pages, CSS, `public/`, HMR, build and generate.
  - Side effect: dev SSR emits one duplicate CSS `<link>` with an absolute `/_nuxt/tmp/.../app/assets/css/main.css` path. It answers 200, so it is cosmetic.
- **Main:** identical (`diff` of `middlewareMode.ts`, `mionVitePlugin.ts` and `sfcTransform.ts` with `mion main` shows no change).
- **Repro:** `repros/nuxt-hotreload/`, plain Vite with `root: 'web'` and the entry at `../api/server.ts`.
  - `ROOT=web ./run.sh` prints `ping after edit: {...route-not-found...}`.
  - `ROOT=. ./run.sh` prints `ping after edit: {"ping":"pong"}`.
- **Fix idea:** decide ownership by "not in node_modules" or by the tsconfig program / workspace root, not by `config.root`. Also always invalidate the entry module itself.

### 2. The router is reset but not re-initialised: 422 "Not-found chain is not registered. This should never happen."
- **Category:** mion-bug.
- **Symptom A, permanent:** entry outside the root and a batch appears (the first `batch()` in the program, or batches removed and re-added). From then on every API request answers:
  ```
  HTTP/1.1 422  x-rpc-error: not-found
  {"@thrownErrors":{"mion@platformError":{"mion@isΣrrθr":true,"type":"not-found","publicMessage":"Not-found chain is not registered. This should never happen.","statusCode":422}}}
  ```
  It never recovers until restart. When the batch file disappears first, the log also shows:
  ```
  ERROR  [mion] middleware error: Failed to load url /@fs/.../spike-nuxt/.mion/rpc/batches.generated.js (resolved id: ...) in .../api/src/mion.ts. Does the file exist?
  ```
- **Symptom B, transient race (also with the root workaround):** during any API reload, concurrent requests get the same 422.
  - Measured: 116 of 200 parallel requests in Nuxt, and 15 of 240 in plain Vite.
  - It also hit one cold-start e2e run: three API tests in a row failed with this body.
- **Root cause:**
  - `reload()` calls `router.resetRouter()` and only then `load()` (`middlewareMode.ts:108-118`).
  - (A) `load()` gets the cached entry module, because issue 1 stopped it from being invalidated, so `initRoutes` never runs again.
  - (B) Only the first request after a change awaits the reload. Concurrent requests see `staleSince === undefined` and dispatch straight into the reset router (`:153-157`). There is no shared reload promise.
- **Workaround:** the root workaround fixes A. Nothing in the starter fixes B. It is dev-only, and the e2e is now stable because readiness waits for the first build (issue 13).
- **Main:** identical.
- **Repros:**
  - A: `repros/nuxt-hotreload/run-batch.sh`. `ROOT=web` shows `hello after batch added: {...Not-found chain is not registered...}`; `ROOT=.` shows `Hello y!`.
  - B: `ROOT=. ./run-race.sh` gives `15 {"@thrownErrors":{"mion@platformError"...` and `225 {"hello":"Hello x!"}`.
- **Fix idea:** `reloadPromise ??= reload(...)`, awaited by every request. Or build the new routes and swap them in, instead of reset-then-load.

### 3. `rpc-batch-element-unreadable` with Nuxt's provide pattern (`useNuxtApp().$mionClient`)
- **Category:** mion-gap (by design, but an important constraint for Nuxt).
- **Symptom** (dev reports it as a warning; a production build would fail):
  ```
  WARN  error rpc-batch-element-unreadable (2)
    batch() element is not a route call the build can read (root is not the client routes proxy); write routes.a.b(...) inline or bind it to a const/let in this file.
      pages/mion-orders.vue.ts:35:88
  ```
- **Root cause:** the resolver statically traces the batch root to a `const`/`let` initialised by `initClient()`, through imports and destructuring (`ts-go-runtypes/internal/compiler/requestbatch/routes.go:140-201`). A value that comes from `provide` / `useNuxtApp()`, or from an `initClient` inside the plugin function, cannot be traced. Nuxt auto-imports would not work either: the symbol resolves to a declaration in `.nuxt/imports.d.ts` that has no initializer.
- **Fix:** module-level `export const {client, routes} = initClient(...)` in a folder that is not auto-imported (`app/lib/`), imported explicitly.
- **Consequences:**
  - `initClient` copies its options (`@mionjs/client` `client.js:15-20`), so `baseURL` is fixed when the module loads. There is no per-request SSR origin (no `useRequestURL()`).
  - The SSR origin must come from env.
  - `useRuntimeConfig()` cannot be used on the server at module scope.
- **Docs gap:** the client docs never say that batches need a module-level client.

### 4. Cloudflare Workers cannot boot with the published packages, even with `emitMode: 'both'`
- **Category:** mion-bug (blocker for the cloudflare deploy story).
- **Symptom** (`wrangler dev` on the bundle from `npm run build:api:cloudflare`):
  ```
  ✘ [ERROR] service core:user:mion-nuxt-api: Uncaught Error: RuntimeCodeGenBlockedError: Route/middleware "@thrownErrors" carries build-time type information, but this runtime forbids compiling functions from strings.
  ✘ [ERROR] The Workers runtime failed to start.
  ```
- **Root cause:**
  - `@mionjs/router` ships its internal `mionErrorsRoutes` (`@thrownErrors`, `platformError`, ...) precompiled under `node_modules/@mionjs/router/.dist/esm/.mion/types/*.js`, built with the default `emitMode: 'code'` (string-only entries).
  - In the bundle, the app's own `.mion` entries carry factories (`function g_Xhuv_IugtMk3(utl) {...}`). The router's copy of the same type (`var __rt_Xhuv_IugtMk3 = [... "function Xhuv_IugtMk3(v){...}return Xhuv_IugtMk3"]`) is string-only. An app's `emitMode` cannot reach it.
  - Build config: `packages/rpc-router/vite.config.ts:16-18` (no `emitMode`).
  - mion's own workerd tests avoid this by bundling `@mionjs/*` from the `source` condition. `packages/private-test-server/buildTestBundle.ts:62-80` even says built `.dist` output "cannot run on the edge at all". The published `exports` have no `source` condition.
- **Workaround:** none in the starter. The options are (a) mion ships `.dist` built with `emitMode: 'both'`, or ships sources and a `source` export; or (b) the plugin re-transforms `@mionjs/*` dist on edge targets.
- **Main:** unchanged (`packages/rpc-router/vite.config.ts` has no `emitMode`, and no todo exists).
- **Repro:** `repros/nuxt-edge/`.
  - One route, `createCloudflareHandler()`, and the docs' `cloudflare.vite.config.ts` verbatim, plus `define: {'process.env': '{}'}` (issue 5).
  - Run `npx vite build && wrangler dev`.
  - Result: `Uncaught Error: RuntimeCodeGenBlockedError: Route/middleware "@thrownErrors" ...`.

### 5. The documented Cloudflare Vite config fails earlier: `ReferenceError: process is not defined`
- **Category:** mion-bug + mion-docs.
- **Symptom:** the docs' `packages/private-examples/src/cloudflare/cloudflare.vite.config.ts` (`build.lib` mode) gives:
  ```
  ✘ [ERROR] service core:user:repro-edge: Uncaught ReferenceError: process is not defined
  ```
- **Root cause:** the unguarded `getPublicRoutesData: process.env.GENERATE_ROUTER_SPEC === 'true'` at module scope in `packages/rpc-router/src/constants.ts:15`. Everything else uses the guarded `getENV`, for example `router.ts:320`. Library mode does not replace `process.env`.
  - The starter's config uses `ssr.target: 'webworker'`, which turns this into `{}.GENERATE_ROUTER_SPEC`, so it reaches issue 4 instead.
  - The docs' `wrangler.toml` has no `nodejs_compat` either.
- **Main:** same line (`constants.ts:15`).
- **Fix:** use `getENV('GENERATE_ROUTER_SPEC')`, or document `define` / `nodejs_compat`.

### 6. `server.build` inside Nuxt silently breaks production SSR
- **Category:** mion-gap. The docs present `server.entry` as being "for a fullstack app (Nuxt, SSR, ...)".
- **Symptom:**
  - `nuxt build` exits 0, but Nuxt's SSR output is replaced by the API bundle (`api/dist-nuxt/server.node.mjs` + `styles.mjs`).
  - Nitro only warns:
    ```
    ".../.nuxt/dist/server/server.mjs" is imported by " virtual:nuxt/internal/entry", but could not be resolved – treating it as an external dependency.
    ```
  - The preview then answers 500 on every page:
    ```
    Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../.nuxt/dist/server/server.mjs'
    ```
- **Root cause:** `serverBundlePlugin` uses a `config` hook with `order: 'post'` to override `environments.ssr.build.{outDir,rollupOptions.input}` and to turn on `builder` (`packages/devtools/src/vite/mionVitePlugin.ts:195-221`). Nuxt's server build *is* Vite's `ssr` environment, and the plugin instance is shared by both of Nuxt's builds.
- **Workaround:** do not use `server.build` in Nuxt; use a separate `api/vite.config.ts`.
- **Main:** identical.
- **Fix idea:** detect a host that already owns `ssr` (Nuxt, SvelteKit, ...) and throw. Or document it as Vite-SPA-only.

### 7. A server-only API build cannot see batches written in `.vue` files, so production answers `batch-unknown-id`
- **Category:** mion-gap / docs.
- **Symptom:** with the batch inline in `mion-orders.vue`, `api/dist/server.node.js` contains no batch id. Calling it with the client's id gives:
  ```
  HTTP/1.1 404 Not Found   x-rpc-error: batch-unknown-id
  {"@thrownErrors":{"mion@batchNotFound":{"publicMessage":"Batch id not registered on this server. Batches are compiled by the build; rebuild the client and the server together.", ...,"statusCode":404}}}
  ```
  The same build also deleted the dev run's `.mion/rpc/` (a shared genDir).
- **Root cause:** `.vue` scripts reach the resolver only when Vite transforms them (`sfcTransform.ts:108-121`, which registers a virtual `Comp.vue.ts`). tsgo does not parse `.vue` files from the tsconfig, so a build that never imports the page never sees its batch. In `nuxt dev` it works because the client transform registers the page in the same process.
- **Fix (verified):** keep `batch()` / `inputFrom()` in a `.ts` module (`app/lib/orders.ts`). Every build then emits the same id, `b_OmpEKjLsJLKwbL`.
- **Docs:** the Vue SFC section and the batch page should say that batches in SFCs exist only for builds that transform the SFC.

### 8. The mion ESLint plugin fails on `.vue` files
- **Category:** mion-gap.
- **Symptom** (any `.vue` with mion code, or that merely matches the prefilter):
  ```
  1:1  error  [mion] resolver failed: scanFiles [app/components/LintRepro.vue]: source file not in program: .../app/components/LintRepro.vue  mion/error
  ```
- **Root cause:** `packages/devtools/src/lint/lint-worker.ts:85-106` calls `setSources({[rel]: text})` + `scanFiles([rel])` with the raw `.vue` path. Unlike the build's SFC pass, there is no virtual `.vue.ts` registration and no script extraction. Only `.js` files get the "not in program" error swallowed.
- **Workaround:** limit the mion rules to `**/*.ts` (and keep mion code out of SFCs; see issue 7).
- **Main:** same. Main's lint code has no `vue` handling.
- **Repro:** a three-line SFC:
  ```vue
  <script setup lang="ts">
  import {routes} from '../lib/mion-client';
  const greeting = await routes.hello('vue').call();
  </script>
  ```
  with `files: ['**/*.vue'], ...mion.configs.recommended`, then run `npx eslint`.

### 9. `nuxt dev` with the old starter: `postinstall` and every Nuxt command fail on the removed subpath
- **Category:** starter (expected; recorded for the update log).
- **Symptom:**
  ```
  > nuxt prepare
  ERROR  Package subpath './vite-plugin' is not defined by "exports" in .../node_modules/@mionjs/devtools/package.json
      at api/mion-plugin.ts:3:25
  npm error command sh -c nuxt prepare
  ```
- **Fix:** step 2.

### 10. `nuxt generate` bakes API failures into the static site and exits 0
- **Category:** framework (Nuxt) / starter design.
- **Symptom:** with SSR data loading and no reachable API, `nuxt generate` succeeds. `.output/public/mion-orders/index.html` and its `_payload.json` contain `API Error: TypeError: Error executing request: fetch failed`, which hydration then keeps.
  - With `MION_API_URL=http://localhost:3101` and the built API running, the page prerenders real data. Client-side navigation then reuses the prerendered `_payload.json` and never calls the API, so the data is frozen at generate time.
  - Earlier, using `NUXT_PUBLIC_MION_API_URL` for prerender also wrote `localhost:3101` into the shipped public runtime config. That is why the spike uses a server-only `MION_API_URL`.
- **Options:**
  - (a) Keep SSR, and make `loadOrdersWithEvents` throw on error so prerender fails loudly.
  - (b) Go back to `{server: false}` for live data, which is what the old starter did.
  - (c) Generate only with an API running.
  - This is a maintainer decision (open question 1).

### 11. Separate-domain mode needs CORS, which 0.13.2 has no built-in support for
- **Category:** mion-gap.
- **Symptom:** browser to API on another origin:
  ```
  Access to fetch at 'http://localhost:3101/api/mion/mion-batch?id=b_OmpEKjLsJLKwbL' from origin 'http://localhost:3100' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  ```
- **Root cause:** there is no CORS middleware. `MionRequest` has no `method` (`@mionjs/router` `types/context.d.ts:16-22`), so you would need a platform-specific `rawMiddleware`.
- **Main:** adds `mionSecurity({origins, cors, csrf})` in `packages/rpc-router/src/middlewares/security.ts` and `lib/httpMethod.ts`. It is not in 0.13.2.
- **Starter:** document proxy mode (same origin) as the default.

### 12. The router ignores the HTTP method: mutations run via GET and OPTIONS
- **Category:** mion-gap (security / CSRF).
- **Symptom:**
  - `curl "localhost:3101/api/mion/orders/createOrder?data=<base64url {"orders/createOrder":["Eve via GET",10]}>"` gives `200 {"orders/createOrder":{...,"customer":"Eve via GET",...}}`, and the order is created.
  - The same with `-X OPTIONS` and a JSON body also creates an order.
  - A CORS preflight (`OPTIONS /api/mion/mion-batch?id=...`) *executes* the batch: it returns the listOrders data with a 422 for the missing params.
- **Root cause:** `dispatchRoute(path, ...)` in `packages/rpc-router/src/dispatch.ts:25-37` never receives the method. "Mutations always POST" is enforced by the client only.
- **Main:** fixed by `mionSecurity` (`csrf.methodByIntent`, `QUERY_METHODS = GET/HEAD/POST`, `POST_ONLY` for mutations), when the app installs it.

### 13. Cold-start e2e flake: Playwright treats nuxi's loading page as ready
- **Category:** framework (Nuxt/Playwright). The old config had the same latent problem; 0.13's resolver warm-up makes the build longer.
- **Symptom:** `homepage loads` fails intermittently with `waiting for "http://localhost:3100/" navigation to finish...`. The webServer log shows `WebServer available` about 1 s after start, while Nuxt is `Ready` after about 5 s. nuxi answers 503 (the "Starting Nuxt..." page) until then.
- **Fix (verified):** `webServer.url` instead of `webServer.port`. Then 3 cold runs and 1 warm run passed in a row.
- Two more cold-start reloads: Vite dep discovery of `@mionjs/client` and of `@vue/devtools-core` (Nuxt DevTools). Both are fixed by `optimizeDeps.include`.

### 14. The `nuxi typecheck` failures that the old tsconfig layout causes
- **Category:** starter.
- **Symptom** (before the fixes):
  ```
  api/src/api.ts(1,9): error TS1484: 'Routes' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
  ... (9 such errors in api/src/features/orders/*.ts)
  app/lib/mion-client.ts(8,10): error TS2591: Cannot find name 'process'. ...
  nuxt.config.ts(1,31): error TS2591: Cannot find name 'node:url'. ...
  ```
- **Root cause:**
  - `api/` files are type-checked inside Nuxt's app project, through the client's `import type`, and that project uses `verbatimModuleSyntax: true` and `types: []`.
  - `nuxt.config.ts` needs `@types/node`.
  - The old `api/tsconfig.json` (`reflection: true`, NodeNext) fails on `@mionjs/platform-bun`'s types (issue 21) and is not used by any build anymore.
- **Fix:** `import type`, `@types/node`, the `globalThis.process` cast in client code, and the new `api/tsconfig.json` + `tsc -p api` for the entries, which no Nuxt project covers.

### 15. Seed data calls `randomUUID_V7()` at module scope, which workerd forbids
- **Category:** starter (this was already there in 0.8.10).
- **Symptom:**
  ```
  ✘ [ERROR] service core:user:mion-nuxt-api: Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope.
  ```
- **Fix:** fixed UUIDv7 seed ids. Ids are still generated per request in `insertOrder`, which is allowed.

### 16. The starters' CLAUDE.md rule "never `import type`" is obsolete
- **Category:** mion-docs (starters repo).
- In 0.13.2 the Go resolver reads types from the program. The mion examples use `import type * as TF from '@mionjs/run-types/formats'`. Nuxt's `verbatimModuleSyntax` *requires* `import type`. Verified: validation and serialization are unchanged.
- Also: `Routes` must still be imported (only as a type), and handlers still need explicit param and return types (lint rule `rpc-handler-missing-return-type`).

### 17. Generated-state collisions between dev and the API builds
- **Category:** mion-gap (minor).
- Nuxt (`emitMode: 'code'`) and `api/vite.config.ts` (`'both'` for cloudflare) write the same `<root>/.mion` genDir. A batch-less run deletes `.mion/rpc`, which killed the running dev API (issue 2A path).
- **Suggestion:** use a separate `runTypes.genDir` for API builds (for example `.mion-api`), or make the docs state that one genDir means one process.

### 18. Running API source without the transform: `MissingRtFnsError` (why `dev-server.ts` and `vite-node` are gone)
- **Category:** informational.
- ```
  MissingRtFnsError: Route/middleware "hello" has no build-time type information.
  Cause: RunTypes: no type id injected for 'hello#params'. The @mionjs/devtools vite plugin (via @mionjs/devtools mionVitePlugin) must be active at build time.
  ```
- `node api/src/server.node.ts`, `vite-node` and `tsx` all fail this way. Always run a built bundle, or `nuxt dev`.

### 19. `deploy/` needs review (not deployable here)
- **Category:** starter. All of this was already there before the port.
- `deploy/vercel.json` declares `functions: {"api/mion/**": {"runtime": "nodejs20.x"}}`, but no `api/mion/` function files exist.
  - Vercel's zero-config would treat files under the project's `api/` folder (`api/vite.config.ts`, `api/src/*.ts`) as functions.
  - `nodejs20.x` is old.
  - It needs a real `api/mion/[...path].js`, or a build that outputs to `.vercel/output`.
- `deploy/wrangler.toml` is fine for paths (`main = "../api/dist/cloudflare-worker.js"`), but it is blocked by issue 4.
- `deploy/aws/cloudfront.json` targets Lambda, but there is no `platform-aws` entry in the starter.

### 20. In dev, an API entry that fails to load makes the whole site answer 503
- **Category:** mion-gap (dev UX).
- When the entry throws during load, `mountPath` is never set, so `middlewareMode.ts:151` no longer filters by basePath. Every Nuxt URL (`/`, `/_nuxt/*`) then answers `503 mion API failed to initialize: ...`.
- It is helpful as a signal, but it also blanks the frontend.

### 21. `@mionjs/platform-bun` packaging
- **Category:** mion-gap (packaging).
- Its runtime `dependencies` include `@mionjs/devtools` and `@mionjs/bin-compiler`, which pull in the 25 MB native compiler plus `typescript`/`vite` peers in production installs.
  - The cause is its Bun preload loader (`packages/platform-bun/loader/runtypes-loader.ts`).
  - They could be optional peers.
- Its `.d.ts` references `Bun.*` / `'bun'` without declaring `@types/bun` / `bun-types`. Without `skipLibCheck` you get:
  ```
  node_modules/@mionjs/platform-bun/.dist/esm/src/bunHttp.d.ts(2,24): error TS2307: Cannot find module 'bun' or its corresponding type declarations.
  ```
- Main is the same.

### 22. Minor
- Every build writes `<outDir>/mion-pure-fns/` (pure-fn artifact, `packages/devtools/src/core/unplugin.ts:619-640`). Instances:
  - `api/dist/mion-pure-fns/`.
  - `.nuxt/dist/{client,server}/mion-pure-fns/`. Nitro does not publish it.
- Published `@mionjs/run-types` sourcemaps point to missing sources: Vite prints `Sourcemap for ".../@mionjs/run-types/dist/runtime/index.js" points to missing source files` in plain Vite.
- On config errors the resolver prints a misleading `resolver process died unexpectedly — respawned it and retrying the interrupted request.` before the real error. Examples: the references-only tsconfig, or `.nuxt/tsconfig.app.json` missing before `nuxt prepare`:
  ```
  program: tsconfig parse failed: Cannot read file '.../.nuxt/tsconfig.app.json'.
  ```
  This means `build:api` needs `nuxt prepare` (`postinstall`) to have run, so `npm ci --ignore-scripts` would break it.
- The compact wire format surprises raw HTTP consumers: `getOrder` (`Order | undefined`) answers `{"orders/getOrder":[-1,{...}]}`.

### 23. Checked and not reproducible
- Nuxt calls `configureServer` on the client server first and the SSR server second (verified with a debug plugin). mion's middleware correctly mounts on the client server (the `mounted` guard), but `mion-rt-invalidate` keeps the SSR server (`mionVitePlugin.ts:150-155`).
- I expected stale client validators after editing a type in another file. Changing `hello(name: string)` to `number` was picked up by the browser on reload: the client-side `validation-error` was raised with no request sent. So the file-level HMR of `.mion/api/*` covers it. Worth a mion-side test anyway.

### 24. Housekeeping during the spike (not a product issue)
- An over-broad `pkill` pattern killed one resolver process belonging to the sibling `spike-vue` run once. Its plugin respawns resolvers.
- A shared file, `scratchpad/api.ts.bak`, was overwritten by a sibling spike and briefly read back into this spike. That was corrected, and all my files have lived under `tools-nuxt/` since.

---

## 4. Architecture options for hosting the API

| Option | Dev | Prod | Verdict |
|---|---|---|---|
| **A. `mionVitePlugin({server:{entry}})` in `nuxt.config` `vite.plugins`, plus a separate `api/vite.config.ts` for production bundles** | ✅ one process, one port; SSR loopback works; HMR works with the `vite.root` workaround; race in issue 2 | Nuxt static/SSR plus a separate API (node, bun, vercel; cloudflare blocked by issue 4); proxy mode via CDN rewrite | **Recommended** (what the spike does) |
| B. A as-is but with `server.build` | ✅ | ❌ breaks Nuxt SSR (issue 6) | Do not use in Nuxt |
| C. Nitro server route (`server/routes/api/mion/[...].ts`) calling a mion fetch handler, mion transform via `nitro.rollupConfig.plugins` (`@mionjs/devtools/runtypes/rollup`) | Not tested | Would ship the API inside Nitro, with one deploy target | Second resolver process; no batch-table / hot-reload wiring for Nitro; goes against the starter's "no Nitro" principle. Only if the maintainer wants a single deploy |
| D. Separate API process in dev (`vite build --watch` of `api/` + `node`), `devServer.proxy` | Works in principle; two processes, slower loop | Same as A | Loses the main 0.13 Nuxt benefit |
| E. Nuxt module / `addVitePlugin` / `vite:extendConfig` | Not needed: Nuxt already gives `vite.plugins` to both builds and dev servers, which is what the plugin expects | Same as A | No benefit until mion ships a Nuxt module that could set `vite.root`/`tsConfig` and refuse `server.build` |

**Recommendation:** option A.
- Default to proxy mode (same origin, CDN rewrite of `/api/mion/*`). Separate-domain mode needs the CORS work in issue 11, which waits for main's `mionSecurity`.
- Keep the `vite.root` workaround until issues 1 and 2 are fixed in mion.
- Keep all typed mion client code in `.ts` modules under `app/lib/`.
- Drop the cloudflare entry from the starter, or mark it experimental, until issue 4 ships.

## 5. What could not be verified, and why

- **Real deployments** (Vercel, Cloudflare, AWS): no accounts or network egress. The Vercel bundle was exercised by calling its `POST` export with web `Request`s in Node. The Cloudflare bundle was run in local `wrangler dev` / workerd, where it fails (issue 4).
- **Vercel Edge runtime:** not part of the starter; presumably broken by the same cause as issue 4.
- **Option C (Nitro route) and option D:** not prototyped, for time.
- **Windows/macOS paths** and `vite.root` on symlinked dirs: Linux only.
- **`npm run mionlink` with local tarballs:** forbidden by the spike rules.
- **The root `tests/create-nuxt.test.ts` itself:** not run. It calls `npx playwright install chromium`, which the rules forbid. Its pieces (`create.mjs --no-install` copy, `npm install` + `postinstall`, `npx playwright test`) were each run separately.
- **CORS workaround** with a hand-written `rawMiddleware` on 0.13.2: not written. Proxy mode was verified instead (`tools-nuxt/static-proxy.mjs` serving `.output/public` and proxying `/api/mion` to the node API).

## 6. Open questions for the maintainer

1. **SSR or client-only data** for the showcase page? SSR works, but prerendering freezes the orders and needs an API during `nuxt generate` (issue 10). The old starter used `{server: false}`.
2. **Cloudflare entry:** keep it as experimental (it builds but cannot boot) or remove it until router dist ships with `emitMode: 'both'` (issue 4)? Should issues 4 and 5 be fixed in mion before the starter release, as CLAUDE.md says ("fix it in the mion repo first")?
3. **Is the `vite.root` override acceptable** in the starter, or should mion fix `isOwnFile` first (issues 1 and 2) so the Nuxt config stays at Nuxt defaults?
4. **Should mion ship a small Nuxt helper or module?** It could set `tsConfig` (generating the one-program tsconfig from Nuxt's), set root ownership, and refuse `server.build`.
5. **Separate-domain mode:** wait for `mionSecurity` (main) or hand-roll CORS in 0.13.2?
6. **`mionlink`:** should it pack `@mionjs/bin-compiler` and the host's `@mionjs/native-compiler-*`? That needs the Go build.
7. **`deploy/vercel.json`:** rework it as a proper Vercel Build Output, or drop it (issue 19)?
8. **Starters CLAUDE.md:** update the `import type` rule and the "Mion Route Pattern" snippet (`createMionRouter` / `mion.query`) for all starters.
