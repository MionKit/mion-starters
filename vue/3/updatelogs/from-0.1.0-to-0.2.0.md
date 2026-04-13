# Update Log: v0.1.0 -> v0.2.0

**Date:** 2026-04-13

## Updated

| Package    | From    | To      |
| ---------- | ------- | ------- |
| vue        | ^3.5.29 | ^3.5.31 |
| vue-router | ^4.6.4  | ^5.0.4  |
| vitest     | ^4.0.18 | ^4.1.2  |

## Skipped

| Package           | Current  | Available | Reason                                              |
| ----------------- | -------- | --------- | --------------------------------------------------- |
| typescript        | ^5       | ~6.0.0    | mion doesn't support TypeScript 6 yet               |
| vite              | ^7.3.1   | ^8.0.3    | Vite 8 too new, mion vite plugin likely incompatible |
| eslint            | ^9       | ^10.1.0   | Potential compat issues with ts-eslint & mion plugin |
| @vitejs/plugin-vue| ^6       | ^6.0.5    | ^6 already covers 6.0.5                             |
| eslint-plugin-vue | ^10      | ~10.8.0   | ^10 already covers 10.8.0                           |
| typescript-eslint | ^8       | —         | Staying on eslint 9                                 |
| vite-node         | ^5.3.0   | —         | Staying on vite 7                                   |

## Issues & Fixes

- **vue-router v5**: Major version bump from v4. No breaking changes affecting the starter — `createRouter` and `createWebHistory` API unchanged. All tests pass without code modifications.

## Code Changes

- No code changes required. Only `package.json` version bumps.
