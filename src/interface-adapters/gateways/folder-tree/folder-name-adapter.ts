import type { FolderName } from "@/domain/types";
import type { ErmiFolderName } from "@/interface-adapters/external-types";

export const folderNameAdapter = (ermiMessage: ErmiFolderName): FolderName => {
	const adaptEntry = (entry: { SHO: string; DES: string }) => ({
		short: entry.SHO,
		description: entry.DES,
	});

	return {
		...(ermiMessage.ENG && { english: adaptEntry(ermiMessage.ENG) }),
		...(ermiMessage.FRA && { french: adaptEntry(ermiMessage.FRA) }),
		...(ermiMessage.GER && { german: adaptEntry(ermiMessage.GER) }),
		...(ermiMessage[""] && { default: adaptEntry(ermiMessage[""]) }),
	};
};
