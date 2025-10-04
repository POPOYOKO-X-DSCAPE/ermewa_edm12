import type { FolderTreeInterface } from "@/domain/types/folder-tree";
import type { FolderTreeBodyResponse } from "@/interface-adapters/external-types";

import { folderNameAdapter } from "./folder-name-adapter";

const adaptFolderTreeResponse = (
	input: FolderTreeBodyResponse,
	parentPath: string[] = [],
): FolderTreeInterface => {
	const currentPath = [...parentPath, input.SID];

	const output: FolderTreeInterface = {
		sid: input.SID,
		level: input.LEV,
		name: input.XOBJ,
		status: input.XSTA,
		type: input.XTYP,
		path: currentPath,
		...(input.FLD && { folder: input.FLD }),
		...(input.FNAME && { folderName: folderNameAdapter(input.FNAME) }),
		children: [],
		natures: [],
		display: {
			folder: normalizeDisplay(input.FDISPLAY?.FLD),
			sid: normalizeDisplay(input.FDISPLAY?.SID),
		},
		links: input.XLNK ?? {},
	};

	if (input.SOBJ?.length) {
		output.children = input.SOBJ.map((child) =>
			adaptFolderTreeResponse(child, currentPath),
		);
	}

	return output;
};

const normalizeDisplay = (value: boolean | string | undefined) => {
	if (typeof value === "boolean") return value;
	if (typeof value === "string")
		return value === "ondemand" ? "ondemand" : false;
	return false;
};

export default adaptFolderTreeResponse;
