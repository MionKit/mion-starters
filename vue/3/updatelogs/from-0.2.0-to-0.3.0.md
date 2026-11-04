# Update Log: v0.2.0 -> v0.3.0

**Date:** 2026-11-04

## Updated

| Package                  | From          | To        |
| ------------------------ | ------------- | --------- |
| @mionjs/*                | 0.8.10        | 0.13.2    |
| vue                      | ^3.5.31       | ^3.5.44   |
| vue-router               | ^5.0.4        | ^5.4.0    |
| vite                     | ^7.3.1        | ^8.3.5    |
| vitest                   | ^4.1.2        | ^5.1.0    |
| @vitejs/plugin-vue       | ^6            | ^6.0.10   |
| @playwright/test         | ^1.58.2       | ^1.64.1   |

## Added

| Package                       | Version   | Why                                                   |
| ----------------------------- | --------- | ----------------------------------------------------- |
| @mionjs/run-types             | 0.13.2    | `UUIDv7` format                                       |
| @mionjs/bin-compiler          | 0.13.2    | required peer of `@mionjs/devtools`                   |
| vue-tsc, @types/node          | ^3.3.14, ^24.19.2 | `npm run typecheck` over one tsconfig         |
| oxlint                        | ^1.89.0   | lint with the mion rules, `.vue` files included        |
| wrangler                      | ^4.157.0  | run and deploy the Cloudflare Workers build           |

## Removed

| Package                                     | Why                                                   |
| ------------------------------------------- | ----------------------------------------------------- |
| @mionjs/type-formats                        | formats moved to `@mionjs/run-types/formats`          |
| @mionjs/platform-vercel                     | never deployable from this starter; not one of its targets |
| vite-node                                   | the API runs inside the Vite dev server               |
| eslint, eslint-plugin-vue, typescript-eslint | replaced by oxlint                                   |

## Skipped

| Package    | Current | Available | Reason                                          |
| ---------- | ------- | --------- | ----------------------------------------------- |
| typescript | ^6      | 7.x       | TypeScript 7 breaks vue-tsc                     |

## Code Changes

- One `vite.config.ts` and one `tsconfig.json` for the SPA, the API and the tests. `vite build` builds both bundles;
  `--mode bun` or `--mode cloudflare` picks the API target.
- Router in `api/src/router.ts` (`createMionRouter`, `mion.query`, `mion.mutation`, sync `initRoutes`).
  Fixed seed ids in the orders repository.
- Batch demo (`batch` + `inputFrom`, was `routesFlow` + `serverMapFrom`) in `app/orders-batch.ts`, with a
  module-level client. No more provide/inject composable.
- Vue Router set up in `app/main.ts`; `App.vue` and `app/router.ts` removed.
- Cloudflare: one Worker serving the SPA and the API (`wrangler.toml`), replacing the broken Pages Functions setup.
- Vitest starts the API in its own process (`api/tests/global-setup.ts`); new typed client test.
