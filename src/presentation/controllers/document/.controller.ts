import { t } from "@src/i18n";
import {
	buildDocumentStoreDerivedPatch,
	resolveDocumentEditorKey,
} from "../../../domain/stores/document-editor.store.helpers";
import { navigationBaseController } from "../navigation.controller";
import {
	type DocumentMode,
	type NatureActionFlags,
	buildDocumentEditorActions,
	hasPermission,
} from "./document-editor.actions";
import { createDocumentEditorCommands } from "./document-editor.commands";
import {
	type BinaryExtension,
	normalizeBinaryExtension,
	resolveDocumentImportDecision,
	resolveDocumentImportPolicy,
} from "./document-file-policy";
import { documentStatusNumberByKey } from "./document-status";
import {
	areEditorsEquivalentForStore,
	reuseShallowEqualEditorActions,
} from "./editor-state";

/* cspell:ignore attente rejet xdoc xohn xfile */

type AppProfileShape = {
	profile?: {
		parameters?: {
			mode?: { parameter?: unknown };
			documentManagement?: { parameter?: unknown };
			fileManagement?: { parameter?: unknown };
			enableControl?: { parameter?: unknown };
			defaultUploadStatus?: { parameter?: unknown };
			uncontrolledDocumentStatus?: { parameter?: unknown };
		};
	};
	user?: {
		email?: unknown;
	};
};

type NatureFlagsShape = {
	editable?: unknown;
	controllable?: unknown;
	enableControl?: unknown;
	uploadEnabled?: unknown;
	flagEnabled?: unknown;
};

type NatureStateWithExtensions = {
	extensions?: readonly string[];
};

