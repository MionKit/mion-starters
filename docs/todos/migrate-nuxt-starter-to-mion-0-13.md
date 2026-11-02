---
type: chore
spec: guidelines
status: blocked
created: 2026-11-02
---

# Migrate the Nuxt 4 starter to mion 0.13

## Intent

`nuxt/4` runs on mion 0.8.10 (deepkit, AOT caches, the removed `@mionjs/devtools/vite-plugin` with a child-process
API server). Port it to mion 0.13 with the same Orders showcase: the mion Vite plugin inside Nuxt's own Vite for
dev (API in the Nuxt dev server, one port), and a separate API build for production deploys.

Blocked on the shared starter tooling for 0.13 (local registry flow, create script, repo docs). The Cloudflare
target is also blocked on mion fixes (below).

## Direction

A full spike port already works on published 0.13.2: report `docs/investigations/mion-0.13-migration/nuxt.md`
(final shape, migration steps in order, 24 issues, hosting options compared), diff
`docs/investigations/mion-0.13-migration/patches/nuxt.patch`. Use them as the starting point; the implementer still
plans the final shape and re-checks against the mion version actually installed.

Verified shape (hosting option A in the report):

- `nuxt.config.ts`: `vite.plugins: [mionVitePlugin({tsConfig: 'tsconfig.mion.json', server: {entry: 'api/src/server.node.ts'}})]`
  from `@mionjs/devtools/vite`. Nuxt routes dev requests through the client Vite server's middleware, so the API
  answers inside `nuxt dev`; the transform runs on both Nuxt builds. No Nuxt module or hook is needed.
- One mion program: a `tsconfig.mion.json` extending `.nuxt/tsconfig.app.json` plus `api/src` (Nuxt's root
  tsconfig is references-only, which mion refuses). Pass it to the Nuxt config, the API build and the lint config.
- Never use `server.build` in Nuxt: it replaces Nuxt's own SSR bundle and every page answers 500. Build the API
  with a separate `api/vite.config.ts` (the spike selects the entry with `--mode`; Cloudflare needs
  `runTypes.emitMode: 'both'`).
- Client: a module-level `initClient()` in a folder Nuxt does not auto-import (`app/lib/`); delete
  `app/plugins/mion.ts`. `provide` / `useNuxtApp()` clients cannot be traced by the batch compiler. The batch demo
  lives in a `.ts` module so separate API builds compile its id. `import type` throughout (Nuxt sets
  `verbatimModuleSyntax`).
- Router in `api/src/mion.ts`, `mion.query` / `mion.mutation`, sync `mion.initRoutes`. `UUIDv7` from
  `@mionjs/run-types/formats`. Fixed UUIDv7 seed ids. Delete `api/mion-plugin.ts`, `api/src/dev-server.ts`.
- Playwright `webServer.url` (not `port`), or nuxi's loading page counts as ready; `optimizeDeps.include` the mion
  client packages.

mion issues this starter depends on (fix them in mion first, per `CLAUDE.md`; investigation README, table
"mion issues found"): dev hot reload ignores an entry outside the Vite root (the spike sets `vite.root` to the
project root as a workaround, with a cosmetic duplicate CSS link), the reset-then-load reload race (422 during a
reload), `server.build` silently taking over a host's SSR environment, linting `.vue`, edge-safe published
packages and the `process.env` guard (Cloudflare blocked without both). Separate-domain mode needs CORS, which only
mion `main` has (`mionSecurity`); it also adds HTTP method checks that 0.13.2 lacks (a mutation runs via GET).

Decide first (report section 6):

- Showcase data: SSR with `useAsyncData` (works; `nuxt generate` then needs a live API and freezes the data, and
  silently bakes "API Error" into the HTML when no API runs) or client-only `server: false` as before.
- Cloudflare target: keep it as blocked until mion's edge fixes ship, or drop it.
- `deploy/`: `vercel.json` points at function files that never existed and an old runtime; `deploy/aws` targets
  Lambda with no `platform-aws` entry. Rework or drop each.
- Keep the `vite.root` workaround, or wait for the mion fix so the Nuxt config stays at Nuxt defaults.
- Whether mion should ship a small Nuxt helper (tsconfig, root, refuse `server.build`) instead of starter config.

## Docs

`nuxt/4/README.md` (dev, build, generate, deploy, proxy vs separate-domain mode) and
`plans/mion-nuxt-integration.md`, whose architecture section describes the 0.8 setup (`initAOTClient`, AOT caches,
`noViteClient`). Add an `updatelogs/` entry for the mion upgrade.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- `npm test` and the root `tests/create-nuxt.test.ts` pass on the mion version in use, cold and warm; `nuxt build`
  and `nuxt generate` (with the chosen data strategy) work, and every kept API build target runs.
- No workaround remains that a merged mion fix made unnecessary.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.
