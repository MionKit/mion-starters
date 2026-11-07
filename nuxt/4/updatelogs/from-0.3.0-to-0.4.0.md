# Update Log: v0.3.0 -> v0.4.0

**Date:** 2026-11-07

mion 0.13.2 to 0.14.0. v0.3.0 was never published to npm.

## Updated

| Package    | From   | To     |
| ---------- | ------ | ------ |
| @mionjs/\* | 0.13.2 | 0.14.0 |

No other dependency changed.

## Issues & Fixes

mion 0.14.0 fixes these 0.13.2 bugs in this starter (each checked):

- **mion lint on `.vue` files:** `npm run lint` no longer fails with `source file not in program`.
- **API hot reload:** an edited API handler takes effect within seconds during `nuxt dev`.
- **Cloudflare Worker:** the `build:cloudflare` output boots on workerd and answers `hello`.
- **`@mionjs/platform-bun` production install:** no longer installs `@mionjs/devtools`, `@mionjs/bin-compiler`,
  the native compiler or `typescript`. `npm install --omit=dev @mionjs/platform-bun` went from 64 MB to 4.4 MB.

## Code Changes

- `package.json` sets `engines.node >=24`, the minimum mion 0.14.0 needs.
- The home page (`index.vue`) adds a **Mion Docs** button (https://mion.io) between **Mion Showcase** and the framework docs
  button, now labeled **Nuxt Docs**.
