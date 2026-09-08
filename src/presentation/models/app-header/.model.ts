import { createModels } from "@src/core/presentation.builder";

import { resolveHeaderRuntime } from "./header-runtime";

export const appHeaderModel = createModels(({ stores }) => ({
	xprmRaw: () => stores.appStore.state.xprmRaw,
	xtreeRaw: () => stores.appStore.state.xtreeRaw,
})).refine(({ models }) => ({
	headerRuntime: () =>
		resolveHeaderRuntime({
			xprmRaw: models.xprmRaw,
			xtreeRaw: models.xtreeRaw,
		}),
}));
