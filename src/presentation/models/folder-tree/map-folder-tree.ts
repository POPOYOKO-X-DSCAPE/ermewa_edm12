import type { EditorStoreBadge } from "@src/domain/stores/document-editor.store.helpers";

import type {
	SidebarDocument,
	SidebarFolder,
	SidebarNature,
} from "../../contracts/side-bar.interface";

export type RawDocument = Readonly<{
	code: string;
	name: string;
	status: { label: string; number: number };
}>;

export type RawNature = Readonly<{
	code: string;
	label: Readonly<{
		short?: string;
		long?: string;
	}>;
	mode: "mono" | "multi";
	isMandatory?: boolean;
	documents?: readonly RawDocument[];
}>;

export type RawFolder = Readonly<{
	sid: string;
	name: string;
	parent?: { sid: string };
	children?: readonly RawFolder[];
	natures?: readonly RawNature[];
}>;

type SidebarBranch = SidebarFolder | SidebarNature;

type DocumentCacheEntry = {
	epoch: string;
	pathKey: string;
	isSelected: boolean;
	badge: EditorStoreBadge | undefined;
	name: string;
	statusNumber: number;
	statusLabel: string;
	value: SidebarDocument;
};

type NatureCacheEntry = {
	epoch: string;
	folderKey: string;
	name: string;
	description: string;
	mode: "mono" | "multi";
	isMandatory: boolean;
	canPaste: boolean;
	children: readonly SidebarDocument[];
	value: SidebarNature;
};

type FolderCacheEntry = {
	epoch: string;
	isRoot: boolean;
	isInitiallyOpen: boolean;
	isLoading: boolean;
	children: readonly SidebarBranch[];
	value: SidebarFolder;
};

type MapFolderTreeInput = {
	selectedDocumentCode: string | undefined;
	expandedFolderSidSet: ReadonlySet<string>;
	loadingFolderSidSet: ReadonlySet<string>;
	badgeByDocumentCode: Readonly<Record<string, EditorStoreBadge>>;
	pasteableNatureKeySet: ReadonlySet<string>;
	statusLabel?: (label: string) => string;
	/** Invalidation token (locale + XPRM revision) so localized labels are refreshed. */
	epoch?: string;
};

type SelectDocument = (
	documentCode: string,
	natureCode: string,
	folderSid: string,
	folderName: string,
) => void;

const areItemsShallowEqual = <T>(
	left: readonly T[],
	right: readonly T[],
): boolean =>
	left.length === right.length &&
	left.every((item, index) => item === right[index]);

