---
type: chore
spec: guidelines
status: ready
created: 2026-11-03
---

# Remove the Next.js starter

## Intent

The maintainer dropped Next.js: mion RPC targets SPAs (the browser to server bridge), and Next was only there for
adoption. A React + Vite SPA starter replaces it (its own todo). mion is in beta with no users, so the starter goes
with no deprecation notice and no trace in this repo, and nothing is published or deprecated on npm.

## Direction

The implementer plans the details. Verified on `main` (`f535697`):

- Delete `nextjs/16/` entirely.
- Remove every reference:
  - `STARTER_DIRS` in `scripts/mion-utils.mjs`;
  - the starter lists in `scripts/pre-publish-test.mjs` and `scripts/publish-all.mjs`;
  - the root tests (`tests/create-e2e.test.ts`, `tests/create-output.test.ts`, `tests/mion-utils.test.ts` cases);
  - `CLAUDE.md` (repo tree, create commands, the `create.mjs` exclude notes that only exist for Next: `.next`,
    `next-env.d.ts`, `api/drizzle`), the root `README.md`, `.claude/skills/update-deps/SKILL.md`;
  - the `EXCLUDE` lists in the remaining `create.mjs` files and the `gitignore` / `.gitignore` / `.npmignore`
    entries that only Next needed. Keep them identical across the remaining starters.
- Drizzle goes with it: no other starter has a drizzle showcase. Remove drizzle-only notes the same way.
- Keep `docs/done/` as is: it is the record of past work, Next.js included.
- A React starter session runs in parallel and adds `react` to the same lists: rebase onto `origin/main` before
  merge and keep both changes.

## Docs

`CLAUDE.md` and the root `README.md` (sections listing the starters).

Before opening the PR, run the simplify-docs pass (the `docs-simplifier` subagent) over every page and example
this change touched, review its report against the code, and commit it as its own commit.

## Done when

- No `nextjs` folder, script entry, test case or doc mention remains outside `docs/done/` and this spec.
- The root fast tests (`tests/create-output.test.ts`, `tests/mion-utils.test.ts`) pass.
- The simplify-docs pass ran on every touched page and the simplify-comments pass on every touched source file,
  each committed on its own.

## Plan (approved 2026-11-03)

- Delete `nextjs/16/` and `plans/` (an old, finished Nuxt plan built on the Next.js starter).
- Drop `nextjs` from `STARTER_DIRS`, `pre-publish-test.mjs`, `publish-all.mjs` and the root `test:create:nextjs` script.
- Drop the drizzle pin exception (`onOwnLine`) in `mionupdate.mjs`: no starter uses drizzle.
- `create.mjs` (nuxt, vue): drop `.next`, `next-env.d.ts` and the `api/drizzle` filter. Same for `.npmignore` and the
  root `.gitignore` (`.next`, `out`, `*/*/api/drizzle/`).
- Drop the stale `@mionjs/drizzle` override from the nuxt and vue `package.json` (their lockfiles already lack it).
- Root tests, `CLAUDE.md`, `README.md`, the update-deps skill and `docs/todos/starters-repository-urls.md` follow.
- Unrelated finding fixed in the same PR: committed Playwright `test-results/` removed and gitignored.
