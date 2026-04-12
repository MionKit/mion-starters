# Mion Starters

## Repo Structure
- **Not a monorepo** — each starter is an independent `npm create` package with own `package.json`, `tsconfig.json`, etc.
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

Each starter contains a `create.mjs` bin script that copies the starter files into a new project directory, cleans up the `package.json`, and runs `npm install`.

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
npm run mionupdate              # fetches latest @mionjs/core version from npm and updates all starters
npm run mionupdate -- 0.8.4     # set all @mionjs/* deps to a specific version
```

### Using local tarballs (for development)
```bash
npm run mionlink                # packs mion packages, copies tarballs, and switches deps to file: references
```
This runs `scripts/mionlink.mjs` which packs & copies tarballs from `../mion` into `mion-tarballs/`, rewrites all `@mionjs/*` deps to `file:` references, cleans caches, and runs `npm install` in each starter.

Both scripts share utilities from `scripts/mion-utils.mjs` and handle cleanup + `npm install` automatically.


## Testing & Validation
- Each starter has e2e tests (`npm test` / Playwright). **All e2e tests must pass** before a starter is considered working.
- If any test fails, **stop and investigate the failure** before making further changes. Do not assume failures are unrelated or pre-existing.
- Starters serve as integration/e2e tests for mion itself. If a failure originates in a mion package (build error, missing export, runtime bug), **fix it in the mion repo first** rather than working around it in the starter.

## Root Tests
Root-level e2e tests (`tests/create-starter.test.ts`) verify that each `create.mjs` script correctly copies files and modifies `package.json`. Run with `npm test` from root. Uses vitest.
