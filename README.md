# Mion Starters

Starter templates and CLI for scaffolding [mion](https://mion.io) into new or existing projects.

## Structure

```
mion-starters/
├── cli/                  # CLI tool (@mionkit/starter)
├── nextjs/
│   └── 16/               # Next.js 16 starter
├── nuxt/                 # (planned)
│   └── 4/
└── standalone/           # (planned)
```

Each starter is a **self-contained project** (own `package.json`, `tsconfig.json`, etc.) — no monorepo. Starters can be copied as-is to bootstrap a new project.

Starters are versioned by the major version of their framework (e.g. `nextjs/16`, `nuxt/4`).

## Starters

### Next.js 16

Full-stack Next.js 16 app with mion API showcasing:
- Mion server routes and handlers
- Mion client usage from React components
- Orders API showcase (CRUD, models, repository pattern)
- Feature-based folder structure under `api/src/features/`

## CLI

The `@mionkit/starter` CLI can:
- **Create a new project** — copies a full starter into an empty directory
- **Scaffold into existing project** — copies mion-specific files into an already initialized project

```bash
npx @mionkit/starter init
```

## Linking Mion Packages

Mion packages are not yet published to npm. Link them locally from the [mion monorepo](https://github.com/MionKit/mion):

```bash
# From the mion monorepo, link each package:
cd /path/to/mion
npm link -w @mionkit/core -w @mionkit/router -w @mionkit/client -w @mionkit/http # ... etc

# Then in a starter directory:
cd nextjs/16/api
npm link @mionkit/core @mionkit/router @mionkit/client @mionkit/http # ... etc
```

## License

[MIT](LICENSE)
