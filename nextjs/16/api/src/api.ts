import { initMionRouter, PublicApi, query, Routes } from "@mionjs/router";
import { aotCaches } from "virtual:mion-aot/caches";
import { ordersRoutes } from "./features/orders/orders-handlers.ts";

const routes = {
  hello: query((ctx, name: string): string => `Hello ${name}!`),
  getTime: query((ctx): Date => new Date()),
  orders: ordersRoutes,
} satisfies Routes;

export type MyApi = PublicApi<typeof routes>;

export async function initApi() {
  return initMionRouter(routes, { aotCaches, basePath: "api/mion" });
}
