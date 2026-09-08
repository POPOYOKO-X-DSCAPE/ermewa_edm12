import type {
	SidebarDocument,
	SidebarFolder,
	SidebarNature,
} from "../../contracts/side-bar.interface";

type SidebarFilters =
	| {
			mandatoryOnly: boolean;
			statuses: readonly number[];
	  }
	| undefined;

const areItemsShallowEqual = <T>(
	left: readonly T[],
	right: readonly T[],
): boolean =>
	left.length === right.length &&
	left.every((item, index) => item === right[index]);

export const filterSidebarTree = (
	tree: readonly SidebarFolder[],
	filters: SidebarFilters,
): readonly SidebarFolder[] => {
	if (!filters) {
		return tree;
	}

	const { statuses, mandatoryOnly } = filters;
	const hasStatusFilter = statuses.length > 0;
	if (!mandatoryOnly && !hasStatusFilter) {
		return tree;
	}

	const statusSet = hasStatusFilter ? new Set(statuses) : undefined;

	const filterDocument = (
		document: SidebarDocument,
	): SidebarDocument | null => {
		if (!statusSet) {
			return document;
		}

		return statusSet.has(document.status.number) ? document : null;
	};

	const filterNature = (
		nature: SidebarNature,
	): SidebarNature | null => {
		if (mandatoryOnly && !nature.content.isMandatory) {
			return null;
		}

		const children = nature.children
			.map(filterDocument)
			.filter((child): child is SidebarDocument => child !== null);

		if (statusSet && children.length === 0) {
			return null;
		}

		if (areItemsShallowEqual(nature.children, children)) {
			return nature;
		}

		return {
			...nature,
			children,
		};
	};

	const filterFolder = (folder: SidebarFolder): SidebarFolder => {
		const children: Array<SidebarFolder | SidebarNature> = [];

		for (const child of folder.children) {
			if (child.type === "folder") {
				children.push(filterFolder(child));
				continue;
			}

			const nextNature = filterNature(child);
			if (nextNature) {
				children.push(nextNature);
			}
		}

		if (areItemsShallowEqual(folder.children, children)) {
			return folder;
		}

		return {
			...folder,
			children,
		};
	};

	const nextTree = tree.map(filterFolder);
	return areItemsShallowEqual(tree, nextTree) ? tree : nextTree;
};
