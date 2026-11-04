---
type: chore
spec: guidelines
status: blocked
created: 2026-11-04
---

# Pin the Nuxt starter to the next mion release

## Why

`nuxt/4` is ported to mion 0.13 and verified on a local-registry build of mion `main`. Its committed
`package.json` pins `@mionjs/*` to `0.13.2`, the latest published release, because a starter is never committed in
local mode. 0.13.2 lacks the mion fixes the port relies on, so a project created from the published starter today
breaks where `main` works:

- API hot reload in `nuxt dev` (an entry outside the Vite root, and the reload race);
- the mion lint rules on `.vue` files;
- the Cloudflare Worker booting on workerd (edge-safe packages, the `process.env` guard);
- `@mionjs/platform-bun` no longer pulling `@mionjs/devtools` and the native compiler into production installs.

Blocked until mion publishes a release with those fixes.

## Direction

- `npm run mionupdate -- <new version> nuxt/4`, commit the npm-mode `package.json` and `package-lock.json`.
- Run the root `create-starter-nuxt` test in npm mode, cold and warm, plus `preview:api:bun` and
  `preview:api:cloudflare` against the e2e suite.
- Bump the starter's `version` and add an `updatelogs/` entry, then publish.
