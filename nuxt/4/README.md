# Nuxt + mion Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

This starter is configured for **pnpm 11** with supply-chain hardening
(`minimumReleaseAge`, `ignoreScripts`, `allowBuilds` allowlist,
`allowNonRegistryProtocols: false`, exact version pinning). Make sure
pnpm is available (`corepack enable`).

## Setup

Install dependencies:

```bash
pnpm install
```

Because `ignoreScripts: true` blocks lifecycle hooks, the `dev`,
`generate`, and `preview` scripts run `nuxt prepare` inline. If you
ever need to generate Nuxt's types manually:

```bash
pnpm run prepare:nuxt
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm run dev
```

## Production

Build the application for production:

```bash
pnpm run generate    # static / hybrid
# or one of the API targets:
pnpm run build:api
pnpm run build:api:node
pnpm run build:api:bun
pnpm run build:api:vercel
pnpm run build:api:cloudflare
```

Locally preview the production build:

```bash
pnpm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
