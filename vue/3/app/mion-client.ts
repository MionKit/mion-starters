import { initClient } from "@mionjs/client";
import type { MyApi } from "../api/src/api.ts";

export const mionClient = initClient<MyApi>({
  baseURL: window.location.origin,
  basePath: "api/mion",
});
