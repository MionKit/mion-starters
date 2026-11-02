#!/bin/bash
# Replays the edit sequence that collapsed the broker's Program ("source file not in program") in next dev (Turbopack).
# Needs a running `MION_NEXT_DEBUG=1 next dev -p 4317` in the spike dir.
P=${SPIKE:?set SPIKE to a nextjs/16 checkout with patches/nextjs.patch applied}; D=$P/app
hit() { curl -s -X POST localhost:4317/api/mion/hello -H 'Content-Type: application/json' -d '{"hello":["x"]}' -o /dev/null -w "$1 %{http_code}\n"; }
hit start
mkdir -p $D/newdir && printf "import {initClient} from '@mionjs/client';\nimport type {MyApi} from '@mion-app/api';\nexport async function greet() {\n  const {routes} = initClient<MyApi>({baseURL: 'http://localhost:4317', basePath: 'api/mion'});\n  const [g] = await routes.hello('new file').call();\n  return g;\n}\n" > $D/newdir/helper.ts
sleep 5; hit "after newdir"
mkdir -p $D/repro2 && sed 's/Server Component/x/' $D/mion-server/server-client.ts > $D/repro2/server-client.ts && cp $D/mion-server/actions.ts $D/mion-server/page.tsx $D/repro2/
sleep 5; curl -s -o /dev/null -w "GET /repro2 %{http_code}\n" localhost:4317/repro2
rm -rf $D/repro2 $D/newdir; sleep 3
cd $P && echo 'export type CustomerName = string;' >> api/src/features/orders/orders-models.ts && sed -i "s/import {Order, OrderEvent} from '.\/orders-models.ts';/import {Order, OrderEvent, CustomerName} from '.\/orders-models.ts';/; s/createOrder: mion.mutation((ctx, customer: string,/createOrder: mion.mutation((ctx, customer: CustomerName,/" api/src/features/orders/orders-handlers.ts; cd /
sleep 6; hit "after type edit"
