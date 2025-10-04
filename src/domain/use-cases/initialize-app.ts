import services from "@/infra-structures/services";

import type {
	AppProfileResponse,
	DisplaySelectResponse,
	FolderTreeResponse,
} from "@/interface-adapters/external-types";
import { adaptAppProfileResponse } from "@/interface-adapters/gateways";
import adaptDisplaySelectResponse from "@/interface-adapters/gateways/display-select/response-adapter";
import adaptFolderTreeResponse from "@/interface-adapters/gateways/folder-tree/response-adapter";
import extractInitialFolderPath from "../parts/extract-initial-folder-path";

const initializeApp = async () => {
	const [
		appProfileResponse,
		folderTreeResponse,
		displaySelectResponse,
	] = await Promise.all([
		// @ts-ignore explanation<typescript technical debt [services layer]>
		services.ermewa.get.appProfile<AppProfileResponse>(),
		// @ts-ignore explanation<typescript technical debt [services layer]>
		services.ermewa.get.folderTree<FolderTreeResponse>(),
		// @ts-ignore explanation<typescript technical debt [services layer]>
		services.ermewa.get.displaySelect<DisplaySelectResponse>(),
	]);

	const [appProfileJson, folderTreeJson, displaySelectJson] =
		await Promise.all([
			appProfileResponse.data.json(),
			folderTreeResponse.data.json(),
			displaySelectResponse.data.json(),
		]);

	const payload = {
		appProfile: adaptAppProfileResponse(appProfileJson),
		folderTree: adaptFolderTreeResponse(folderTreeJson.xTree),
		displaySelect: adaptDisplaySelectResponse(displaySelectJson),
		appTitle: "EDM <offline mode>",
	};

	console.log(payload);

	return {
		...payload,
		loadingPath: payload.folderTree
			? extractInitialFolderPath(payload.folderTree)
			: [],
	};
};

export default initializeApp;
