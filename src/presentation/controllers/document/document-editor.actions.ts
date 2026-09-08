import { t } from "@src/i18n";
import {
	type DocumentStatusKey,
	documentStatusNumberByKey,
	toDocumentStatusKey,
} from "./document-status";
import type { EditorActionShape, EditorLike } from "./editor-state";

export type DocumentMode = "EDIT" | "UPLOAD" | "READONLY";
export type ViewerActionId =
	| "save"
	| "upload"
	| "download"
	| "email"
	| "pending"
	| "validate"
	| "reject"
	| "remove"
	| "delete"
	| "copy"
	| "paste";

export type NatureActionFlags = Readonly<{
	editable?: boolean;
	controllable?: boolean;
	uploadEnabled?: boolean;
}>;

export type ViewerAction = Readonly<
	EditorActionShape & {
		id: ViewerActionId;
	}
>;

export type ViewerActionEditor = EditorLike & {
	mode: "existing" | "new";
	binaryStatus: "idle" | "loading" | "ready" | "error";
};

type ActionPolicyContext = Readonly<{
	editor: ViewerActionEditor;
	documentMode: DocumentMode;
	documentManagement: string;
	fileManagement: string;
	enableControl?: boolean;
	uncontrolledDocumentStatus?: number;
	defaultUploadStatus?: number;
	natureFlags: NatureActionFlags;
	hasCanonicalContext: boolean;
	clipboardAvailable: boolean;
	clipboardDocumentCode?: string;
	canPaste: boolean;
}>;

const normalizePermissionSource = (source: string): string =>
	source.trim().toUpperCase();

export const hasPermission = (source: string, code: string): boolean => {
	const normalizedSource = normalizePermissionSource(source);
	const normalizedCode = code.trim().toUpperCase();

	if (!normalizedSource || !normalizedCode) {
		return false;
	}

	if (normalizedSource === "*") {
		return true;
	}

	return normalizedSource.includes(normalizedCode);
};

const isStatusActionOpenInMode = (
	documentMode: DocumentMode,
	statusKey: DocumentStatusKey,
): boolean => {
	if (documentMode === "READONLY") return false;
	if (documentMode === "EDIT") return true;
	return statusKey === "rejected" || statusKey === "pending";
};

const viewerActionIds = [
	"save",
	"upload",
	"download",
	"email",
	"copy",
	"paste",
	"pending",
	"validate",
	"reject",
	"remove",
	"delete",
] as const satisfies readonly ViewerActionId[];

const resolveEditorStatusNumber = (
	editor: ViewerActionEditor,
	defaultUploadStatus?: number,
): number | undefined =>
	editor.draft.statusNumber ??
	(editor.mode === "new" ? defaultUploadStatus : undefined);

const getActionLabel = (actionId: ViewerActionId): string => {
	switch (actionId) {
		case "save":
			return t("actionSave");
		case "upload":
			return t("actionUpload");
		case "download":
			return t("actionDownload");
		case "email":
			return t("actionEmail");
		case "copy":
			return t("actionCopy");
		case "paste":
			return t("actionPaste");
		case "pending":
			return t("actionPending");
		case "validate":
			return t("actionValidate");
		case "reject":
			return t("actionReject");
		case "remove":
			return t("actionRemove");
		case "delete":
			return t("actionDelete");
	}
};

const getActionOrder = (action: ViewerAction): number => {
	switch (action.id) {
		case "delete":
			return 10;
		case "pending":
			return 20;
		case "validate":
			return 30;
		case "reject":
			return 40;
		case "remove":
			return 50;
		case "download":
			return 60;
		case "email":
			return 70;
		case "copy":
			return 80;
		case "paste":
			return 85;
		case "upload":
			return 90;
		case "save":
			return 100;
		default:
			return 0;
	}
};

