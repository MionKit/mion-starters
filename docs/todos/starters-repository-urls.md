---
type: fix
spec: guidelines
status: ready
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
  `https://github.com/MionKit/mion-starters/issues` in `nextjs/16`, `nuxt/4` and `vue/3` `package.json`.

## Done when

- The three starters' `repository` and `bugs` links open the real repository.
