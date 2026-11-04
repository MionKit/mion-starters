---
type: fix
spec: guidelines
status: done
created: 2026-11-02
---

# Point the starters' package metadata at the real repository

## Intent

Every starter's `package.json` sends `repository.url` and `bugs.url` to `github.com/mionjs/mion-starters`, but the
repository lives at `github.com/MionKit/mion-starters`. If `mionjs` is not a GitHub alias of `MionKit`, the npm page
of every `@mionjs/create-starter-*` package links to a missing repository and issue tracker.

## Direction

- Check whether `https://github.com/mionjs/mion-starters` resolves (it could not be checked from the sandbox that
  found this: the proxy blocked it).
- If it does not: set `repository.url` to `git+https://github.com/MionKit/mion-starters.git` and `bugs.url` to
  `https://github.com/MionKit/mion-starters/issues` in every starter `package.json`.

## Done when

- Every starter's `repository` and `bugs` links open the real repository.

## Plan: fix the links (approved 2026-11-04)

- `github.com/mionjs/mion-starters` does not resolve: git asks for a login, which GitHub does for a missing repository.
  Every mion package already links to `github.com/MionKit/mion`.
- `react/19`, `vue/3` and `nuxt/4` `package.json`: `repository.url` and `bugs.url` point at `MionKit/mion-starters`.
- `tests/create-output.test.ts` fails on a wrong `repository` or `bugs` link in any starter.
- No README, `CLAUDE.md` or `create.mjs` output named the wrong repository: `create.mjs` already drops both fields.
