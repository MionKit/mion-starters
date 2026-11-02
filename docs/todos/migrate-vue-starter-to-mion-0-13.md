---
type: chore
spec: guidelines
status: blocked
created: 2026-11-02
---

# Migrate the Vue 3 starter to mion 0.13

## Intent

`vue/3` runs on mion 0.8.10 (deepkit, AOT caches, three Vite configs, two tsconfigs, a separate API dev setup).
Port it to mion 0.13 with the same Orders showcase, so the starter is one Vite config and one tsconfig, with the
API running inside the Vite dev server and one `vite build` emitting both the client and the API.

Blocked on the shared starter tooling for 0.13 (local registry flow, create script, repo docs). The edge targets
are also blocked on mion fixes (below).

## Direction

A full spike port already works on published 0.13.2: report `docs/investigations/mion-0.13-migration/vue.md`
(final shape, migration steps in order, 23 issues), diff `docs/investigations/mion-0.13-migration/patches/vue.patch`.
Use them as the starting point; the implementer still plans the final shape and re-checks against the mion
version actually installed.

Verified shape:

- One `vite.config.ts`: `vue()` + `mionVitePlugin` from `@mionjs/devtools/vite` with
  `server: {entry: 'api/src/server.node.ts', build: {outDir: 'dist-server'}}`, the vitest block and a preview
  proxy. One root `tsconfig.json` covering `app/` (ts + vue), `api/src`, `api/tests`.
- Delete `vite.app.build.config.ts`, `vitest.config.ts`, `vitest.globalSetup.ts`, `api/vite.config.ts`,
  `api/mion-plugin.ts`, `api/tsconfig.json`, `api/src/dev-server.ts`, `app/composables/useMionClient.ts`, and
  `virtual:mion-aot/caches` from `env.d.ts`. Drop `vite-node`, `@mionjs/type-formats` and the `overrides` block;
  add `@mionjs/run-types`, `@mionjs/bin-compiler`, `vue-tsc`, `@types/node`; Vite 8.
- Router in `api/src/router.ts`, `mion.query` / `mion.mutation`, sync `mion.initRoutes`, entries just
  `import './api.ts'`. `UUIDv7` from `@mionjs/run-types/formats`. Fixed UUIDv7 seed ids.
- The batch demo (`batch` + `inputFrom`, replacing `routesFlow` + `serverMapFrom`) lives in a `.ts` module and
  reads `mionClient.routes` directly, not through provide/inject or destructuring: three mion issues make the
  in-SFC and injected variants fail (`batch-unknown-id` on fresh dev, the batch reader cannot trace the injected
  client, the mion lint rules cannot read `.vue`). Apply the mion lint config to `.ts` only until mion lints SFCs.
- Vitest: a `globalSetup` that imports the routes and starts `startNodeServer` in-process, plus a client test.

mion issues this starter depends on (fix them in mion first, per `CLAUDE.md`; investigation README, table
"mion issues found"): edge-safe published packages and the `process.env` guard (Cloudflare Workers blocked
without both), the SFC batch registration race, batch-reader destructuring, linting `.vue`, `server.build`
taking several entries and not copying `public/` (the spike uses a small `configEnvironment` plugin instead),
`vite preview` not serving the API, the package-name path bug.

Decide first (open questions in the report, section 5):

- Keep Cloudflare Workers / Vercel Edge as blocked targets until mion ships the edge fixes, or drop them for now.
  `functions/` and `deploy/` were already broken before this migration (wrong import path, wrong Pages
  Functions signature); the spike replaced them with one Workers + static assets `wrangler.toml`.
- Vercel: give it a real deploy layout (`vercel.json` + function folder) or drop it; it was never wired.
- Batches in `.ts` modules as the recommended Vue pattern, or wait for mion to support batches in
  `<script setup>` with an injected client.

## Docs

`vue/3/README.md`: dev, build, preview and deploy sections rewritten for the single config and the two bundles.
Add an `updatelogs/` entry for the mion upgrade, as the update-deps skill does.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- `npm test` (vitest + Playwright) and the root `tests/create-vue.test.ts` pass on the mion version in use, and
  `vite build` emits a client bundle with no server types and a self-contained API bundle.
- Every deploy target kept in the starter actually runs (node, bun, and any edge target only once mion's edge
  fixes are released); no workaround remains that a merged mion fix made unnecessary.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.