export const buildDocumentEditorAction = (
	actionId: ViewerActionId,
	ctx: ActionPolicyContext,
): ViewerAction => {
	const {
		editor,
		documentMode,
		documentManagement,
		fileManagement,
		enableControl,
		uncontrolledDocumentStatus,
		defaultUploadStatus,
		natureFlags,
		hasCanonicalContext,
		clipboardAvailable,
		clipboardDocumentCode,
		canPaste,
	} = ctx;

	const statusNumber = resolveEditorStatusNumber(
		editor,
		defaultUploadStatus,
	);
	const statusKey = toDocumentStatusKey(statusNumber);

	const canEditNature = natureFlags.editable !== false;
	const canUploadNature = natureFlags.uploadEnabled !== false;
	const canControlNature =
		enableControl !== false && natureFlags.controllable !== false;
	const canRunStatusActions =
		canControlNature &&
		isStatusActionOpenInMode(documentMode, statusKey);
	const isNewDocument = editor.mode === "new";
	const isExistingDocument = editor.mode === "existing";
	const hasBinary = Boolean(editor.draft.binary?.url);

	const canUploadByDocumentPermission = hasPermission(
		documentManagement,
		"U",
	);
	const canValidateByDocumentPermission = hasPermission(
		documentManagement,
		"V",
	);
	const canRejectByDocumentPermission = hasPermission(
		documentManagement,
		"R",
	);
	const canRemoveByDocumentPermission = hasPermission(
		documentManagement,
		"D",
	);
	const canDeleteByDocumentPermission = hasPermission(
		documentManagement,
		"S",
	);
	const canPendingByDocumentPermission = hasPermission(
		documentManagement,
		"P",
	);

	const canDownloadByFilePermission = hasPermission(
		fileManagement,
		"D",
	);
	const canMailByFilePermission = hasPermission(fileManagement, "M");
	const canCopyByFilePermission = hasPermission(fileManagement, "C");
	const canPasteByFilePermission = hasPermission(fileManagement, "C");

	const currentStatusNumber =
		statusNumber ?? uncontrolledDocumentStatus ?? undefined;

	const canSaveTarget =
		documentMode !== "READONLY" &&
		canEditNature &&
		statusKey !== "removed";

	const canUploadTarget =
		(isNewDocument ||
			(documentMode !== "READONLY" && canEditNature)) &&
		canUploadNature &&
		canUploadByDocumentPermission &&
		statusKey !== "removed";

	const canMutateTargetForPaste =
		editor.mode === "new"
			? canUploadTarget
			: hasCanonicalContext && canSaveTarget;

	const allowedById: Record<ViewerActionId, boolean> = {
		save: canSaveTarget,

		upload: canUploadTarget,

		download:
			canDownloadByFilePermission &&
			statusKey !== "removed" &&
			(isExistingDocument || hasBinary),

		email:
			canMailByFilePermission &&
			statusKey !== "removed" &&
			(isExistingDocument || hasBinary),

		copy:
			canCopyByFilePermission &&
			hasCanonicalContext &&
			statusKey !== "removed",

		paste:
			canPasteByFilePermission &&
			clipboardAvailable &&
			canPaste &&
			canMutateTargetForPaste,

		pending: canRunStatusActions && canPendingByDocumentPermission,

		validate: canRunStatusActions && canValidateByDocumentPermission,

		reject: canRunStatusActions && canRejectByDocumentPermission,

		remove: canRunStatusActions && canRemoveByDocumentPermission,

		delete:
			documentMode !== "READONLY" &&
			statusKey !== "removed" &&
			canDeleteByDocumentPermission,
	};

	const isLocalOnly =
		editor.mode === "new" ||
		(!isExistingDocument && Boolean(editor.draft.binary?.url));

	if (editor.mode === "new") {
		if (actionId === "upload") {
			return {
				id: "upload",
				label: getActionLabel("upload"),
				hidden: !allowedById.upload,
				disabled: editor.saving || !editor.draft.binary,
			};
		}

		if (actionId === "paste") {
			return {
				id: "paste",
				label: getActionLabel("paste"),
				hidden: !allowedById.paste,
				disabled: editor.saving,
			};
		}

		return {
			id: actionId,
			label: getActionLabel(actionId),
			hidden: true,
			disabled: true,
		};
	}

	if (!hasCanonicalContext) {
		switch (actionId) {
			case "download":
				return {
					id: "download",
					label: getActionLabel("download"),
					hidden:
						!canDownloadByFilePermission ||
						!hasBinary ||
						statusKey === "removed",
					disabled: editor.saving || !hasBinary,
				};

			case "email":
				return {
					id: "email",
					label: getActionLabel("email"),
					hidden:
						!canMailByFilePermission ||
						!hasBinary ||
						statusKey === "removed",
					disabled: editor.saving || !hasBinary,
				};

			case "paste":
				return {
					id: "paste",
					label: getActionLabel("paste"),
					hidden: !allowedById.paste,
					disabled: editor.saving,
				};

			default:
				return {
					id: actionId,
					label: getActionLabel(actionId),
					hidden: true,
					disabled: true,
				};
		}
	}

	switch (actionId) {
		case "save":
			return {
				id: "save",
				label: getActionLabel("save"),
				hidden: isLocalOnly || !allowedById.save,
				disabled:
					editor.saving ||
					!editor.dirty ||
					editor.binaryStatus === "loading",
			};

		case "upload":
			return {
				id: "upload",
				label: getActionLabel("upload"),
				hidden: !isLocalOnly || !allowedById.upload,
				disabled: editor.saving || !editor.draft.binary,
			};

		case "download":
			return {
				id: "download",
				label: getActionLabel("download"),
				hidden: !allowedById.download,
				disabled:
					editor.saving ||
					(!hasBinary && editor.binaryStatus === "loading"),
			};

		case "email":
			return {
				id: "email",
				label: getActionLabel("email"),
				hidden: !allowedById.email,
				disabled:
					editor.saving ||
					(!hasBinary && editor.binaryStatus === "loading"),
			};

		case "copy":
			return {
				id: "copy",
				label: getActionLabel("copy"),
				hidden:
					!allowedById.copy ||
					clipboardDocumentCode === editor.documentCode,
				disabled: editor.saving,
			};

		case "paste":
			return {
				id: "paste",
				label: getActionLabel("paste"),
				hidden: !allowedById.paste,
				disabled: editor.saving,
			};

		case "pending":
			return {
				id: "pending",
				label: getActionLabel("pending"),
				hidden:
					!allowedById.pending ||
					currentStatusNumber === documentStatusNumberByKey.pending ||
					statusKey === "removed",
				disabled: editor.saving,
			};

		case "validate":
			return {
				id: "validate",
				label: getActionLabel("validate"),
				hidden:
					!allowedById.validate ||
					statusKey === "validated" ||
					statusKey === "removed",
				disabled: editor.saving,
			};

		case "reject":
			return {
				id: "reject",
				label: getActionLabel("reject"),
				hidden:
					!allowedById.reject ||
					statusKey === "rejected" ||
					statusKey === "removed",
				disabled: editor.saving,
			};

		case "remove":
			return {
				id: "remove",
				label: getActionLabel("remove"),
				hidden: !allowedById.remove || statusKey === "removed",
				disabled: editor.saving,
			};

		case "delete":
			return {
				id: "delete",
				label: getActionLabel("delete"),
				hidden: !allowedById.delete,
				disabled: editor.saving,
			};
	}
};

export const buildDocumentEditorActions = (
	ctx: ActionPolicyContext,
): readonly ViewerAction[] =>
	viewerActionIds
		.map((actionId) => buildDocumentEditorAction(actionId, ctx))
		.sort((left, right) => getActionOrder(left) - getActionOrder(right));


export type DocumentEditorActionContext = ActionPolicyContext;

export const canRenderDocumentEditorAction = (
	actionId: ViewerActionId,
	ctx: ActionPolicyContext,
): boolean => !buildDocumentEditorAction(actionId, ctx).hidden;

export const canRenderUploadAction = (
	ctx: ActionPolicyContext,
): boolean => canRenderDocumentEditorAction("upload", ctx);

export const canRenderPasteAction = (
	ctx: ActionPolicyContext,
): boolean => canRenderDocumentEditorAction("paste", ctx);
