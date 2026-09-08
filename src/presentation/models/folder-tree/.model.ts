import { statusLabel as translateStatusLabel } from "@src/i18n";
import { i18nModel } from "@src/i18n/i18n.model";
import { createModels } from "../../../core/presentation.builder";
import {
	canRenderUploadAction,
	hasPermission,
} from "../../controllers/document/document-editor.actions";

import type {
	CreateDocumentDialogState,
	DuplicableDocumentOption,
} from "../../contracts/side-bar.interface";
import { collectUnsavedDocuments } from "./collect-unsaved-documents";
import { filterSidebarTree } from "./filter-folder-tree";
import {
	type RawFolder,
	createFolderTreeMapper,
} from "./map-folder-tree";

type BinaryExtension =
	| "json"
	| "unknown"
	| "pdf"
	| "jpg"
	| "jpeg"
	| "png"
	| "mpeg"
	| "svg"
	| "mp4"
	| "txt"
	| "xml"
	| "msg";

type AppProfileShape = {
	profile?: {
		parameters?: {
			mode?: { parameter?: unknown };
			fileManagement?: { parameter?: unknown };
			documentManagement?: { parameter?: unknown };
			defaultUploadStatus?: { parameter?: unknown };
		};
	};
};

type ClipboardShape = {
	documentCode?: string;
	fileExtension?: string;
};

type DocumentMode = "EDIT" | "UPLOAD" | "READONLY";

type NatureFlagsShape = {
	editable?: unknown;
	controllable?: unknown;
	uploadEnabled?: unknown;
	enableControl?: unknown;
	flagEnabled?: unknown;
};

const readFlag = (value: unknown): boolean | undefined => {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") {
		if (value === 1) return true;
		if (value === 0) return false;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["1", "true", "yes", "y", "on"].includes(normalized)) {
			return true;
		}
		if (["0", "false", "no", "n", "off"].includes(normalized)) {
			return false;
		}
	}
	return undefined;
};

const readDocumentMode = (
	appProfile: AppProfileShape | undefined,
): DocumentMode => {
	const raw = appProfile?.profile?.parameters?.mode?.parameter;
	return raw === "EDIT" || raw === "UPLOAD" || raw === "READONLY"
		? raw
		: "READONLY";
};

const toInteger = (value: unknown): number | undefined => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.trunc(value);
	}
	if (typeof value === "string") {
		const parsed = Number.parseInt(value.trim(), 10);
		return Number.isNaN(parsed) ? undefined : parsed;
	}
	return undefined;
};

const runtimeReplaceableExtensions = [
	"pdf",
	"jpg",
	"jpeg",
	"png",
	"mpeg",
	"svg",
	"mp4",
	"txt",
	"xml",
	"msg",
	"json",
] as const satisfies readonly BinaryExtension[];

const pdfConvertibleExtensions = [
	"pdf",
	"jpg",
	"jpeg",
	"png",
] as const satisfies readonly BinaryExtension[];

type PdfConvertibleExtension =
	(typeof pdfConvertibleExtensions)[number];

const isPdfConvertibleExtension = (
	value: BinaryExtension,
): value is PdfConvertibleExtension =>
	(pdfConvertibleExtensions as readonly string[]).includes(value);

const toUnique = <T extends string>(
	values: readonly T[],
): readonly T[] => Array.from(new Set(values)) as readonly T[];

const normalizeBinaryExtension = (
	value: string | undefined,
): BinaryExtension => {
	switch (value?.trim().toLowerCase()) {
		case "json":
		case "unknown":
		case "pdf":
		case "jpg":
		case "jpeg":
		case "png":
		case "mpeg":
		case "svg":
		case "mp4":
		case "txt":
		case "xml":
		case "msg":
			return value.trim().toLowerCase() as BinaryExtension;
		default:
			return "unknown";
	}
};

const normalizeNatureExtensions = (
	values: readonly string[] | undefined,
): readonly string[] =>
	toUnique(
		(values ?? [])
			.map((value) => value.trim().toLowerCase().replace(/^\./, ""))
			.filter(Boolean),
	);

const buildAcceptAttribute = (extensions: readonly string[]): string =>
	toUnique(extensions.map((extension) => `.${extension}`)).join(",");

