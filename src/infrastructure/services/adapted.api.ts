import adapters from "@src/interface-adapters/gateways";

import { api } from "./raw.api";

export const adaptedApi = api.withAdapters(...adapters);
