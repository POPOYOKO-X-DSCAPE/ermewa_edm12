import { createModels } from "@src/core/presentation.builder";
import { t } from "@src/i18n";
import { resolveDocumentEditorKey } from "@src/domain/stores/document-editor.store.helpers";
import {
	canRenderDocumentEditorAction,
	hasPermission,
	type DocumentEditorActionContext,
	type ViewerActionEditor,
} from "@src/presentation/controllers/document/document-editor.actions";
import {
	normalizeBinaryExtension,
	resolveDocumentImportPolicy,
} from "@src/presentation/controllers/document/document-file-policy";

type DocumentMode = "EDIT" | "UPLOAD" | "READONLY";

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

type NatureFlagsShape = {
	editable?: unknown;
	controllable?: unknown;
	uploadEnabled?: unknown;
};

type NatureStateShape = {
	flags?: NatureFlagsShape;
	extensions?: readonly string[];
	hasExpireDate?: unknown;
	hasExpirationDate?: unknown;
};

type ClipboardShape = {
	documentCode?: string;
	documentName?: string;
	fileExtension?: string;
};

type NodeActionShape = Readonly<{
	id: "copy" | "paste";
	label: string;
	hidden: boolean;
	disabled: boolean;
}>;

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

const getFileManagementParameter = (
	appProfile: AppProfileShape | undefined,
): string => {
	const raw = appProfile?.profile?.parameters?.fileManagement?.parameter;
	return typeof raw === "string" ? raw : "";
};

const getDocumentManagementParameter = (
	appProfile: AppProfileShape | undefined,
): string => {
	const raw = appProfile?.profile?.parameters?.documentManagement?.parameter;
	return typeof raw === "string" ? raw : "";
};

const getDefaultUploadStatusParameter = (
	appProfile: AppProfileShape | undefined,
): number | undefined =>
	toInteger(appProfile?.profile?.parameters?.defaultUploadStatus?.parameter);

