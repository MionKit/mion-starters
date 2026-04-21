# Nuxt 4 + Mion Starter — Integration Plan

## Context

Mion starters repo already has a working Next.js 16 starter at `nextjs/16/`. The goal is to create a Nuxt 4 (Vue) starter with similar functionality but better DX, leveraging the fact that Nuxt uses Vite natively (unlike Next.js which uses Turbopack and required workarounds).

A fresh Nuxt 4 project has been scaffolded at `nuxt/4/` using `npx nuxi init 4 --template minimal`.

## Architecture Decisions

### Core philosophy: Static SPA + Separate Mion API

- **Nuxt generates static files** (`nuxt generate`) — deployed to CDN/Pages
- **Mion API deploys independently** — Node, Bun, Lambda, Cloudflare, Vercel
- **No Nitro integration** — Nitro overlaps with mion (routing, platform adapters); wrapping mion inside Nitro adds complexity for no benefit
- **No `server/` directory** — Nuxt is purely a frontend build pipeline
- Static files are NEVER served from the mion process — always CDN/Pages

### Two operating modes (config-only difference, no code changes)

1. **Proxy mode** — same domain, CDN rewrites `/api/mion/*` to API origin
2. **Separate domain mode** — API on different URL, CORS headers on mion side, client uses explicit `baseURL`

### Single Vite config for dev (major DX win over Next.js starter)

- Mion Vite plugin runs inside `nuxt.config.ts` via `vite.plugins`
- No `mion-aot-caches-shim.js` hack (needed in Next.js because Turbopack can't run Vite plugins)
- No `noViteClient` — the client IS built by Vite
- Use `initClient` (not `initAOTClient`) — Vite handles AOT caches automatically
- HMR for both frontend and API types in one process
- `api/vite.config.ts` exists only for production API builds

### SSR support during `nuxt generate`

- `ssr: true` in nuxt config — needed so `nuxt generate` pre-renders pages with real data
- Mion client must work in both Node.js and browser environments
- During generate, mion client fetches from a running API instance (e.g. `http://localhost:3001`)
- On browser, client uses same-origin (proxy mode) or configured API URL (separate domain mode)
- Integration with Nuxt's `useAsyncData` composable for SSG data fetching
- `runtimeConfig` controls API URL per environment

### Separate build targets

- `nuxt generate` → static files only (frontend)
- `vite build` in `api/` → API bundle per target platform
- These are completely independent — different deploy targets, different pipelines
- Optional future enhancement: intercept `nuxt generate` to also trigger API build

## Directory Structure

```
nuxt/4/
├── nuxt.config.ts                  # ssr:true, mion vite plugin, dev proxy, runtimeConfig
├── package.json                    # Dev + build scripts
├── tsconfig.json                   # References .nuxt generated configs
├── app/
│   ├── app.vue                     # Root component with NuxtPage
│   ├── pages/
│   │   ├── index.vue               # Home page
│   │   └── mion-orders.vue         # Orders showcase page
│   ├── plugins/
│   │   └── mion.ts                 # Nuxt plugin: initClient + provide routes
│   └── composables/
│       └── useMionOrders.ts        # Orders data fetching with useAsyncData
├── api/                            # Independent mion API sub-package
│   ├── package.json
│   ├── tsconfig.json               # reflection: true, target: ES2023
│   ├── vite.config.ts              # Production API builds only
│   └── src/
│       ├── api.ts                  # Route definitions + initApi()
│       ├── models.ts               # Shared model exports (PublicApi type)
│       ├── dev-server.ts           # Dev server (vite-node, port 3001)
│       ├── server.node.ts          # Node.js standalone
│       ├── server.bun.ts           # Bun standalone
│       ├── lambda.ts               # AWS Lambda handler
│       ├── cloudflare-worker.ts    # Cloudflare Workers handler
│       ├── vercel-serverless.ts    # Vercel serverless function
│       └── features/
│           └── orders/
│               ├── orders-handlers.ts
│               ├── orders-models.ts
│               └── orders-repository.ts
├── deploy/                         # Platform-specific hosting/proxy configs
│   ├── vercel.json                 # Rewrites: /api/mion/* → serverless fn
│   ├── wrangler.toml               # Cloudflare Workers + Pages config
│   └── aws/
│       └── cloudfront.json         # S3 origin + Lambda origin behaviors
├── public/
│   └── favicon.ico
└── e2e/
    └── smoke.test.ts               # Playwright tests
```

## Key Files — Implementation Details

### `nuxt.config.ts`

```ts
import { resolve } from "path";
import { mionVitePlugin } from "@mionjs/devtools/vite-plugin";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  ssr: true, // Required for nuxt generate to pre-render with data
  devtools: { enabled: true },

  // Mion API URL config
  runtimeConfig: {
    mionApiUrl: "http://localhost:3001", // Server-side / generate
    public: {
      mionApiUrl: "", // Empty = same origin (proxy mode)
    },
  },

  // Mion Vite plugin — single config, no workarounds
  vite: {
    plugins: [
      mionVitePlugin({
        runTypes: { tsConfig: resolve(__dirname, "api/tsconfig.json") },
        serverPureFunctions: {
          clientSrcPath: resolve(__dirname, "app"),
          // noViteClient: false (default) — client built by Vite
        },
      }),
    ],
  },

  // Dev proxy: forward /api/mion/* to mion dev server
  devServer: {
    proxy: {
      "/api/mion": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

### `package.json` scripts

```json
{
  "name": "mion-nuxt-starter",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "npm-run-all2 --parallel --race dev:*",
    "dev:nuxt": "nuxt dev",
    "dev:api": "npm run --prefix api dev",
    "generate": "nuxt generate",
    "build:api": "npm run --prefix api build",
    "build:api:node": "npm run --prefix api build:node",
    "build:api:bun": "npm run --prefix api build:bun",
    "build:api:lambda": "npm run --prefix api build:lambda",
    "build:api:cloudflare": "npm run --prefix api build:cloudflare",
    "build:api:vercel": "npm run --prefix api build:vercel",
    "preview": "nuxt preview",
    "test": "playwright test"
  }
}
```

### `app/plugins/mion.ts` — Nuxt plugin

```ts
import { initClient } from "@mionjs/client";
import { MyApi } from "@mion-app/api";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const { routes } = initClient<MyApi>({
    baseURL: import.meta.server
      ? config.mionApiUrl // Server-side: localhost during generate
      : config.public.mionApiUrl || window.location.origin, // Browser: same origin or configured
    basePath: "api/mion",
  });

  return { provide: { mionRoutes: routes } };
});
```

### `app/pages/mion-orders.vue` — Using mion with useAsyncData

```vue
<script setup>
const { $mionRoutes: routes } = useNuxtApp();

