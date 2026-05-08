import { initClient } from "@mionjs/client";
import { aotCaches } from "virtual:mion-aot/caches";
import type { MyApi } from "../api/src/api.ts";

export const mionClient = initClient<MyApi>({
  aotCaches,
  baseURL: window.location.origin,
  basePath: "api/mion",
});