const resolveImportPolicy = (
	natureExtensions: readonly string[] | undefined,
) => {
	const normalizedNatureExtensions =
		normalizeNatureExtensions(natureExtensions);
	const hasExplicitNatureExtensions =
		normalizedNatureExtensions.length > 0;
	const natureAllowed = new Set(normalizedNatureExtensions);
	const pdfAllowed = hasExplicitNatureExtensions
		? natureAllowed.has("pdf")
		: false;

	const nativeReplaceExtensions = hasExplicitNatureExtensions
		? runtimeReplaceableExtensions.filter((extension) =>
				natureAllowed.has(extension),
			)
		: runtimeReplaceableExtensions;

	const replaceExtensions = pdfAllowed
		? toUnique([
				...nativeReplaceExtensions,
				...pdfConvertibleExtensions,
			])
		: nativeReplaceExtensions;

	return {
		natureExtensions: normalizedNatureExtensions,
		replace: {
			allowed: replaceExtensions.length > 0,
			extensions: replaceExtensions,
			accept: buildAcceptAttribute(replaceExtensions),
			multiple: pdfAllowed,
		},
	} as const;
};

const canDuplicateDocument = (input: {
	targetNatureExtensions: readonly string[] | undefined;
	sourceExtension: string | undefined;
}): { allowed: boolean; conversion: "native" | "pdf" } => {
	const sourceExtension = normalizeBinaryExtension(
		input.sourceExtension,
	);
	if (sourceExtension === "unknown") {
		return { allowed: false, conversion: "native" };
	}

	const policy = resolveImportPolicy(input.targetNatureExtensions);
	if (policy.replace.extensions.includes(sourceExtension)) {
		return { allowed: true, conversion: "native" };
	}

	if (
		policy.replace.extensions.includes("pdf") &&
		isPdfConvertibleExtension(sourceExtension)
	) {
		return { allowed: true, conversion: "pdf" };
	}

	return { allowed: false, conversion: "native" };
};

const sortByLabel = <T extends { label: { document: string } }>(
	left: T,
	right: T,
) =>
	left.label.document.localeCompare(right.label.document, undefined, {
		sensitivity: "base",
		numeric: true,
	});

