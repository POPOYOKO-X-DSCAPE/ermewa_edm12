import type { FolderTreeInterface } from "@/domain/types";

function findNodeBySid(
	tree: FolderTreeInterface,
	sid: string,
): FolderTreeInterface | undefined {
	if (tree.sid === sid) {
		return tree;
	}

	if (tree.children) {
		for (const child of tree.children) {
			const foundNode = findNodeBySid(child, sid);
			if (foundNode) {
				return foundNode;
			}
		}
	}

	return undefined;
}

export default findNodeBySid;
