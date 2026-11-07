# Update Log: v0.3.0 -> v0.4.0

**Date:** 2026-11-07

mion 0.13.2 to 0.14.0. v0.3.0 was never published to npm.

## Updated

| Package    | From   | To     |
| ---------- | ------ | ------ |
| @mionjs/\* | 0.13.2 | 0.14.0 |

No other dependency changed.

## Issues & Fixes

0.13.2 lacked mion fixes this starter relies on. Checked gone on 0.14.0:

- **mion lint on `.vue` files:** `npm run lint` no longer fails with `source file not in program`.
- **API hot reload:** editing an API handler during `nuxt dev` reaches the next request within seconds.
- **Cloudflare Worker:** the `build:cloudflare` output boots on workerd and answers `hello`.
- **`@mionjs/platform-bun` production install:** no longer pulls `@mionjs/devtools`, `@mionjs/bin-compiler`,
  the native compiler or `typescript`. `npm install --omit=dev @mionjs/platform-bun` went from 64 MB to 4.4 MB.

## Code Changes

- `package.json` declares `engines.node >=24`, the floor mion 0.14.0 sets.
