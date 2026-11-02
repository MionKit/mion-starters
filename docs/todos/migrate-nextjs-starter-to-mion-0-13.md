---
type: chore
spec: guidelines
status: blocked
created: 2026-11-02
---

# Migrate the Next.js 16 starter to mion 0.13 with `withMion`

## Intent

`nextjs/16` runs on mion 0.8.10 with a split setup: the API is built separately by Vite, dev runs a second
vite-node server on port 3001 behind a Next rewrite, Turbopack gets an empty AOT-cache shim, and the client
features that need build-time code (`routesFlow`, `serverMapFrom`) did not work. mion 0.13 ships
`withMion` (`@mionjs/devtools/next`), which runs mion's transform inside Next on Turbopack and webpack and hosts the
API in Next's own route handler. Port the starter to it: one process, one build, every showcase feature working.

Blocked on the shared starter tooling for 0.13 (local registry flow, create script, repo docs), and on the mion
fixes below for a workaround-free result.

## Direction

A full spike port already works on published 0.13.2, 7/7 e2e on Turbopack and webpack, dev and production: report
`docs/investigations/mion-0.13-migration/nextjs.md` (final shape, migration steps in order, 18 issues), diff
`docs/investigations/mion-0.13-migration/patches/nextjs.patch`. Use them as the starting point; the implementer
still plans the final shape and re-checks against the mion version actually installed.

Verified shape:

- `next.config.mts` (not `.ts`: Next compiles a `.ts` config to CJS and `@mionjs/devtools/next` is ESM-only):
  `export default await withMion(nextConfig)`, with `nextConfig` written as `satisfies NextConfig`. Drop
  `ignoreBuildErrors`, `transpilePackages`, the shim aliases and the rewrites; `serverExternalPackages` for the
  `@mionjs/*` runtime packages removes the "loaded N times" warning.
- `app/api/[...mion]/route.ts` imports the routes module and exports `createVercelHandler()`'s methods. Delete
  `mion-aot-caches-shim.js`, `mion-aot-caches.d.ts`, `api/tsconfig.json`, `api/vite.config.ts`,
  `api/src/dev-server.ts`, `api/src/vercel-serverless.ts`; `api` is no longer excluded from the root tsconfig.
- Router in `api/src/router.ts`, `mion.query` / `mion.mutation`, sync `mion.initRoutes`; `TF.UUIDv7` from
  `@mionjs/run-types/formats`. Deps: drop `@mionjs/type-formats`, `@mionjs/drizzle`, `vite`, `vite-node`,
  `npm-run-all2`, the `overrides` block; add `@mionjs/run-types`, `@mionjs/devtools`, `@mionjs/bin-compiler`, and
  declare `drizzle-orm` and `@neondatabase/serverless`, which the old starter imported without declaring.
- The batch demo (`batch` + `inputFrom`) and every other mion call site live in a directive-free module imported
  by the `"use client"` page, never in a `"use client"` / `"use server"` file itself (mion puts its imports above
  the directive).
- Drizzle: `toDrizzlePGTable<Order>()` has no replacement; write slim `DZ.pgTable` tables
  (`@mionjs/drizzle-orm-pg-core`, 0.45.x line) plus `toDrizzle` for drizzle-kit and queries; `uuid` columns need
  `$type<TF.UUIDv7>()`. The Neon repository typechecks and builds correct SQL but was not run against a database.

mion issues this starter depends on (fix them in mion first, per `CLAUDE.md`; investigation README, table
"mion issues found"):

- imports above `"use client"` / `"use server"`;
- router re-init in `next dev`: any edit breaks the API until restart; the spike resets the router in dev from a
  `dev-reset.ts` imported before the routes;
- `next dev --webpack` not detected: the spike pushes `--webpack` into argv;
- the `.ts` config / ESM export and `withMion` typing;
- `.mion/` created after `withMion` returns, so the first clean build fails on Next 16.4;
- the intermittent "source file not in program" in dev;
- the routes proxy that hangs when awaited;
- the misleading dual-load warning;
- drizzle `uuid` version and table-from-model.

Every spike workaround for these must go once the fix is released.

Decide first (report section 5):

- Keep the call sites in a separate module even after the directive fix (arguably cleaner), or call the client from
  the page directly as the 0.8 starter did.
- Showcase a Server Component / server action calling the API (works over HTTP to the request origin; in-process is
  impossible today) or call the repository directly.
- Keep an optional standalone API recipe (`server.node.ts` + a `vite build`, verified to serve the same batch id) or
  leave standalone deploys to the planned standalone starter. Drop `server.bun.ts` either way unless it is kept in
  that recipe.
- Drizzle models: handwritten `Order` / `OrderEvent` next to slim tables, or models inferred from the tables.
- Next 16.2.x or 16.4.x.

## Docs

`nextjs/16/README.md` is still the create-next-app boilerplate: write the mion sections (dev, build, the route
handler, the batch demo, drizzle). Add an `updatelogs/` entry for the mion upgrade.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- `npm test` and the root `tests/create-nextjs.test.ts` pass on the mion version in use, on `next dev` and
  `next build` + `next start`, with Turbopack and with webpack.
- Editing a type, a handler or a client file during `next dev` keeps the API working without a restart.
- No workaround remains that a merged mion fix made unnecessary.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.
