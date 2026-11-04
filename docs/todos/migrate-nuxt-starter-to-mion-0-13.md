---
type: chore
spec: guidelines
status: blocked
created: 2026-11-02
---

# Migrate the Nuxt 4 starter to mion 0.13, as an SPA

## Intent

`nuxt/4` runs on mion 0.8.10: deepkit, AOT caches, and the removed `@mionjs/devtools/vite-plugin` with a
child-process API server. Port it to mion 0.13 with the same Orders showcase:

- the mion Vite plugin runs inside Nuxt's own Vite in dev, so the API answers on the Nuxt dev server;
- a separate API build covers production deploys.

**SPA first (decided):** mion's main target is the SPA, the browser to server bridge. The Nuxt starter runs as an
SPA (`ssr: false`), with client-only data, and `nuxt generate` emits a static SPA.

**Blocked until merged:**

- the shared starter tooling for 0.13 (local registry flow, create script, repo docs);
- the mion fixes this starter needs (below).

The port runs on a local-registry build of mion `main`, never on workarounds for mion bugs.

## Direction

A full spike port already works on published 0.13.2:

- report: `docs/investigations/mion-0.13-migration/nuxt.md`;
- diff: `docs/investigations/mion-0.13-migration/patches/nuxt.patch`;
- decisions and the mion-or-starter split: `DECISIONS.md`.

The spike used SSR. Switch to SPA, and leave out every spike workaround a merged mion fix made unnecessary. The
implementer plans the final shape against the mion version actually installed.

**Verified shape (hosting option A in the report):**

- **Dev hosting.** `nuxt.config.ts` sets
  `vite.plugins: [mionVitePlugin({tsConfig: 'tsconfig.mion.json', server: {entry: 'api/src/server.node.ts'}})]` from
  `@mionjs/devtools/vite`. Nuxt routes dev requests through the client Vite server's middleware, so the API answers
  inside `nuxt dev`. No Nuxt module or hook is needed. Do not override `vite.root`: the mion dev-reload fix
  removes the need.
- **One mion program.** Add a `tsconfig.mion.json` extending `.nuxt/tsconfig.app.json`, plus `api/src` (Nuxt's root
  tsconfig is references-only, which mion refuses). This is Nuxt layout and stays in the starter. Use it in the Nuxt
  config, the API build and the lint config.
- **API build.** Never use `server.build` in Nuxt: it replaces Nuxt's own server bundle. Build the API with a
  separate `api/vite.config.ts`, one target at a time (`--mode <target>`).
- **Client.** A module-level `initClient()` in `app/lib/` (not an auto-imported folder), with batch functions in
  `.ts` modules there. Delete `app/plugins/mion.ts`: `provide` / `useNuxtApp()` clients cannot be traced by the batch
  compiler. Use `import type` throughout (Nuxt sets `verbatimModuleSyntax`).
- **Router.** Router module, `mion.query` / `mion.mutation`, sync `mion.initRoutes`. `UUIDv7` from
  `@mionjs/run-types/formats`. Fixed UUIDv7 seed ids. Delete `api/mion-plugin.ts` and `api/src/dev-server.ts`.
- **Playwright.** Use `webServer.url` (not `port`), or nuxi's loading page counts as ready. Add the mion client
  packages to `optimizeDeps.include`.

**Deploy targets (decided):**

- **Keep node, bun and Cloudflare Workers.** Cloudflare needs `runTypes.emitMode: 'both'` and must run on local
  workerd.
- **Drop Vercel** (`deploy/vercel.json` and `vercel-serverless.ts`): it never worked.
- **Drop `deploy/aws`:** there is no AWS adapter entry.
- **Proxy mode** (same origin, CDN rewrite of `/api/mion/*`) is the default. Separate-domain mode needs CORS, which
  only mion `main` has (`mionSecurity`, unreleased). Document it as available once that release ships.

**Framework versions (decided):** move to the latest Nuxt and tooling with the `update-deps` skill as part of the
port.

**mion fixes this starter needs merged first** (investigation README, table "mion issues found"):

- in-process API reload: entry outside the Vite root, and the reload race;
- the `server.build` gaps: refusing a host that owns the server build, no `mion-pure-fns/` in the public output;
- linting `.vue` files;
- edge-safe published packages, plus the `process.env` guard.

## Docs

`nuxt/4/README.md` (dev, build, generate, deploy, proxy mode). Rewrite `plans/mion-nuxt-integration.md`, or remove
it if the README covers it: its architecture section describes the 0.8 setup (`initAOTClient`, AOT caches,
`noViteClient`). Add an `updatelogs/` entry for the mion upgrade.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- `npm test` and the root `tests/create-nuxt.test.ts` pass on the local-registry mion build, cold and warm.
- `nuxt build` and `nuxt generate` produce a working SPA.
- node, bun and Cloudflare Workers (on workerd) each run.
- No workaround for a fixed mion bug remains.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.

## Plan: SPA port on mion main (approved 2026-11-04)

- `nuxt.config.ts`: `ssr: false`, `mionVitePlugin({tsConfig, server: {entry}})` with absolute paths (Nuxt's Vite root
  is `app/`). No `vite.root`, no `server.build`. `nuxt build` forwards `/api/mion/**` to `MION_API_URL`.
- `tsconfig.mion.json`: one program for the app, the API and its tests.
- API shared with `react/19`: router module, `mion.query` / `mion.mutation`, `UUIDv7`, fixed seed ids. Entries:
  node, bun, Cloudflare Worker. One `api/vite.config.ts`, `--mode <target>`, plus Vitest API tests.
- Client: `app/lib/mion-client.ts` (module-level `initClient`), `app/lib/orders-batch.ts` (`batch` + `inputFrom`).
- Lint: mion rules on `.ts` and `.vue`. Dropped: Vercel, `deploy/aws`, `api/mion-plugin.ts`, `dev-server.ts`,
  `app/plugins/mion.ts`.
- Checks: unit + Playwright cold and warm, root nuxt create test, `nuxt build` / `nuxt generate` behind a proxy,
  node, bun and Cloudflare (local workerd) bundles each running the e2e suite.
