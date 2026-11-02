# mion 0.13 migration: decision brief

Discussed and decided with the maintainer on 2026-11-02. For each item: what the spike hit, a short example, and the
recommendation.

**Outcome:** every recommendation below was accepted, with one change. 3.7 is client-only data, under a general
guideline: **SPA first.** mion's main target is the SPA, the browser to server bridge, so starters prefer SPA over
SSR. The Nuxt starter runs as an SPA (`ssr: false`).

**Rule used to place each fix** (from the maintainer): a fix goes into mion only when it is generic, meaning it would
help any app, framework or starter using mion, and it never depends on or names a starter. Everything else is fixed
in the starters.

Contents:

1. [Workarounds the spikes used, and where each fix belongs](#1-workarounds-the-spikes-used-and-where-each-fix-belongs)
2. [The other mion findings, re-checked against the rule](#2-the-other-mion-findings-re-checked-against-the-rule)
3. [Starter product questions](#3-starter-product-questions)
4. [What changes in the todos and the launch order](#4-what-changes-in-the-todos-and-the-launch-order)

---

## 1. Workarounds the spikes used, and where each fix belongs

A workaround is code a spike added to a starter only to get around a mion bug. If the bug gets fixed in mion, the
workaround disappears from the starter. If the problem is really the starter's own, the "workaround" is just the
right starter code and stays.

### 1.1 Next.js: resetting the router by hand in dev (`dev-reset.ts`)

**Symptom.** Edit any file during `next dev` and every API call fails until you restart:

```
Error: Invalid route: @thrownErrors. Naming collision, duplicated route
```

**Why.** Next re-runs the route handler module after an edit. mion keeps the route table in a global, but the "router
already created" flag inside the module. The new module copy has a fresh flag, sees the old table, and refuses.

**Workaround in the spike.**

```ts
// api/src/dev-reset.ts, imported in route.ts BEFORE the routes
import {resetRouter} from '@mionjs/router';
if (process.env.NODE_ENV !== 'production') resetRouter();
```

**Where the fix belongs: mion.** Any host that re-runs modules has this bug: Next dev, Vitest watch mode, any
hot-reload setup, any server that bundles the routes twice in one process. Nothing about it is starter specific.

### 1.2 Next.js: forcing webpack detection (`process.argv.push('--webpack')`)

**Symptom.** `next dev --webpack` runs without mion's build step, so every route fails with
`MissingRtFnsError: Route/middleware "hello" has no build-time type information`.

**Why.** `withMion` decides "Turbopack or webpack?" by looking for `--webpack` in the command line. Next 16 starts the
dev server in a child process that does not get that flag, so mion guesses Turbopack.

**Workaround in the spike.**

```ts
// next.config.mts
if (!process.env.TURBOPACK && !process.argv.includes('--webpack')) process.argv.push('--webpack');
```

**Where the fix belongs: mion.** Every Next app using webpack in dev hits it.

### 1.3 Next.js: creating `.mion/` before Next starts (`mkdirSync('.mion')`)

**Symptom.** Only on Next 16.4, and only on the first build of a clean checkout: 69 errors like
`Can't resolve '.mion/types/A0Qb_GPOGolr.js'`. The second build passes.

**Why.** `withMion` returns before mion has created its generated folder. Turbopack 16.4 remembers "this folder does
not exist" and never looks again.

**Workaround in the spike.**

```ts
mkdirSync(new URL('./.mion', import.meta.url), {recursive: true});
```

**Where the fix belongs: mion.** Every Next 16.4 app on a clean checkout, so every CI run, hits it.

### 1.4 Next.js: `next.config.mts` instead of `next.config.ts`

**Symptom.** The config from mion's docs, saved as `next.config.ts`, fails to load:

```
Error: Package subpath './next' is not defined by "exports" in .../@mionjs/devtools/package.json
```

**Why.** Next turns a `.ts` config into CommonJS (`require`), and mion only ships that entry as an ES module.

**Workaround in the spike.** Name the file `next.config.mts`, which Next loads as an ES module.

**Where the fix belongs: mion, as a docs fix at least.** Either mion also ships a CommonJS build of
`@mionjs/devtools/next`, or the docs say `.mts` / `.mjs`. Generic: every Next user copying the docs hits it.
Using `.mts` in the starter is fine either way.

### 1.5 Next.js: mion calls moved out of `"use client"` pages (`orders-client.ts`)

**Symptom.** A `"use client"` page that calls the mion client fails to build:

```
The "use client" directive must be placed before other expressions.
```

**Why.** mion's build step adds `import` lines at the very top of the file, above the `"use client"` line. React's
rules say the directive must come first.

**Workaround in the spike.** Keep the page UI-only and move the calls into a file with no directive:

```ts
// app/mion-orders/orders-client.ts (no "use client")
const {routes} = initClient<MyApi>({baseURL: window.location.origin, basePath: 'api/mion'});
export async function loadOrdersWithEvents() { /* batch + inputFrom */ }

// app/mion-orders/page.tsx
'use client';
import {loadOrdersWithEvents} from './orders-client';
```

**Where the fix belongs: mion.** Any React Server Components framework (Next, Waku, RedwoodJS) and any file with a
directive at the top hits it. Whether the starter keeps the split file afterwards is a separate style question (3.10).

### 1.6 Next.js: `serverExternalPackages` for the `@mionjs/*` packages

**Symptom.** Every Next app prints `[mion] @mionjs/core has been loaded 2 times ... use ssr.noExternal`. The advice
is a Vite option, so it means nothing in Next.

**Workaround in the spike.**

```ts
serverExternalPackages: ['@mionjs/core', '@mionjs/router', '@mionjs/run-types', '@mionjs/client', '@mionjs/platform-vercel'],
```

**Where the fix belongs: both.** mion fixes the message (or `withMion` sets this option itself, or the Next docs
recommend it). Whatever mion recommends, the starter follows.

### 1.7 Nuxt: setting `vite.root` to the project root

**Symptom.** In `nuxt dev`, editing an API file does nothing. After a batch is added, every call answers forever:

```
422 "Not-found chain is not registered. This should never happen."
```

**Why.** mion's dev server only watches files inside Vite's `root`. Nuxt sets `root` to `app/`, and the API lives in
`api/`, outside it.

**Workaround in the spike.**

```ts
// nuxt.config.ts
vite: {root: fileURLToPath(new URL('.', import.meta.url)), plugins: [mionVitePlugin({...})]},
```

It works, but it changes a Nuxt default and causes a harmless duplicate CSS link.

**Where the fix belongs: mion.** Any Vite project whose `root` is a subfolder hits it: Nuxt, monorepos, a
`root: 'web'` setup. mion should decide "is this file mine?" by the TypeScript program, not by Vite's root.

### 1.8 Nuxt and Vue: requests failing during a reload (no workaround)

**Symptom.** While the dev API reloads after an edit, requests that arrive at the same moment get the same 422.
In one test, 116 of 200 requests failed.

**Why.** mion clears the router first, then loads the new one, and only the first request waits for that.

**Where the fix belongs: mion.** It affects every Vite app using the in-process API.

### 1.9 Vue and Nuxt: batches moved from `.vue` files into `.ts` files

Three separate mion problems all pushed batches out of `.vue` files:

- **Fresh `vite dev` returns `404 batch-unknown-id`** for a batch written only in a `.vue` file, until any API file
  is edited. Cause: a timing bug in how mion registers a batch it first sees in a `.vue` file. **mion, generic** (any
  Vue app).
- **The mion lint rules crash on `.vue` files** (`source file not in program`). **mion, generic.**
- **A client from `inject()` or `useNuxtApp()` cannot be used in a batch:**

  ```ts
  const {routes} = useMionClient(); // fails: rpc-batch-element-unreadable
  ```

  mion has to trace `routes` back to the `initClient()` call at build time, so it can give the batch an id. A value
  handed through `provide`/`inject` cannot be traced. Plain destructuring of an imported client
  (`const {routes} = mionClient`) also fails today, which is a fixable bug. **mion, generic.** Note that `inject()`
  can probably never be traced, so the docs should say so.
- A separately built API never sees a batch that lives only in a `.vue` file, so production answers
  `batch-unknown-id`. This is by design, so it is a **mion docs fix**.

**The starter pattern** (module-level client plus batch functions in `.ts` files) is fine starter code, whatever
mion fixes. See 3.4.

### 1.10 Nuxt: `tsconfig.mion.json`

**Why it exists.** mion needs one tsconfig that sees both client and server code. Nuxt's root `tsconfig.json` only
lists references to generated configs, and mion refuses that shape. The spike added:

```jsonc
// tsconfig.mion.json
{"extends": "./.nuxt/tsconfig.app.json", "include": [".nuxt/nuxt.d.ts", "app/**/*", "app/**/*.vue", "api/src/**/*"]}
```

**Where the fix belongs: the starter.** It is Nuxt-specific project layout. A mion "Nuxt helper" that generates it
would tie mion to one framework, which the rule says no to.

### 1.11 Nuxt: never using `server.build`, separate `api/vite.config.ts` instead

**Symptom.** With mion's two-bundle build turned on, `nuxt build` exits fine, then every page answers 500, because
mion's API bundle replaced Nuxt's own server bundle.

**Where the fix belongs: split.**

- **mion (generic):** detect a host that already owns the server build (Nuxt, SvelteKit, any SSR framework) and stop
  with a clear error instead of silently breaking it.
- **Starter:** building the API with its own config is simply the right Nuxt setup.

### 1.12 Vue: a small plugin to build four API entry points

**Why.** mion's two-bundle build takes one API entry (`server.entry`). The Vue starter ships four (node, bun, vercel,
cloudflare), so the spike added:

```ts
const apiEntries: Plugin = {
  name: 'api-entries',
  configEnvironment(name) {
    if (name !== 'ssr') return;
    return {build: {copyPublicDir: false, rollupOptions: {input: {
      'server.node': 'api/src/server.node.ts', 'server.bun': 'api/src/server.bun.ts',
      'vercel-serverless': 'api/src/vercel-serverless.ts', 'cloudflare-worker': 'api/src/cloudflare-worker.ts'}}}};
  },
};
```

**Where the fix belongs: mostly the starter.** A real app deploys to one target, so "four API entries from one
build" is a showcase need, not a generic one. The starter can build one target at a time (the Nuxt spike's
`vite build --mode <target>`), or drop targets (3.2, 3.3). The generic parts stay in mion:

- don't silently overwrite an `input` the user set; warn or merge;
- don't copy `public/` into the API bundle.

### 1.13 Starter-only fixes: no mion change

These were starter bugs or starter choices, and they stay in the starters:

- **Fixed seed ids instead of `randomUUID_V7()` at module scope.** Cloudflare refuses random values at startup.
  Already wrong in 0.8.
- **Package name from the folder name in `create.mjs`.** The root test passes an absolute path, which `create.mjs`
  wrote as the package `name`. mion uses that name as a folder in generated files, so the build broke. An absolute
  path is not a valid npm name anyway, so the starter fixes `create.mjs`. mion can still validate the name (generic,
  low priority), but the starter must not depend on that.
- **Playwright `webServer.url` instead of `port`**, `optimizeDeps.include`, the Nuxt client's base URL from an env
  var during SSR, the new ESLint config, the drizzle `$type<TF.UUIDv7>()` on uuid columns (until mion adds a version
  option), declaring `drizzle-orm` and `@neondatabase/serverless`, which the old Next starter used without declaring.

---

## 2. The other mion findings, re-checked against the rule

| Finding | Generic? | Verdict |
|---|---|---|
| Published packages can't run on Cloudflare / Vercel Edge (built-in routes compiled as code strings; unguarded `process.env`) | Yes: every edge user | mion |
| Routes object hangs when `await`ed (it pretends to be a Promise) | Yes: any client user | mion |
| `@mionjs/platform-bun` pulls the 25 MB compiler into production installs | Yes: every Bun user | mion |
| `@mionjs/run-types` source maps point at missing files (23 warnings per dev start) | Yes | mion |
| Only `.mion/types/` is gitignored, not `.mion/api/` or `.mion/rpc/` | Yes | mion |
| TypeScript peer range allows TS 7, which breaks devtools | Yes | mion |
| Noisy dev logs, colour codes in the 503 body, misleading "resolver died" message | Yes | mion, low priority |
| `vite preview` doesn't serve the API | Yes, but small | mion docs (say how to preview), feature optional |
| `mion-pure-fns/` folder (source paths, mapper ids) written into the public output folder | Yes: leaks into any static deploy | mion |
| Intermittent "source file not in program" in `next dev` (cause unproven) | Yes, in core code | mion, but reproduce first |
| No CORS, no HTTP method checks (a mutation runs via GET) | Yes | already fixed on mion `main` (`mionSecurity`), needs a release |
| Drizzle uuid column has no version option (`UUIDv7` needs `$type`) | Yes | mion, small |
| Drizzle: build a table from a model type (0.8 had `toDrizzlePGTable<Order>()`) | Feature, design question | see 3.14 |
| **Local registry tooling** (old todo "publish the working tree to a local registry") | **No.** Only the starters need it, and mion already has every piece: `scripts/release/pack.mjs`, `publish-tarballs.mjs --registry`, `.github/verdaccio.yaml` | **Move to the starters** (section 4) |

On that last row: the starters' `mionlink` script can build mion, pack it with mion's own scripts, start verdaccio
with mion's config, publish there and install. The only snag found was version clashes in npm's cache (a locally
built 0.13.2 against the real 0.13.2). The starter avoids that with its own npm cache folder in local mode
(`npm install --cache .mion-local-cache`), with no mion change. If that turns out not to be enough, a tiny generic
mion change (let `bump-version.mjs` take a prerelease like `0.13.3-local.1`) can be filed then.

---

## 3. Starter product questions

### 3.1 Port policy: wait for the mion fixes, or port now with workarounds?

- **Wait (recommended):** each starter port starts once the mion fixes it needs are merged, and installs mion from
  the local registry built from `main`. The starters never carry the workarounds from section 1, and they are a
  real test of the fixes.
- **Port now:** faster first result, but every workaround from section 1 lands in the starters and has to be removed
  in a second pass. Some of them (`process.argv.push`, `dev-reset.ts`) would also teach users bad habits if they
  stayed by accident.

### 3.2 Cloudflare Workers in the Vue and Nuxt starters

Today's Vue `functions/` folder was already broken before this migration: it imports `api/dist/cloudflare-worker.js`
while the build writes `dist/api/`, and its `onRequest` has the wrong signature. The spike replaced it with one
`wrangler.toml` that serves the static site and the API from a single Worker:

```toml
main = "../dist-server/cloudflare-worker.js"
[assets]
directory = "../dist"
not_found_handling = "single-page-application"
run_worker_first = ["/api/*"]
```

It ran on local workerd once the mion edge bug was patched by hand.

- **Keep (recommended):** the edge fix is in the first mion wave, so the ports will have it. It is also mion's best
  edge showcase.
- **Drop:** smaller starters, less to test.

### 3.3 Vercel in the Vue and Nuxt starters

Neither starter ever had a working Vercel deploy:

- Nuxt's `deploy/vercel.json` points at an `api/mion/**` function folder that does not exist, on `nodejs20.x`.
- Vue has a `vercel-serverless.ts` entry but nothing that tells Vercel to use it.

Making it real means a Vercel function folder or the Build Output API per starter, and it can only be checked with a
Vercel account.

- **Drop from Vue and Nuxt (recommended):** keep node, bun and Cloudflare there; Vercel is the Next.js starter's
  native target.
- **Rework:** a proper layout in both, tested only by simulating the handler locally.

### 3.4 Where Vue and Nuxt starters write `batch()` calls

```ts
// Option A (recommended): app/lib/orders.ts
import {routes} from './mion-client';          // module-level initClient()
export async function loadOrdersWithEvents() {
  const ordersReq = routes.orders.listOrders();
  const ids = inputFrom(ordersReq, (orders) => orders!.map((o) => o.id));
  return batch([ordersReq, routes.orders.getOrdersEvents(ids.asArg())]).call();
}
// page: const {data} = await useAsyncData('orders', loadOrdersWithEvents);
```

```vue
<!-- Option B: inline in the page -->
<script setup lang="ts">
const ordersReq = routes.orders.listOrders();
const [[orders], [events]] = await batch([ordersReq, /* ... */]).call();
</script>
```

- **A** works in every build, including a separately built API (which never reads `.vue` files), gets linted, and
  keeps API calls out of templates.
- **B** is more natural Vue, but needs the mion SFC fixes and still breaks for separately built APIs (the Nuxt
  production setup).

### 3.5 Framework versions

The spikes ran on Next 16.2.3 (16.4.3 checked once), Nuxt 4.6.3 with Vite 8, and Vue 3.5 with Vite 8. Recommendation:
each port also moves its framework to the latest version with the existing `update-deps` skill, so the migration and
the framework bump are tested together once.

### 3.6 Root tests and `create.mjs`

- **Root tests** (`tests/create-*.test.ts`) today only run Playwright. Recommendation: also run `npm run build` (and
  typecheck / unit tests where a starter has them). This would have caught the package-name bug.
- **`create.mjs`** copies `description`, `homepage`, `author`, `version` and `license` from the starter into the
  user's new project, so a new app says it is "Starter template for building full-stack apps with mion" at version
  0.2.0. Recommendation: remove them.

### 3.7 Nuxt showcase data: server-rendered or client-only?

- **(a) Server-rendered with `useAsyncData`:** the orders page HTML arrives with the data in it, which is the point of
  Nuxt. Catch: `nuxt generate` (the static build) fetches the data at build time, so it needs a running API, and the
  data is frozen until the next build. If the API is down, today it quietly bakes "API Error" into the HTML. The fix is
  to make the page throw so the build fails.
- **(b) Client-only** (`useAsyncData(..., {server: false})`, what the 0.8 starter did): data always live, nothing
  needed at build time, but no server-rendered data.

**Decided: (b) client-only**, and the whole Nuxt starter runs as an SPA (`ssr: false`), under the SPA-first
guideline. The first recommendation was (a), because server rendering is why many pick Nuxt.

### 3.8 Nuxt `deploy/aws`

`deploy/aws/cloudfront.json` routes to a Lambda, but the starter has no AWS entry and no `@mionjs/platform-aws`.
Recommendation: drop it.

### 3.9 Next.js: a Server Component demo?

Next apps often fetch data in Server Components. Calling your own API over HTTP from there works (the spike built
`/mion-server`), but it is an extra network hop inside the same server, which Next discourages. Calling the API
in-process is impossible today (1.1). The usual Next advice is to call the data layer directly:

```tsx
// app/orders/page.tsx (Server Component)
import {findAllOrders} from '@/api/src/features/orders/orders-repository';
export default async function Page() { const orders = await findAllOrders(); /* ... */ }
```

Recommendation: no extra demo page, and a README note showing the snippet above.

### 3.10 Next.js: keep the separate client file after the directive fix?

Once 1.5 is fixed, the page could call the client directly again. Recommendation: keep `orders-client.ts` anyway. The
page stays UI-only, and the same pattern as Vue and Nuxt (3.4) makes the three starters read alike.

### 3.11 Next.js: a standalone API recipe?

The spike checked that the same API can also be built as a plain Node server (`vite build` of `server.node.ts`) and
answers the same batch ids. Options:

- leave standalone deploys to the planned `standalone/` starter and delete `server.node.ts`, `server.bun.ts`,
  `vercel-serverless.ts`, `dev-server.ts` (recommended);
- or keep an optional `vite.api.config.ts` recipe in the Next starter.

### 3.12 Next.js: drizzle models

0.8 built the drizzle table from the API model (`toDrizzlePGTable<Order>()`). 0.13 goes the other way: you write the
table and can infer a type from it. Options:

- **Handwritten models next to the tables (recommended):** `Order` and `OrderEvent` stay as they are. `OrderEvent` is
  a union of five event shapes, which one table row type cannot express, so it would stay handwritten anyway.
- **Inferred:** `type Order = InferSelectModel<typeof orders>`. One source of truth, but the UI then sees mion's branded
  column types.

### 3.13 Next.js: Node version

`next.config.mts` needs Node 22.18 or newer (built-in TypeScript loading). Recommendation: add
`"engines": {"node": ">=22.18"}` so older Node fails with a clear message.

### 3.14 mion: drizzle "table from a model type"

The Next starter does not need it (3.12). The question is whether mion wants the 0.8 feature back for everyone:

- **(a) Build it:** a generic feature, but it needs design work (how a union model maps to a table).
- **(b) Document "write the table, infer the model" and only add the uuid version option (recommended):** small,
  and matches drizzle's own way.

### 3.15 mion: how to fix the edge problem

mion's built-in routes have to ship as real functions, not code strings, for edge runtimes. Options:

- publish the packages in "both" mode, which adds about 15% gzipped to every user's server bundle;
- or have the app's build re-compile the package entries in the app's own mode.

Recommendation: let that session propose one in its plan, and you pick when you approve it.

---

## 4. What changes in the todos and the launch order

### Todo changes (if the recommendations above are taken)

- **Delete** the mion todo "publish the working tree to a local registry"; the starters' tooling todo takes it over
  using mion's existing scripts (section 2).
- **Trim** the mion "Vite server.build gaps" todo: drop "accept several entries", keep "don't silently overwrite the
  input", "don't copy `public/`", "refuse a host that owns the server build", "no `mion-pure-fns/` in the public
  output", and preview docs (1.11, 1.12).
- **Trim** the mion drizzle todo to the uuid version option plus docs, if 3.14 (b).
- **Starter todos:** replace each "Decide first" list with the answers, and drop every workaround from their
  instructions in favour of "needs mion fix X merged" (3.1).

### Launch order

The starter tooling no longer waits on mion, so it moves to the first wave.

| Wave | Starts when | Sessions |
|---|---|---|
| 1 | now | mion: edge-safe packages; directive fix; Vue SFC batches and linting; drizzle uuid. Starters: tooling (local registry, `mionupdate`, `create.mjs`, `CLAUDE.md`) |
| 2 | edge-safe merged | mion: in-process API reload in dev (shares `router.ts` with edge) |
| 3 | reload merged | mion: `withMion` fixes; Vite `server.build` gaps; packaging and small fixes (all touch files the reload fix rewrites) |
| 4 | tooling merged + each starter's mion fixes merged | Vue port; Nuxt port; Next.js port (each against a local-registry build of mion `main`) |
| 5 | all ports green | mion release, `mionupdate`, rerun every e2e, publish the starters (maintainer) |

Each starter port waits for:

- **Vue:** edge, SFC, reload, `server.build`, packaging.
- **Nuxt:** edge, SFC lint, reload, `server.build`.
- **Next.js:** directive, reload, `withMion`, packaging, drizzle uuid.
