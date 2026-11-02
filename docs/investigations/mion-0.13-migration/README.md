# Migrating the starters to mion 0.13: investigation

Date: 2026-11-02. Target: the published `@mionjs/*@0.13.2` (drizzle packages `0.45.1`). Starting point: mion 0.8.10
(the deepkit era) at mion-starters `12ef4da`.

## How this was investigated

Each starter was copied to a throwaway folder and fully ported to the published 0.13.2 packages, then run through
install, typecheck, lint, dev server, production build, every deploy entry it has, and its Playwright e2e. Every
failure was chased to its root cause in the exact 0.13.2 source (mion `prod` branch, `cb9d90ea4`), then checked
against mion `main` (50 commits ahead, at `cf677d3`).

| File | What it holds |
|---|---|
| [nextjs.md](nextjs.md), [nuxt.md](nuxt.md), [vue.md](vue.md) | Full spike report per starter: final working shape, migration steps in order, every issue with exact error, root cause, source pointer and repro, what was not verified, open questions |
| [patches/](patches/) | The working spike ports as diffs against `12ef4da` (`git apply --check` passes). A reference, not a deliverable: they carry the workarounds listed below |
| [repros/](repros/) | Minimal repros for the mion bugs (no `node_modules`; `npm install` then follow the matching report section) |

Spike copies, logs and `node_modules` were not kept. Paths in the reports that point at them are history only.

## Results at a glance

| | Next.js 16 | Nuxt 4 | Vue 3 |
|---|---|---|---|
| Port works on 0.13.2 | Yes, with 4 mion workarounds | Yes, with 1 mion workaround | Yes |
| Dev: API in the same process | `withMion` + `app/api/[...mion]/route.ts` | `mionVitePlugin({server: {entry}})` inside Nuxt's Vite | `mionVitePlugin({server: {entry}})` |
| Build | `next build` (Turbopack and webpack) | `nuxt build` + separate `api/vite.config.ts` | One `vite build`: client `dist/` + API `dist-server/` |
| e2e | 7/7 on 4 lanes (Turbopack/webpack, dev/prod) | 6/6, 3 cold runs | vitest 8/8, Playwright 5/5 |
| Cloudflare / Vercel Edge | Not in this starter | Blocked by mion | Blocked by mion |
| Node / Bun / Vercel (Node runtime) | Node standalone checked | All run | All run |

Next.js answer to the original question: yes, `@mionjs/devtools/next` (`withMion`) covers the RPC router too. The
API is served from Next's own route handler, batches compile into it, and the separate vite-node server, the
rewrites and the AOT shim all go away. The front-end features that did not work before (`routesFlow`,
`serverMapFrom`, now `batch` and `inputFrom`) work in the browser.

## What changed between 0.8.10 and 0.13.2, for a starter

| 0.8.10 | 0.13.2 |
|---|---|
| deepkit reflection, `"reflection": true`, AOT caches, `virtual:mion-aot/caches` | Go resolver precompiles types at build time (`@mionjs/bin-compiler` + a native binary package, peer of `@mionjs/devtools`) |
| `@mionjs/devtools/vite-plugin`, `aotCaches`, `serverPureFunctions`, `server.{startScript, runMode, viteConfig}` | `@mionjs/devtools/vite` `mionVitePlugin({tsConfig, client, runTypes, server: {entry, build, exclude, hotReload}})`; `@mionjs/devtools/next` `withMion` |
| Separate tsconfig for `api/` | ONE tsconfig program for client + server (a references-only tsconfig is refused) |
| `initMionRouter(routes, opts)` (async), standalone `query` / `mutation` | `const mion = createMionRouter(opts)`, `mion.query` / `mion.mutation`, `mion.initRoutes(routes)` (sync) |
| `routesFlow([...])`, `serverMapFrom(req, fn, 'name')` | `batch([...])`, `inputFrom(req, fn)` (mapper id compiled, no name) |
| `call()` result | `[result, error, response]`; a batch returns one tuple per route |
| `@mionjs/type-formats` `FormatUUIDv7` | `@mionjs/run-types/formats` `UUIDv7` |
| `@mionjs/drizzle` `toDrizzlePGTable<Model>()` | `@mionjs/drizzle-orm` + `@mionjs/drizzle-orm-pg-core` (0.45.x line), slim tables + `toDrizzle` |
| "never `import type`" (deepkit) | `import type` is safe, and required under Nuxt's `verbatimModuleSyntax` |
| ESLint `@mionjs/enforce-type-imports` | `mion.configs.recommended`: rules `mion/error`, `mion/runtime-error`, `mion/warning`, `mion/info` |
| `vite-node` dev server on port 3001 | Removed: API source can no longer run untransformed (`MissingRtFnsError`) |

## Shared findings across all starters