type ClipboardState = {
	documentCode?: string;
	documentName?: string;
	fileExtension?:
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

const isAbortError = (error: unknown): boolean =>
	(error instanceof DOMException && error.name === "AbortError") ||
	(error instanceof Error && error.name === "AbortError");

const resolveAbsoluteUrl = (value: string): string => {
	try {
		return new URL(value, window.location.href).toString();
	} catch {
		return value;
	}
};

const FLOW_DEBUG_KEY = "__ERMEWA_FLOW_DEBUG__";

type FlowDebugEvent = {
	ts: string;
	scope: string;
	event: string;
	payload?: unknown;
};

type LocationFolderRef = {
	name: string;
	sid: string;
};

const pushDocumentFlowDebug = (event: string, payload?: unknown) => {
	const entry: FlowDebugEvent = {
		ts: new Date().toISOString(),
		scope: "document",
		event,
		payload,
	};

	console.log(`[FLOW][document] ${event}`, payload ?? "");

	const root = window as Window & {
		[FLOW_DEBUG_KEY]?: FlowDebugEvent[];
	};

	const current = root[FLOW_DEBUG_KEY] ?? [];
	current.push(entry);
	if (current.length > 1000) {
		current.splice(0, current.length - 1000);
	}
	root[FLOW_DEBUG_KEY] = current;
};

const toDebugError = (error: unknown) =>
	error instanceof Error
		? {
				name: error.name,
				message: error.message,
			}
		: { message: String(error) };

const isCreateDocumentToken = (value: string | undefined): boolean =>
	value?.trim().toLowerCase() === "new";

const readFolderFromCurrentLocation = ():
	| LocationFolderRef
	| undefined => {
	const url = new URL(window.location.href, window.location.origin);
	const fld = url.searchParams.get("FLD")?.trim() ?? "";
	const [folderNameFromQuery = "", folderSidFromQuery = ""] =
		fld.split("$");

	const segments = url.pathname.split("/").filter(Boolean);
	const folderNameFromPath = segments[0] ?? "";
	const folderSidFromPath = segments[1] ?? "";

	const name = folderNameFromQuery || folderNameFromPath;
	const sid = folderSidFromQuery || folderSidFromPath;

	if (!name || !sid) {
		return undefined;
	}

	return { name, sid };
};

const getFallbackDocumentStatusLabel = (
	statusNumber: number | undefined,
): string | undefined => {
	switch (statusNumber) {
		case documentStatusNumberByKey.pending:
			return "Pending";
		case documentStatusNumberByKey.validated:
			return "Validated";
		case documentStatusNumberByKey.rejected:
			return "Rejected";
		case documentStatusNumberByKey.removed:
			return "Removed";
		default:
			return undefined;
	}
};
const normalizeSelectedFiles = (
	input: File | readonly File[],
): readonly File[] =>
	Array.isArray(input)
		? input.filter((file): file is File => file instanceof File)
		: input instanceof File
			? [input]
			: [];

const askUserImportChoice = (file: File): "native" | "pdf" =>
	window.confirm(t("alertImportAsPdf", { name: file.name }))
		? "pdf"
		: "native";

const resolveMimeTypeFromExtension = (
	extension: BinaryExtension,
): string => {
	switch (extension) {
		case "pdf":
			return "application/pdf";
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "png":
			return "image/png";
		case "svg":
			return "image/svg+xml";
		case "mp4":
			return "video/mp4";
		case "mpeg":
			return "video/mpeg";
		case "xml":
			return "application/xml";
		case "json":
			return "application/json";
		case "txt":
			return "text/plain";
		case "msg":
			return "application/vnd.ms-outlook";
		default:
			return "application/octet-stream";
	}
};

const ensureFileNameHasExtension = (
	name: string | undefined,
	extension: BinaryExtension,
): string => {
	const baseName = name?.trim() || "document";
	if (extension === "unknown") {
		return baseName;
	}

	const normalizedBaseName = baseName.toLowerCase();
	if (normalizedBaseName.endsWith(`.${extension}`)) {
		return baseName;
	}

	return `${baseName}.${extension}`;
};

const base64ToBlob = (
	base64: string,
	mimeType = "application/pdf",
): Blob => {
	const normalized = base64.includes(",")
		? (base64.split(",")[1] ?? "")
		: base64;
	const binary = atob(normalized);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return new Blob([bytes], { type: mimeType });
};

export const documentController = navigationBaseController
	.refine(
		({
			api,
			repositories,
			stores,
			controls: { selectDocument: baseSelectDocument },
		}) => {
			type BinaryCandidateSource =
				| "xdoc"
				| "xohn"
				| "canonical"
				| "select"
				| "ensure"
				| "xupd";

			type BinaryRaceState = {
				winnerSignature?: string;
				winnerSource?: BinaryCandidateSource;
				promises: Map<string, Promise<boolean>>;
				controllers: Map<string, AbortController>;
			};

			const binaryRaceByDocumentCode = new Map<
				string,
				BinaryRaceState
			>();
			const binaryDirtyByDocumentCode = new Map<string, boolean>();
			const viewerPdfDirtyByDocumentCode = new Map<string, boolean>();

			type Editor = (typeof stores.documentStore.state.editors)[string];
			type EditorDraft = Editor["draft"];
			type EditorPreview = NonNullable<EditorDraft["preview"]>;
			type EditorBinary = NonNullable<EditorDraft["binary"]>;
			type EditorAction = Editor["actions"][number];

			type EditorPatch = Partial<Omit<Editor, "draft" | "actions">> & {
				draft?: Partial<Omit<EditorDraft, "binary">> & {
					binary?: Partial<EditorBinary>;
				};
			};

			type NavigationDescription = {
				documentCode: string;
				natureCode: string;
				folder: { name: string; sid: string };
			};

			type RemoteBinaryDescriptor = {
				documentCode: string;
				url: string;
				detailedUrl: string;
				shortUrl: string;
				extension: EditorDraft["fileType"];
				language: string;
			};

			const makeNewEditorKey = (documentCode: string) =>
				`new:${documentCode}`;

			const makeExistingEditorKey = (documentCode: string) =>
				`existing:${documentCode}`;

			const remoteBinaryDescriptors = new Map<
				string,
				RemoteBinaryDescriptor
			>();
			const preloadDescriptorLoading = new Map<
				string,
				Promise<RemoteBinaryDescriptor | undefined>
			>();

			const getBinaryRaceState = (
				documentCode: string,
			): BinaryRaceState => {
				const existing = binaryRaceByDocumentCode.get(documentCode);
				if (existing) {
					return existing;
				}

				const created: BinaryRaceState = {
					promises: new Map(),
					controllers: new Map(),
				};

				binaryRaceByDocumentCode.set(documentCode, created);
				return created;
			};

			const clearBinaryRaceStateIfIdle = (documentCode: string) => {
				const state = binaryRaceByDocumentCode.get(documentCode);
				if (!state) return;
				if (state.promises.size === 0 && state.controllers.size === 0) {
					binaryRaceByDocumentCode.delete(documentCode);
				}
			};

			const isBinaryDirty = (documentCode: string): boolean =>
				binaryDirtyByDocumentCode.get(documentCode) === true;

			const setBinaryDirty = (documentCode: string, dirty: boolean) => {
				if (dirty) {
					binaryDirtyByDocumentCode.set(documentCode, true);
					return;
				}

				binaryDirtyByDocumentCode.delete(documentCode);
			};

			const isViewerPdfDirty = (documentCode: string): boolean =>
				viewerPdfDirtyByDocumentCode.get(documentCode) === true;

			const setViewerPdfDirty = (
				documentCode: string,
				dirty: boolean,
			) => {
				if (dirty) {
					viewerPdfDirtyByDocumentCode.set(documentCode, true);
					return;
				}

				viewerPdfDirtyByDocumentCode.delete(documentCode);
			};

			const buildBinaryDescriptorSignature = (
				descriptor: RemoteBinaryDescriptor,
			) =>
				[
					descriptor.documentCode,
					descriptor.url,
					descriptor.detailedUrl,
					descriptor.shortUrl,
					descriptor.extension,
				].join("|");

			const getRunningBinaryCandidateCount = (documentCode: string) =>
				binaryRaceByDocumentCode.get(documentCode)?.promises.size ?? 0;

			const getCanonicalBinaryDescriptor = (
				documentCode: string,
			): RemoteBinaryDescriptor | undefined => {
				const document = getDocumentByCode(documentCode);
				if (!document) return undefined;

				const extension = document.state.fileExtension;
				if (
					!document.state.url ||
					!extension ||
					extension === "unknown"
				) {
					return undefined;
				}

				return {
					documentCode,
					url: document.state.url,
					detailedUrl:
						document.state.fullUrl || document.state.shortUrl || "",
					shortUrl: document.state.shortUrl || document.state.url,
					extension,
					language: document.state.language || "",
				};
			};

			const hasCanonicalContext = (
				editor: Editor | undefined,
			): boolean =>
				Boolean(
					editor?.documentId && editor?.natureId && editor?.folderId,
				);

			const isSameNavigation = (
				left: NavigationDescription | undefined,
				right: NavigationDescription | undefined,
			) =>
				left?.documentCode === right?.documentCode &&
				left?.natureCode === right?.natureCode &&
				left?.folder.sid === right?.folder.sid;

			const readNavigationFromLocation = ():
				| NavigationDescription
				| undefined => {
				const url = new URL(
					window.location.href,
					window.location.origin,
				);
				const sp = url.searchParams;

				const documentCode = sp.get("DOC")?.trim() ?? "";
				const natureCode = sp.get("NAT")?.trim() ?? "";
				const folder = readFolderFromCurrentLocation();

				if (
					!documentCode ||
					isCreateDocumentToken(documentCode) ||
					!natureCode ||
					!folder
				) {
					return undefined;
				}

				return {
					documentCode,
					natureCode,
					folder,
				};
			};

			const putEditor = (editorKey: string, editor: Editor) => {
				const nextEditors = {
					...stores.documentStore.state.editors,
					[editorKey]: editor,
				};

				stores.documentStore.patch({
					editors: {
						[editorKey]: editor,
					},
					...buildDocumentStoreDerivedPatch({
						editors: nextEditors,
						selectedEditorKey:
							stores.documentStore.state.selectedEditorKey,
					}),
				});
			};

			const setSelectedEditorKey = (
				selectedEditorKey: string | undefined,
			) => {
				stores.documentStore.patch({
					selectedEditorKey,
					...buildDocumentStoreDerivedPatch({
						editors: stores.documentStore.state.editors,
						selectedEditorKey,
					}),
				});
			};

			const getIndexedEditorKeyByDocumentCode = (
				documentCode: string,
			) =>
				resolveDocumentEditorKey({
					documentCode,
					editors: stores.documentStore.state.editors,
					editorKeysByDocumentCode:
						stores.documentStore.state.editorKeysByDocumentCode,
					selectedEditorKey:
						stores.documentStore.state.selectedEditorKey,
				});

			const getIndexedEditorByDocumentCode = (documentCode: string) => {
				const editorKey =
					getIndexedEditorKeyByDocumentCode(documentCode);
				return editorKey
					? stores.documentStore.state.editors[editorKey]
					: undefined;
			};

			const getAppProfile = () =>
				stores.appStore.state.appProfile as AppProfileShape | undefined;

			const getAppProfileParameters = () =>
				getAppProfile()?.profile?.parameters;

			const getCurrentUserEmail = (): string => {
				const raw = getAppProfile()?.user?.email;
				return typeof raw === "string" ? raw.trim() : "";
			};

			const getDocumentMode = (): DocumentMode => {
				const mode = getAppProfileParameters()?.mode?.parameter;
				return mode === "EDIT" ||
					mode === "UPLOAD" ||
					mode === "READONLY"
					? mode
					: "READONLY";
			};

			const getDocumentManagement = (): string => {
				const raw =
					getAppProfileParameters()?.documentManagement?.parameter;
				return typeof raw === "string" ? raw : "";
			};

			const getFileManagement = (): string => {
				const raw =
					getAppProfileParameters()?.fileManagement?.parameter;
				return typeof raw === "string" ? raw : "";
			};

			const getClipboardState = (): ClipboardState | undefined =>
				stores.documentStore.state.clipboard as
					| ClipboardState
					| undefined;

			const getDefaultUploadStatus = (): number | undefined =>
				toInteger(
					getAppProfileParameters()?.defaultUploadStatus?.parameter,
				);

			const getUncontrolledDocumentStatus = (): number | undefined =>
				toInteger(
					getAppProfileParameters()?.uncontrolledDocumentStatus
						?.parameter,
				);

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

			const getDocumentByCode = (documentCode: string) => {
				const editor = getIndexedEditorByDocumentCode(documentCode);
				const documentById = editor?.documentId
					? repositories.document.getById(editor.documentId)
					: undefined;

				if (documentById && documentById.state.code === documentCode) {
					return documentById;
				}

				return repositories.document
					.read()
					.find((document) => document.state.code === documentCode);
			};

			const getNatureByDocumentCode = (documentCode: string) => {
				const editor = getIndexedEditorByDocumentCode(documentCode);
				const document = getDocumentByCode(documentCode);
				const natureById = editor?.natureId
					? repositories.nature.getById(editor.natureId)
					: document
						? repositories.nature.getById(document.state.nature)
						: undefined;

				if (natureById) {
					return natureById;
				}

				if (!document) return undefined;

				return repositories.nature
					.read()
					.find((nature) => nature.meta.id === document.state.nature);
			};

			const getFolderByDocumentCode = (documentCode: string) => {
				const editor = getIndexedEditorByDocumentCode(documentCode);
				const nature = getNatureByDocumentCode(documentCode);
				const folderById = editor?.folderId
					? repositories.folder.getById(editor.folderId)
					: nature
						? repositories.folder.getById(nature.state.folder)
						: undefined;

				if (folderById) {
					return folderById;
				}

				if (!nature) return undefined;

				return repositories.folder
					.read()
					.find((folder) => folder.meta.id === nature.state.folder);
			};

			const getDocumentImportPolicy = (documentCode: string) => {
				const nature = getNatureByDocumentCode(documentCode);
				const editor = getEditorByDocumentCode(documentCode);

				return resolveDocumentImportPolicy({
					natureExtensions: (
						nature?.state as NatureStateWithExtensions | undefined
					)?.extensions,
					currentFileType: editor?.draft.fileType,
				});
			};

			type DocumentMetaDraft = Readonly<{
				name: string;
				date: string;
				expires: string;
			}>;

			const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

			const normalizeMetaName = (value: string | undefined): string =>
				value?.trim() ?? "";

			const normalizeMetaDate = (value: string | undefined): string => {
				const trimmed = value?.trim() ?? "";
				return ISO_DATE_RE.test(trimmed) ? trimmed : "";
			};

			const normalizeMetaDraft = (
				draft: Partial<DocumentMetaDraft>,
			): DocumentMetaDraft => ({
				name: normalizeMetaName(draft.name),
				date: normalizeMetaDate(draft.date),
				expires: normalizeMetaDate(draft.expires),
			});

			type DocumentEmailDraft = Readonly<{
				from: string;
				to: string;
				cc: string;
				bcc: string;
				subject: string;
				text: string;
			}>;

			const normalizeEmailValue = (value: string | undefined): string =>
				value?.trim() ?? "";

			const normalizeEmailDraft = (
				draft: Partial<DocumentEmailDraft>,
			): DocumentEmailDraft => ({
				from: normalizeEmailValue(draft.from),
				to: normalizeEmailValue(draft.to),
				cc: normalizeEmailValue(draft.cc),
				bcc: normalizeEmailValue(draft.bcc),
				subject: normalizeEmailValue(draft.subject),
				text: draft.text?.trim() ?? "",
			});

			type RejectEmailInfoCacheEntry = Readonly<{
				templateKey: string;
				to: string;
				cc: string;
				subject: string;
				text: string;
			}>;

			const rejectEmailInfoByDocumentCode = new Map<
				string,
				RejectEmailInfoCacheEntry
			>();
			const rejectEmailInfoLoadingByDocumentCode = new Map<
				string,
				Promise<RejectEmailInfoCacheEntry | undefined>
			>();

			const joinEmailRecipients = (
				values: readonly string[] | undefined,
			): string =>
				(values ?? [])
					.map((value) => normalizeEmailValue(value))
					.filter(Boolean)
					.join("; ");

			const buildDefaultEmailDraft = (
				documentCode: string,
			): DocumentEmailDraft => {
				const editor = getEditorByDocumentCode(documentCode);
				const document = getDocumentByCode(documentCode);
				const fallbackSubject = normalizeEmailValue(
					editor?.draft.name ?? document?.state.name ?? documentCode,
				);

				return {
					from: getCurrentUserEmail(),
					to: "",
					cc: "",
					bcc: "",
					subject: fallbackSubject,
					text: "",
				};
			};

			const buildRejectEmailDraftFromCache = (
				documentCode: string,
				entry?: RejectEmailInfoCacheEntry,
			): DocumentEmailDraft => {
				const fallback = buildDefaultEmailDraft(documentCode);

				if (!entry) {
					return fallback;
				}

				return {
					...fallback,
					to: entry.to || fallback.to,
					cc: entry.cc || fallback.cc,
					subject: entry.subject || fallback.subject,
					text: entry.text || fallback.text,
				};
			};

			const blobToBase64DataUrl = (blob: Blob): Promise<string> =>
				new Promise((resolve, reject) => {
					const reader = new FileReader();

					reader.onloadend = () => {
						const result = reader.result;
						if (typeof result !== "string") {
							reject(new Error("blob to base64 conversion failed"));
							return;
						}

						resolve(result);
					};

					reader.onerror = () => {
						reject(
							reader.error ??
								new Error("blob to base64 conversion failed"),
						);
					};

					reader.readAsDataURL(blob);
				});

			const toRawBase64Content = (value: string): string => {
				const trimmed = value.trim();
				const separatorIndex = trimmed.indexOf(",");
				return separatorIndex >= 0
					? trimmed.slice(separatorIndex + 1)
					: trimmed;
			};

			const resolveEmailAttachmentFilename = (
				documentCode: string,
				editor: Editor,
			): string => {
				const rawBaseName =
					editor.draft.binary?.name?.trim() ||
					editor.draft.name?.trim() ||
					documentCode;

				if (rawBaseName.includes(".")) {
					return rawBaseName;
				}

				const extension = normalizeBinaryExtension(
					editor.draft.fileType,
				);

				return extension === "unknown"
					? rawBaseName
					: `${rawBaseName}.${extension}`;
			};

			const areMetaDraftsEqual = (
				left: DocumentMetaDraft,
				right: DocumentMetaDraft,
			): boolean =>
				left.name === right.name &&
				left.date === right.date &&
				left.expires === right.expires;

			const readEditorMetaDraft = (editor: Editor): DocumentMetaDraft =>
				normalizeMetaDraft({
					name: editor.draft.name,
					date: editor.draft.documentDate,
					expires: editor.draft.expirationDate,
				});

			const readCanonicalMetaDraft = (
				document: ReturnType<typeof getDocumentByCode> | undefined,
			): DocumentMetaDraft =>
				normalizeMetaDraft({
					name: document?.state.name,
					date: document?.state.documentDate,
					expires: document?.state.expirationDate,
				});

			const isMetaDirty = (documentCode: string): boolean => {
				const editor = getEditorByDocumentCode(documentCode);
				if (!editor || editor.mode === "new") {
					return false;
				}

				return !areMetaDraftsEqual(
					readEditorMetaDraft(editor),
					readCanonicalMetaDraft(getDocumentByCode(documentCode)),
				);
			};

			const syncEditorDirtyFromSources = (
				documentCode: string,
			): boolean => {
				const editor = getEditorByDocumentCode(documentCode);
				if (!editor) {
					return false;
				}

				const nextDirty =
					isViewerPdfDirty(documentCode) ||
					isBinaryDirty(documentCode) ||
					isMetaDirty(documentCode);

				if (editor.dirty !== nextDirty) {
					patchEditor(documentCode, {
						dirty: nextDirty,
					});
				}

				return nextDirty;
			};

			const ensurePreloadedEditor = (
				description: NavigationDescription,
			) => {
				const key = makeExistingEditorKey(description.documentCode);
				const existing = stores.documentStore.state.editors[key];

				if (existing) {
					patchEditor(description.documentCode, {
						natureCode: existing.natureCode ?? description.natureCode,
						folderSid: existing.folderSid ?? description.folder.sid,
					});
					return key;
				}

				const editor: Editor = {
					documentId: undefined,
					documentCode: description.documentCode,

					natureId: undefined,
					natureCode: description.natureCode,

					folderId: undefined,
					folderSid: description.folder.sid,

					mode: "existing",

					dirty: false,
					saving: false,
					binaryStatus: "loading",

					error: undefined,
					lastSavedAt: undefined,

					actions: [],

					draft: {
						name: description.documentCode,
						fileType: "unknown",

						statusNumber: undefined,
						statusLabel: undefined,

						documentDate: undefined,
						expirationDate: undefined,

						memo: undefined,
						binary: undefined,
					},
				};

				editor.actions = buildEditorActions(
					editor,
				) as Editor["actions"];

				putEditor(key, editor);

				return key;
			};

			const reconcileExistingEditor = (documentCode: string) => {
				const document = getDocumentByCode(documentCode);
				const nature = getNatureByDocumentCode(documentCode);
				const folder = getFolderByDocumentCode(documentCode);
				const editor = getEditorByDocumentCode(documentCode);

				if (!document || !nature || !folder || !editor) return false;

				const nextName =
					!editor.draft.name || editor.draft.name === documentCode
						? document.state.name
						: editor.draft.name;

				patchEditor(documentCode, {
					documentId: document.meta.id,
					natureId: nature.meta.id,
					natureCode: nature.state.code,
					folderId: folder.meta.id,
					folderSid: folder.state.sid,
					error: undefined,
					draft: {
						name: nextName,
						fileType:
							editor.draft.fileType === "unknown"
								? document.state.fileExtension
								: editor.draft.fileType,
						preview:
							editor.draft.preview ??
							getPreviewFromCanonicalDocument(document),
						statusNumber:
							editor.draft.statusNumber ?? document.state.status.number,
						statusLabel:
							editor.draft.statusLabel ?? document.state.status.label,
						documentDate:
							editor.draft.documentDate ??
							(document.state.documentDate || undefined),
						expirationDate:
							editor.draft.expirationDate ??
							document.state.expirationDate,
						memo: editor.draft.memo ?? document.state.memo ?? undefined,
					},
				});

				remoteBinaryDescriptors.delete(documentCode);

				return true;
			};

			const getEnableControlParameter = (): boolean | undefined =>
				readFlag(getAppProfileParameters()?.enableControl?.parameter);

			const getNatureFlags = (
				nature: ReturnType<typeof getNatureByDocumentCode>,
			): NatureActionFlags => {
				const raw = nature?.state.flags as NatureFlagsShape | undefined;

				return {
					editable: readFlag(raw?.editable),
					controllable:
						readFlag(raw?.enableControl) ??
						readFlag(raw?.controllable) ??
						readFlag(raw?.flagEnabled),
					uploadEnabled: readFlag(raw?.uploadEnabled),
				};
			};

			const buildEditorActions = (
				editor: Editor,
			): readonly EditorAction[] => {
				const nature = editor.documentCode
					? getNatureByDocumentCode(editor.documentCode)
					: undefined;
				const clipboard = getClipboardState();
				const clipboardExtension = normalizeBinaryExtension(
					clipboard?.fileExtension,
				);
				const clipboardAvailable =
					hasPermission(getFileManagement(), "C") &&
					Boolean(clipboard?.documentCode) &&
					clipboardExtension !== "unknown";
				const sameDocumentAsClipboard =
					Boolean(clipboard?.documentCode) &&
					clipboard?.documentCode === editor.documentCode;
				const pastePolicy = resolveDocumentImportPolicy({
					natureExtensions: (
						nature?.state as NatureStateWithExtensions | undefined
					)?.extensions,
					currentFileType: editor.draft.fileType,
				});
				const targetHasBinary = Boolean(editor.draft.binary?.url);
				const targetFileType = normalizeBinaryExtension(
					editor.draft.fileType,
				);
				const canReplace =
					clipboardAvailable &&
					!sameDocumentAsClipboard &&
					pastePolicy.replace.extensions.includes(clipboardExtension);
				const canAddPages =
					clipboardAvailable &&
					!sameDocumentAsClipboard &&
					targetHasBinary &&
					targetFileType === "pdf" &&
					pastePolicy.addPages.extensions.includes(clipboardExtension);
				const canPaste = canReplace || canAddPages;

				return buildDocumentEditorActions({
					editor,
					documentMode: getDocumentMode(),
					documentManagement: getDocumentManagement(),
					fileManagement: getFileManagement(),
					enableControl: getEnableControlParameter(),
					uncontrolledDocumentStatus: getUncontrolledDocumentStatus(),
					defaultUploadStatus: getDefaultUploadStatus(),
					natureFlags: getNatureFlags(nature),
					hasCanonicalContext: hasCanonicalContext(editor),
					clipboardAvailable,
					clipboardDocumentCode: clipboard?.documentCode,
					canPaste,
				}) as Editor["actions"];
			};

			const ensureExistingEditor = (documentCode: string) => {
				const key = makeExistingEditorKey(documentCode);
				const existing = stores.documentStore.state.editors[key];

				if (existing) return key;

				const document = getDocumentByCode(documentCode);
				if (!document) return undefined;

				const nature = getNatureByDocumentCode(documentCode);
				const folder = getFolderByDocumentCode(documentCode);

				const editor: Editor = {
					documentId: document.meta.id,
					documentCode: document.state.code,

					natureId: nature?.meta.id,
					natureCode: nature?.state.code,

					folderId: folder?.meta.id,
					folderSid: folder?.state.sid,

					mode: "existing",

					dirty: false,
					saving: false,
					binaryStatus: "idle",

					error: undefined,
					lastSavedAt: undefined,

					actions: [],

					draft: {
						name: document.state.name,
						fileType: document.state.fileExtension,
						preview: getPreviewFromCanonicalDocument(document),

						statusNumber: document.state.status.number,
						statusLabel: document.state.status.label,

						documentDate: document.state.documentDate || undefined,
						expirationDate: document.state.expirationDate || undefined,

						memo: document.state.memo || undefined,
						binary: undefined,
					},
				};

				editor.actions = buildEditorActions(
					editor,
				) as Editor["actions"];

				putEditor(key, editor);

				return key;
			};

			const resolveEditorKeyByDocumentCode = (documentCode: string) => {
				const indexedEditorKey =
					getIndexedEditorKeyByDocumentCode(documentCode);
				if (indexedEditorKey) {
					return indexedEditorKey;
				}

				return ensureExistingEditor(documentCode);
			};

			const patchEditor = (
				documentCode: string,
				patch: EditorPatch,
			) => {
				const editorKey = resolveEditorKeyByDocumentCode(documentCode);
				if (!editorKey) return;

				const current = stores.documentStore.state.editors[editorKey];
				if (!current) return;

				const nextDraft = patch.draft
					? {
							...current.draft,
							...patch.draft,
							binary: patch.draft.binary
								? {
										...current.draft.binary,
										...patch.draft.binary,
									}
								: current.draft.binary,
						}
					: current.draft;

				const resolvedStatusNumber =
					nextDraft.statusNumber ??
					(current.mode === "new" || patch.mode === "new"
						? getDefaultUploadStatus()
						: undefined);
				const didPatchStatusNumberChange =
					patch.draft?.statusNumber !== undefined &&
					patch.draft.statusNumber !== current.draft.statusNumber;
				const nextStatusLabel =
					patch.draft?.statusLabel !== undefined
						? patch.draft.statusLabel
						: didPatchStatusNumberChange
							? undefined
							: nextDraft.statusLabel;

				const next: Editor = {
					...current,
					...patch,
					// @ts-ignore
					draft: {
						...nextDraft,
						statusNumber:
							resolvedStatusNumber ?? nextDraft.statusNumber,
						statusLabel: nextStatusLabel,
					},
					dirty:
						patch.dirty !== undefined ? patch.dirty : current.dirty,
					saving:
						patch.saving !== undefined ? patch.saving : current.saving,
					binaryStatus:
						patch.binaryStatus !== undefined
							? patch.binaryStatus
							: current.binaryStatus,
					actions: [],
				};

				next.actions = reuseShallowEqualEditorActions(
					current.actions as Editor["actions"],
					buildEditorActions(next) as Editor["actions"],
				);

				if (areEditorsEquivalentForStore(current, next)) {
					return;
				}

				const nextEditors = {
					...stores.documentStore.state.editors,
					[editorKey]: next,
				};

				stores.documentStore.patch({
					editors: {
						[editorKey]: next,
					},
					...buildDocumentStoreDerivedPatch({
						editors: nextEditors,
						selectedEditorKey:
							stores.documentStore.state.selectedEditorKey,
					}),
				});
			};

			const getEditorByDocumentCode = (documentCode: string) => {
				const editorKey = resolveEditorKeyByDocumentCode(documentCode);
				if (!editorKey) return undefined;
				return stores.documentStore.state.editors[editorKey];
			};

			const resolveDocumentUpdateContext = (documentCode: string) => {
				const editor = getEditorByDocumentCode(documentCode);
				if (!editor) return undefined;

				const document =
					(editor.documentId
						? repositories.document.getById(editor.documentId)
						: undefined) ?? getDocumentByCode(documentCode);
				if (!document) return undefined;

				const nature =
					(editor.natureId
						? repositories.nature.getById(editor.natureId)
						: undefined) ??
					repositories.nature.getById(document.state.nature) ??
					getNatureByDocumentCode(documentCode);
				if (!nature) return undefined;

				const folder =
					(editor.folderId
						? repositories.folder.getById(editor.folderId)
						: undefined) ??
					repositories.folder.getById(nature.state.folder) ??
					getFolderByDocumentCode(documentCode);
				if (!folder) return undefined;

				return {
					document,
					nature,
					folder,
					editor,
				};
			};

			const readCanonicalDocumentPayload = async (
				documentCode: string,
			) => {
				const response = await api.ermewa.get.document({
					params: { documentCode },
				});

				if (!response.ok || !response.value.data) {
					return undefined;
				}

				return response.value.data;
			};

			let rememberBinaryBlob: (
				documentCode: string,
				blob: Blob,
			) => void = () => {};

			const setEditorBinaryBlob = (
				documentCode: string,
				blob: Blob,
				options?: {
					name?: string;
					type?: string;
					base64?: string;
					url?: string;
				},
			) => {
				const currentEditor = getEditorByDocumentCode(documentCode);
				if (!currentEditor) return undefined;

				rememberBinaryBlob(documentCode, blob);

				const objectUrl = options?.url ?? URL.createObjectURL(blob);

				patchEditor(documentCode, {
					binaryStatus: "ready",
					error: undefined,
					draft: {
						preview: {
							url: objectUrl,
							source: "blob",
						},
						binary: {
							url: objectUrl,
							name:
								options?.name || currentEditor.draft.name || "document",
							size: blob.size,
							type:
								options?.type ||
								blob.type ||
								"application/octet-stream",
							base64: options?.base64,
						},
					},
				});

				pushDocumentFlowDebug("binary.set", {
					documentCode,
					url: objectUrl,
					size: blob.size,
				});

				return objectUrl;
			};

			const ensureEditorBinary = async (
				editorKey: string,
				opts?: {
					force?: boolean;
					source?: BinaryCandidateSource;
					descriptor?: RemoteBinaryDescriptor;
				},
			): Promise<boolean> => {
				const editor = stores.documentStore.state.editors[editorKey];
				if (
					!editor ||
					editor.mode !== "existing" ||
					!editor.documentCode
				) {
					return false;
				}

				if (!opts?.force && editor.draft.binary?.url) {
					pushDocumentFlowDebug("xfile.ensure.skip-existing", {
						editorKey,
						documentCode: editor.documentCode,
						source: opts?.source ?? "ensure",
					});
					return true;
				}

				const descriptor =
					opts?.descriptor ??
					getCanonicalBinaryDescriptor(editor.documentCode) ??
					remoteBinaryDescriptors.get(editor.documentCode);

				if (!descriptor) {
					pushDocumentFlowDebug("xfile.ensure.miss", {
						editorKey,
						documentCode: editor.documentCode,
						source: opts?.source ?? "ensure",
					});
					setBinaryStateAfterRace(editor.documentCode);
					return false;
				}

				return startBinaryCandidateLoad({
					editorKey,
					descriptor,
					source: opts?.source ?? "ensure",
					force: opts?.force,
				});
			};

			const markDocumentDirty = (
				documentCode: string,
				dirty: boolean,
			) => {
				setViewerPdfDirty(documentCode, dirty);
				syncEditorDirtyFromSources(documentCode);
			};

			const replaceDocumentBinary = async (
				documentCode: string,
				input: File | readonly File[],
			) => {
				const editor = getEditorByDocumentCode(documentCode);
				if (!editor) {
					return false;
				}

				const files = normalizeSelectedFiles(input);
				if (!files.length) {
					return false;
				}

				const natureExtensions = (
					getNatureByDocumentCode(documentCode)?.state as
						| NatureStateWithExtensions
						| undefined
				)?.extensions;

				const buildDecision = (preferredChoice?: "native" | "pdf") =>
					resolveDocumentImportDecision({
						files,
						natureExtensions,
						currentFileType: editor.draft.fileType,
						preferredChoice,
					});

				let decision = buildDecision();

				if (decision.kind === "ask-user") {
					decision = buildDecision(askUserImportChoice(decision.file));
				}

				if (decision.kind === "reject") {
					throw new Error(decision.reason);
				}

				const editorKey = resolveEditorKeyByDocumentCode(documentCode);
				if (editorKey) {
					abortBinaryLoadForEditor(editorKey);
				}

				unregisterPdfCommit(documentCode);

				if (decision.kind === "pdf") {
					const { convertFilesToPdfArtifact } = await import(
						"@src/infrastructure/library/pdf/convert-files-to-pdf"
					);
					const converted = await convertFilesToPdfArtifact(
						decision.files,
					);

					setEditorBinaryBlob(documentCode, converted.blob, {
						name: converted.fileName,
						type: converted.blob.type || "application/pdf",
						base64: converted.base64,
					});

					patchEditor(documentCode, {
						binaryStatus: "ready",
						error: undefined,
						draft: {
							fileType: "pdf",
						},
					});

					pushDocumentFlowDebug("binary.replace.local", {
						documentCode,
						target: "pdf",
						fileCount: decision.files.length,
						fileNames: decision.files.map((file) => file.name),
					});
				} else {
					setEditorBinaryBlob(documentCode, decision.file, {
						name: decision.file.name,
						type: decision.file.type || "application/octet-stream",
					});

					patchEditor(documentCode, {
						binaryStatus: "ready",
						error: undefined,
						draft: {
							fileType: decision.extension,
						},
					});

					pushDocumentFlowDebug("binary.replace.local", {
						documentCode,
						target: "native",
						fileName: decision.file.name,
						fileExtension: decision.extension,
					});
				}

				setViewerPdfDirty(documentCode, false);
				setBinaryDirty(documentCode, true);
				syncEditorDirtyFromSources(documentCode);

				return true;
			};

			const updateDocumentMetaDraft = (
				documentCode: string,
				draft: DocumentMetaDraft,
			) => {
				const editor = getEditorByDocumentCode(documentCode);
				if (!editor) {
					return false;
				}

				const nextMeta = normalizeMetaDraft(draft);
				const currentMeta = readEditorMetaDraft(editor);

				if (areMetaDraftsEqual(currentMeta, nextMeta)) {
					return false;
				}

				const canonicalMeta = readCanonicalMetaDraft(
					getDocumentByCode(documentCode),
				);

				patchEditor(documentCode, {
					draft: {
						name: nextMeta.name,
						documentDate: nextMeta.date,
						expirationDate: nextMeta.expires,
					},
				});

				const nextDirty = syncEditorDirtyFromSources(documentCode);

				pushDocumentFlowDebug("meta.draft.updated", {
					documentCode,
					dirty: nextDirty,
					name: nextMeta.name,
					date: nextMeta.date,
					expires: nextMeta.expires,
				});

				return true;
			};

			const sendDocumentEmail = async (
				documentCode: string,
				draft: DocumentEmailDraft,
			) => {
				const normalizedDraft = normalizeEmailDraft(draft);

				if (
					normalizedDraft.from.length === 0 ||
					normalizedDraft.to.length === 0 ||
					normalizedDraft.subject.length === 0
				) {
					throw new Error(
						"Missing required email fields: from, to, subject",
					);
				}

				let editor = getEditorByDocumentCode(documentCode);
				if (!editor) {
					throw new Error("Document attachment is not available");
				}

				const preparedCommit = await commitDocumentPdf(documentCode);
				let attachmentContent = preparedCommit?.fileData.binary;

				if (!attachmentContent) {
					const binaryReady = await ensureDocumentBinary(documentCode);
					editor = getEditorByDocumentCode(documentCode);

					if (!binaryReady || !editor?.draft.binary?.url) {
						throw new Error("Document attachment is not available");
					}

					let base64DataUrl = editor.draft.binary.base64?.trim() ?? "";

					if (!base64DataUrl) {
						const response = await fetch(editor.draft.binary.url);

						if (!response.ok) {
							throw new Error("Failed to read document attachment");
						}

						const blob = await response.blob();
						base64DataUrl = await blobToBase64DataUrl(blob);

						patchEditor(documentCode, {
							draft: {
								binary: {
									base64: base64DataUrl,
								},
							},
						});
					}

					attachmentContent = toRawBase64Content(base64DataUrl);
				}

				const attachment = {
					filename: resolveEmailAttachmentFilename(
						documentCode,
						editor,
					),
					content: attachmentContent,
					encoding: "base64",
				} as const;

				pushDocumentFlowDebug("xmail.start", {
					documentCode,
					to: normalizedDraft.to,
					hasCc: normalizedDraft.cc.length > 0,
					hasBcc: normalizedDraft.bcc.length > 0,
					hasText: normalizedDraft.text.length > 0,
					filename: attachment.filename,
				});

				const response = await api.ermewa.post.sendMail({
					body: {
						from: normalizedDraft.from,
						to: normalizedDraft.to,
						subject: normalizedDraft.subject,
						...(normalizedDraft.cc ? { cc: normalizedDraft.cc } : {}),
						...(normalizedDraft.bcc
							? { bcc: normalizedDraft.bcc }
							: {}),
						...(normalizedDraft.text
							? { text: normalizedDraft.text }
							: {}),
						attachments: [attachment],
					},
				});

				if (!response.ok) {
					pushDocumentFlowDebug("xmail.error", {
						documentCode,
						...((toDebugError(response.error) as Record<
							string,
							unknown
						>) ?? {}),
					});

					throw new Error(
						response.error.message || "Failed to send email",
					);
				}

				pushDocumentFlowDebug("xmail.done", {
					documentCode,
					to: normalizedDraft.to,
					filename: attachment.filename,
				});

				return true;
			};

			const getRejectEmailDraft = (
				documentCode: string,
			): DocumentEmailDraft =>
				buildRejectEmailDraftFromCache(
					documentCode,
					rejectEmailInfoByDocumentCode.get(documentCode),
				);

			const prefetchRejectEmailInfo = async (
				documentCode: string,
			): Promise<DocumentEmailDraft> => {
				const cached = rejectEmailInfoByDocumentCode.get(documentCode);
				if (cached) {
					return buildRejectEmailDraftFromCache(documentCode, cached);
				}

				const running =
					rejectEmailInfoLoadingByDocumentCode.get(documentCode);
				if (running) {
					const resolved = await running;
					return buildRejectEmailDraftFromCache(documentCode, resolved);
				}

				const job = (async () => {
					pushDocumentFlowDebug("xrml.start", {
						documentCode,
					});

					try {
						const response = await api.ermewa.get.rejectEmailInfo({
							params: { documentCode },
						});

						if (!response.ok || !response.value.data) {
							pushDocumentFlowDebug("xrml.miss", {
								documentCode,
								ok: response.ok,
							});
							return undefined;
						}

						const payload = response.value.data;
						const entry: RejectEmailInfoCacheEntry = {
							templateKey: normalizeEmailValue(payload.templateKey),
							to: joinEmailRecipients(payload.to),
							cc: joinEmailRecipients(payload.cc),
							subject: normalizeEmailValue(payload.subject),
							text: payload.text?.trim() ?? "",
						};

						rejectEmailInfoByDocumentCode.set(documentCode, entry);

						pushDocumentFlowDebug("xrml.done", {
							documentCode,
							templateKey: entry.templateKey,
							hasTo: entry.to.length > 0,
							hasCc: entry.cc.length > 0,
							hasSubject: entry.subject.length > 0,
							hasText: entry.text.length > 0,
						});

						return entry;
					} catch (error) {
						pushDocumentFlowDebug("xrml.error", {
							documentCode,
							...((toDebugError(error) as Record<string, unknown>) ??
								{}),
						});
						return undefined;
					} finally {
						rejectEmailInfoLoadingByDocumentCode.delete(documentCode);
					}
				})();

				rejectEmailInfoLoadingByDocumentCode.set(documentCode, job);

				const resolved = await job;
				return buildRejectEmailDraftFromCache(documentCode, resolved);
			};

			const uploadDocumentBody = async (
				body: Parameters<typeof api.ermewa.post.upload>[0]["body"],
			) => {
				const response = await api.ermewa.post.upload({ body });

				if (!response.ok) {
					throw new Error(response.error.message || "upload failed");
				}

				const data = response.value.data;
				if (!data) {
					throw new Error("upload returned no data");
				}

				return data;
			};

			type UploadDocumentPayload = NonNullable<
				Awaited<ReturnType<typeof uploadDocumentBody>>
			>;
			type UploadedDocumentPayload =
				UploadDocumentPayload["uploaded"][number];

			const updateDocumentBody = (
				body: Parameters<
					typeof api.ermewa.post.documentUpdate
				>[0]["body"],
			) => api.ermewa.post.documentUpdate({ body });
			type UpdateDocumentResponse = Awaited<
				ReturnType<typeof updateDocumentBody>
			>;
			const readUpdatedDocumentPayload = (
				response: UpdateDocumentResponse,
			) =>
				response.ok ? response.value.data?.updated?.[0] : undefined;
			const readUpdatedDocumentLastUpdateTime = (
				response: UpdateDocumentResponse,
			): string | undefined => {
				const value =
					readUpdatedDocumentPayload(response)?.lastUpdateTime;
				const trimmed = value?.trim();
				return trimmed ? trimmed : undefined;
			};

			const deleteDocumentBody = (
				documentCode: string,
				body: Parameters<
					typeof api.ermewa.post.documentDelete
				>[0]["body"],
			) =>
				api.ermewa.post.documentDelete({
					params: { documentCode },
					body,
				});

			const ensureDocumentBinary = (documentCode: string) =>
				ensureEditorBinary(makeExistingEditorKey(documentCode));

			let finalizeUploadedDocument: (input: {
				sourceDocumentCode: string;
				uploadedDocument: UploadedDocumentPayload;
				context: NonNullable<
					ReturnType<typeof resolveDocumentUpdateContext>
				>;
			}) => Promise<boolean> = async () => false;
			let finalizeSavedDocument: (input: {
				sourceDocumentCode: string;
				response: UpdateDocumentResponse;
				context: NonNullable<
					ReturnType<typeof resolveDocumentUpdateContext>
				>;
				fileData?: {
					binary: string;
					extension: string;
					encoding: "base64";
					language?: string;
				};
			}) => Promise<boolean> = async () => false;

			const documentEditorCommands = createDocumentEditorCommands({
				patchEditor,
				getEditorByDocumentCode,
				resolveDocumentUpdateContext,
				getDefaultUploadStatus,
				ensureDocumentBinary,
				isBinaryDirty,
				upload: uploadDocumentBody,
				documentUpdate: updateDocumentBody,
				documentDelete: deleteDocumentBody,
				afterUploadSuccess: (input) => finalizeUploadedDocument(input),
				afterSaveSuccess: (input) => finalizeSavedDocument(input),
				resolveUpdatedLastSavedAt: ({ response }) =>
					readUpdatedDocumentLastUpdateTime(response),
				pushDocumentFlowDebug,
				toDebugError,
				setEditorBinaryBlob,
			});

			rememberBinaryBlob = documentEditorCommands.rememberBinaryBlob;

			const {
				registerPdfCommit,
				unregisterPdfCommit,
				commitDocumentPdf,
				setDocumentPdfDraft,
				uploadDocument,
				updateDocument,
				saveDocument,
				deleteDocument,
				runDocumentAction: baseRunDocumentAction,
			} = documentEditorCommands;

			const fetchSourceDocumentBlob = async (
				documentCode: string,
			): Promise<
				| {
						blob: Blob;
						extension: BinaryExtension;
						fileName: string;
				  }
				| undefined
			> => {
				const sourceDocument = getDocumentByCode(documentCode);
				const sourceEditor = getEditorByDocumentCode(documentCode);

				const preparedCommit = await commitDocumentPdf(documentCode);
				if (preparedCommit) {
					const extension = normalizeBinaryExtension(
						preparedCommit.fileData.extension ||
							sourceEditor?.draft.fileType ||
							sourceDocument?.state.fileExtension,
					);

					if (extension !== "unknown") {
						return {
							blob: base64ToBlob(
								preparedCommit.fileData.binary,
								resolveMimeTypeFromExtension(extension),
							),
							extension,
							fileName: ensureFileNameHasExtension(
								sourceEditor?.draft.name ??
									sourceDocument?.state.name ??
									documentCode,
								extension,
							),
						};
					}
				}

				const draftBinaryUrl = sourceEditor?.draft.binary?.url;
				const draftExtension = normalizeBinaryExtension(
					sourceEditor?.draft.fileType,
				);

				if (draftBinaryUrl && draftExtension !== "unknown") {
					const response = await fetch(draftBinaryUrl);

					if (response.ok) {
						const blob = await response.blob();
						return {
							blob,
							extension: draftExtension,
							fileName: ensureFileNameHasExtension(
								sourceEditor?.draft.binary?.name ||
									sourceEditor?.draft.name ||
									sourceDocument?.state.name ||
									documentCode,
								draftExtension,
							),
						};
					}
				}

				if (!sourceDocument || sourceDocument.state.isLocal === true) {
					return undefined;
				}

				const extension = normalizeBinaryExtension(
					sourceDocument.state.fileExtension,
				);
				if (extension === "unknown" || !sourceDocument.state.url) {
					return undefined;
				}

				const response = await api.ermewa.post.file({
					params: {
						documentCode: sourceDocument.state.code,
						extension,
					},
					body: {
						documentCode: sourceDocument.state.code,
						url: sourceDocument.state.url,
						detailedUrl:
							sourceDocument.state.fullUrl ||
							sourceDocument.state.shortUrl ||
							sourceDocument.state.url,
						extension,
					},
				});

				if (!response.ok || !(response.value.data instanceof Blob)) {
					return undefined;
				}

				return {
					blob: response.value.data,
					extension,
					fileName: ensureFileNameHasExtension(
						sourceDocument.state.name || sourceDocument.state.code,
						extension,
					),
				};
			};

			const buildClipboardSourceFile = async (): Promise<
				File | undefined
			> => {
				const clipboard = getClipboardState();
				if (!clipboard?.documentCode) {
					return undefined;
				}

				const source = await fetchSourceDocumentBlob(
					clipboard.documentCode,
				);
				if (!source) {
					return undefined;
				}

				return new File([source.blob], source.fileName, {
					type:
						source.blob.type ||
						resolveMimeTypeFromExtension(source.extension),
				});
			};

			const buildCurrentPdfFile = async (
				documentCode: string,
			): Promise<File | undefined> => {
				const editor = getEditorByDocumentCode(documentCode);
				const preparedCommit = await commitDocumentPdf(documentCode);

				if (preparedCommit) {
					const blob = base64ToBlob(
						preparedCommit.fileData.binary,
						"application/pdf",
					);

					return new File(
						[blob],
						ensureFileNameHasExtension(
							editor?.draft.name ?? documentCode,
							"pdf",
						),
						{ type: "application/pdf" },
					);
				}

				if (editor?.draft.binary?.url) {
					let blob: Blob | undefined;

					if (editor.draft.binary.base64) {
						blob = base64ToBlob(
							editor.draft.binary.base64,
							editor.draft.binary.type || "application/pdf",
						);
					} else {
						const response = await fetch(editor.draft.binary.url);
						if (!response.ok) {
							return undefined;
						}
						blob = await response.blob();
					}

					return new File(
						[blob],
						ensureFileNameHasExtension(
							editor.draft.binary.name ||
								editor.draft.name ||
								documentCode,
							"pdf",
						),
						{
							type:
								blob.type ||
								editor.draft.binary.type ||
								"application/pdf",
						},
					);
				}

				const binaryReady = await ensureDocumentBinary(documentCode);
				const refreshedEditor = getEditorByDocumentCode(documentCode);
				if (!binaryReady || !refreshedEditor?.draft.binary?.url) {
					return undefined;
				}

				const response = await fetch(refreshedEditor.draft.binary.url);
				if (!response.ok) {
					return undefined;
				}

				const blob = await response.blob();

				return new File(
					[blob],
					ensureFileNameHasExtension(
						refreshedEditor.draft.binary.name ||
							refreshedEditor.draft.name ||
							documentCode,
						"pdf",
					),
					{
						type: blob.type || "application/pdf",
					},
				);
			};

			const mergeClipboardIntoPdfDocument = async (
				documentCode: string,
				sourceFile: File,
			): Promise<boolean> => {
				const currentPdfFile = await buildCurrentPdfFile(documentCode);
				if (!currentPdfFile) {
					return false;
				}

				const editorKey = resolveEditorKeyByDocumentCode(documentCode);
				if (editorKey) {
					abortBinaryLoadForEditor(editorKey);
				}

				unregisterPdfCommit(documentCode);

				const { convertFilesToPdfArtifact } = await import(
					"@src/infrastructure/library/pdf/convert-files-to-pdf"
				);
				const converted = await convertFilesToPdfArtifact([
					currentPdfFile,
					sourceFile,
				]);

				setEditorBinaryBlob(documentCode, converted.blob, {
					name: converted.fileName,
					type: converted.blob.type || "application/pdf",
					base64: converted.base64,
				});

				patchEditor(documentCode, {
					binaryStatus: "ready",
					error: undefined,
					draft: {
						fileType: "pdf",
					},
				});

				setViewerPdfDirty(documentCode, false);
				setBinaryDirty(documentCode, true);
				syncEditorDirtyFromSources(documentCode);

				pushDocumentFlowDebug("binary.paste.append", {
					documentCode,
					sourceFileName: sourceFile.name,
				});

				return true;
			};

			const copyDocument = async (
				documentCode: string,
			): Promise<boolean> => {
				const document = getDocumentByCode(documentCode);
				const editor = getEditorByDocumentCode(documentCode);

				if (
					!document ||
					document.state.isLocal === true ||
					!hasPermission(getFileManagement(), "C")
				) {
					return false;
				}

				const fileExtension = normalizeBinaryExtension(
					editor?.draft.fileType ?? document.state.fileExtension,
				);
				if (fileExtension === "unknown") {
					return false;
				}

				stores.documentStore.patch({
					clipboard: {
						documentCode,
						documentName:
							editor?.draft.name ?? document.state.name ?? documentCode,
						fileExtension,
					},
				});

				refreshAllEditorActions();

				pushDocumentFlowDebug("clipboard.copy", {
					documentCode,
					fileExtension,
				});

				return true;
			};

			const pasteClipboardIntoDocument = async (
				documentCode: string,
			): Promise<boolean> => {
				const clipboard = getClipboardState();
				if (
					!clipboard?.documentCode ||
					!hasPermission(getFileManagement(), "C") ||
					clipboard.documentCode === documentCode
				) {
					return false;
				}

				const targetEditor = getEditorByDocumentCode(documentCode);
				if (!targetEditor) {
					return false;
				}

				const targetNature = getNatureByDocumentCode(documentCode);
				const sourceExtension = normalizeBinaryExtension(
					clipboard.fileExtension,
				);
				if (sourceExtension === "unknown") {
					return false;
				}
				const policy = resolveDocumentImportPolicy({
					natureExtensions: (
						targetNature?.state as NatureStateWithExtensions | undefined
					)?.extensions,
					currentFileType: targetEditor.draft.fileType,
				});
				const targetHasBinary = Boolean(targetEditor.draft.binary?.url);
				const targetFileType = normalizeBinaryExtension(
					targetEditor.draft.fileType,
				);
				const canReplace =
					policy.replace.extensions.includes(sourceExtension);
				const canAddPages =
					targetHasBinary &&
					targetFileType === "pdf" &&
					policy.addPages.extensions.includes(sourceExtension);

				if (!canReplace && !canAddPages) {
					return false;
				}

				const sourceFile = await buildClipboardSourceFile();
				if (!sourceFile) {
					return false;
				}

				if (canAddPages && canReplace) {
					const shouldReplace = window.confirm(
						t("alertReplaceFileChoice"),
					);

					if (shouldReplace) {
						return replaceDocumentBinary(documentCode, [sourceFile]);
					}

					return mergeClipboardIntoPdfDocument(
						documentCode,
						sourceFile,
					);
				}

				if (canAddPages) {
					return mergeClipboardIntoPdfDocument(
						documentCode,
						sourceFile,
					);
				}

				if (targetHasBinary) {
					const confirmed = window.confirm(
						t("alertReplaceFileConfirm"),
					);

					if (!confirmed) {
						return false;
					}
				}

				return replaceDocumentBinary(documentCode, [sourceFile]);
			};

			const statusSyncedActionIds = new Set<
				Parameters<typeof baseRunDocumentAction>[0]
			>(["pending", "validate", "reject", "remove"]);

			const runDocumentAction = async (
				...args: Parameters<typeof baseRunDocumentAction>
			) => {
				const [actionId, documentCode] = args;

				if (actionId === "copy") {
					await copyDocument(documentCode);
					return;
				}

				if (actionId === "paste") {
					await pasteClipboardIntoDocument(documentCode);
					return;
				}

				await baseRunDocumentAction(...args);

				if (!statusSyncedActionIds.has(actionId)) {
					return;
				}

				syncCanonicalDocumentStatusFromEditor(documentCode);
			};

			const rejectDocumentWithEmail = async (
				documentCode: string,
				draft: DocumentEmailDraft,
			) => {
				const normalizedDraft = normalizeEmailDraft(draft);
				const cachedEntry =
					rejectEmailInfoByDocumentCode.get(documentCode);

				if (normalizedDraft.text.length === 0) {
					throw new Error("Memo is required to reject document");
				}

				rejectEmailInfoByDocumentCode.set(documentCode, {
					templateKey: cachedEntry?.templateKey ?? "",
					to: normalizedDraft.to,
					cc: normalizedDraft.cc,
					subject: normalizedDraft.subject,
					text: normalizedDraft.text,
				});

				await sendDocumentEmail(documentCode, normalizedDraft);
				await baseRunDocumentAction("reject", documentCode, {
					memo: normalizedDraft.text,
				});
				syncCanonicalDocumentStatusFromEditor(documentCode);
				return true;
			};

			const matchesCurrentNavigation = (
				description: NavigationDescription,
			) =>
				isSameNavigation(
					stores.appStore.state.currentNavigation,
					description,
				);

			const selectPreloadedEditor = (
				description: NavigationDescription,
				editorKey: string,
			) => {
				baseSelectDocument(description, { syncUrl: false });
				setSelectedEditorKey(editorKey);
			};

			const toRemoteBinaryDescriptor = (input: {
				documentCode: string;
				url?: string;
				file?: {
					type?: EditorDraft["fileType"];
					detailedUrl?: string;
					shortUrl?: string;
					lang?: string;
				};
			}): RemoteBinaryDescriptor | undefined => {
				const extension = input.file?.type;

				if (!input.url || !extension || extension === "unknown") {
					return undefined;
				}

				return {
					documentCode: input.documentCode,
					url: input.url,
					detailedUrl:
						input.file?.detailedUrl ?? input.file?.shortUrl ?? "",
					shortUrl: input.file?.shortUrl ?? input.url,
					extension,
					language: input.file?.lang ?? "",
				};
			};

			function toPreviewUrl(
				descriptor?: RemoteBinaryDescriptor,
			): string | undefined {
				const candidate =
					descriptor?.url ||
					descriptor?.detailedUrl ||
					descriptor?.shortUrl;

				return candidate ? resolveAbsoluteUrl(candidate) : undefined;
			}

			function getPreviewFromDescriptor(
				descriptor?: RemoteBinaryDescriptor,
			): EditorPreview | undefined {
				const url = toPreviewUrl(descriptor);
				return url
					? {
							url,
							source: "descriptor",
						}
					: undefined;
			}

			function getPreviewFromCanonicalDocument(
				document: ReturnType<typeof getDocumentByCode> | undefined,
			): EditorPreview | undefined {
				const candidate =
					document?.state.url ||
					document?.state.fullUrl ||
					document?.state.shortUrl;

				return candidate
					? {
							url: resolveAbsoluteUrl(candidate),
							source: "descriptor",
						}
					: undefined;
			}
			const assertBinaryRequestNotAborted = (signal: AbortSignal) => {
				if (signal.aborted) {
					throw new DOMException("Aborted", "AbortError");
				}
			};

			async function requestBinaryBlobThroughApi(input: {
				documentCode: string;
				url: string;
				detailedUrl: string;
				extension: string;
				signal: AbortSignal;
			}) {
				pushDocumentFlowDebug("xfile.fetch.start", {
					documentCode: input.documentCode,
					extension: input.extension,
					url: input.url,
					detailedUrl: input.detailedUrl,
				});

				assertBinaryRequestNotAborted(input.signal);

				const result = await api.ermewa.post.file({
					params: {
						documentCode: input.documentCode,
						extension: input.extension,
					},
					body: {
						documentCode: input.documentCode,
						url: input.url,
						detailedUrl: input.detailedUrl,
						extension: input.extension,
					},
				});

				assertBinaryRequestNotAborted(input.signal);

				if (!result.ok) {
					throw new Error(result.error.message || "file fetch failed");
				}

				const blob = result.value.data;
				if (!(blob instanceof Blob)) {
					throw new Error("file fetch returned a non-blob payload");
				}

				pushDocumentFlowDebug("xfile.fetch.done", {
					documentCode: input.documentCode,
					contentType: blob.type || "",
				});

				return blob;
			}

			const setBinaryStateAfterRace = (
				documentCode: string,
				fallbackError?: string,
			) => {
				const editor = getEditorByDocumentCode(documentCode);
				if (!editor) return;

				const hasBinary = Boolean(editor.draft.binary?.url);
				const runningCount =
					getRunningBinaryCandidateCount(documentCode);

				if (hasBinary) {
					patchEditor(documentCode, {
						binaryStatus: "ready",
						error: undefined,
					});
					return;
				}

				if (runningCount > 0) {
					patchEditor(documentCode, {
						binaryStatus: "loading",
						error: undefined,
					});
					return;
				}

				if (fallbackError) {
					patchEditor(documentCode, {
						binaryStatus: "error",
						error: fallbackError,
					});
					return;
				}

				patchEditor(documentCode, {
					binaryStatus: "idle",
					error: undefined,
				});
			};

			const startBinaryCandidateLoad = async (args: {
				editorKey: string;
				descriptor: RemoteBinaryDescriptor;
				source: BinaryCandidateSource;
				force?: boolean;
			}): Promise<boolean> => {
				const currentEditor =
					stores.documentStore.state.editors[args.editorKey];
				if (!currentEditor?.documentCode) {
					return false;
				}

				const documentCode = currentEditor.documentCode;
				if (currentEditor.draft.binary?.url && !args.force) {
					pushDocumentFlowDebug("xfile.skip.existing-binary", {
						documentCode,
						source: args.source,
					});
					return true;
				}

				const signature = buildBinaryDescriptorSignature(
					args.descriptor,
				);
				const race = getBinaryRaceState(documentCode);
				const running = race.promises.get(signature);
				if (running) {
					pushDocumentFlowDebug("xfile.dedupe", {
						documentCode,
						source: args.source,
						signature,
					});
					return running;
				}

				patchEditor(documentCode, {
					binaryStatus: "loading",
					error: undefined,
					draft: {
						fileType: args.descriptor.extension,
						preview: getPreviewFromDescriptor(args.descriptor),
					},
				});

				const controller = new AbortController();
				const job: Promise<boolean> = (async () => {
					try {
						pushDocumentFlowDebug("xfile.candidate.start", {
							documentCode,
							source: args.source,
							signature,
							url: args.descriptor.url,
							detailedUrl: args.descriptor.detailedUrl,
							extension: args.descriptor.extension,
						});

						const blob = await requestBinaryBlobThroughApi({
							documentCode,
							url: args.descriptor.url,
							detailedUrl: args.descriptor.detailedUrl,
							extension: args.descriptor.extension,
							signal: controller.signal,
						});

						if (controller.signal.aborted) {
							pushDocumentFlowDebug(
								"xfile.candidate.aborted-after-fetch",
								{
									documentCode,
									source: args.source,
									signature,
								},
							);
							return false;
						}

						const latestEditor =
							stores.documentStore.state.editors[args.editorKey];
						if (
							!latestEditor?.documentCode ||
							latestEditor.documentCode !== documentCode
						) {
							pushDocumentFlowDebug("xfile.candidate.stale-editor", {
								documentCode,
								source: args.source,
							});
							return false;
						}

						const latestRace = getBinaryRaceState(documentCode);
						if (
							latestRace.winnerSignature &&
							latestRace.winnerSignature !== signature
						) {
							pushDocumentFlowDebug("xfile.candidate.lose-after-win", {
								documentCode,
								source: args.source,
								winnerSource: latestRace.winnerSource,
							});
							return false;
						}

						latestRace.winnerSignature = signature;
						latestRace.winnerSource = args.source;

						setEditorBinaryBlob(documentCode, blob, {
							name: latestEditor.draft.name || documentCode,
							type: blob.type || "application/octet-stream",
						});

						pushDocumentFlowDebug("xfile.candidate.win", {
							documentCode,
							source: args.source,
							signature,
							size: blob.size,
						});

						for (const [
							otherSignature,
							otherController,
						] of latestRace.controllers.entries()) {
							if (otherSignature === signature) {
								continue;
							}

							pushDocumentFlowDebug("xfile.candidate.abort-loser", {
								documentCode,
								winnerSource: args.source,
								otherSignature,
							});
							otherController.abort();
						}

						setBinaryStateAfterRace(documentCode);
						return true;
					} catch (error) {
						if (isAbortError(error)) {
							pushDocumentFlowDebug("xfile.candidate.abort", {
								documentCode,
								source: args.source,
								signature,
							});
							return false;
						}

						pushDocumentFlowDebug("xfile.candidate.error", {
							documentCode,
							source: args.source,
							signature,
							...toDebugError(error),
						});
						setBinaryStateAfterRace(
							documentCode,
							error instanceof Error
								? error.message
								: "binary loading error",
						);
						return false;
					} finally {
						const latestRace =
							binaryRaceByDocumentCode.get(documentCode);
						if (latestRace) {
							latestRace.controllers.delete(signature);
							latestRace.promises.delete(signature);
						}

						clearBinaryRaceStateIfIdle(documentCode);
						setBinaryStateAfterRace(documentCode);
					}
				})();

				race.controllers.set(signature, controller);
				race.promises.set(signature, job);

				return job;
			};

			function abortBinaryLoadForEditor(editorKey: string) {
				const editor = stores.documentStore.state.editors[editorKey];
				const documentCode = editor?.documentCode;
				if (!documentCode) return false;

				const race = binaryRaceByDocumentCode.get(documentCode);
				if (!race) return false;

				let aborted = false;
				for (const controller of race.controllers.values()) {
					controller.abort();
					aborted = true;
				}

				return aborted;
			}

			const preloadDocumentDescriptor = async (
				description: NavigationDescription,
			): Promise<RemoteBinaryDescriptor | undefined> => {
				const requestKey = [
					description.documentCode,
					description.natureCode,
					description.folder.sid,
				].join("|");

				const running = preloadDescriptorLoading.get(requestKey);
				if (running) {
					return running;
				}

				const job = (async () => {
					const editorKey = ensurePreloadedEditor(description);
					if (!editorKey) return undefined;

					void prefetchRejectEmailInfo(description.documentCode);
					selectPreloadedEditor(description, editorKey);
					pushDocumentFlowDebug("xdoc.start", {
						documentCode: description.documentCode,
						folderSid: description.folder.sid,
					});

					const response = await api.ermewa.get.document({
						params: {
							documentCode: description.documentCode,
						},
					});

					if (!response.ok || !response.value.data) {
						const existingBinary = Boolean(
							getEditorByDocumentCode(description.documentCode)?.draft
								.binary?.url,
						);

						pushDocumentFlowDebug("xdoc.miss", {
							documentCode: description.documentCode,
							ok: response.ok,
							hasExistingBinary: existingBinary,
						});

						if (
							matchesCurrentNavigation(description) &&
							!existingBinary
						) {
							patchEditor(description.documentCode, {
								binaryStatus: "loading",
								error: undefined,
							});
						}

						return undefined;
					}

					if (!matchesCurrentNavigation(description)) {
						pushDocumentFlowDebug("xdoc.stale", {
							documentCode: description.documentCode,
						});
						return undefined;
					}

					const remote = response.value.data;
					const remoteDescriptor = toRemoteBinaryDescriptor({
						documentCode: description.documentCode,
						url: remote.url,
						file: remote.file
							? {
									type: remote.file.type,
									detailedUrl: remote.file.detailedUrl,
									shortUrl: remote.file.shortUrl,
									lang: remote.file.lang,
								}
							: undefined,
					});

					if (remoteDescriptor) {
						remoteBinaryDescriptors.set(
							description.documentCode,
							remoteDescriptor,
						);
					}

					const refreshedEditor = getEditorByDocumentCode(
						description.documentCode,
					);
					const hasBinary = Boolean(refreshedEditor?.draft.binary?.url);

					patchEditor(description.documentCode, {
						natureCode: remote.nature || description.natureCode,
						folderSid: description.folder.sid,
						binaryStatus: hasBinary
							? "ready"
							: remoteDescriptor
								? "loading"
								: "error",
						error:
							hasBinary || remoteDescriptor
								? undefined
								: "file preload unavailable",
						draft: {
							name: remote.name?.baseName || description.documentCode,
							fileType:
								remote.file?.type ??
								refreshedEditor?.draft.fileType ??
								"unknown",
							preview:
								refreshedEditor?.draft.preview ??
								getPreviewFromDescriptor(remoteDescriptor),
							statusNumber: remote.state,
							statusLabel: remote.stateDescription?.english,
							documentDate: remote.date || undefined,
							expirationDate: remote.expirationDate || undefined,
							memo: remote.memo || undefined,
						},
					});

					pushDocumentFlowDebug("xdoc.done", {
						documentCode: description.documentCode,
						hasDescriptor: Boolean(remoteDescriptor),
					});

					return remoteDescriptor;
				})();

				preloadDescriptorLoading.set(requestKey, job);

				try {
					return await job;
				} finally {
					if (preloadDescriptorLoading.get(requestKey) === job) {
						preloadDescriptorLoading.delete(requestKey);
					}
				}
			};

			const preloadDocumentBinary = async (
				description: NavigationDescription,
				remoteDescriptor?: RemoteBinaryDescriptor,
				opts?: {
					source?: BinaryCandidateSource;
					force?: boolean;
				},
			) => {
				const source = opts?.source ?? "xdoc";
				const editorKey = ensurePreloadedEditor(description);
				if (!editorKey) return false;

				selectPreloadedEditor(description, editorKey);

				if (remoteDescriptor) {
					remoteBinaryDescriptors.set(
						description.documentCode,
						remoteDescriptor,
					);

					patchEditor(description.documentCode, {
						binaryStatus: "loading",
						error: undefined,
						draft: {
							fileType: remoteDescriptor.extension,
							preview: getPreviewFromDescriptor(remoteDescriptor),
						},
					});
				}

				if (!matchesCurrentNavigation(description)) {
					pushDocumentFlowDebug("xfile.preload.stale", {
						documentCode: description.documentCode,
						source,
					});
					return false;
				}

				const descriptor =
					remoteDescriptor ??
					getCanonicalBinaryDescriptor(description.documentCode) ??
					remoteBinaryDescriptors.get(description.documentCode);

				if (!descriptor) {
					pushDocumentFlowDebug("xfile.preload.miss", {
						documentCode: description.documentCode,
						source,
					});
					setBinaryStateAfterRace(description.documentCode);
					return false;
				}

				return ensureEditorBinary(editorKey, {
					force: opts?.force,
					source,
					descriptor,
				});
			};

			const preloadFromCurrentUrl = async () => {
				const description = readNavigationFromLocation();
				if (!description) {
					return false;
				}

				const remoteDescriptor =
					await preloadDocumentDescriptor(description);

				if (remoteDescriptor) {
					return preloadDocumentBinary(description, remoteDescriptor, {
						source: "xdoc",
					});
				}

				return Boolean(
					getEditorByDocumentCode(description.documentCode)?.draft
						.binary?.url,
				);
			};

			const attachPreloadedDocumentToCanonicalContext = async (
				description: NavigationDescription,
				opts?: { forceBinary?: boolean },
			) => {
				if (!matchesCurrentNavigation(description)) {
					pushDocumentFlowDebug("canonical.attach.stale", {
						documentCode: description.documentCode,
					});
					return false;
				}

				const reconciled = reconcileExistingEditor(
					description.documentCode,
				);
				const editorKey = resolveEditorKeyByDocumentCode(
					description.documentCode,
				);

				if (!reconciled || !editorKey) {
					pushDocumentFlowDebug("canonical.attach.miss", {
						documentCode: description.documentCode,
						reconciled,
						hasEditorKey: Boolean(editorKey),
					});
					return false;
				}

				const editor = stores.documentStore.state.editors[editorKey];
				if (
					editor?.mode === "existing" &&
					(opts?.forceBinary || !editor.draft.binary?.url)
				) {
					const race = binaryRaceByDocumentCode.get(
						description.documentCode,
					);
					if (race && race.promises.size > 0 && !opts?.forceBinary) {
						pushDocumentFlowDebug("canonical.attach.skip-duplicate", {
							documentCode: description.documentCode,
						});
						return true;
					}

					await ensureEditorBinary(editorKey, {
						force: opts?.forceBinary,
						source: "canonical",
					});
				}

				patchEditor(description.documentCode, {});
				pushDocumentFlowDebug("canonical.attach.done", {
					documentCode: description.documentCode,
				});
				return true;
			};

			const markDocumentViewerReady = (documentCode: string) => {
				const editorKey = resolveEditorKeyByDocumentCode(documentCode);
				if (!editorKey) {
					return false;
				}

				const aborted = abortBinaryLoadForEditor(editorKey);
				pushDocumentFlowDebug("viewer.ready", {
					documentCode,
					aborted,
				});
				return aborted;
			};

			const refreshAllEditorActions = () => {
				const seenDocumentCodes = new Set<string>();

				for (const editor of Object.values(
					stores.documentStore.state.editors,
				)) {
					const documentCode = editor?.documentCode;

					if (!documentCode || seenDocumentCodes.has(documentCode)) {
						continue;
					}

					seenDocumentCodes.add(documentCode);
					patchEditor(documentCode, {});
				}
			};

			const loadDocument = async (opts?: {
				syncUrl?: boolean;
				forceBinary?: boolean;
			}) => {
				const documentCode =
					stores.appStore.state.currentNavigation?.documentCode;
				if (!documentCode) return false;

				const document = getDocumentByCode(documentCode);
				const nature = getNatureByDocumentCode(documentCode);
				const folder = getFolderByDocumentCode(documentCode);

				if (!document || !nature || !folder) return false;

				await selectDocument(
					{
						documentCode,
						natureCode: nature.state.code,
						folder: {
							name: folder.state.name,
							sid: folder.state.sid,
						},
					},
					opts,
				);

				return true;
			};

			const selectDocument = async (
				description: NavigationDescription,
				opts?: { syncUrl?: boolean; forceBinary?: boolean },
			) => {
				baseSelectDocument(description, opts);

				if (!description.documentCode) return;

				const editorKey = resolveEditorKeyByDocumentCode(
					description.documentCode,
				);

				if (!editorKey) return;

				reconcileExistingEditor(description.documentCode);

				setSelectedEditorKey(editorKey);
				void prefetchRejectEmailInfo(description.documentCode);

				const editor = stores.documentStore.state.editors[editorKey];

				if (
					editor?.mode === "existing" &&
					(opts?.forceBinary || !editor.draft.binary?.url)
				) {
					await ensureEditorBinary(editorKey, {
						force: opts?.forceBinary,
						source: "select",
					});
				}

				pushDocumentFlowDebug("select-document.done", {
					documentCode: description.documentCode,
					folderSid: description.folder.sid,
				});

				patchEditor(description.documentCode, {});
			};

			const commitEditorsState = (input: {
				editors: typeof stores.documentStore.state.editors;
				selectedEditorKey?: string;
			}) => {
				stores.documentStore.patch({
					editors: () => input.editors,
					selectedEditorKey: input.selectedEditorKey,
					...buildDocumentStoreDerivedPatch({
						editors: input.editors,
						selectedEditorKey: input.selectedEditorKey,
					}),
				});
			};

			const rebuildFolderTreeStructureSnapshot = () => {
				const root = repositories.folder
					.read()
					.find((folder) => folder.state.parent === undefined);

				if (!root) {
					stores.appStore.patch({
						folderTreeStructure: undefined,
					});
					return;
				}

				const resolved = repositories.folder
					.graph(({ value, self }) => ({
						sid: value,
						name: value,
						parent: {
							sid: value,
						},
						children: self,
						natures: {
							code: value,
							mode: value,
							isMandatory: value,
							label: {
								short: value,
								long: value,
							},
							documents: {
								code: value,
								name: value,
								status: {
									number: value,
									label: value,
								},
							},
						},
					}))
					.resolve(root.meta.id);

				stores.appStore.patch({
					folderTreeStructure: resolved.state,
				});
			};

			const syncCanonicalDocumentStatusFromEditor = (
				documentCode: string,
			) => {
				const editor = getEditorByDocumentCode(documentCode);
				const document = getDocumentByCode(documentCode);

				if (!editor || !document) {
					return false;
				}

				const nextStatusNumber =
					editor.draft.statusNumber ?? document.state.status.number;
				const nextStatusLabel =
					editor.draft.statusLabel ??
					getFallbackDocumentStatusLabel(nextStatusNumber) ??
					document.state.status.label;
				const nextMemo = editor.draft.memo ?? document.state.memo;

				document.patch({
					status: {
						number: nextStatusNumber,
						label: nextStatusLabel,
					},
					memo: nextMemo,
					lastUpdated: editor.lastSavedAt ?? document.state.lastUpdated,
				});

				rebuildFolderTreeStructureSnapshot();

				pushDocumentFlowDebug("xupd.status.sidebar-sync", {
					documentCode,
					status: nextStatusNumber,
				});

				return true;
			};

			const migrateUploadedEditorToCanonical = (input: {
				sourceDocumentCode: string;
				uploadedDocumentCode: string;
				documentId?: string;
				natureId?: string;
				natureCode?: string;
				folderId?: string;
				folderSid?: string;
				lastSavedAt?: string;
				binaryStatus: Editor["binaryStatus"];
				error?: string;
				draft: Partial<Omit<EditorDraft, "binary">> & {
					binary?: EditorDraft["binary"];
				};
			}) => {
				const currentEditors = stores.documentStore.state.editors;

				const localEntry = Object.entries(currentEditors).find(
					([, editor]) =>
						editor?.documentCode === input.sourceDocumentCode &&
						editor?.mode === "new",
				);

				const fallbackEntry =
					localEntry ??
					Object.entries(currentEditors).find(
						([, editor]) =>
							editor?.documentCode === input.sourceDocumentCode,
					);

				const canonicalEditorKey = makeExistingEditorKey(
					input.uploadedDocumentCode,
				);

				const existingCanonicalEditor =
					currentEditors[canonicalEditorKey];

				const baseEditor =
					existingCanonicalEditor ??
					fallbackEntry?.[1] ??
					getEditorByDocumentCode(input.uploadedDocumentCode);

				if (!baseEditor) {
					return undefined;
				}

				const nextEditor: Editor = {
					...baseEditor,
					documentId: input.documentId,
					documentCode: input.uploadedDocumentCode,
					natureId: input.natureId,
					natureCode: input.natureCode,
					folderId: input.folderId,
					folderSid: input.folderSid,
					mode: "existing",
					dirty: false,
					saving: false,
					binaryStatus: input.binaryStatus,
					error: input.error,
					lastSavedAt: input.lastSavedAt,
					draft: {
						...baseEditor.draft,
						...input.draft,
						binary:
							input.draft.binary !== undefined
								? input.draft.binary
								: baseEditor.draft.binary,
					},
					actions: [],
				};

				nextEditor.actions = reuseShallowEqualEditorActions(
					(existingCanonicalEditor?.actions ??
						baseEditor.actions) as Editor["actions"],
					buildEditorActions(nextEditor) as Editor["actions"],
				);

				const nextEditors = { ...currentEditors };

				if (fallbackEntry && fallbackEntry[0] !== canonicalEditorKey) {
					delete nextEditors[fallbackEntry[0]];
				}

				nextEditors[canonicalEditorKey] = nextEditor;

				commitEditorsState({
					editors: nextEditors,
					selectedEditorKey: canonicalEditorKey,
				});

				return canonicalEditorKey;
			};

			finalizeSavedDocument = async ({
				sourceDocumentCode,
				response,
				context,
				fileData,
			}) => {
				const updatedDocument = readUpdatedDocumentPayload(response);
				const canonicalDocumentCode =
					updatedDocument?.documentCode?.trim() || sourceDocumentCode;

				pushDocumentFlowDebug("xupd.reload.start", {
					sourceDocumentCode,
					canonicalDocumentCode,
					hasFileData: Boolean(fileData),
				});

				if (!canonicalDocumentCode) {
					throw new Error("update returned an empty document code");
				}

				const localEditor = getEditorByDocumentCode(sourceDocumentCode);
				const localDocument =
					getDocumentByCode(sourceDocumentCode) ?? context.document;
				const canonicalPayload =
					(await readCanonicalDocumentPayload(canonicalDocumentCode)) ??
					undefined;

				if (!canonicalPayload) {
					pushDocumentFlowDebug("xupd.reload.miss", {
						sourceDocumentCode,
						canonicalDocumentCode,
					});
					return false;
				}

				const responseFile = updatedDocument?.files?.[0];
				const shouldReloadBinary =
					Boolean(fileData) || Boolean(updatedDocument?.files?.length);

				const nextNature =
					repositories.nature
						.read()
						.find(
							(nature) =>
								nature.state.code ===
									(canonicalPayload.nature ??
										updatedDocument?.natureCode) &&
								nature.state.folder === context.folder.meta.id,
						) ?? context.nature;

				const nextFileExtension = normalizeBinaryExtension(
					canonicalPayload.file?.type ??
						responseFile?.fileType ??
						localDocument?.state.fileExtension,
				);

				const nextUrl =
					canonicalPayload.url ??
					responseFile?.shortUrl ??
					localDocument?.state.url ??
					"";
				const nextFullUrl =
					canonicalPayload.file?.detailedUrl ??
					localDocument?.state.fullUrl ??
					nextUrl;
				const nextShortUrl =
					canonicalPayload.file?.shortUrl ??
					responseFile?.shortUrl ??
					localDocument?.state.shortUrl ??
					nextUrl;
				const nextLanguage =
					canonicalPayload.file?.lang ??
					responseFile?.language ??
					localDocument?.state.language ??
					"";

				const previousNature =
					repositories.nature.getById(localDocument.state.nature) ??
					context.nature;

				const canonicalDocument = localDocument.patch({
					code: canonicalDocumentCode,
					isLocal: false,
					name:
						canonicalPayload.name?.baseName ||
						localDocument.state.name ||
						canonicalDocumentCode,
					status: {
						number:
							canonicalPayload.state ??
							updatedDocument?.state ??
							localDocument.state.status.number,
						label:
							canonicalPayload.stateDescription?.english ??
							getFallbackDocumentStatusLabel(
								canonicalPayload.state ?? updatedDocument?.state,
							) ??
							localDocument.state.status.label,
					},
					documentDate:
						canonicalPayload.date ||
						updatedDocument?.documentDate ||
						localDocument.state.documentDate ||
						"",
					expirationDate:
						canonicalPayload.expirationDate ||
						updatedDocument?.documentExpires ||
						localDocument.state.expirationDate ||
						undefined,
					lastUpdated:
						canonicalPayload.lastTimeUpdated ||
						updatedDocument?.lastUpdateTime ||
						localEditor?.lastSavedAt ||
						localDocument.state.lastUpdated ||
						"",
					url: nextUrl,
					fullUrl: nextFullUrl,
					shortUrl: nextShortUrl,
					language: nextLanguage,
					fileExtension: nextFileExtension,
					memo:
						canonicalPayload.memo ??
						localDocument.state.memo ??
						undefined,
					nature: nextNature.meta.id,
				});

				if (previousNature.meta.id !== nextNature.meta.id) {
					previousNature.patch({
						documents: (previousNature.state.documents ?? []).filter(
							(documentId) => documentId !== canonicalDocument.meta.id,
						),
					});

					nextNature.patch({
						documents: Array.from(
							new Set([
								...(nextNature.state.documents ?? []),
								canonicalDocument.meta.id,
							]),
						),
					});
				}

				const canonicalDescriptor = toRemoteBinaryDescriptor({
					documentCode: canonicalDocumentCode,
					url: nextUrl,
					file: {
						type: nextFileExtension,
						detailedUrl: nextFullUrl,
						shortUrl: nextShortUrl,
						lang: nextLanguage,
					},
				});
				if (canonicalDescriptor) {
					remoteBinaryDescriptors.set(
						canonicalDocumentCode,
						canonicalDescriptor,
					);
				}

				const canonicalEditorKey = migrateUploadedEditorToCanonical({
					sourceDocumentCode,
					uploadedDocumentCode: canonicalDocumentCode,
					documentId: canonicalDocument.meta.id,
					natureId: nextNature.meta.id,
					natureCode: nextNature.state.code,
					folderId: context.folder.meta.id,
					folderSid: context.folder.state.sid,
					lastSavedAt:
						canonicalPayload.lastTimeUpdated ??
						updatedDocument?.lastUpdateTime ??
						localEditor?.lastSavedAt,
					binaryStatus: shouldReloadBinary
						? "loading"
						: localEditor?.draft.binary
							? "ready"
							: "idle",
					error: undefined,
					draft: {
						name:
							canonicalPayload.name?.baseName ||
							localEditor?.draft.name ||
							localDocument.state.name ||
							canonicalDocumentCode,
						fileType: nextFileExtension,
						preview:
							localEditor?.draft.preview ??
							(canonicalDescriptor
								? getPreviewFromDescriptor(canonicalDescriptor)
								: undefined),
						statusNumber:
							canonicalPayload.state ??
							updatedDocument?.state ??
							localEditor?.draft.statusNumber,
						statusLabel:
							canonicalPayload.stateDescription?.english ??
							localEditor?.draft.statusLabel,
						documentDate:
							canonicalPayload.date ||
							updatedDocument?.documentDate ||
							localEditor?.draft.documentDate,
						expirationDate:
							canonicalPayload.expirationDate ||
							updatedDocument?.documentExpires ||
							localEditor?.draft.expirationDate,
						memo: canonicalPayload.memo ?? localEditor?.draft.memo,
						binary: localEditor?.draft.binary,
					},
				});

				baseSelectDocument(
					{
						documentCode: canonicalDocumentCode,
						natureCode: nextNature.state.code,
						folder: {
							name: context.folder.state.name,
							sid: context.folder.state.sid,
						},
					},
					{ syncUrl: false },
				);

				rebuildFolderTreeStructureSnapshot();

				const binaryConfirmed = shouldReloadBinary
					? canonicalEditorKey
						? await ensureEditorBinary(canonicalEditorKey, {
								force: true,
								source: "xupd",
							})
						: false
					: true;

				pushDocumentFlowDebug(
					binaryConfirmed
						? "xupd.reload.done"
						: "xupd.reload.binary-miss",
					{
						sourceDocumentCode,
						canonicalDocumentCode,
						shouldReloadBinary,
						binaryConfirmed,
					},
				);

				if (sourceDocumentCode !== canonicalDocumentCode) {
					remoteBinaryDescriptors.delete(sourceDocumentCode);
				}

				setBinaryDirty(sourceDocumentCode, false);
				setBinaryDirty(canonicalDocumentCode, false);
				setViewerPdfDirty(sourceDocumentCode, false);
				setViewerPdfDirty(canonicalDocumentCode, false);

				return binaryConfirmed;
			};

			finalizeUploadedDocument = async ({
				sourceDocumentCode,
				uploadedDocument,
				context,
			}) => {
				const uploadedDocumentCode =
					uploadedDocument.documentCode?.trim();
				if (!uploadedDocumentCode) {
					throw new Error("upload returned an empty document code");
				}

				const localEditor = getEditorByDocumentCode(sourceDocumentCode);
				const localDocument = getDocumentByCode(sourceDocumentCode);

				const canonicalPayload =
					(await readCanonicalDocumentPayload(uploadedDocumentCode)) ??
					undefined;

				const uploadedDescriptor = (() => {
					const extension = normalizeBinaryExtension(
						uploadedDocument.file?.fileType,
					);
					const detailedUrl =
						uploadedDocument.file?.detailedUrl?.trim() ?? "";
					const shortUrl =
						uploadedDocument.file?.shortUrl?.trim() ?? "";
					const url = detailedUrl || shortUrl;

					if (!url || extension === "unknown") {
						return undefined;
					}

					return {
						documentCode: uploadedDocumentCode,
						url,
						detailedUrl: detailedUrl || shortUrl || url,
						shortUrl: shortUrl || detailedUrl || url,
						extension,
						language: uploadedDocument.file?.language ?? "",
					} satisfies RemoteBinaryDescriptor;
				})();

				const canonicalDescriptor = canonicalPayload
					? toRemoteBinaryDescriptor({
							documentCode: uploadedDocumentCode,
							url: canonicalPayload.url,
							file: canonicalPayload.file
								? {
										type: canonicalPayload.file.type,
										detailedUrl: canonicalPayload.file.detailedUrl,
										shortUrl: canonicalPayload.file.shortUrl,
										lang: canonicalPayload.file.lang,
									}
								: undefined,
						})
					: undefined;

				const nextDescriptor =
					canonicalDescriptor ?? uploadedDescriptor;
				if (nextDescriptor) {
					remoteBinaryDescriptors.set(
						uploadedDocumentCode,
						nextDescriptor,
					);
				}

				const nextNature =
					repositories.nature
						.read()
						.find(
							(nature) =>
								nature.state.code ===
									(canonicalPayload?.nature ??
										uploadedDocument.natureCode) &&
								nature.state.folder === context.folder.meta.id,
						) ?? context.nature;

				const nextFileExtension = normalizeBinaryExtension(
					canonicalPayload?.file?.type ??
						uploadedDocument.file?.fileType ??
						localDocument?.state.fileExtension,
				);

				const nextUrl =
					canonicalPayload?.url ??
					nextDescriptor?.url ??
					localDocument?.state.url ??
					"";
				const nextFullUrl =
					canonicalPayload?.file?.detailedUrl ??
					nextDescriptor?.detailedUrl ??
					localDocument?.state.fullUrl ??
					nextUrl;

				const nextShortUrl =
					canonicalPayload?.file?.shortUrl ??
					nextDescriptor?.shortUrl ??
					localDocument?.state.shortUrl ??
					nextUrl;

				const nextLanguage =
					canonicalPayload?.file?.lang ??
					nextDescriptor?.language ??
					localDocument?.state.language ??
					"";

				const canonicalDocumentPatch = {
					code: uploadedDocumentCode,
					isLocal: false,
					name:
						canonicalPayload?.name?.baseName ||
						uploadedDocument.baseName ||
						localDocument?.state.name ||
						uploadedDocumentCode,
					status: {
						number: canonicalPayload?.state ?? uploadedDocument.status,
						label: canonicalPayload?.stateDescription?.english,
					},
					documentDate:
						canonicalPayload?.date ||
						uploadedDocument.documentDate ||
						localDocument?.state.documentDate ||
						"",
					expirationDate: canonicalPayload?.expirationDate || undefined,
					lastUpdated:
						canonicalPayload?.lastTimeUpdated ||
						uploadedDocument.lastUpdateTime ||
						localDocument?.state.lastUpdated ||
						"",
					url: nextUrl,
					fullUrl: nextFullUrl,
					shortUrl: nextShortUrl,
					language: nextLanguage,
					fileExtension: nextFileExtension,
					memo: canonicalPayload?.memo ?? undefined,
					nature: nextNature.meta.id,
				};

				const existingCanonicalDocument = repositories.document
					.read()
					.find(
						(document) => document.state.code === uploadedDocumentCode,
					);

				const localDocumentId = localDocument?.meta.id;

				const canonicalDocument =
					localDocument &&
					(!existingCanonicalDocument ||
						existingCanonicalDocument.meta.id === localDocument.meta.id)
						? localDocument.patch(canonicalDocumentPatch)
						: existingCanonicalDocument
							? existingCanonicalDocument.patch(canonicalDocumentPatch)
							: repositories.document.insert(canonicalDocumentPatch)[0];

				const currentNatureDocumentIds = Array.from(
					nextNature.state.documents ?? [],
				);

				const nextNatureDocumentIds = Array.from(
					new Set(
						currentNatureDocumentIds.map((documentId) =>
							documentId === localDocumentId
								? canonicalDocument.meta.id
								: documentId,
						),
					),
				);

				if (
					!nextNatureDocumentIds.includes(canonicalDocument.meta.id)
				) {
					nextNatureDocumentIds.push(canonicalDocument.meta.id);
				}

				nextNature.patch({
					documents: nextNatureDocumentIds,
				});

				rebuildFolderTreeStructureSnapshot();

				if (
					localDocumentId &&
					localDocumentId !== canonicalDocument.meta.id
				) {
					repositories.document
						.select((documents) =>
							documents.filter(
								(document) => document.meta.id === localDocumentId,
							),
						)
						.delete();
				}

				migrateUploadedEditorToCanonical({
					sourceDocumentCode,
					uploadedDocumentCode,
					documentId: canonicalDocument.meta.id,
					natureId: nextNature.meta.id,
					natureCode: nextNature.state.code,
					folderId: context.folder.meta.id,
					folderSid: context.folder.state.sid,
					lastSavedAt:
						canonicalPayload?.lastTimeUpdated ||
						uploadedDocument.lastUpdateTime ||
						localEditor?.lastSavedAt,
					binaryStatus: localEditor?.draft.binary ? "ready" : "idle",
					error: undefined,
					draft: {
						name:
							canonicalPayload?.name?.baseName ||
							uploadedDocument.baseName ||
							localEditor?.draft.name ||
							localDocument?.state.name ||
							uploadedDocumentCode,
						fileType: nextFileExtension,
						preview:
							localEditor?.draft.preview ??
							(nextDescriptor
								? getPreviewFromDescriptor(nextDescriptor)
								: undefined),
						statusNumber:
							canonicalPayload?.state ?? uploadedDocument.status,
						statusLabel: canonicalPayload?.stateDescription?.english,
						documentDate:
							canonicalPayload?.date ||
							uploadedDocument.documentDate ||
							localEditor?.draft.documentDate,
						expirationDate:
							canonicalPayload?.expirationDate ||
							localEditor?.draft.expirationDate,
						memo: canonicalPayload?.memo ?? localEditor?.draft.memo,
						binary: localEditor?.draft.binary,
					},
				});

				await selectDocument(
					{
						documentCode: uploadedDocumentCode,
						natureCode: nextNature.state.code,
						folder: {
							name: context.folder.state.name,
							sid: context.folder.state.sid,
						},
					},
					{ syncUrl: true },
				);

				rebuildFolderTreeStructureSnapshot();

				if (localEditor?.draft.binary) {
					patchEditor(uploadedDocumentCode, {
						binaryStatus: "ready",
						error: undefined,
						draft: {
							fileType: nextFileExtension,
							preview:
								localEditor.draft.preview ??
								(nextDescriptor
									? getPreviewFromDescriptor(nextDescriptor)
									: undefined),
							binary: localEditor.draft.binary,
						},
					});
				}

				remoteBinaryDescriptors.delete(sourceDocumentCode);
				setBinaryDirty(sourceDocumentCode, false);
				setBinaryDirty(uploadedDocumentCode, false);
				setViewerPdfDirty(sourceDocumentCode, false);
				setViewerPdfDirty(uploadedDocumentCode, false);

				return true;
			};

			return {
				readNavigationFromLocation,
				preloadDocumentDescriptor,
				preloadDocumentBinary,
				preloadFromCurrentUrl,
				attachPreloadedDocumentToCanonicalContext,
				refreshAllEditorActions,
				markDocumentViewerReady,
				loadDocument,
				selectDocument,
				getDocumentByCode,
				getNatureByDocumentCode,
				getFolderByDocumentCode,
				getDocumentImportPolicy,
				ensureExistingEditor,
				ensureEditorBinary,
				markDocumentDirty,
				replaceDocumentBinary,
				updateDocumentMetaDraft,
				sendDocumentEmail,
				getRejectEmailDraft,
				prefetchRejectEmailInfo,
				rejectDocumentWithEmail,
				registerPdfCommit,
				unregisterPdfCommit,
				commitDocumentPdf,
				uploadDocument,
				updateDocument,
				saveDocument,
				deleteDocument,
				runDocumentAction,
				copyDocument,
				pasteClipboardIntoDocument,
				getClipboardSourceFile: buildClipboardSourceFile,
				setDocumentPdfDraft,
				getDefaultUploadStatus,
			};
		},
	)
	.build();
