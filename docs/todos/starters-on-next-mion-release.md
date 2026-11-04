---
type: chore
spec: guidelines
status: blocked
created: 2026-11-04
---

# Pin the Nuxt and Vue starters to the next mion release

## Why

`nuxt/4` and `vue/3` are ported to mion 0.13 and verified on a local-registry build of mion `main`. Their committed
`package.json` files pin `@mionjs/*` to `0.13.2`, the latest published release, because a starter is never committed
in local mode. 0.13.2 lacks the mion fixes both ports rely on, so a project created from the published starters
today breaks where `main` works:

- the mion lint rules on `.vue` files: in npm mode the root create test's `lints` step fails for Vue with
  `resolver failed: scanFiles [app/pages/MionOrdersPage.vue]: source file not in program`;
- API hot reload with an entry outside the Vite root, and the reload race (Nuxt);
- the Cloudflare Worker booting on workerd (edge-safe packages, the `process.env` guard);
- `@mionjs/platform-bun` no longer pulling `@mionjs/devtools` and the native compiler into production installs.

Blocked until mion publishes a release with those fixes.

## Direction

- `npm run mionupdate -- <new version> nuxt/4 vue/3`, commit the npm-mode `package.json` and `package-lock.json`.
- Run the root `create-starter-nuxt` and `create-starter-vue` tests in npm mode, cold and warm.
- Bump each starter's `version` and add an `updatelogs/` entry, then publish.
