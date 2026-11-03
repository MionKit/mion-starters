---
type: feature
spec: guidelines
status: done
created: 2026-11-03
---

# A React + Vite SPA starter on mion 0.13

## Intent

The maintainer replaced the Next.js starter with a simple React + Vite starter. It follows the "SPA first"
guideline in `CLAUDE.md`: React only in SPA mode, so no SSR and no server components. Keep it simple for now: no
deploy targets beyond running the API with Node. Choosing a deploy target (Vercel, Cloudflare, AWS) at create time
is a separate, later todo for every starter.

It shows the same Orders showcase as the other starters, built the way the Vue starter's verified 0.13 shape works.

## Direction

The implementer plans the details. Pointers:

- **Location and package:** `react/19/` (versioned by the React major, like the other starters), published as
  `@mionjs/create-starter-react` with a `create.mjs` bin like the other starters (same `EXCLUDE` list).
- **Scaffold first.** Start from the official `npm create vite@latest -- --template react-ts` output, the same way
  the `update-deps` skill compares against a fresh official scaffold, then add mion.
- **Shape to follow:** the Vue starter's spike port on mion 0.13, verified working. In the
  `claude/focused-feynman-3p5dap` branch of this repo, `docs/investigations/mion-0.13-migration/vue.md` (section 1)
  and `patches/vue.patch` describe it; `DECISIONS.md` has the decisions. In short:
  - one `vite.config.ts`: `react()` plus `mionVitePlugin` from `@mionjs/devtools/vite` with
    `server: {entry: 'api/src/server.node.ts', build: {outDir: 'dist-server'}}`, the API runs inside `vite dev`;
  - one root `tsconfig.json` covering the app and `api/`: mion refuses Vite's references-only tsconfig;
  - `api/src/router.ts` with `createMionRouter`, `api.ts` with `mion.query` / `mion.mutation` and a sync
    `mion.initRoutes`, the orders feature, `UUIDv7` from `@mionjs/run-types/formats`, fixed seed ids;
  - a module-level `initClient()` and the batch demo (`batch` + `inputFrom`) in `.ts` modules; React components only
    call them;
  - client-side routing for the two pages (home, orders) with a router that runs in SPA mode;
  - vitest with an in-process `globalSetup` plus Playwright e2e with the same smoke tests as the Vue starter.
- **mion version:** run against the local registry build of mion `main` (`npm run mionlink`), since the needed mion
  fixes are not published yet. Never work around a mion bug in the starter: report it instead. Known open mion
  items that may show up: the `server.build` gaps (`public/` copied into `dist-server`, `mion-pure-fns/` in the
  public output) and packaging warnings; their fixes are in progress.
- **Register the starter:** `STARTER_DIRS` in `scripts/mion-utils.mjs`, `scripts/pre-publish-test.mjs`,
  `scripts/publish-all.mjs`, the root tests, `CLAUDE.md` and the root `README.md`.
- A Next.js removal session runs in parallel and edits the same lists: rebase onto `origin/main` before merge and
  keep both changes.

## Docs

`react/19/README.md` (dev, build, preview, run the API), `CLAUDE.md` (repo tree, create commands) and the root
`README.md`.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- `npm create @mionjs/starter-react` (via the root create e2e test) gives a project whose dev server, build, vitest
  and Playwright e2e pass on the local-registry mion build.
- No workaround for a mion bug in the starter.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.

## Plan: React 19 + Vite SPA starter (approved 2026-11-03)

- Router: React Router 8 (`react-router`, `createBrowserRouter`), SPA only. Picked over TanStack Router: same shape
  as the Vue starter's `vue-router` list, nothing generated.
- Scaffold from `npm create vite@latest -- --template react-ts` into `react/19/` (own commit), then add mion.
- One `vite.config.ts` (`react()` + `mionVitePlugin` with `server.entry` = `api/src/server.node.ts`,
  `server.build.outDir` = `dist-server`), one root `tsconfig.json`, Node API only.
- Copy from the Vue starter, ported to React: the home page, the mion orders page (batch demo in `orders-batch.ts`),
  the raw API tests, the typed client test with an in-process `globalSetup`, the 5 Playwright smoke tests.
- Register `react/19` in `scripts/mion-utils.mjs`, `scripts/pre-publish-test.mjs`, `scripts/publish-all.mjs`, the root
  tests, root `package.json`, `CLAUDE.md` and root `README.md`.
- Starters publish by hand (`scripts/publish-all.mjs`); a GitHub Actions workflow for every starter is filed as its
  own todo.

## What shipped

- `react/19/` as planned. Lint is oxlint (the official scaffold's linter) extending
  `@mionjs/devtools/oxlint-recommended.json`, not ESLint. TypeScript stays on `^6` like the other starters, although
  the scaffold now ships TypeScript 7.
- Page styles are CSS modules (`*.module.css`), React's match for Vue's scoped styles. The layout both pages share
  sits in `app/assets/layout.module.css`, applied as a second class (CSS `composes` makes Vite warn).
- The client uses `export const {routes} = initClient(...)`; batches built from it work in dev, build and tests.
- Verified on the local-registry build of mion `main`: typecheck, oxlint, `vite build`, vitest 10/10, Playwright 7/7,
  the built API on Node, and `npm run test:create:react`.
- Rebased onto `main` after the Next.js removal (#3) landed: the starter lists now hold nuxt, react and vue.
- Fixed along the way, in every starter it applies to: the mion logo and the "alternative to GraphQL" line were
  white on white on the light theme; `create.mjs` took a leading flag (`--no-install`) as the project name;
  `createOrder` took a client-chosen id with no uniqueness check; `npm run preview` backgrounded the API with `&`;
  pages kept the default body margin; the e2e test only logged browser errors. The root create e2e test now also starts the built API with Node.
- mion gaps still on mion `main`, reported, not worked around: `server.build` copies `public/` into `dist-server/`,
  `mion-pure-fns/` lands in the public `dist/`, and 23 "Sourcemap points to missing source files" warnings on every
  `vite dev` / `vitest` start.
- Filed: `docs/todos/starters-ci-workflow.md` (test and publish the starters from GitHub Actions).
