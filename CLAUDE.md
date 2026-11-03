# Mion Starters

## Repo Structure
- **Not a monorepo**: each starter is an independent `npm create` package with own `package.json`, `tsconfig.json`, etc.
- Starters are versioned by framework major version: `nuxt/4`, `vue/3`, `standalone/1`
- Each starter is published as a `create-*` package and can be used via `npm create`

```
mion-starters/
├── nuxt/
│   └── 4/                       # @mionjs/create-starter-nuxt
├── vue/
│   └── 3/                       # @mionjs/create-starter-vue
├── standalone/                   # (planned)
├── scripts/                      # mionlink / mionstop / mionupdate, pre-publish test, publish
└── tests/                        # Root-level e2e tests for create scripts
```

## Starter Guidelines
- **SPA first.** mion mainly serves a browser app calling its own server (an SPA), so starters prefer SPA over SSR.
  Example: the Nuxt starter runs with `ssr: false` and loads data on the client.

## Creating a New Project
```bash
npm create @mionjs/starter-nuxt my-app
npm create @mionjs/starter-vue my-app
```

Each starter contains a `create.mjs` bin script that copies the starter files into a new project directory, cleans up the `package.json`, and runs `npm install`.
- The package name is the new folder's name (`basename(targetDir)`), never the raw argument: mion uses it as a path segment in generated files.
- Generated state is never copied: `.mion` (except `.mion/enriched/`), build output (`dist`, `dist-server`, `.nuxt`, `.output`), `.wrangler`, `.data`, `.npmrc`.
- Keep the `EXCLUDE` list the same in every `create.mjs`. A new generated folder goes into `EXCLUDE`, `gitignore`, `.gitignore` and `.npmignore`.

## Mion API Structure (shared across all starters)
`api/` is a source folder, not a package. Client and server code share one `tsconfig.json` at the starter root, so mion sees every route and every client call.

```
api/
└── src/
    ├── router.ts                 # export const mion = createMionRouter({basePath: 'api/mion'})
    ├── api.ts                    # route tree + mion.initRoutes(routes); export type MyApi
    ├── models.ts                 # Shared models
    └── features/                 # Feature-based modules
        └── orders/               # Orders showcase
            ├── orders-handlers.ts
            ├── orders-models.ts
            └── orders-repository.ts
```

All starters implement the same showcase Orders API to demonstrate mion features (routes, client, models, flows). Follow this structure when adding new starters.

## Code Style
- No `I` prefix for interfaces or `T` prefix for type parameters
- Prefer one-liner comments: `/** does this and that */`
- Prefer one-line if statements: `if (condition) doSomething();`
- Don't use `@param` / `@returns` in JSDoc

## Mion Route Pattern
The router lives in its own module, so feature files import `mion` without a cycle through `api.ts`.

```ts
// api/src/router.ts
import {createMionRouter} from '@mionjs/router';
export const mion = createMionRouter({basePath: 'api/mion'});

// api/src/features/orders/orders-handlers.ts
import {Routes} from '@mionjs/router';
import type {UUIDv7} from '@mionjs/run-types/formats';
import {mion} from '../../router.ts';

export const ordersRoutes = {
    // Use query for read-only handlers
    getOrder: mion.query((ctx, id: UUIDv7): Order | undefined => findOrderById(id)),
    // Use mutation for handlers that modify data
    createOrder: mion.mutation((ctx, customer: string, total: number): Order => insertOrder(customer, total)),
} satisfies Routes;

// api/src/api.ts
export const myApi = mion.initRoutes({orders: ordersRoutes} satisfies Routes);
export type MyApi = typeof myApi;
```

## Client Batches
Write `batch()` calls in `.ts` modules that use a module-level `initClient()`, never in `.vue` files or in a client passed through `provide` / `inject`. mion traces the client back to `initClient()` at build time to give each batch an id.

```ts
// app/mion-client.ts
export const {routes} = initClient<MyApi>({baseURL: window.location.origin, basePath: 'api/mion'});

// app/orders-batch.ts
import {routes} from './mion-client';
export async function loadOrdersWithEvents() {
    const ordersReq = routes.orders.listOrders();
    const ids = inputFrom(ordersReq, (orders) => orders!.map((o) => o.id));
    return batch([ordersReq, routes.orders.getOrdersEvents(ids.asArg())]).call();
}
```

## Mion Packages
All `@mionjs/*` packages are published to npm:
- `@mionjs/core`, `@mionjs/router`, `@mionjs/client`, `@mionjs/run-types`, `@mionjs/platform-*`
- `@mionjs/devtools` (dev) plus its required peer `@mionjs/bin-compiler`, which pulls this machine's `@mionjs/native-compiler-<os>-<arch>`

TypeScript stays on `^6`: TypeScript 7 breaks vue-tsc and typescript-eslint.

### Using npm versions (default for CI / release)
```bash
npm run mionupdate              # each @mionjs/* dep to its own latest npm version
npm run mionupdate -- 0.13.2    # this version for every @mionjs/* dep
npm run mionupdate -- vue/3     # only these starter folders
```

### Using a local mion build (for development)
Needs the mion repo cloned and set up as a sibling folder (`../mion`).

```bash
npm run mionlink                # build ../mion, publish it to a local registry, switch every starter to it
npm run mionlink -- --no-build  # reuse mion's last packed tarballs
npm run mionlink -- vue/3       # only these starter folders
npm run mionstop                # stop the local registry
```

`mionlink` runs mion's own scripts (`miondevx core build`, `build-binaries.mjs --host-only`, `pnpm run build`, `pack.mjs`). It starts `verdaccio` (a local npm registry) on `http://127.0.0.1:4873/` with mion's `.github/verdaccio.yaml`, then publishes with `publish-tarballs.mjs --registry`. Each starter then gets a `.npmrc` with `@mionjs:registry=http://127.0.0.1:4873/` and installs with its own npm cache (`.mion-local-cache`), because a local build has the same version as the npm one. Registry state lives in `.mion-registry/`.

The registry keeps running after `mionlink`, so later installs and the root tests still work. `mionupdate` removes the `.npmrc` line and switches back to npm. Never commit a starter in local mode.

## Testing & Validation
- Each starter has e2e tests (`npm test` / Playwright). **All e2e tests must pass** before a starter is considered working.
- If any test fails, **stop and investigate the failure** before making further changes. Do not assume failures are unrelated or pre-existing.
- Starters serve as integration/e2e tests for mion itself. If a failure originates in a mion package (build error, missing export, runtime bug), **fix it in the mion repo first** rather than working around it in the starter. Then test the fix here with `npm run mionlink`.

## Root Tests
Run with `npm test` from root (vitest).
- `tests/create-output.test.ts` (fast, no install): each `create.mjs` names the package after the folder, drops starter-only fields and copies no generated state.
- `tests/mion-utils.test.ts` (fast): the dependency switching helpers.
- `tests/create-e2e.test.ts` (one block per starter): create a project, install, then `npm run build`, `typecheck` and `test:unit` when the starter has them, and Playwright. A starter in local mode installs from the local registry.