export const createFolderTreeMapper = (deps: {
	selectDocument: SelectDocument;
}) => {
	const { selectDocument } = deps;

	const documentCache = new WeakMap<RawDocument, DocumentCacheEntry>();
	const natureCache = new WeakMap<RawNature, NatureCacheEntry>();
	const folderCache = new WeakMap<RawFolder, FolderCacheEntry>();
	const selectActionCache = new Map<string, () => void>();

	const pathCache = new Map<string, [string, string, string]>();

	const getDocumentPath = (
		folderName: string,
		folderSid: string,
		natureCode: string,
	): [string, string, string] => {
		const pathKey = `${folderName}:${folderSid}:${natureCode}`;
		const cached = pathCache.get(pathKey);
		if (cached) {
			return cached;
		}

		const next: [string, string, string] = [
			folderName,
			folderSid,
			natureCode,
		];
		pathCache.set(pathKey, next);
		return next;
	};

	const getSelectAction = (input: {
		documentCode: string;
		natureCode: string;
		folderSid: string;
		folderName: string;
	}) => {
		const key = `${input.folderName}:${input.folderSid}:${input.natureCode}:${input.documentCode}`;
		const cached = selectActionCache.get(key);
		if (cached) {
			return cached;
		}

		const next = () =>
			selectDocument(
				input.documentCode,
				input.natureCode,
				input.folderSid,
				input.folderName,
			);

		selectActionCache.set(key, next);
		return next;
	};

	const mapDocument = (
		document: RawDocument,
		selectedDocumentCode: string | undefined,
		folderName: string,
		folderSid: string,
		natureCode: string,
		badgeByDocumentCode: Readonly<Record<string, EditorStoreBadge>>,
		statusLabel: ((label: string) => string) | undefined,
		epoch: string,
	): SidebarDocument => {
		const isSelected = document.code === selectedDocumentCode;
		const badge = badgeByDocumentCode[document.code];
		const pathKey = `${folderName}:${folderSid}:${natureCode}`;
		const cached = documentCache.get(document);

		if (
			cached &&
			cached.epoch === epoch &&
			cached.pathKey === pathKey &&
			cached.isSelected === isSelected &&
			cached.badge === badge &&
			cached.name === document.name &&
			cached.statusNumber === document.status.number &&
			cached.statusLabel === document.status.label
		) {
			return cached.value;
		}

		const value: SidebarDocument = {
			type: "document",
			id: `document:${folderSid}:${natureCode}:${document.code}`,
			name: document.name,
			isSelected,
			actions: [],
			status: {
				number: document.status.number,
				label: statusLabel
					? statusLabel(document.status.label)
					: document.status.label,
			},
			badge,
			path: getDocumentPath(folderName, folderSid, natureCode),
			selectOnAction: getSelectAction({
				documentCode: document.code,
				natureCode,
				folderSid,
				folderName,
			}),
		};

		documentCache.set(document, {
			epoch,
			pathKey,
			isSelected,
			badge,
			name: document.name,
			statusNumber: document.status.number,
			statusLabel: document.status.label,
			value,
		});

		return value;
	};

	const mapNature = (
		nature: RawNature,
		selectedDocumentCode: string | undefined,
		folderName: string,
		folderSid: string,
		badgeByDocumentCode: Readonly<Record<string, EditorStoreBadge>>,
		pasteableNatureKeySet: ReadonlySet<string>,
		statusLabel: ((label: string) => string) | undefined,
		epoch: string,
	): SidebarNature => {
		const name = "";
		const description = nature.label.long ?? "";
		const isMandatory = nature.isMandatory === true;
		const canPaste = pasteableNatureKeySet.has(
			`${folderSid}:${nature.code}`,
		);
		const folderKey = `${folderName}:${folderSid}`;
		const children = (nature.documents ?? []).map((document) =>
			mapDocument(
				document,
				selectedDocumentCode,
				folderName,
				folderSid,
				nature.code,
				badgeByDocumentCode,
				statusLabel,
				epoch,
			),
		);
		const cached = natureCache.get(nature);

		if (
			cached &&
			cached.epoch === epoch &&
			cached.folderKey === folderKey &&
			cached.name === name &&
			cached.description === description &&
			cached.mode === nature.mode &&
			cached.isMandatory === isMandatory &&
			cached.canPaste === canPaste &&
			areItemsShallowEqual(cached.children, children)
		) {
			return cached.value;
		}

		const value: SidebarNature = {
			type: "nature",
			id: `nature:${folderSid}:${nature.code}`,
			name,
			content: {
				code: nature.code,
				name,
				description,
				mode: nature.mode,
				isMandatory,
			},
			children,
			canPaste,
		};

		natureCache.set(nature, {
			epoch,
			folderKey,
			name,
			description,
			mode: nature.mode,
			isMandatory,
			canPaste,
			children,
			value,
		});

		return value;
	};

	const mapFolder = (
		folder: RawFolder,
		selectedDocumentCode: string | undefined,
		expandedFolderSidSet: ReadonlySet<string>,
		loadingFolderSidSet: ReadonlySet<string>,
		badgeByDocumentCode: Readonly<Record<string, EditorStoreBadge>>,
		pasteableNatureKeySet: ReadonlySet<string>,
		statusLabel: ((label: string) => string) | undefined,
		epoch: string,
	): SidebarFolder => {
		const mappedNatures = (folder.natures ?? []).map((nature) =>
			mapNature(
				nature,
				selectedDocumentCode,
				folder.name,
				folder.sid,
				badgeByDocumentCode,
				pasteableNatureKeySet,
				statusLabel,
				epoch,
			),
		);

		const mappedFolders = (folder.children ?? []).map((child) =>
			mapFolder(
				child,
				selectedDocumentCode,
				expandedFolderSidSet,
				loadingFolderSidSet,
				badgeByDocumentCode,
				pasteableNatureKeySet,
				statusLabel,
				epoch,
			),
		);

		const isRoot = !folder.parent?.sid;
		const hasExpandedState = expandedFolderSidSet.size > 0;
		const isInitiallyOpen = hasExpandedState
			? expandedFolderSidSet.has(folder.sid)
			: isRoot;
		const isLoading = loadingFolderSidSet.has(folder.sid);
		const children: Array<SidebarFolder | SidebarNature> = [
			...mappedNatures,
			...mappedFolders,
		];
		const cached = folderCache.get(folder);

		if (
			cached &&
			cached.epoch === epoch &&
			cached.isRoot === isRoot &&
			cached.isInitiallyOpen === isInitiallyOpen &&
			cached.isLoading === isLoading &&
			areItemsShallowEqual(cached.children, children)
		) {
			return cached.value;
		}

		const value: SidebarFolder = {
			type: "folder",
			id: `folder:${folder.sid}`,
			name: folder.name,
			children,
			isRoot,
			isInitiallyOpen,
			isLoading,
		};

		folderCache.set(folder, {
			epoch,
			isRoot,
			isInitiallyOpen,
			isLoading,
			children,
			value,
		});

		return value;
	};

	return (
		folder: RawFolder,
		input: MapFolderTreeInput,
	): SidebarFolder =>
		mapFolder(
			folder,
			input.selectedDocumentCode,
			input.expandedFolderSidSet,
			input.loadingFolderSidSet,
			input.badgeByDocumentCode,
			input.pasteableNatureKeySet,
			input.statusLabel,
			input.epoch ?? "",
		);
};
