# Mion Starters

## Package manager: pnpm 11
The repo and every starter use **pnpm 11** with supply-chain hardening
mirroring the mion repo (`minimumReleaseAge`, `ignoreScripts: true`,
`allowBuilds` allowlist, `allowNonRegistryProtocols: false`, exact
version pinning). Settings live in `pnpm-workspace.yaml` files — one
at the repo root and one inside each starter (so end-users who run
`npm create @mionjs/starter-*` inherit the same protections).

Enable corepack to get the pinned pnpm version automatically:
```bash
corepack enable
```
Or install pnpm globally: `npm i -g pnpm@11`.

## Repo Structure
- **Not a monorepo** — each starter is an independent `npm create` package with its own `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, etc.
- Starters are versioned by framework major version: `nextjs/16`, `nuxt/4`, `vue/3`, `standalone/1`
- Each starter is published as a `create-*` package and can be used via `npm create`

```
mion-starters/
├── nextjs/
│   └── 16/                       # @mionjs/create-starter-nextjs
├── nuxt/
│   └── 4/                       # @mionjs/create-starter-nuxt
├── vue/
│   └── 3/                       # @mionjs/create-starter-vue
├── standalone/                   # (planned)
└── tests/                        # Root-level e2e tests for create scripts
```

## Creating a New Project
```bash
npm create @mionjs/starter-nextjs my-app
npm create @mionjs/starter-nuxt my-app
npm create @mionjs/starter-vue my-app
```

Each starter contains a `create.mjs` bin script that copies the starter files into a new project directory, cleans up the `package.json`, and runs `pnpm install` (Nuxt also runs `pnpm exec nuxt prepare`).

## Mion API Structure (shared across all starters)
Each starter contains an `api/` sub-package with the same folder structure:

```
api/
├── package.json                  # Independent package (own deps, tsconfig, etc.)
├── src/
│   ├── api.ts                    # Route definitions + initApi()
│   ├── models.ts                 # Shared models
│   └── features/                 # Feature-based modules
│       └── orders/               # Orders showcase
│           ├── orders-handlers.ts
│           ├── orders-models.ts
│           └── orders-repository.ts
├── vite.config.ts
└── tsconfig.json
```

All starters implement the same showcase Orders API to demonstrate mion features (routes, client, models, flows). Follow this structure when adding new starters.

## Code Style
- No `I` prefix for interfaces or `T` prefix for type parameters
- Prefer one-liner comments: `/** does this and that */`
- Prefer one-line if statements: `if (condition) doSomething();`
- Don't use `@param` / `@returns` in JSDoc
- NEVER use `import type` for types that need mion runtime reflection

```ts
// WRONG - breaks reflection
import type {TypeFormatParams, Brand} from '@mionjs/core';

// CORRECT
import {TypeFormatParams, Brand} from '@mionjs/core';
```

## Mion Route Pattern
```ts
import {query, mutation, Routes} from '@mionjs/router';

export const myRoutes = {
    // Use query for read-only handlers
    myQuery: query((ctx, param1: string): ReturnType => {
        return fetchSomething(param1);
    }),
    // Use mutation for handlers that modify data
    myMutation: mutation((ctx, param1: string, param2: number): ReturnType => {
        return doSomething(param1, param2);
    }),
} satisfies Routes;
```

## Mion Packages
All `@mionjs/*` packages are published to npm. During development, local tarballs from the mion repo can be used instead.

### Using npm versions (default for CI / release)
```bash
pnpm run mionupdate              # fetches latest @mionjs/core version from npm and updates all starters
pnpm run mionupdate -- 0.8.4     # set all @mionjs/* deps to a specific version
```

### Using local tarballs (for development)
```bash
pnpm run mionlink                # packs mion packages, copies tarballs, and switches deps to file: references
```
This runs `scripts/mionlink.mjs` which packs & copies tarballs from `../mion` into `mion-tarballs/`, rewrites all `@mionjs/*` deps to `file:` references, cleans caches, and runs `pnpm install` in each starter.

### How `@mionjs/*` from local tarballs coexists with `allowNonRegistryProtocols: false`
pnpm 11 doesn't expose a per-package allowlist for `allowNonRegistryProtocols`, so we enforce the "`file:` is OK only for `@mionjs/*`" rule by **workflow**:
- The starter's `pnpm-workspace.yaml` keeps `allowNonRegistryProtocols: false` on disk at all times.
- `mionlink` runs its `pnpm install` with `--config.allowNonRegistryProtocols=true` so the freshly-written `file:../../mion-tarballs/mionjs-*.tgz` refs can resolve. The on-disk config is **not** mutated, so a crashed install can never leave a starter in a relaxed posture.
- At that moment, the only file: refs in any starter's `package.json` are the `@mionjs/*` ones (because mionlink just wrote them in the previous step) — so the exception is effectively scoped to mion's own packages.
- Every other install (including the one end-users run after `npm create`) sees `allowNonRegistryProtocols: false` and rejects file/git/http specifiers wholesale.

`mionupdate` doesn't need this — it puts deps back on npm-registry versions, so the hardened default works as-is.

Both scripts share utilities from `scripts/mion-utils.mjs` and handle cleanup + `pnpm install` automatically.


## Testing & Validation
- Each starter has e2e tests (`pnpm test` / Playwright). **All e2e tests must pass** before a starter is considered working.
- If any test fails, **stop and investigate the failure** before making further changes. Do not assume failures are unrelated or pre-existing.
- Starters serve as integration/e2e tests for mion itself. If a failure originates in a mion package (build error, missing export, runtime bug), **fix it in the mion repo first** rather than working around it in the starter.

## Root Tests
Root-level e2e tests (`tests/create-starter.test.ts`) verify that each `create.mjs` script correctly copies files and modifies `package.json`. Run with `pnpm test` from root. Uses vitest.

## Adding entries to `allowBuilds`
pnpm 11 blocks every dependency install/postinstall script by default. When `pnpm install` reports a blocked build, add the package name to the `allowBuilds:` map in the appropriate `pnpm-workspace.yaml` (root for root-level tooling, or the affected starter's file). Only allow what you've vetted — that's the whole point.

## How `minimumReleaseAge` interacts with the lockfile
`minimumReleaseAge` (7 days / 10080 minutes) applies to **resolution**, not to lockfile-bound installs. Once a `pnpm-lock.yaml` exists, `pnpm install` reuses the pinned versions and skips the age check entirely — so the gate exists primarily to govern **future bumps**.

This makes the bootstrap pattern important: the very first install in a fresh tree has nothing to compare against, so pnpm checks every package. If brand-new ecosystem packages (or those with incomplete `time` metadata on npm) make that initial resolution fail, seed the lockfile once with the gate bypassed:

```bash
pnpm install --config.minimumReleaseAge=0
```

Commit the resulting `pnpm-lock.yaml`. All subsequent installs run with the 7-day gate active, but resolution is skipped, so the gate only triggers when a real dep bump introduces a fresh version. At that point either wait for it to age out or add a targeted `minimumReleaseAgeExclude` entry.
