---
type: chore
spec: guidelines
status: ready
created: 2026-11-02
---

# Shared starter tooling for mion 0.13: local registry, version update, create script, repo docs

## Intent

The three starter ports to mion 0.13 share tooling that is broken or stale today. Land it first. Each port can then
run against a locally built mion while mion bugs found during the migration are fixed upstream, and the create flow
and repo docs match how 0.13 works.

Full investigation: `docs/investigations/mion-0.13-migration/` (start with `README.md`; decisions in
`DECISIONS.md`).

## Direction

The implementer plans the details. Decided and verified pointers:

- **Local mion packages through a registry, not `file:` tarballs.** `scripts/mionlink.mjs` calls
  `../mion/scripts/pack-packages.sh` and reads `test-publish/tarballs`, and neither exists in mion any more. `file:`
  tarballs also cannot resolve `@mionjs/bin-compiler`'s per-platform `@mionjs/native-compiler-<os>-<arch>`
  optional dependency.
  - **Reuse mion's own pre-publish e2e pieces.** Do not add tooling to mion: this flow only serves the starters.
    - `.github/verdaccio.yaml`: serves `@mionjs/*` only from local publishes, proxies everything else.
    - The JS build, then `scripts/release/build-binaries.mjs --host-only`.
    - `scripts/release/pack.mjs`, which writes `tarballs/`.
    - `scripts/release/publish-tarballs.mjs --registry <url>`, which needs no receipt for a local registry.
    - `scripts/release/e2e.mjs` shows how mion starts verdaccio and installs from it.
  - **Flow:** build mion from `../mion`, start verdaccio with that config, publish, point each starter at the
    registry, clean caches, install.
  - **npm cache clash.** A locally built package has the same version as the npmjs one, so install in local mode
    with a dedicated npm cache folder (`npm install --cache <dir>`). If that proves insufficient, stop and report:
    a prerelease version would need a small generic mion change.
  - Rework or replace `mionlink` and the `file:` + `overrides` handling in `scripts/mion-utils.mjs`, and add a
    command to stop the registry.
- **`mionupdate` must respect version lines.** `updateDeps` in `scripts/mion-utils.mjs` writes one version to every
  `@mionjs/*` dep, but `@mionjs/drizzle-orm*` ride drizzle's line (0.45.x). Resolve each package's version on its own
  line, for example with `npm view <pkg> version` per package. Also drop the `api/package.json` lookup in
  `findStarterPackageJsons`: no starter has one.
- **`create.mjs` (same shape in all three starters).**
  - Exclude generated state: `.mion`, plus each host's output (`dist-server`, `.wrangler`, `.data`,
    `next-env.d.ts`, drizzle migrations output).
  - Set the package name from the folder name (`basename(targetDir)`), never the raw argument. 0.13 uses the package
    name as a path segment in generated files, and the root tests pass an absolute path.
  - Remove `description`, `homepage`, `author`, `version` and `license` from the copied `package.json`.
  - Add `.mion` (keeping `.mion/enriched/`) and host outputs to `gitignore` and `.npmignore`. Otherwise a
    maintainer's local `.mion` gets published.
- **Root tests** (`tests/create-*.test.ts`): also run each starter's `npm run build`, plus typecheck and unit tests
  where the starter has them.
- **`scripts/pre-publish-test.mjs` / `scripts/publish-all.mjs`**: the investigation did not check them. Confirm they
  fit the new package set and the registry flow.
- **Repo docs (`CLAUDE.md`)** for 0.13:
  - Add a guideline: **SPA first.** mion's main target is the SPA (the browser to server bridge), so starters prefer
    SPA over SSR.
  - Remove the "NEVER use `import type`" rule. It was a deepkit rule, and `import type` now works (verified; Nuxt
    even requires it).
  - Route pattern: `createMionRouter` in `api/src/router.ts`, plus `mion.query` / `mion.mutation`.
  - Layout: one tsconfig program for client and server; `api/` is a source folder, not a package.
  - Batches go in `.ts` modules with a module-level `initClient()`.
  - Package list: add `@mionjs/run-types`, `@mionjs/bin-compiler` and `@mionjs/drizzle-orm*`; remove
    `@mionjs/type-formats` and `@mionjs/drizzle`.
  - The local registry dev workflow.
  - Also check `.claude/skills/update-deps/SKILL.md` for anything that assumes the old setup.
- **Toolchain.** TypeScript stays on `^6`: TS 7 breaks vue-tsc and typescript-eslint. The Next.js starter states its
  own Node floor.

## Docs

`CLAUDE.md` (sections "Repo Structure", "Mion API Structure", "Code Style", "Mion Route Pattern", "Mion Packages",
plus the new SPA-first guideline) and the root `README.md` if it describes the dev workflow.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- One command builds the local mion checkout into a local registry and switches every starter to it, with the
  native compiler resolved. One command switches back to published versions, each package on its own version line.
- `create.mjs` in all three starters produces a project that builds under the name it was given and carries no
  generated state. The root tests run the build.
- `CLAUDE.md` describes 0.13 and SPA first, with no rule that only applied to deepkit.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.
