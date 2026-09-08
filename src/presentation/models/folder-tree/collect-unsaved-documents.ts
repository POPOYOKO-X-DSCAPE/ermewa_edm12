import type {
	SidebarDocument,
	SidebarFolder,
	SidebarNature,
} from "../../contracts/side-bar.interface";

export const collectUnsavedDocuments = (
	nodes: readonly (SidebarFolder | SidebarNature | SidebarDocument)[],
): SidebarDocument[] => {
	const out: SidebarDocument[] = [];

	for (const node of nodes) {
		if (node.type === "document") {
			if (node.badge === "N" || node.badge === "M") {
				out.push(node);
			}
			continue;
		}

		out.push(...collectUnsavedDocuments(node.children));
	}

	return out;
};
