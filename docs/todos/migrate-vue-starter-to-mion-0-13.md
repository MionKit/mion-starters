---
type: chore
spec: guidelines
status: blocked
created: 2026-11-02
---

# Migrate the Vue 3 starter to mion 0.13

## Intent

`vue/3` runs on mion 0.8.10: deepkit, AOT caches, three Vite configs, two tsconfigs, and a separate API dev setup.
Port it to mion 0.13 with the same Orders showcase. The result is one Vite config and one tsconfig, the API runs
inside the Vite dev server, and `vite build` emits both the client and the API.

**Blocked until merged:**

- the shared starter tooling for 0.13 (local registry flow, create script, repo docs);
- the mion fixes this starter needs (below).

The port runs on a local-registry build of mion `main`, never on workarounds for mion bugs.

## Direction

A full spike port already works on published 0.13.2:

- report: `docs/investigations/mion-0.13-migration/vue.md`;
- diff: `docs/investigations/mion-0.13-migration/patches/vue.patch`;
- decisions and the mion-or-starter split: `DECISIONS.md`.

Use them as the starting point. The implementer still plans the final shape against the mion version actually
installed, and leaves out every spike workaround a merged mion fix made unnecessary.

**Verified shape:**

- **Config.** One `vite.config.ts`: `vue()` plus `mionVitePlugin` from `@mionjs/devtools/vite`, with
  `server: {entry: 'api/src/server.node.ts', build: {outDir: 'dist-server'}}`, the vitest block, and a preview setup.
  One root `tsconfig.json` covering `app/` (ts + vue), `api/src` and `api/tests`.
- **Delete:**
  - `vite.app.build.config.ts`, `vitest.config.ts`, `vitest.globalSetup.ts`;
  - `api/vite.config.ts`, `api/mion-plugin.ts`, `api/tsconfig.json`, `api/src/dev-server.ts`;
  - `app/composables/useMionClient.ts`;
  - `virtual:mion-aot/caches` from `env.d.ts`.
- **Dependencies.** Drop `vite-node`, `@mionjs/type-formats` and the `overrides` block. Add `@mionjs/run-types`,
  `@mionjs/bin-compiler`, `vue-tsc` and `@types/node`. Move to Vite 8.
- **Router and entries.** Router in `api/src/router.ts`, `mion.query` / `mion.mutation`, sync `mion.initRoutes`.
  Entries just `import './api.ts'`. `UUIDv7` from `@mionjs/run-types/formats`. Fixed UUIDv7 seed ids (workerd
  refuses random values at module scope).
- **Batches in `.ts` modules (decided).** The batch demo (`batch` + `inputFrom`, replacing `routesFlow` +
  `serverMapFrom`) lives in `app/*.ts` with a module-level `initClient()`, called from the page. This stays the
  pattern even after mion's SFC fixes: it works in every build, gets linted, and keeps API calls out of templates.
- **Vitest.** A `globalSetup` that imports the routes and starts `startNodeServer` in-process, plus a client test.

**Deploy targets (decided):**

- **Keep node, bun and Cloudflare Workers.** Replace the broken `functions/` and `deploy/` with one Workers +
  static assets `wrangler.toml` (shape in the report), and verify it on local workerd.
- **Drop Vercel.** Delete `vercel-serverless.ts` and any Vercel config: it was never wired, and Vercel is the Next.js
  starter's target.
- **Build one target at a time,** for example `vite build --mode <target>` choosing `server.entry` (the Nuxt spike's
  pattern). Do not hand-write a multi-entry plugin: a real app deploys to one target, so mion will not grow
  multi-entry builds.

**Framework versions (decided):** move to the latest Vue, Vite and tooling with the `update-deps` skill as part of
the port.

**mion fixes this starter needs merged first** (investigation README, table "mion issues found"):

- edge-safe published packages, plus the `process.env` guard;
- the SFC batch registration race and linting `.vue` files;
- in-process API reload;
- the `server.build` gaps: no silent input overwrite, no `public/` copy, no `mion-pure-fns/` in the public output;
- consumer packaging fixes (the `platform-bun` deps, source map warnings, `.mion` gitignore).

## Docs

`vue/3/README.md`: dev, build, preview and deploy sections rewritten for the single config and the two bundles. Add
an `updatelogs/` entry for the mion upgrade, as the update-deps skill does.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- `npm test` (vitest + Playwright) and the root `tests/create-vue.test.ts` pass on the local-registry mion build.
- `vite build` emits a client bundle with no server types and a self-contained API bundle.
- node, bun and Cloudflare Workers (on workerd) each run.
- No workaround for a fixed mion bug remains.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.
