#!/bin/bash
# usage: ROOT=web|. ./run.sh ; boots vite, calls hello, adds a `ping` route to api/server.ts, calls ping
cd "$(dirname "$0")"
git checkout -q api/server.ts 2>/dev/null || cp api/server.ts.orig api/server.ts
setsid npx vite --port 3102 --strictPort > vite.log 2>&1 & PGID=$!
for i in $(seq 1 30); do sleep 1; curl -s -m1 localhost:3102/api/hello >/dev/null && break; done
echo "hello: $(curl -s -X POST localhost:3102/api/hello -H 'content-type: application/json' -d '{"hello":["x"]}')"
sed -i 's#hello: mion.query#ping: mion.query((ctx): string => "pong"),\n  hello: mion.query#' api/server.ts
sleep 3
echo "ping after edit: $(curl -s -X POST localhost:3102/api/ping -H 'content-type: application/json' -d '{"ping":[]}')"
cp api/server.ts.orig api/server.ts
kill -- -$PGID 2>/dev/null; sleep 1
