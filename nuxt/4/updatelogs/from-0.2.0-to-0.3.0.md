# Update Log: v0.2.0 -> v0.3.0

**Date:** 2026-11-04

mion 0.8 to 0.13, and the starter becomes an SPA (`ssr: false`).

## Updated

| Package      | From    | To       |
| ------------ | ------- | -------- |
| @mionjs/\*   | 0.8.x   | 0.13.2   |
| nuxt         | ^4.4.2  | ^4.6.4   |
| vue          | ^3.5.32 | ^3.5.44  |
| vue-router   | ^5.0.4  | ^5.4.0   |
| @nuxt/eslint | ^1.15.2 | ^1.17.0  |
| eslint       | ^10     | ^10.14.0 |
| @playwright/test | ^1.59.1 | ^1.64.1 |

Added: `@mionjs/run-types`, `@mionjs/bin-compiler`, `vite`, `vitest`, `vue-tsc`, `@types/node`.
Removed: `@mionjs/type-formats`, `@mionjs/platform-vercel`, `vite-node`, the `overrides` block.

## Skipped

| Package    | Current | Available | Reason                                     |
| ---------- | ------- | --------- | ------------------------------------------ |
| typescript | ^6      | 7.0.2     | TypeScript 7 breaks vue-tsc and typescript-eslint |

## Changes

- The mion Vite plugin (`@mionjs/devtools/vite`) runs in `nuxt.config.ts`: the API runs inside `nuxt dev`.
  `api/mion-plugin.ts` and `api/src/dev-server.ts` are gone.
- `tsconfig.mion.json`: one program for the app and the API (Nuxt's `tsconfig.json` only holds references).
- Router: `createMionRouter` in `api/src/router.ts`, `mion.query` / `mion.mutation`, sync `mion.initRoutes`.
  `FormatUUIDv7` becomes `UUIDv7` from `@mionjs/run-types/formats`. Seed orders use fixed ids.
- Client: the Nuxt plugin client becomes a module-level `initClient()` in `app/lib/mion-client.ts`.
  `routesFlow` + `serverMapFrom` become `batch` + `inputFrom` in `app/lib/orders-batch.ts`.
- `api/vite.config.ts` builds one target per run: `--mode server.node | server.bun | cloudflare-worker`.
- Dropped: Vercel (`deploy/vercel.json`, `vercel-serverless.ts`) and `deploy/aws`.
- `nuxt build` forwards `/api/mion/**` to `MION_API_URL` (proxy mode).
- Scripts: `build` runs `nuxt build` and the Node API build (was `nuxt generate`); `build:api` takes the place of
  `build:api:node`; `build:api:vercel` is gone. New: `preview:api*`, `typecheck`, `test:unit`, `test:e2e:build`.
- New Vitest API tests (`npm run test:unit`).
