import { domainFactory } from "@packages/free/domain/domain.factory";

import appTypes from "./types";

export const {
	createSchema,
	createStore,
	createEntity,
	createRepositories,
	modelsFactory,
	componentFactory,
} = domainFactory({
	appTypes,
	entityNames: [
		"user",
		"folder",
		"nature",
		"document",
		"file",
		"email",
	],
});
