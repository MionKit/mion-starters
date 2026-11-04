---
type: chore
spec: guidelines
status: done
created: 2026-11-04
---

# Remove what the mion 0.13 upgrade left unused in the starters

## Intent

The starters moved from mion 0.8 (deepkit, AOT, vite-node, tarballs) to 0.13, Next.js was removed, React was
added, and Vue and Nuxt were ported, each in its own PR. Sweep the repo as a whole for files, scripts, config and
dependencies nothing uses any more, so every starter ships only what it needs.

## Direction

The implementer plans the sweep. Places to look, verified as having candidates on `main` (`cc9ef96`):

- Dependencies per starter (`react/19`, `vue/3`, `nuxt/4`) and at the root: anything not imported or not run by a
  script. For example: whether the starters need `@mionjs/core` directly, `vue-router` in the Nuxt starter, and
  dependencies vs devDependencies placement (`@nuxt/eslint`). The root `package-lock.json` still lists `vite-node`:
  regenerate the lockfiles once the manifests are clean.
- Leftovers of the 0.8 setup or of Next.js in scripts, `CLAUDE.md`, READMEs, the update-deps skill, ignore files
  and `create.mjs` `EXCLUDE` lists (kept identical across starters).
- Committed local files: `.claude/settings.local.json` holds one person's permissions with stale paths; decide
  whether it belongs in git.
- Consistency between the three starters where it only differs by accident (for example Nuxt uses ESLint, React
  and Vue use oxlint): note it; change only what is clearly leftover.
- Keep `docs/investigations/` if it reaches `main`: it is history.

When unsure whether something is used, list it in the PR instead of deleting it.

## Docs

`CLAUDE.md`, the root `README.md` and each starter's `README.md`, only where they describe removed things.

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- Every candidate is removed or listed in the PR with why it stays; each starter's tests and the root tests pass on
  the local-registry mion build.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.

## Plan: sweep (approved 2026-11-04)

Remove:

- `.claude/settings.local.json`: one person's permissions with stale paths. Untracked, ignored in the root `.gitignore`.
- `.vercel` in every `create.mjs` `EXCLUDE`, `nuxt/4/.npmignore` and the root `.gitignore`: Vercel is no target.
- The `@mionjs/*` `overrides` cleanup in `writeVersions` and its tests, and the `overrides` read in
  `pre-publish-test.mjs`: only the tarball setup wrote those overrides.
- Tailwind / PostCSS in the update-deps skill: no starter uses them.

Change:

- Root `vitest` `^3` to `^5`, as in the starters: drops `vite-node` from the root lockfile.
- Nuxt `@nuxt/eslint` to `devDependencies`, next to `eslint`.
- update-deps skill: compare oxlint, not the scaffold's ESLint, for React and Vue (create-vue's `--eslint` adds
  both, it has no oxlint-only option), and compare `.oxlintrc.json`.
- Regenerate every lockfile.

Keep:

- `@mionjs/core` in every starter: `orders-repository.ts` imports `randomUUID_V7` from it.
- Nuxt `vue` + `vue-router`: not imported, but Nuxt's official template ships both and update-deps compares with it.
- Accidental-looking differences that are choices: Nuxt lints with ESLint (`@nuxt/eslint`), React and Vue with oxlint;
  React targets Node only; React has no `updatelogs/` yet.
- `updatelogs/`: history.
- `hasFileDeps` in `pre-publish-test.mjs`: still refuses a hand-written `file:` mion dependency before publishing.
- `.wrangler` / `.data` in React's ignore files: `tests/create-output.test.ts` keeps one list for every starter.
