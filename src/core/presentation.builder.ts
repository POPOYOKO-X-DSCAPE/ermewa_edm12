import { controllerFactory } from "@packages/free/domain/controller.factory";

import { modelsFactory } from "@src/core/domain.builders";
import { repositories } from "@src/domain/repositories";
import stores from "@src/domain/stores";
import { adaptedApi } from "@src/infrastructure/services/adapted.api";

export const createController = controllerFactory({
	api: adaptedApi,
	repositories,
	stores,
});

export const createModels = modelsFactory({
	repositories,
	stores,
});
