# Mion Starters

## Repo Structure
- **Not a monorepo** — each starter and the CLI are independent packages with own `package.json`, `tsconfig.json`, etc.
- Starters are versioned by framework major version: `nextjs/16`, `nuxt/4`, `standalone/1`
- Starters can be copied as root directory when creating a new project

```
mion-starters/
├── cli/                          # @mionjs/starter CLI
├── nextjs/
│   └── 16/                       # Next.js 16 starter
├── nuxt/                         # (planned)
│   └── 4/
└── standalone/                   # (planned)
```

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

## Linking Mion Packages
Packages are not published to npm yet. Link from local mion monorepo:
```bash
# In mion monorepo:
npm link -w @mionjs/core -w @mionjs/router -w @mionjs/client ...
# In starter's api directory:
npm link @mionjs/core @mionjs/router @mionjs/client ...
```

## CLI
The CLI (`cli/`) scaffolds mion into projects — either copying a full starter or specific files into an existing repo. It is a separate package (`@mionjs/starter`).
