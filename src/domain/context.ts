import { createEnvironment } from "@packages/free";

import type {
	FolderTreeInterface,
	NatureMaskInterface,
	NaturesInterface,
} from "./types";

export const { environment: context } = createEnvironment<{
	masks: {
		[key: string]: NatureMaskInterface;
	};
	// documents: DocumentInterface[];
	// WIP:
	_folderTree: FolderTreeInterface | undefined;
	_naturesConfig: NaturesInterface[string] | undefined;
	_selectedSid: string;
	_selectedNatureCode: string;
	_documentId: string;
	_selectedFileId: string;
}>({
	masks: {},
	// documents: [],
	// WIP:
	_folderTree: undefined,
	_naturesConfig: undefined,
	_selectedSid: "",
	_selectedNatureCode: "",
	_documentId: "",
	_selectedFileId: "",
});
