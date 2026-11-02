#!/bin/bash
# usage: ROOT=web|. ./run-batch.sh ; boots vite with NO batch, then adds a batch to web/main.ts (batch table appears)
cd "$(dirname "$0")"
cp web/main.ts.orig web/main.ts; rm -rf .mion
setsid npx vite --port 3102 --strictPort > vite.log 2>&1 & PGID=$!
for i in $(seq 1 30); do sleep 1; curl -s -m1 localhost:3102/api/hello >/dev/null && break; done
curl -s localhost:3102/ > /dev/null; curl -s localhost:3102/main.ts > /dev/null
echo "hello before: $(curl -s -X POST localhost:3102/api/hello -H 'content-type: application/json' -d '{"hello":["x"]}')"
cat >> web/main.ts <<'EOT'
import {batch} from '@mionjs/client';
const a = routes.hello('a');
const b = routes.hello('b');
batch([a, b]).call().then((r) => console.log(r));
EOT
sleep 1; curl -s localhost:3102/main.ts > /dev/null; sleep 3
ls .mion/rpc 2>/dev/null | tr '\n' ' '; echo
echo "hello after batch added: $(curl -s -X POST localhost:3102/api/hello -H 'content-type: application/json' -d '{"hello":["y"]}')"
echo "hello again: $(curl -s -X POST localhost:3102/api/hello -H 'content-type: application/json' -d '{"hello":["z"]}')"
cp web/main.ts.orig web/main.ts
kill -- -$PGID 2>/dev/null; sleep 1
