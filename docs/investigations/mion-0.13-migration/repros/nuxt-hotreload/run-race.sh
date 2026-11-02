#!/bin/bash
# ROOT=. ./run-race.sh ; edits the API (hot reload) then fires 8 parallel requests every 50ms for ~1.5s
cd "$(dirname "$0")"
cp api/server.ts.orig api/server.ts
setsid npx vite --port 3102 --strictPort > vite.log 2>&1 & PGID=$!
for i in $(seq 1 30); do sleep 1; curl -s -m1 localhost:3102/api/hello >/dev/null && break; done
curl -s -X POST localhost:3102/api/hello -d '{"hello":["warm"]}' > /dev/null
echo "// edit $(date +%s%N)" >> api/server.ts; sleep 0.5
for r in $(seq 1 30); do for j in $(seq 1 8); do (curl -s -m 10 -X POST localhost:3102/api/hello -d '{"hello":["x"]}' | cut -c1-60; echo) & done; sleep 0.05; done 2>/dev/null | grep -v '^$' | sort | uniq -c
cp api/server.ts.orig api/server.ts
kill -- -$PGID 2>/dev/null; sleep 1
