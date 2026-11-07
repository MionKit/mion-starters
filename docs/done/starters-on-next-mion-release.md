---
type: chore
spec: guidelines
status: ready
created: 2026-11-04
---

# Pin the Nuxt, React and Vue starters to the next mion release

## Why

`nuxt/4`, `react/19` and `vue/3` are ported to mion 0.13 and verified on a local-registry build of mion `main`. Their
committed `package.json` files pin `@mionjs/*` to `0.13.2`, the latest published release, because a starter is never committed
in local mode. 0.13.2 lacks the mion fixes the ports rely on, so a project created from the published starters
today breaks where `main` works:

- the mion lint rules on `.vue` files: in npm mode the root create test's `lints` step fails for Vue with
  `resolver failed: scanFiles [app/pages/MionOrdersPage.vue]: source file not in program`;
- API hot reload with an entry outside the Vite root, and the reload race (Nuxt);
- the Cloudflare Worker booting on workerd (edge-safe packages, the `process.env` guard);
- `@mionjs/platform-bun` no longer pulling `@mionjs/devtools` and the native compiler into production installs.

mion 0.14.0, published with those fixes, unblocks it.

## Direction

- `npm run mionupdate -- <new version>` for all three starters, commit the npm-mode `package.json` and `package-lock.json`.
- Run the root create tests for every starter in npm mode, cold and warm, plus each starter's own tests.
- Bump each starter's `version` and add an `updatelogs/` entry, then publish.

## Plan: mion 0.14.0 (approved 2026-11-07)

- `npm run mionupdate -- 0.14.0` for `nuxt/4`, `react/19`, `vue/3`; commit npm-mode `package.json` + `package-lock.json`.
- Root `npm test` in npm mode, cold (empty npm cache) then warm (same cache), plus each starter's `npm test`.
- Check the four 0.13.2 issues are gone on 0.14.0: `.vue` lint, Nuxt API hot reload, workerd boot,
  `platform-bun` production install.
- All three starters get version 0.4.0, with `updatelogs/from-0.3.0-to-0.4.0.md` (Nuxt, Vue) and
  `updatelogs/from-0.1.0-to-0.4.0.md` (React), then `scripts/pre-publish-test.mjs`.
- Publishing stays with the maintainer (2FA).
