import type { NatureObject } from "@/domain/types/folder-tree";
import services from "@/infra-structures/services";
import type {
	NatureMaskResponse,
	NaturesResponse,
} from "@/interface-adapters/external-types";

import { adaptNatureMasks } from "@/interface-adapters/gateways/";
import { adaptNatures } from "@/interface-adapters/gateways/";

type FolderKeys = { object: string; sid: string };

const loadFolder = async (
	folderKeys: FolderKeys,
	isSupervisor?: boolean,
): Promise<NatureObject[]> => {
	const { object: folderName } = folderKeys;
	const showRemovedDocuments = isSupervisor;

	try {
		const [natureMaskResponse, naturesResponse] = await Promise.all([
			// @ts-ignore explanation<typescript technical debt [services layer]>
			services.ermewa.get.naturesMasks<NatureMaskResponse>({
				params: { ...folderKeys },
			}),
			// @ts-ignore explanation<typescript technical debt [services layer]>
			services.ermewa.get.natures<NaturesResponse>({
				params: { ...folderKeys },
			}),
		]);

		const [natureMaskJson, naturesJson] = await Promise.all([
			natureMaskResponse.data.json(),
			naturesResponse.data.json(),
		]);

		const natureMask = adaptNatureMasks(
			natureMaskJson,
			showRemovedDocuments,
		);
		const natures = adaptNatures(naturesJson);

		const result: NatureObject[] = natures[folderName]
			? Object.values(natures[folderName].natures).map((nature) => ({
					...natureMask[nature.code],
					folderName,
					config: nature,
				}))
			: [];

		return result.filter((nature) => nature.headers?.isMaster);
	} catch (e) {
		console.error("Failed to load folder content", e);
		return [];
	}
};

export default loadFolder;