export const documentModel = createModels(({ stores, repositories }) => {
	const getSelectedDocumentCode = () =>
		stores.appStore.state.currentNavigation?.documentCode;

	const resolveSelectedEditorKey = () => {
		const selectedKey = stores.documentStore.state.selectedEditorKey;
		if (selectedKey) {
			return selectedKey;
		}

		const documentCode = getSelectedDocumentCode();
		if (!documentCode) {
			return undefined;
		}

		return stores.documentStore.state.editorKeysByDocumentCode[documentCode];
	};

	const resolveSelectedEditor = () => {
		const editorKey = resolveSelectedEditorKey();
		return editorKey ? stores.documentStore.state.editors[editorKey] : undefined;
	};

	const resolveSelectedDocumentContext = () => {
		const documentCode = getSelectedDocumentCode();
		const editor = resolveSelectedEditor();

		const documentById = editor?.documentId
			? repositories.document.getById(editor.documentId)
			: undefined;
		const resolvedDocumentById =
			documentById &&
			(!documentCode || documentById.state.code === documentCode)
				? documentById
				: undefined;

		if (resolvedDocumentById) {
			const nature =
				(editor?.natureId
					? repositories.nature.getById(editor.natureId)
					: undefined) ??
				repositories.nature.getById(resolvedDocumentById.state.nature);

			const folder = nature
				? ((editor?.folderId
						? repositories.folder.getById(editor.folderId)
						: undefined) ??
					repositories.folder.getById(nature.state.folder))
				: undefined;

			return {
				document: resolvedDocumentById,
				nature,
				folder,
			};
		}

		if (!documentCode) {
			return undefined;
		}

		const document = repositories.document
			.read()
			.find((entry) => entry.state.code === documentCode);
		if (!document) {
			return undefined;
		}

		const nature = repositories.nature.getById(document.state.nature);
		const folder = nature
			? repositories.folder.getById(nature.state.folder)
			: undefined;

		return {
			document,
			nature,
			folder,
		};
	};

	const getSelectedDocumentViewerReadonly = () => {
		const editor = resolveSelectedEditor();

		if (editor?.mode === "new") {
			return false;
		}

		const appProfile = stores.appStore.state.appProfile as
			| AppProfileShape
			| undefined;
		const mode = readDocumentMode(appProfile);

		if (mode === "READONLY") {
			return true;
		}

		const nature = resolveSelectedDocumentContext()?.nature;
		const rawFlags = (nature?.state as NatureStateShape | undefined)?.flags;

		return readFlag(rawFlags?.editable) === false;
	};

	const getNatureActionFlags = (
		nature: ReturnType<typeof repositories.nature.getById> | undefined,
	) => {
		const rawFlags = (nature?.state as NatureStateShape | undefined)?.flags;

		return {
			editable: readFlag(rawFlags?.editable),
			controllable: readFlag(rawFlags?.controllable),
			uploadEnabled: readFlag(rawFlags?.uploadEnabled),
		} as const;
	};

	const buildSyntheticEditorForDocumentCode = (
		documentCode: string,
	): ViewerActionEditor | undefined => {
		const editors = stores.documentStore.state.editors;
		const editorKeysByDocumentCode =
			stores.documentStore.state.editorKeysByDocumentCode;
		const selectedEditorKey = stores.documentStore.state.selectedEditorKey;

		const editorKey = resolveDocumentEditorKey({
			documentCode,
			editors,
			editorKeysByDocumentCode,
			selectedEditorKey,
		});

		if (editorKey) {
			return editors[editorKey] as ViewerActionEditor | undefined;
		}

		const document = repositories.document
			.read()
			.find((entry) => entry.state.code === documentCode);
		if (!document) {
			return undefined;
		}

		const nature = repositories.nature.getById(document.state.nature);
		const folder = nature
			? repositories.folder.getById(nature.state.folder)
			: undefined;

		const syntheticEditor: ViewerActionEditor = {
			documentId: document.meta.id,
			documentCode: document.state.code,
			natureId: nature?.meta.id,
			natureCode: nature?.state.code,
			folderId: folder?.meta.id,
			folderSid: folder?.state.sid,
			mode: document.state.isLocal === true ? "new" : "existing",
			dirty: false,
			saving: false,
			binaryStatus: document.state.url ? "ready" : "idle",
			error: undefined,
			lastSavedAt: undefined,
			actions: [],
			draft: {
				name: document.state.name,
				fileType: normalizeBinaryExtension(document.state.fileExtension),
				statusNumber: document.state.status.number,
				statusLabel: document.state.status.label,
				documentDate: document.state.documentDate || undefined,
				expirationDate: document.state.expirationDate || undefined,
				memo: document.state.memo || undefined,
				preview: document.state.url
					? {
						url: document.state.url,
						source: "descriptor",
					}
					: undefined,
				binary: document.state.url
					? {
						url: document.state.url,
						name: document.state.name,
						size: 0,
						type:
							document.state.fileExtension || "application/octet-stream",
					}
					: undefined,
			},
		};

		return syntheticEditor;
	};

	return {
		currentNavigation: () => stores.appStore.state.currentNavigation,

		selectedDocumentCode: getSelectedDocumentCode,

		selectedDocumentContext: resolveSelectedDocumentContext,

		selectedEditorKey: resolveSelectedEditorKey,

		selectedEditor: resolveSelectedEditor,

		documentClipboard: () =>
			stores.documentStore.state.clipboard as ClipboardShape | undefined,

		documentNodeActionsByDocumentCode: () => {
			const clipboard = stores.documentStore.state.clipboard as
				| ClipboardShape
				| undefined;
			const appProfile = stores.appStore.state.appProfile as
				| AppProfileShape
				| undefined;
			const fileManagement = getFileManagementParameter(appProfile);
			const documentManagement = getDocumentManagementParameter(appProfile);
			const documentMode = readDocumentMode(appProfile);
			const defaultUploadStatus = getDefaultUploadStatusParameter(appProfile);
			const clipboardExtension = normalizeBinaryExtension(
				clipboard?.fileExtension,
			);
			const clipboardAvailable =
				hasPermission(fileManagement, "C") &&
				Boolean(clipboard?.documentCode) &&
				clipboardExtension !== "unknown";

			return (documentCode: string): readonly NodeActionShape[] => {
				const document = repositories.document
					.read()
					.find((entry) => entry.state.code === documentCode);
				if (!document) {
					return [];
				}

				const nature = repositories.nature.getById(document.state.nature);
				const editor = buildSyntheticEditorForDocumentCode(documentCode);
				if (!editor) {
					return [];
				}

				const pastePolicy = resolveDocumentImportPolicy({
					natureExtensions:
						(nature?.state as NatureStateShape | undefined)?.extensions,
					currentFileType: editor.draft.fileType,
				});
				const targetFileType = normalizeBinaryExtension(
					editor.draft.fileType,
				);
				const isClipboardSourceDocument =
					clipboard?.documentCode === documentCode;
				const canReplace =
					clipboardAvailable &&
					!isClipboardSourceDocument &&
					pastePolicy.replace.extensions.includes(clipboardExtension);
				const canAddPages =
					clipboardAvailable &&
					!isClipboardSourceDocument &&
					targetFileType === "pdf" &&
					Boolean(editor.draft.binary?.url) &&
					pastePolicy.addPages.extensions.includes(clipboardExtension);

				const actionContext: DocumentEditorActionContext = {
					editor,
					documentMode,
					documentManagement,
					fileManagement,
					enableControl: undefined,
					uncontrolledDocumentStatus: undefined,
					defaultUploadStatus,
					natureFlags: getNatureActionFlags(nature),
					hasCanonicalContext:
						editor.mode === "new"
							? false
							: Boolean(
								editor.documentId && editor.natureId && editor.folderId,
							),
					clipboardAvailable,
					clipboardDocumentCode: clipboard?.documentCode,
					canPaste: canReplace || canAddPages,
				};

				const canCopy = canRenderDocumentEditorAction(
					"copy",
					actionContext,
				);
				const canPaste = canRenderDocumentEditorAction(
					"paste",
					actionContext,
				);

				return [
					{
						id: "copy",
						label: t("actionCopy"),
						hidden: !canCopy,
						disabled: false,
					},
					{
						id: "paste",
						label: t("actionPaste"),
						hidden: !canPaste,
						disabled: false,
					},
				] as const;
			};
		},

		documentViewerActionsByDocumentCode: () => {
			const editors = stores.documentStore.state.editors;
			const editorKeysByDocumentCode =
				stores.documentStore.state.editorKeysByDocumentCode;
			const selectedEditorKey = stores.documentStore.state.selectedEditorKey;

			return (documentCode: string) => {
				const editorKey = resolveDocumentEditorKey({
					documentCode,
					editors,
					editorKeysByDocumentCode,
					selectedEditorKey,
				});

				return editorKey ? editors[editorKey]?.actions ?? [] : [];
			};
		},

		selectedDocumentViewerReadonly: getSelectedDocumentViewerReadonly,

		selectedDocumentViewerInteractionDisabled: () =>
			resolveSelectedEditor()?.saving ?? false,

		selectedDocumentViewerHasExpirationDate: () => {
			const natureState = resolveSelectedDocumentContext()?.nature
				?.state as NatureStateShape | undefined;
			const rawHasExpirationDate =
				natureState?.hasExpireDate ?? natureState?.hasExpirationDate;

			return readFlag(rawHasExpirationDate) !== false;
		},
	};
})
	.refine(({ models }) => ({
		selectedDocumentEntity: () => models.selectedDocumentContext?.document,
		selectedNatureEntity: () => models.selectedDocumentContext?.nature,
		selectedFolderEntity: () => models.selectedDocumentContext?.folder,
	}))
	.refine(({ models }) => ({
		selectedDocumentViewerContent: () => {
			const editor = models.selectedEditor;
			if (!editor) return undefined;

			const binary = editor.draft.binary;
			const fileType = editor.draft.fileType ?? "unknown";
			const isNew = editor.mode === "new";
			const viewerUrl = binary?.url ?? "";

			return {
				documentCode: editor.documentCode,
				url: viewerUrl,
				type: fileType,
				error: editor.error ?? null,
				loading: isNew
					? false
					: !viewerUrl &&
					  (editor.binaryStatus === "loading" ||
							editor.binaryStatus === "idle"),
			};
		},

		selectedDocumentViewerMeta: () => {
			const editor = models.selectedEditor;
			if (!editor) return undefined;

			const hasExpirationDate =
				models.selectedDocumentViewerHasExpirationDate;

			return {
				name: editor.draft.name,
				date: editor.draft.documentDate,
				expires: hasExpirationDate
					? editor.draft.expirationDate
					: undefined,
				status: editor.draft.statusNumber,
				memo:
					editor.draft.memo ?? models.selectedDocumentEntity?.state.memo,
				hasExpirationDate,
			};
		},

		selectedDocumentViewerActions: () => {
			const editor = models.selectedEditor;
			const documentCode = models.selectedDocumentCode;
			if (!editor) {
				return [];
			}

			const baseActions = editor.actions ?? [];
			if (editor.mode !== "new" || !documentCode) {
				return baseActions;
			}

			const nodeActions =
				models.documentNodeActionsByDocumentCode(documentCode);
			const pasteAction = nodeActions.find(
				(action) => action.id === "paste" && !action.hidden,
			);

			if (!pasteAction) {
				return baseActions;
			}

			if (baseActions.some((action) => action.id === "paste")) {
				return baseActions;
			}

			return [...baseActions, pasteAction];
		},
	}))
	.refine(({ models }) => ({
		selectedDocumentViewer: () => {
			const content = models.selectedDocumentViewerContent;
			if (!content) {
				return undefined;
			}

			const meta = models.selectedDocumentViewerMeta;

			return {
				...content,
				name: meta?.name,
				date: meta?.date,
				expires: meta?.expires,
				status: meta?.status,
				memo: meta?.memo,
				hasExpirationDate: meta?.hasExpirationDate,
			};
		},

		isDirty: () => models.selectedEditor?.dirty ?? false,

		documentViewerActions: () => models.selectedDocumentViewerActions,
	}));
