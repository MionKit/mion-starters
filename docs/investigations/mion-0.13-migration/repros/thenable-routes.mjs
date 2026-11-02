// node repros/thenable-routes.mjs  (run from a dir with @mionjs/client installed)
import {initClient} from '@mionjs/client';
const {routes} = initClient({baseURL: 'http://localhost:1'});
console.log('typeof routes.then =', typeof routes.then); // 'function': the proxy is a thenable
const timeout = new Promise((r) => setTimeout(() => r('TIMED OUT: awaiting the routes proxy never settles'), 1000));
console.log(await Promise.race([(async () => routes)().then(() => 'resolved'), timeout]));
