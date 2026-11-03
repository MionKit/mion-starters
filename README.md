# Mion Starters

Starter templates for new [mion](https://mion.io) projects, one `npm create` package per framework.

```bash
npm create @mionjs/starter-nuxt my-app
npm create @mionjs/starter-react my-app
npm create @mionjs/starter-vue my-app
```

## Repo Structure

```
mion-starters/
├── nuxt/4/       # @mionjs/create-starter-nuxt
├── react/19/     # @mionjs/create-starter-react
├── vue/3/        # @mionjs/create-starter-vue
├── scripts/      # dev and publish scripts
└── tests/        # root tests for the create scripts
```

Each starter is a self-contained project (own `package.json`, `tsconfig.json`), not a monorepo. Starters are versioned
by their framework's major version. All of them ship the same Orders showcase API.

## Developing Against a Local mion

With the [mion repo](https://github.com/MionKit/mion) cloned and set up next to this one (`../mion`):

```bash
npm run mionlink      # build ../mion, publish it to a local registry, switch every starter to it
npm run mionstop      # stop the local registry
npm run mionupdate    # back to the npm-published packages
```

Details are in [CLAUDE.md](CLAUDE.md#mion-packages).

## Root Tests

```bash
npm test              # every root test: create each starter, build it, run its tests
```

## License

[MIT](LICENSE)