export const folderTreeModel = createModels(
	({ repositories, stores }) => {
		const selectDocument = (
			documentCode: string,
			natureCode: string,
			folderSid: string,
			folderName: string,
		) => {
			stores.appStore.patch({
				currentNavigation: {
					documentCode,
					natureCode,
					folder: {
						name: folderName,
						sid: folderSid,
					},
				},
			});
		};

		const mapFolderTree = createFolderTreeMapper({
			selectDocument,
		});

		return {
			filters: () => stores.appStore.state.filters,

			folderTree: () => {
				const structure = stores.appStore.state.folderTreeStructure;
				const selectedDocumentCode =
					stores.appStore.state.currentNavigation?.documentCode;
				const expandedFolderSids =
					stores.appStore.state.expandedFolderSids;
				const loadingFolderSids = stores.appStore.state.loadingFolders;
				const badgeByDocumentCode =
					stores.documentStore.state.badgesByDocumentCode;
				const clipboard = stores.documentStore.state.clipboard as
					| ClipboardShape
					| undefined;
				const appProfile = stores.appStore.state.appProfile as
					| AppProfileShape
					| undefined;

				if (!structure) return [];

				const fileManagement =
					typeof appProfile?.profile?.parameters?.fileManagement
						?.parameter === "string"
						? appProfile.profile.parameters.fileManagement.parameter
						: "";
				const documentManagement =
					typeof appProfile?.profile?.parameters?.documentManagement
						?.parameter === "string"
						? appProfile.profile.parameters.documentManagement.parameter
						: "";
				const documentMode = readDocumentMode(appProfile);
				const defaultUploadStatus = toInteger(
					appProfile?.profile?.parameters?.defaultUploadStatus
						?.parameter,
				);
				const clipboardExtension = normalizeBinaryExtension(
					clipboard?.fileExtension,
				);
				const canPasteFromClipboard =
					hasPermission(fileManagement, "C") &&
					Boolean(clipboard?.documentCode) &&
					clipboardExtension !== "unknown";

				const pasteableNatureKeySet = new Set<string>();
				if (canPasteFromClipboard) {
					for (const nature of repositories.nature.read()) {
						const folder = repositories.folder.getById(
							nature.state.folder,
						);
						if (!folder) {
							continue;
						}

						const canCreateAtNature =
							nature.state.mode === "multi" ||
							(nature.state.documents?.length ?? 0) === 0;
						if (!canCreateAtNature) {
							continue;
						}

						const compatibility = canDuplicateDocument({
							targetNatureExtensions: nature.state.extensions,
							sourceExtension: clipboardExtension,
						});
						if (!compatibility.allowed) {
							continue;
						}

						const rawFlags = nature.state.flags as
							| NatureFlagsShape
							| undefined;
						const canUploadAtNature = canRenderUploadAction({
							editor: {
								mode: "new",
								dirty: false,
								saving: false,
								binaryStatus: "idle",
								actions: [],
								draft: {
									name: undefined,
									fileType: "unknown",
									statusNumber: undefined,
									statusLabel: undefined,
									documentDate: undefined,
									expirationDate: undefined,
									memo: undefined,
									preview: undefined,
									binary: undefined,
								},
							},
							documentMode,
							documentManagement,
							fileManagement,
							enableControl: undefined,
							uncontrolledDocumentStatus: undefined,
							defaultUploadStatus,
							natureFlags: {
								editable: readFlag(rawFlags?.editable),
								controllable:
									readFlag(rawFlags?.enableControl) ??
									readFlag(rawFlags?.controllable) ??
									readFlag(rawFlags?.flagEnabled),
								uploadEnabled: readFlag(rawFlags?.uploadEnabled),
							},
							hasCanonicalContext: false,
							clipboardAvailable: canPasteFromClipboard,
							clipboardDocumentCode: clipboard?.documentCode,
							canPaste: compatibility.allowed,
						});
						if (!canUploadAtNature) {
							continue;
						}

						pasteableNatureKeySet.add(
							`${folder.state.sid}:${nature.state.code}`,
						);
					}
				}

				const i18n = i18nModel.i18n;
				const profile = stores.appStore.state.appProfile as
					| {
							translations?: Record<string, unknown>;
							user?: { defaultLanguage?: string };
					  }
					| undefined;
				const epoch = `i18n:${
					profile?.user?.defaultLanguage ?? ""
				}:${profile?.translations ? Object.keys(profile.translations).length : 0}`;

				return [
					mapFolderTree(structure as RawFolder, {
						selectedDocumentCode,
						expandedFolderSidSet: new Set(expandedFolderSids),
						loadingFolderSidSet: new Set(loadingFolderSids),
						badgeByDocumentCode,
						pasteableNatureKeySet,
						statusLabel: (label) => translateStatusLabel(label, i18n),
						epoch,
					}),
				];
			},

			createDocumentDialogState: () =>
				stores.appStore.state.createDocumentDialog as
					| CreateDocumentDialogState
					| undefined,

			createDocumentDialog: () => {
				const state = stores.appStore.state.createDocumentDialog as
					| CreateDocumentDialogState
					| undefined;

				if (!state) {
					return {
						isOpen: false,
						target: undefined,
						filePicker: undefined,
						duplicableDocuments:
							[] as readonly DuplicableDocumentOption[],
					} as const;
				}

				const targetFolder = repositories.folder
					.read()
					.find((folder) => folder.state.sid === state.folderSid);
				const targetNature = targetFolder
					? repositories.nature
							.read()
							.find(
								(nature) =>
									nature.state.folder === targetFolder.meta.id &&
									nature.state.code === state.natureCode,
							)
					: undefined;

				const filePicker = targetNature
					? resolveImportPolicy(targetNature.state.extensions)
					: undefined;

				const duplicableDocuments = !targetNature
					? []
					: repositories.document
							.read()
							.flatMap((document) => {
								if (document.state.isLocal === true) {
									return [];
								}

								const sourceNature = repositories.nature.getById(
									document.state.nature,
								);
								if (!sourceNature) {
									return [];
								}

								const sourceFolder = repositories.folder.getById(
									sourceNature.state.folder,
								);
								if (!sourceFolder) {
									return [];
								}

								const compatibility = canDuplicateDocument({
									targetNatureExtensions: targetNature.state.extensions,
									sourceExtension: document.state.fileExtension,
								});

								if (!compatibility.allowed) {
									return [];
								}

								return [
									{
										id: `${sourceFolder.state.sid}:${sourceNature.state.code}:${document.state.code}`,
										documentCode: document.state.code,
										documentName: document.state.name,
										folderName: sourceFolder.state.name,
										folderSid: sourceFolder.state.sid,
										natureCode: sourceNature.state.code,
										fileExtension: document.state.fileExtension,
										label: {
											folder: sourceFolder.state.name,
											nature: sourceNature.state.code,
											document: `${document.state.code} - ${document.state.name}`,
										},
										conversion: compatibility.conversion,
									} satisfies DuplicableDocumentOption,
								];
							})
							.sort(sortByLabel);

				return {
					isOpen: true,
					target:
						targetFolder && targetNature
							? {
									folderSid: targetFolder.state.sid,
									folderName: targetFolder.state.name,
									natureCode: targetNature.state.code,
									natureExtensions: normalizeNatureExtensions(
										targetNature.state.extensions,
									),
								}
							: undefined,
					filePicker,
					duplicableDocuments,
				} as const;
			},
		};
	},
)
	.refine(({ models, stores }) => ({
		filteredTree: () =>
			filterSidebarTree(
				models.folderTree,
				stores.appStore.state.filters,
			),
	}))
	.refine(({ models }) => ({
		unsavedDocuments: () => collectUnsavedDocuments(models.folderTree),
	}));
