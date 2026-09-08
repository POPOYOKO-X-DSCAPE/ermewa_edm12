import type { SidebarDocument } from "@src/presentation/contracts/side-bar.interface";

const FOLDER_PREFIX = "folder:";
const DOCUMENT_PREFIX = "document:";

export const resolveFolderSidFromNodeId = (folderId: string): string =>
	folderId.startsWith(FOLDER_PREFIX)
		? folderId.slice(FOLDER_PREFIX.length)
		: folderId;

export const resolveDocumentCodeFromNode = (
	document: Pick<SidebarDocument, "id" | "path">,
): string => {
	const [, folderSid, natureCode] = document.path;
	const prefix = `${DOCUMENT_PREFIX}${folderSid}:${natureCode}:`;

	return document.id.startsWith(prefix)
		? document.id.slice(prefix.length)
		: document.id;
};
