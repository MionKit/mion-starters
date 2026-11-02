// Run from a project with @mionjs/router installed:
//   cp -r node_modules/@mionjs/router node_modules/@mionjs/router-copy && node router-dual-instance.mjs
// Two physical copies of @mionjs/router in one process (what a bundler does per Next server entry, and what a dev
// re-evaluation does): route tables live on globalThis (getOrCreateGlobal), the "created/initialized" flags are
// module scoped. No routes needed: initRouter registers the reserved `@thrownErrors` route before any user route.
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
for (const pkg of ['router', 'router-copy']) {
  const {createMionRouter} = await import(pathToFileURL(resolve(`node_modules/@mionjs/${pkg}/.dist/esm/index.js`)).href);
  try {
    createMionRouter({basePath: 'api'}).initRoutes({});
  } catch (e) {
    console.log(pkg, '->', e.message);
  }
}
