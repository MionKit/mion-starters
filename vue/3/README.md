# Vue 3 + mion Starter

A full-stack starter that pairs a Vue 3 SPA (Vite + Vue Router) with a [mion](https://mion.io) API. The API deploys
to Node, Bun or Cloudflare Workers.

## Setup

```bash
npm install
```

## Development

Runs the Vite dev server with the mion API inside it, under `/api/mion`:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

Each build emits the SPA into `dist/` and the API for one target into `dist-server/`:

```bash
npm run build             # Node: dist-server/server.node.js
npm run build:bun         # Bun: dist-server/server.bun.js
npm run build:cloudflare  # Cloudflare Workers: dist-server/cloudflare-worker.js
```

## Preview

```bash
npm run preview:api # after `npm run build`: the API on Node, port 3001
npm run preview     # in a second terminal: the SPA, forwarding /api/mion to the API
```

- Bun: `npm run build:bun`, then `npm run preview:bun` in place of `preview:api`.
- Cloudflare Workers: `npm run build:cloudflare`, then `npm run preview:cloudflare`. One Worker serves the SPA and
  the API on [http://localhost:8787](http://localhost:8787), the way `wrangler.toml` deploys them.

## Deploy

- Node or Bun: copy `dist/` to any static host or CDN and run the matching file in `dist-server/`.
- Cloudflare Workers: `npm run build:cloudflare`, then `npx wrangler deploy`.

## Test

```bash
npm run typecheck   # vue-tsc
npm run lint        # oxlint with the mion rules
npm run test:unit   # vitest: raw API calls and the typed client
npm run test:e2e    # playwright
```

## Project Layout

- `app/`: Vue SPA (pages, router, mion client, batch calls)
- `api/`: mion API (routes, models, repository, one entry per deploy target)

Write `batch()` calls in `.ts` modules that use the module-level client from `app/mion-client.ts`, like
`app/orders-batch.ts`. Vue components only call those functions.

## Learn More

- [mion docs](https://mion.io)
- [Vue docs](https://vuejs.org)
- [Vue Router docs](https://router.vuejs.org)
