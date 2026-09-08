import { makeKindRegistry } from "../core/runtime/kind.registry";
import { makeRepositoriesEngine } from "../core/runtime/repositories.engine";
import { createSubscriberEngine } from "../core/runtime/subscriber.engine";
import { baseComponentFactory } from "../domain/component.factory";
import { baseModelsFactory } from "../domain/models.factory";

import { entityBuilder } from "./entity.builder";
import { schemaBuilder } from "./schema.builder";
import { storeBuilder } from "./store.builder";

type TypeEngineLike<D extends Record<string, unknown>> = {
	load(): D;
};

export const domainFactory = <
	D extends Record<string, unknown>,
	const ENames extends readonly string[],
>(config: { appTypes: TypeEngineLike<D>; entityNames: ENames }) => {
	const { appTypes, entityNames } = config;

	const { refs, kindMap } = makeKindRegistry(entityNames);

	const subscriber = createSubscriberEngine();

	const { createSchema } = schemaBuilder({ appTypes });

	const { createStore } = storeBuilder({
		appTypes,
		entityNames,
		refs,
		subscriber,
	});

	const { createEntity } = entityBuilder({
		appTypes,
		entityNames,
		refs,
		subscriber,
	});

	const createRepositories = makeRepositoriesEngine({
		appTypes,
		kindMap,
		getId(entity) {
			return entity.meta.id;
		},
		subscriber,
	});

	const modelsFactory = baseModelsFactory({
		subscriber,
	});

	const componentFactory = baseComponentFactory({
		subscriber,
	});

	return {
		createSchema,
		createStore,
		createEntity,
		createRepositories,
		modelsFactory,
		componentFactory,
	};
};
