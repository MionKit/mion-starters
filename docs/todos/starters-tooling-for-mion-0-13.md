---
type: chore
spec: guidelines
status: ready
created: 2026-11-02
---

# Shared starter tooling for mion 0.13: local registry, version update, create script, repo docs

## Intent

The three starter ports to mion 0.13 share tooling that is broken or stale today. Land it first, so each port can
run against a locally built mion while mion bugs found during the migration are fixed upstream, and so the create
flow and repo docs match how 0.13 works.

Full investigation, including the per-starter spike reports: `docs/investigations/mion-0.13-migration/` (start
with its README).

## Direction

The implementer plans the details. Verified pointers:

- **Local mion packages through a registry, not `file:` tarballs.** `scripts/mionlink.mjs` calls
  `../mion/scripts/pack-packages.sh` and reads `test-publish/tarballs`, neither of which exists in mion any more.
  `file:` tarballs also cannot resolve `@mionjs/bin-compiler`'s per-platform `@mionjs/native-compiler-<os>-<arch>`
  optional dependency. mion's own pre-publish e2e already solves this with a throwaway verdaccio:
  `.github/verdaccio.yaml` (serves `@mionjs/*` only from local publishes, proxies the rest),
  `scripts/release/build-binaries.mjs --host-only`, `scripts/release/pack.mjs` (output `tarballs/`) and
  `scripts/release/publish-tarballs.mjs --registry <url>`. Reuse that flow: build mion, start verdaccio, publish,
  point each starter at the registry (project `.npmrc` or `--registry`), clean caches, install. Use a prerelease
  version so a locally built package never collides with the same version from npmjs in the npm cache; mion's
  `bump-version.mjs` only accepts `X.Y.Z` today, so this may need a small mion-side change or a local-only bump.
  Rework or replace `mionlink` and the `file:` + `overrides` handling in `scripts/mion-utils.mjs` accordingly.
- **`mionupdate` must respect version lines.** `updateDeps` in `scripts/mion-utils.mjs` writes one version to
  every `@mionjs/*` dep, but `@mionjs/drizzle-orm*` ride drizzle's line (0.45.x). Resolve each package's version
  on its own line (for example `npm view <pkg> version` per package, or the `versionLine` marker in mion's
  package.json files). `findStarterPackageJsons` still looks for an `api/package.json` no starter has.
- **`create.mjs` (same shape in all three starters).** Exclude generated state: `.mion`, and each host's output
  (`dist-server`, `.wrangler`, `.data`, `next-env.d.ts`, drizzle migrations output). Set the package name from the
  folder name (`basename(targetDir)`), never the raw argument: 0.13 uses the package name as a path segment in
  generated pure-function modules, and the root tests pass an absolute path. Add `.mion` (keep
  `.mion/enriched/`) and host outputs to `gitignore` and `.npmignore`, or a maintainer's local `.mion` gets
  published. Whether to also strip `description`, `homepage`, `author`, `version`, `license` is open.
- **Root tests** (`tests/create-*.test.ts`): also run each starter's build (and unit tests / typecheck where it
  has them), which catches the package-name bug above and the two-bundle builds.
- **`scripts/pre-publish-test.mjs` / `scripts/publish-all.mjs`**: not checked by the investigation; confirm they
  still fit the new package set and the registry flow.
- **Repo docs.** `CLAUDE.md` is stale for 0.13: the "NEVER use `import type`" rule is obsolete (verified;
  Nuxt even requires `import type`), the route pattern is now `createMionRouter` + `mion.query` /
  `mion.mutation` from a shared `api/src/router.ts`, there is one tsconfig program for client and server, `api/`
  is a source folder and not a package, batches live in `.ts` modules with a module-level `initClient()`, and the
  mion package list changed (`@mionjs/run-types`, `@mionjs/bin-compiler`, `@mionjs/drizzle-orm*`, no
  `@mionjs/type-formats`, no `@mionjs/drizzle`). Update the dev workflow section for the registry flow. Also check
  the `update-deps` skill (`.claude/skills/update-deps/SKILL.md`) for anything that assumes the old setup.
- **Toolchain floor.** The starters run on Node 26 / npm 11 in the investigation; `next.config.mts` needs Node with
  native TypeScript (22.18+). TypeScript stays on `^6` (TS 7 breaks vue-tsc and typescript-eslint). Decide whether
  to state an `engines` field.

## Docs

`CLAUDE.md` (sections "Repo Structure", "Mion API Structure", "Code Style", "Mion Route Pattern", "Mion Packages")
and each starter's `README.md` where it describes the dev workflow.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- One command builds the local mion tree into a local registry and switches every starter to it; one command
  switches back to published versions, each package on its own version line.
- `create.mjs` in all three starters produces a project that builds with the package name it was given, carries no
  generated state, and the root tests run the build.
- `CLAUDE.md` describes 0.13, with no rule that only applied to deepkit.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.
