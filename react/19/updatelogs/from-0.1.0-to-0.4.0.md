# Update Log: v0.1.0 -> v0.4.0

**Date:** 2026-11-07

mion 0.13.2 to 0.14.0. v0.1.0 was never published to npm; the version jumps to 0.4.0 to match the Nuxt and Vue starters.

## Updated

| Package    | From   | To     |
| ---------- | ------ | ------ |
| @mionjs/\* | 0.13.2 | 0.14.0 |

No other dependency changed.

## Issues & Fixes

- **Update logs shipped in the package:** `.npmignore` now leaves out `updatelogs/`, like the other starters,
  so new projects no longer get them.

## Code Changes

- `package.json` sets `engines.node >=24`, the minimum mion 0.14.0 needs.
- The home page (`HomePage.tsx`) adds a **Mion Docs** button (https://mion.io) between **Mion Showcase** and the framework docs
  button, now labeled **React Docs**.