// Runs server-side during nuxt generate, hydrates on client
const { data: orders } = await useAsyncData("orders", () =>
  routes.orders.listOrders().fetch(),
);
</script>
```

### `api/src/api.ts` — Same pattern as Next.js starter

- Copied from `nextjs/16/api/src/api.ts`
- Same route definitions, same `initApi()`, same `PublicApi` export
- Same `features/orders/` showcase

### `api/vite.config.ts` — Production builds only

- Same mion plugin config
- Multiple build entry points (node, bun, lambda, cloudflare, vercel)
- Bundles `@mionjs/*`, externalizes Node builtins

### `api/src/` entry points

- **`dev-server.ts`** — `vite-node --watch` for dev (port 3001)
- **`server.node.ts`** — `createNodeServer` from `@mionjs/platform-node`
- **`server.bun.ts`** — `createBunServer` from `@mionjs/platform-bun`
- **`lambda.ts`** — `createLambdaHandler` from `@mionjs/platform-lambda`
- **`cloudflare-worker.ts`** — `createCloudflareHandler` from `@mionjs/platform-cloudflare`
- **`vercel-serverless.ts`** — `createVercelHandler` from `@mionjs/platform-vercel`

## Reference: Files to copy/adapt from Next.js starter

| Source (`nextjs/16/`)          | Target (`nuxt/4/`)             | Notes                                              |
| ------------------------------ | ------------------------------ | -------------------------------------------------- |
| `api/src/api.ts`               | `api/src/api.ts`               | Copy as-is                                         |
| `api/src/models.ts`            | `api/src/models.ts`            | Copy as-is                                         |
| `api/src/features/orders/*`    | `api/src/features/orders/*`    | Copy as-is                                         |
| `api/src/vercel-serverless.ts` | `api/src/vercel-serverless.ts` | Copy as-is                                         |
| `api/src/server.node.ts`       | `api/src/server.node.ts`       | Copy as-is                                         |
| `api/src/server.bun.ts`        | `api/src/server.bun.ts`        | Copy as-is                                         |
| `api/src/dev-server.ts`        | `api/src/dev-server.ts`        | Copy as-is                                         |
| `api/vite.config.ts`           | `api/vite.config.ts`           | Adapt: remove `noViteClient`, adjust paths         |
| `api/package.json`             | `api/package.json`             | Adapt: add per-platform build scripts              |
| `api/tsconfig.json`            | `api/tsconfig.json`            | Copy, adjust path aliases                          |
| `app/mion-orders/page.tsx`     | `app/pages/mion-orders.vue`    | Rewrite: React → Vue + useAsyncData                |
| `next.config.ts`               | `nuxt.config.ts`               | Rewrite: mion plugin in vite config, runtimeConfig |
| `e2e/smoke.test.ts`            | `e2e/smoke.test.ts`            | Adapt URLs and selectors                           |

## New files (no Next.js equivalent)

| File                           | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `app/plugins/mion.ts`          | Nuxt plugin: `initClient` + provide routes globally |
| `api/src/lambda.ts`            | AWS Lambda entry point                              |
| `api/src/cloudflare-worker.ts` | Cloudflare Workers entry point                      |
| `deploy/vercel.json`           | Vercel static + serverless rewrite config           |
| `deploy/wrangler.toml`         | Cloudflare Pages + Worker config                    |
| `deploy/aws/cloudfront.json`   | CloudFront S3 + Lambda behavior config              |

## Implementation Order

1. **API sub-package** — copy `api/` from nextjs starter, adapt configs
2. **Nuxt config** — `nuxt.config.ts` with mion plugin, proxy, runtimeConfig
3. **Mion client plugin** — `app/plugins/mion.ts` with `initClient`
4. **Pages** — `index.vue` (home) + `mion-orders.vue` (showcase with `useAsyncData`)
5. **Dev flow** — verify `npm run dev` works (nuxt + mion in parallel)
6. **Generate flow** — verify `nuxt generate` pre-renders with mion data
7. **API production builds** — per-platform entry points + build scripts
8. **Deploy configs** — `deploy/` directory with platform-specific configs
9. **E2E tests** — Playwright smoke tests
10. **README** — Setup, dev, generate, deploy instructions per platform

## Verification

1. `npm run dev` — Nuxt on 3000, API on 3001, proxy works, HMR works
2. Open browser → orders page loads, mion client fetches data
3. `nuxt generate` — produces static HTML with pre-rendered order data in `.output/public/`
4. Inspect generated HTML — order data baked into the page (not fetched client-side)
5. Serve static files with a simple HTTP server — page loads, client hydrates, subsequent navigation fetches from API
6. `npm run build:api:node` — produces standalone API bundle, start it, verify it responds
7. `npm run test` — Playwright e2e passes

## Platform Deploy Matrix

| Platform       | Static files     | API                  | Proxy/Rewrite                                   |
| -------------- | ---------------- | -------------------- | ----------------------------------------------- |
| **Vercel**     | Vercel Static    | Vercel Serverless Fn | `vercel.json` rewrites                          |
| **Cloudflare** | Cloudflare Pages | Cloudflare Worker    | `_routes.json` or Worker routing                |
| **AWS**        | S3 + CloudFront  | Lambda               | CloudFront behavior: `/api/mion/*` → Lambda     |
| **Node**       | Any CDN          | `server.node.ts`     | Reverse proxy (nginx) or separate domain + CORS |
| **Bun**        | Any CDN          | `server.bun.ts`      | Reverse proxy or separate domain + CORS         |