- Batches must live in `.ts` modules, and `routes` must trace back to a module-level `initClient()` call:
  - a batch only inside a `.vue` file is invisible to builds that do not transform that file;
  - the mion lint rules cannot read `.vue` files;
  - a client from `provide`/`inject`, a composable or `useNuxtApp()` cannot be traced by the batch compiler.
- The router is created once in its own module (`api/src/router.ts`) so feature files can import `mion` without an
  import cycle through `api.ts`.
- Seed data must not call `randomUUID_V7()` at module scope: workerd refuses random values in global scope.
- `create.mjs` must exclude generated state (`.mion`, plus each host's output) and must use the folder name, not
  the path argument, as the package name. The package name becomes a path segment in generated pure-function
  modules, so an absolute path breaks the build.
- `npm run mionupdate` would set the drizzle packages (0.45.x line) to the train version and break install.
- `npm run mionlink` is broken: mion no longer has `scripts/pack-packages.sh`, and `file:` tarballs cannot pick
  the per-platform native compiler (an npm `os`/`cpu` optional dependency). mion's own pre-publish e2e solves the
  same problem with a throwaway verdaccio registry (`.github/verdaccio.yaml`, `scripts/release/pack.mjs`,
  `scripts/release/publish-tarballs.mjs --registry <url>`).
- TypeScript stays on `^6`: TS 7 breaks vue-tsc and typescript-eslint.

## mion issues found

All are present in 0.13.2 and unchanged on `main` unless noted. Details, exact errors and repros are in the
per-starter reports.

| # | Issue | Hits | Severity | Source pointer (0.13.2) |
|---|---|---|---|---|
| 1 | Published router/core ship code-string-only compiled functions; the app's `emitMode: 'both'` cannot reach them, so Cloudflare Workers / Vercel Edge fail at `initRoutes` (`RuntimeCodeGenBlockedError`). mion's own edge tests bundle from the `source` condition, so CI never sees it | Vue, Nuxt | Blocker (edge) | `packages/rpc-router/vite.config.ts:16-18` |
| 2 | Unguarded `process.env.GENERATE_ROUTER_SPEC` at module load: `process is not defined` on Workers | Vue, Nuxt | Blocker (edge) | `packages/rpc-router/src/constants.ts:15` |
| 3 | The source rewrite puts its import block above `"use client"` / `"use server"`, so Next rejects the file on both bundlers | Next | High | `ts-go-runtypes/internal/compiler/sourcerewrite/transform.go:55-57`, `packages/devtools/src/core/apply-edits.ts:17` |
| 4 | Router re-init: route tables live on `globalThis`, the created/initialized flags are module-scoped, so any edit in `next dev` breaks the API until restart (`Naming collision, duplicated route`), and two server bundles in one process cannot both init | Next | High | `packages/rpc-router/src/router.ts:87-103, 221, 258` |
| 5 | Vite dev reload: reset-then-load with no shared reload promise, so requests during a reload get 422 "Not-found chain is not registered"; a reload that misses the entry leaves the router reset forever | Nuxt (and Vite) | High | `packages/devtools/src/vite/middlewareMode.ts:108-118, 153-157` |
| 6 | Vite dev ownership is decided by the Vite root, so an API entry outside the root (always in Nuxt, root is `app/`) never hot-reloads | Nuxt | High | `packages/devtools/src/vite/middlewareMode.ts:183-185, 280-303` |
| 7 | A batch that first appears through the SFC transform is never registered in the running dev API (`404 batch-unknown-id` on every fresh `vite dev`): `onGenerate` does not mark the middleware stale | Vue | Medium | `packages/devtools/src/vite/mionVitePlugin.ts:141-156`, `middlewareMode.ts:176-180` |
| 8 | `next dev --webpack` gets no mion transform: `isTurbopack()` guesses wrong in the child process Next forks | Next | Medium | `packages/devtools/src/runtypes/next/index.ts:44-48` |
| 9 | `@mionjs/devtools/next` is ESM-only, so the documented `next.config.ts` (compiled to CJS by Next) fails to load; `withMion` rejects a `NextConfig`-typed object; mion's Next smoke app tests `withRunTypes`, not `withMion` | Next | Medium | `packages/devtools/package.json` exports, `packages/devtools/src/next/index.ts:32`, docs `01.rpc/07.devtools/03.nextjs.md` |
| 10 | `withMion` resolves before `.mion/` exists; Next 16.4 Turbopack caches the missing folder and the first clean build fails | Next | Medium | `packages/devtools/src/runtypes/next/broker.ts:155` |
| 11 | Intermittent "source file not in program" in `next dev` after edits (suspected: a one-file `setSources` on source drift collapses the program) | Next | Medium, unproven | `packages/devtools/src/core/unplugin.ts:477-481` vs `:736-739` |
| 12 | `@mionjs/core has been loaded N times` warning in every Next app, with Vite-only advice | Next | Low | `packages/core/index.ts:13-22` |
| 13 | Batch reader rejects `const {routes} = client` (destructuring a non-`initClient` initializer), so provide/inject clients cannot batch | Vue, Nuxt | Medium | `ts-go-runtypes/internal/compiler/requestbatch/routes.go:216-256` |
| 14 | mion lint rules fail on every `.vue` file ("source file not in program"); the Vite preset already solves SFCs with a virtual `.vue.ts` | Vue, Nuxt | Medium | `packages/devtools/src/lint/lint-worker.ts:85-106` |
| 15 | Docs: batches in SFCs exist only for builds that transform the SFC; batches need a module-level client | Vue, Nuxt | Medium | docs `02.vite.md`, `04.client/03.batch.md` |
| 16 | `server.build` takes one entry and silently overwrites a user `input`; copies `public/` into the API bundle; replaces Nuxt's own SSR bundle (`nuxt build` exits 0, every page 500) | Vue, Nuxt | Medium | `packages/devtools/src/vite/mionVitePlugin.ts:195-279` |
| 17 | `vite preview` does not serve the API; every build writes a `mion-pure-fns/` artifact (source paths + mapper source) into the public `outDir` | Vue, Nuxt | Low | `mionVitePlugin.ts` (no `configurePreviewServer`), `packages/devtools/src/core/unplugin.ts:619-640` |
| 18 | The routes proxy answers `then`, so `await`ing `routes` hangs forever | Next | Medium | `packages/rpc-client/src/client.ts:123` |
| 19 | `package.json` `name` is used raw as a path segment for pure-function modules | Vue | Low | `ts-go-runtypes/internal/compiler/marker/marker.go:822-840` |
| 20 | `@mionjs/platform-bun` has runtime deps on `@mionjs/devtools` + `@mionjs/bin-compiler` (25 MB binary in production installs) and its `.d.ts` needs bun types | all | Low | `packages/platform-bun/package.json:63-69` |
| 21 | `@mionjs/run-types` sourcemaps point at unshipped sources (23 warnings per dev start) | Vue, Nuxt | Low | `packages/run-types/package.json` `files` |
| 22 | Only `.mion/types/` is gitignored; `.mion/api/` and `.mion/rpc/` are not | Next | Low | `ts-go-runtypes/internal/compiler/resolver/generate.go:172-185` |
| 23 | `@mionjs/devtools` peer `typescript >=6` admits TS 7, whose package no longer exports the JS API devtools imports | Vue | Low | `packages/devtools/package.json`, `src/vite/buildEntries.ts` |
| 24 | Dev noise: full router options logged on every init, ANSI codes in the 503 body, "resolver died, respawned" printed before the real config error, a failing entry blanks the whole Nuxt site with 503 | all | Low | `packages/rpc-router/src/router.ts:259`, `middlewareMode.ts:151` |
| 25 | Drizzle: `uuid` columns are typed as version "any", so `UUIDv7` needs `$type`; no way left to build a table from a model type | Next | Low (feature) | `packages/drizzle-orm-pg-core` `PgUuidIn` |
| 26 | No HTTP method enforcement (a `mutation` runs via GET or OPTIONS, a CORS preflight runs a batch) and no CORS support | Nuxt | High (security) | **Fixed on `main`** by `mionSecurity` (`packages/rpc-router/src/middlewares/security.ts`); needs a release |
| 27 | Local prerelease flow for downstream projects: `bump-version.mjs` accepts only `X.Y.Z`, and there is no one-command "publish this tree to a local registry" for the starters | starters | Low (tooling) | `scripts/release/bump-version.mjs:31` |

## Process for the migration

1. Fix the mion issues in the mion repo, one background session and PR per fix group, each merged to `main`.
2. Until a mion release ships them, the starters install a locally built mion from a throwaway verdaccio registry
   (built from `main` with the fixes, prerelease version), using the shared tooling in this repo.
3. Port each starter. A starter is done when all of its e2e pass on the local build, with no workaround left that a
   mion fix removed.
4. Publish a new mion version, switch the starters to it with `npm run mionupdate`, rerun every e2e, publish the
   starters.

## Decisions still open

Collected from the reports. Each starter todo repeats the ones it needs.

- Edge targets (Cloudflare Workers, Vercel Edge): keep them, blocked, until mion issues 1 and 2 ship, or drop them for now.
- Vercel deploy layout: neither the Nuxt nor the Vue starter had a working Vercel layout before this migration.
  Rework it or drop it.
- Nuxt showcase data: SSR (prerendered at `nuxt generate`, needs a live API, data frozen) or client-only (`server: false`).
- Next.js: keep an optional standalone API recipe (`vite build` of `server.node.ts`, verified) or leave it to the planned standalone starter.
- Next.js: showcase a Server Component calling the API over HTTP, or call the repository directly.
- Next.js drizzle: handwritten models next to slim tables, or models inferred from the tables.
- Next.js version: stay on 16.2.x or move to 16.4.x (needs mion issue 10 fixed or the `mkdirSync('.mion')` workaround).
