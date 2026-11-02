---
type: chore
spec: guidelines
status: blocked
created: 2026-11-02
---

# Migrate the Next.js 16 starter to mion 0.13 with `withMion`

## Intent

`nextjs/16` runs on mion 0.8.10 with a split setup:

- the API is built separately by Vite;
- dev runs a second vite-node server on port 3001 behind a Next rewrite;
- Turbopack gets an empty AOT-cache shim;
- the client features that need build-time code (`routesFlow`, `serverMapFrom`) did not work.

mion 0.13 ships `withMion` (`@mionjs/devtools/next`). It runs mion's build step inside Next, on Turbopack and
webpack, and hosts the API in Next's own route handler. Port the starter to it: one process, one build, every
showcase feature working.

**Blocked until merged:**

- the shared starter tooling for 0.13 (local registry flow, create script, repo docs);
- the mion fixes this starter needs (below).

The port runs on a local-registry build of mion `main`, never on workarounds for mion bugs.

## Direction

A full spike port already works on published 0.13.2, with 7/7 e2e on Turbopack and webpack, dev and production:

- report: `docs/investigations/mion-0.13-migration/nextjs.md`;
- diff: `docs/investigations/mion-0.13-migration/patches/nextjs.patch`;
- decisions and the mion-or-starter split: `DECISIONS.md`.

Leave out every spike workaround a merged mion fix made unnecessary: `dev-reset.ts`, the `process.argv` push, the
`mkdirSync('.mion')`. The implementer plans the final shape against the mion version actually installed.

**Verified shape:**

- **Config.** `next.config.mts` (or whatever filename the mion Next docs settle on) with
  `export default await withMion(nextConfig)`. Drop `ignoreBuildErrors`, `transpilePackages`, the shim aliases and
  the rewrites. Follow mion's recommendation on `serverExternalPackages` for the `@mionjs/*` runtime packages.
- **Route handler.** `app/api/[...mion]/route.ts` imports the routes module and exports `createVercelHandler()`'s
  methods.
- **Delete:**
  - `mion-aot-caches-shim.js`, `mion-aot-caches.d.ts`;
  - `api/tsconfig.json`, `api/vite.config.ts`.
  `api` is no longer excluded from the root tsconfig.
- **Router.** `api/src/router.ts`, `mion.query` / `mion.mutation`, sync `mion.initRoutes`. `TF.UUIDv7` from
  `@mionjs/run-types/formats`.
- **Dependencies.**
  - Drop `@mionjs/type-formats`, `@mionjs/drizzle`, `vite`, `vite-node`, `npm-run-all2`, the platform node/bun
    packages, and the `overrides` block.
  - Add `@mionjs/run-types`, `@mionjs/devtools` and `@mionjs/bin-compiler`.
  - Declare `drizzle-orm` and `@neondatabase/serverless`, which the old starter imported without declaring.
- **Client call sites (decided).** Keep them in a `.ts` module next to the page (`orders-client.ts`), imported by
  the `"use client"` page. Keep this even after mion's directive fix: the page stays UI-only, the same pattern as
  the Vue and Nuxt starters.
- **Drizzle (decided).**
  - Handwritten `Order` / `OrderEvent` models stay next to slim `DZ.pgTable` tables
    (`@mionjs/drizzle-orm-pg-core`, 0.45.x line).
  - Add `toDrizzle` for drizzle-kit and queries.
  - Use mion's uuid version option once it lands; until then, `$type<TF.UUIDv7>()`.
  - The Neon repository was not run against a database: say so in the README.

**Scope decisions:**

- **No Server Component demo.** The README notes that server code should call the repository directly, not the
  API over HTTP.
- **No standalone API recipe.** That belongs to the planned `standalone/` starter. Delete `api/src/dev-server.ts`,
  `vercel-serverless.ts`, `server.node.ts` and `server.bun.ts`.
- **Node floor.** Add `"engines": {"node": ">=22.18"}`, which `next.config.mts` needs.
- **Framework version.** Move to the latest Next and tooling with the `update-deps` skill as part of the port.

**mion fixes this starter needs merged first** (investigation README, table "mion issues found"):

- imports above `"use client"` / `"use server"`;
- in-process API reload: router re-init in `next dev`;
- the `withMion` fixes: config loading and typing, webpack dev detection, `.mion` created before Next continues,
  the "source file not in program" collapse, the dual-load warning;
- consumer packaging fixes, including the routes proxy that hangs when awaited;
- the drizzle uuid version option.

## Docs

`nextjs/16/README.md` is still the create-next-app boilerplate. Write the mion sections: dev, build, the route
handler, the batch demo, drizzle, and calling the repository from server code. Add an `updatelogs/` entry for the
mion upgrade.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- `npm test` and the root `tests/create-nextjs.test.ts` pass on the local-registry mion build, on `next dev` and on
  `next build` + `next start`, with Turbopack and with webpack, the first clean build included.
- Editing a type, a handler or a client file during `next dev` keeps the API working without a restart.
- No workaround for a fixed mion bug remains.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.
