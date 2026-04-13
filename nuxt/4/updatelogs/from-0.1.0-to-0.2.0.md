# Update Log: v0.1.0 -> v0.2.0

**Date:** 2026-04-13

## Updated

| Package          | From    | To      |
| ---------------- | ------- | ------- |
| nuxt             | ^4.3.1  | ^4.4.2  |
| vue              | ^3.5.29 | ^3.5.32 |
| vue-router       | ^4.6.4  | ^5.0.4  |
| @playwright/test | ^1.58.2 | ^1.59.1 |
| eslint           | ^9      | ^10     |
| vite-node        | ^5.3.0  | ^6.0.0  |

## Skipped

| Package      | Current | Available | Reason                                     |
| ------------ | ------- | --------- | ------------------------------------------ |
| typescript   | ^5      | 6.0.2     | mion compatibility with v6 uncertain       |
| @nuxt/eslint | ^1.15.2 | 1.15.2    | already latest                             |
| @mionjs/\*   | 0.8.6   | —         | managed separately via `mionupdate` script |

## Issues & Fixes

- **vue-router 4 -> 5 (major):** Works seamlessly with Nuxt 4.4. No code changes required.
- **eslint 9 -> 10 (major):** `@nuxt/eslint` supports both `^9` and `^10`. Lint runs without new errors (pre-existing lint issues in `debug-aot-*.js` files are unrelated).
- **vite-node 5 -> 6 (major):** No issues, mion dev server middleware works correctly.
- **Hydration warnings:** Pre-existing hydration mismatch warnings on the orders page. Not caused by these updates.
- **`/_assets/` Vue Router warning:** Cosmetic server-side warning from Nuxt's internal asset path handling. Not caused by these updates.
