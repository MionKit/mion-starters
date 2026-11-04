# Nuxt 4 + mion Starter

A Nuxt 4 SPA (`ssr: false`) with a [mion](https://mion.io) API that runs on Node, Bun or Cloudflare Workers.

## Setup

```bash
npm install
```

## Development

The mion API runs inside `nuxt dev`, under `/api/mion`.

```bash
npm run dev   # open http://localhost:3000
```

## Build

Each `build:api` script builds one API target into `api/dist/`.

```bash
npm run build                 # Nuxt app into .output/, Node API into api/dist/
npm run generate              # static SPA only, into .output/public/
npm run build:api             # Node
npm run build:api:bun         # Bun
npm run build:api:cloudflare  # Cloudflare Workers
```

## Preview

```bash
npm run preview:api             # the built Node API, on port 3001
npm run preview:api:bun         # or the Bun API
npm run preview:api:cloudflare  # or the Worker, on local workerd through npx wrangler
npm run preview                 # in a second terminal: the built app, forwarding /api/mion to the API
```

## Deploy

The browser calls `/api/mion` on the app's own origin (proxy mode):

- `npm run build`: the Nuxt server forwards `/api/mion/**` to `MION_API_URL` (default `http://localhost:3001`),
  read at build time.
- `npm run generate`: host `.output/public/` on a CDN and rewrite `/api/mion/*` to the API.
  `deploy/wrangler.toml` deploys the Worker for Cloudflare.

An API on another domain needs CORS: add the [`mionSecurity`](https://mion.io/rpc/middlewares/security) middleware with the app's origin.

## Test

```bash
npm run typecheck   # nuxi typecheck + tsc for the API entries
npm run lint        # eslint with the Nuxt and mion rules
npm run test:unit   # vitest: raw API calls and the typed client
npm run test:e2e    # playwright, on nuxt dev
npm run test:e2e:build # playwright, on the npm run build output
```

## Project Layout

- `app/`: Nuxt SPA (pages, mion client, batch calls in `app/lib/`)
- `api/`: mion API (routes, models, repository, server entries, `vite.config.ts` for the API bundles)
- `tsconfig.mion.json`: one TypeScript program for the app and the API, used by mion

Write `batch()` calls in `.ts` modules that use the module-level client from `app/lib/mion-client.ts`, like
`app/lib/orders-batch.ts`. Pages only call those functions.

## Learn More

- [mion docs](https://mion.io)
- [Nuxt docs](https://nuxt.com/docs)
