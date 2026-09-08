/* cspell:ignore xupd */

import type { ViewerActionId } from "./document-editor.actions";
import { documentStatusNumberByKey } from "./document-status";

export type PreparedPdfCommit = {
	revision: number;
	fileData: FileDataLike;
	finalize: () => Promise<boolean>;
};

export type PdfCommitFactory = () =>
	| PreparedPdfCommit
	| undefined
	| Promise<PreparedPdfCommit | undefined>;

export type UploadedDocumentLike = Readonly<{
	documentCode: string;
	ok: boolean;
	message?: string;
	lastUpdateTime: string;
	baseName: string;
	natureCode: string;
	status: number;
	documentDate?: string;
	file?: Readonly<{
		shortUrl?: string;
		detailedUrl?: string;
		fileType?: string;
		language?: string;
	}>;
}>;

type UploadResultLike = Readonly<{
	uploaded: readonly UploadedDocumentLike[];
}>;

type EditorLike = Readonly<{
	mode: "existing" | "new";
	dirty: boolean;
	saving: boolean;
	lastSavedAt?: string;
	actions: readonly Readonly<{
		id: string;
		disabled: boolean;
	}>[];
	draft: Readonly<{
		name?: string;
		fileType?: string;
		statusNumber?: number;
		statusLabel?: string;
		documentDate?: string;
		expirationDate?: string;
		memo?: string;
		preview?: Readonly<{
			url: string;
			source: string;
		}>;
		binary?: Readonly<{
			url: string;
			shortUrl?: string;
			detailedUrl?: string;
			name: string;
			size: number;
			type: string;
			base64?: string;
		}>;
	}>;
}>;

type DocumentUpdateContextLike<TEditor extends EditorLike> = Readonly<{
	document: Readonly<{
		meta?: Readonly<{
			id: string;
		}>;
		state: Readonly<{
			code: string;
			name: string;
			status: Readonly<{
				number: number;
				label?: string;
			}>;
			documentDate?: string;
			expirationDate?: string;
			lastUpdated: string;
			fileExtension: string;
			url: string;
			fullUrl: string;
			shortUrl: string;
			language: string;
		}>;
	}>;
	nature: Readonly<{
		meta?: Readonly<{
			id: string;
		}>;
		state: Readonly<{
			code: string;
			documents?: readonly string[];
		}>;
	}>;
	folder: Readonly<{
		meta?: Readonly<{
			id: string;
		}>;
		state: Readonly<{
			name: string;
			sid: string;
		}>;
	}>;
	editor: TEditor;
}>;

type DocumentUpdateResultLike = Readonly<{
	ok: boolean;
	error?: {
		message?: string;
	};
}>;

type FileDataLike = Readonly<{
	binary: string;
	extension: string;
	encoding: "base64";
	language?: string;
	shortUrl?: string;
	detailedUrl?: string;
}>;

const normalizeFileData = (
	fileData: FileDataLike | undefined,
): FileDataLike | undefined => {
	if (!fileData) {
		return undefined;
	}

	const binary = fileData.binary?.trim();
	const extension = fileData.extension?.trim();
	const shortUrl = fileData.shortUrl?.trim();
	const detailedUrl = fileData.detailedUrl?.trim();

	if (!binary || !extension) {
		return undefined;
	}

	return {
		binary,
		extension,
		encoding: fileData.encoding,
		...(fileData.language !== undefined
			? { language: fileData.language }
			: {}),
		...(shortUrl ? { shortUrl } : {}),
		...(detailedUrl ? { detailedUrl } : {}),
	};
};

const withExistingBinaryUrls = (
	fileData: FileDataLike | undefined,
	input: {
		editor: EditorLike;
		document: DocumentUpdateContextLike<EditorLike>["document"];
	},
): FileDataLike | undefined => {
	if (!fileData) {
		return undefined;
	}

	const shortUrl =
		fileData.shortUrl ??
		input.editor.draft.binary?.shortUrl ??
		input.document.state.shortUrl;
	const detailedUrl =
		fileData.detailedUrl ??
		input.editor.draft.binary?.detailedUrl ??
		input.document.state.fullUrl;

	return {
		...fileData,
		...(shortUrl ? { shortUrl } : {}),
		...(detailedUrl ? { detailedUrl } : {}),
	};
};

const blobToBase64 = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onloadend = () => {
			const result = reader.result;
			if (typeof result !== "string") {
				reject(new Error("blob to base64 failed"));
				return;
			}
			resolve(result);
		};

		reader.onerror = () => {
			reject(reader.error ?? new Error("blob to base64 failed"));
		};

		reader.readAsDataURL(blob);
	});

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

export const createDocumentEditorCommands = <
	TEditor extends EditorLike,
	TContext extends DocumentUpdateContextLike<TEditor>,
	TPatch,
	TSetBinaryOptions,
	TUploadBody,
	TUpdateBody,
	TDeleteBody,
	TUpdateResult extends
		DocumentUpdateResultLike = DocumentUpdateResultLike,
	TUploadResult extends UploadResultLike = UploadResultLike,
>(deps: {
	patchEditor: (documentCode: string, patch: TPatch) => void;
	getEditorByDocumentCode: (
		documentCode: string,
	) => TEditor | undefined;
	resolveDocumentUpdateContext: (
		documentCode: string,
	) => TContext | undefined;
	getDefaultUploadStatus: () => number | undefined;
	ensureDocumentBinary: (documentCode: string) => Promise<boolean>;
	isBinaryDirty?: (documentCode: string) => boolean;
	upload: (body: TUploadBody) => Promise<TUploadResult>;
	documentUpdate: (body: TUpdateBody) => Promise<TUpdateResult>;
	documentDelete: (
		documentCode: string,
		body: TDeleteBody,
	) => Promise<unknown>;
	afterUploadSuccess?: (input: {
		sourceDocumentCode: string;
		uploadedDocument: TUploadResult["uploaded"][number];
		context: TContext;
	}) => Promise<boolean | undefined>;
	afterSaveSuccess?: (input: {
		sourceDocumentCode: string;
		response: TUpdateResult;
		context: TContext;
		fileData?: FileDataLike;
	}) => Promise<boolean | undefined>;
	resolveUpdatedLastSavedAt?: (input: {
		response: TUpdateResult;
		context: TContext;
		fileData?: FileDataLike;
	}) => string | undefined;
	pushDocumentFlowDebug: (event: string, payload?: unknown) => void;
	toDebugError: (error: unknown) => unknown;
	setEditorBinaryBlob: (
		documentCode: string,
		blob: Blob,
		options?: TSetBinaryOptions,
	) => unknown;
}) => {
	const pdfCommitRegistry = new Map<string, PdfCommitFactory>();
	const binaryBlobByDocumentCode = new Map<string, Blob>();

	const patchEditor = (documentCode: string, patch: TPatch) => {
		deps.patchEditor(documentCode, patch);
	};

	const rememberBinaryBlob = (
		documentCode: string,
		blob: Blob,
	): void => {
		binaryBlobByDocumentCode.set(documentCode, blob);
	};

	const registerPdfCommit = (
		documentCode: string,
		commit: PdfCommitFactory,
	) => {
		pdfCommitRegistry.set(documentCode, commit);
	};

	const unregisterPdfCommit = (documentCode: string) => {
		pdfCommitRegistry.delete(documentCode);
	};

	const commitDocumentPdf = async (
		documentCode: string,
	): Promise<PreparedPdfCommit | undefined> => {
		const commit = pdfCommitRegistry.get(documentCode);
		if (!commit) return undefined;
		return await commit();
	};

	const resolveEditorFileData = async (documentCode: string) => {
		const editor = deps.getEditorByDocumentCode(documentCode);
		const binary = editor?.draft.binary;

		if (!editor || !binary?.url) return undefined;

		let base64 = binary.base64;

		if (!base64) {
			const blob = binaryBlobByDocumentCode.get(documentCode);
			if (!blob) {
				return undefined;
			}

			base64 = await blobToBase64(blob);
			patchEditor(documentCode, {
				draft: {
					binary: {
						base64,
					},
				},
			} as TPatch);
		}

		const extension =
			editor.draft.fileType || binary.type.split("/").pop() || "pdf";

		return {
			binary: base64,
			extension,
			encoding: "base64" as const,
			language: "",
			...(binary.shortUrl ? { shortUrl: binary.shortUrl } : {}),
			...(binary.detailedUrl
				? { detailedUrl: binary.detailedUrl }
				: {}),
		};
	};

	const setDocumentPdfDraft = (
		documentCode: string,
		blob: Blob,
		url: string,
	) => {
		const currentEditor = deps.getEditorByDocumentCode(documentCode);
		if (!currentEditor) return;

		deps.setEditorBinaryBlob(documentCode, blob, {
			name: currentEditor.draft.name || "document.pdf",
			type: blob.type || "application/pdf",
			url,
		} as TSetBinaryOptions);
	};

	const uploadDocument = async (documentCode: string) => {
		const context = deps.resolveDocumentUpdateContext(documentCode);
		if (!context) return;

		const { document, nature, folder, editor } = context;

		patchEditor(documentCode, {
			saving: true,
			error: undefined,
		} as TPatch);

		try {
			const preparedCommit = await commitDocumentPdf(documentCode);
			const fileData = withExistingBinaryUrls(
				normalizeFileData(preparedCommit?.fileData) ??
					normalizeFileData(await resolveEditorFileData(documentCode)),
				{ editor, document },
			);

			if (!fileData) {
				throw new Error("missing fileData for upload");
			}

			const rawName =
				editor.draft.name ?? document.state.name ?? "document.pdf";

			const lastDotIndex = rawName.lastIndexOf(".");
			const hasExtension = lastDotIndex > 0;

			const baseName = hasExtension
				? rawName.slice(0, lastDotIndex)
				: rawName;

			const extension = (
				fileData.extension ||
				editor.draft.fileType ||
				document.state.fileExtension ||
				"pdf"
			).toUpperCase();

			const uploadResult = await deps.upload({
				localDocumentCode: document.state.code,
				natureCode: nature.state.code,
				documentDate:
					editor.draft.documentDate ??
					document.state.documentDate ??
					new Date().toISOString().slice(0, 10),
				expirationDate: editor.draft.expirationDate ?? "",
				lineNumber: 0,
				status:
					editor.draft.statusNumber ??
					deps.getDefaultUploadStatus() ??
					1,
				documentName: {
					baseName,
					name: rawName,
				},
				master: {
					object: folder.state.name,
					objectSid: folder.state.sid,
					format: extension,
					publication: extension,
					language: "default",
				},
				content: fileData.binary,
			} as TUploadBody);

			const uploadedDocument = uploadResult.uploaded[0];
			if (!uploadedDocument) {
				throw new Error("upload returned no uploaded document");
			}

			if (!uploadedDocument.ok) {
				throw new Error(uploadedDocument.message || "upload failed");
			}

			await preparedCommit?.finalize();

			const handled = await deps.afterUploadSuccess?.({
				sourceDocumentCode: documentCode,
				uploadedDocument,
				context,
			});

			if (handled) {
				return uploadResult;
			}

			patchEditor(documentCode, {
				saving: false,
				dirty: false,
				lastSavedAt:
					uploadedDocument.lastUpdateTime || editor.lastSavedAt,
				mode: "existing",
			} as TPatch);

			return uploadResult;
		} catch (error) {
			patchEditor(documentCode, {
				saving: false,
				error: error instanceof Error ? error.message : "upload failed",
			} as TPatch);
			throw error;
		}
	};

	const updateDocument = async (
		documentCode: string,
		patch: {
			status?: number;
			memo?: string;
		},
		options?: {
			fileData?: FileDataLike;
			resolveFileData?: boolean;
			skipSavingPatch?: boolean;
			preserveDirty?: boolean;
			afterPersist?: (input: {
				response: TUpdateResult;
				context: TContext;
				fileData?: FileDataLike;
			}) => boolean | undefined | Promise<boolean | undefined>;
		},
	) => {
		const context = deps.resolveDocumentUpdateContext(documentCode);
		if (!context) return;

		const { document, nature, folder, editor } = context;
		const previousDirty = editor.dirty;
		const previousLastSavedAt = editor.lastSavedAt;

		if (!options?.skipSavingPatch) {
			patchEditor(documentCode, {
				saving: true,
				error: undefined,
			} as TPatch);
		}

		try {
			const fileData = withExistingBinaryUrls(
				normalizeFileData(options?.fileData) ??
					(options?.resolveFileData
						? normalizeFileData(
								await resolveEditorFileData(documentCode),
							)
						: undefined),
				{ editor, document },
			);
			const statusNumber =
				patch.status ??
				editor.draft.statusNumber ??
				document.state.status.number;
			const memo = patch.memo ?? editor.draft.memo;
			const documentDate =
				editor.draft.documentDate ?? document.state.documentDate;
			const documentExpires =
				editor.draft.expirationDate ?? document.state.expirationDate;
			const name = editor.draft.name ?? document.state.name;
			const requestLastUpdateTime =
				editor.lastSavedAt ?? document.state.lastUpdated;

			const response = await deps.documentUpdate([
				{
					documentCode: document.state.code,
					lastUpdateTime: requestLastUpdateTime,
					name,
					url: document.state.url,
					status: statusNumber,
					memo,
					documentDate,
					documentExpires,
					master: {
						folderName: folder.state.name,
						sid: folder.state.sid,
					},
					natureCode: nature.state.code,
					...(fileData ? { fileData } : {}),
				},
			] as TUpdateBody);

			if (!response.ok) {
				throw new Error(
					response.error?.message || "document update failed",
				);
			}

			const nextStatusNumber =
				patch.status ??
				editor.draft.statusNumber ??
				document.state.status.number;
			const finalized =
				(await options?.afterPersist?.({
					response,
					context,
					fileData,
				})) ?? false;
			const persistedLastSavedAt = deps.resolveUpdatedLastSavedAt?.({
				response,
				context,
				fileData,
			});
			const nextDirty = options?.preserveDirty
				? (deps.getEditorByDocumentCode(documentCode)?.dirty ??
					previousDirty)
				: options?.afterPersist
					? finalized
						? false
						: previousDirty
					: false;
			const nextLastSavedAt =
				persistedLastSavedAt ?? previousLastSavedAt;

			patchEditor(documentCode, {
				saving: false,
				dirty: nextDirty,
				lastSavedAt: nextLastSavedAt,
				draft: {
					statusNumber: nextStatusNumber,
					memo: patch.memo ?? editor.draft.memo,
				},
			} as TPatch);
		} catch (error) {
			patchEditor(documentCode, {
				saving: false,
				error:
					error instanceof Error
						? error.message
						: "document update failed",
			} as TPatch);
			throw error;
		}
	};

	const updateDocumentStatusFast = async (
		documentCode: string,
		patch: {
			status: number;
			memo?: string;
		},
	) => {
		const context = deps.resolveDocumentUpdateContext(documentCode);
		if (!context) return;

		const { document, editor } = context;
		const nextStatusNumber = patch.status;
		const nextMemo = patch.memo ?? editor.draft.memo;
		const previousStatusNumber =
			editor.draft.statusNumber ?? document.state.status.number;
		const previousStatusLabel =
			editor.draft.statusLabel ?? document.state.status.label;
		const previousMemo = editor.draft.memo;

		patchEditor(documentCode, {
			saving: true,
			error: undefined,
			draft: {
				statusNumber: nextStatusNumber,
				memo: nextMemo,
			},
		} as TPatch);

		deps.pushDocumentFlowDebug("xupd.status.fast.start", {
			documentCode,
			status: nextStatusNumber,
		});

		try {
			await updateDocument(
				documentCode,
				{
					status: nextStatusNumber,
					memo: nextMemo,
				},
				{
					skipSavingPatch: true,
					preserveDirty: true,
				},
			);

			deps.pushDocumentFlowDebug("xupd.status.fast.done", {
				documentCode,
				status: nextStatusNumber,
			});
		} catch (error) {
			patchEditor(documentCode, {
				saving: false,
				error:
					error instanceof Error
						? error.message
						: "document update failed",
				draft: {
					statusNumber: previousStatusNumber,
					statusLabel: previousStatusLabel,
					memo: previousMemo,
				},
			} as TPatch);

			deps.pushDocumentFlowDebug("xupd.status.fast.error", {
				documentCode,
				status: nextStatusNumber,
				...((deps.toDebugError(error) as Record<string, unknown>) ??
					{}),
			});
			throw error;
		}
	};

	const saveDocument = async (documentCode: string) => {
		patchEditor(documentCode, {
			saving: true,
			error: undefined,
		} as TPatch);

		try {
			const preparedCommit = await commitDocumentPdf(documentCode);
			const fileData =
				normalizeFileData(preparedCommit?.fileData) ??
				(deps.isBinaryDirty?.(documentCode)
					? normalizeFileData(await resolveEditorFileData(documentCode))
					: undefined);

			await updateDocument(
				documentCode,
				{},
				{
					fileData,
					skipSavingPatch: true,
					afterPersist: async ({ response, context, fileData }) => {
						const commitFinalized = preparedCommit
							? await preparedCommit.finalize()
							: true;
						const saveFinalized =
							(await deps.afterSaveSuccess?.({
								sourceDocumentCode: documentCode,
								response,
								context,
								fileData,
							})) ?? true;

						return commitFinalized && saveFinalized;
					},
				},
			);
		} catch (error) {
			patchEditor(documentCode, {
				saving: false,
				error:
					error instanceof Error
						? error.message
						: "document save failed",
			} as TPatch);
			throw error;
		}
	};

	const triggerDownload = async (documentCode: string) => {
		const editor = deps.getEditorByDocumentCode(documentCode);
		if (!editor) return;

		const preparedCommit = await commitDocumentPdf(documentCode);

		if (preparedCommit) {
			const blob = base64ToBlob(
				preparedCommit.fileData.binary,
				"application/pdf",
			);
			const url = URL.createObjectURL(blob);

			try {
				const anchor = document.createElement("a");
				anchor.href = url;
				anchor.download =
					editor.draft.binary?.name ||
					editor.draft.name ||
					`${documentCode}.pdf`;
				document.body.appendChild(anchor);
				anchor.click();
				anchor.remove();
			} finally {
				URL.revokeObjectURL(url);
			}

			return;
		}

		await deps.ensureDocumentBinary(documentCode);

		const refreshedEditor = deps.getEditorByDocumentCode(documentCode);
		const url = refreshedEditor?.draft.binary?.url;
		if (!url) return;

		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download =
			refreshedEditor?.draft.binary?.name ||
			refreshedEditor?.draft.name ||
			`${documentCode}.pdf`;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
	};

	const triggerEmail = async (documentCode: string) => {
		const editor = deps.getEditorByDocumentCode(documentCode);
		if (!editor) return;

		const subject = encodeURIComponent(
			editor.draft.name || documentCode,
		);
		const body = encodeURIComponent(
			editor.draft.binary?.url || documentCode,
		);
		window.location.href = `mailto:?subject=${subject}&body=${body}`;
	};

	const deleteDocument = async (documentCode: string) => {
		const context = deps.resolveDocumentUpdateContext(documentCode);
		const documentEntity = context?.document;
		if (!documentEntity) return;

		patchEditor(documentCode, {
			saving: true,
			error: undefined,
		} as TPatch);

		try {
			await deps.documentDelete(documentEntity.state.code, {
				documentCode: documentEntity.state.code,
				state: documentEntity.state.status.number,
				url: documentEntity.state.url,
				fileExtension: documentEntity.state.fileExtension,
				language: documentEntity.state.language,
				fullUrl: documentEntity.state.fullUrl,
				shortUrl: documentEntity.state.shortUrl,
			} as TDeleteBody);

			patchEditor(documentCode, {
				saving: false,
				lastSavedAt: new Date().toISOString(),
			} as TPatch);
		} catch (error) {
			patchEditor(documentCode, {
				saving: false,
				error:
					error instanceof Error
						? error.message
						: "document delete failed",
			} as TPatch);
			throw error;
		}
	};

	const runDocumentAction = async (
		actionId: ViewerActionId,
		documentCode: string,
		options?: { memo?: string },
	) => {
		const editor = deps.getEditorByDocumentCode(documentCode);
		const action = editor?.actions.find(
			(entry) => entry.id === actionId,
		);

		if (!editor || !action || action.disabled) return;

		switch (actionId) {
			case "save":
				await saveDocument(documentCode);
				return;
			case "upload":
				await uploadDocument(documentCode);
				return;
			case "download":
				await triggerDownload(documentCode);
				return;
			case "email":
				await triggerEmail(documentCode);
				return;
			case "pending":
				await updateDocumentStatusFast(documentCode, {
					status: documentStatusNumberByKey.pending,
				});
				return;
			case "validate":
				await updateDocumentStatusFast(documentCode, {
					status: documentStatusNumberByKey.validated,
				});
				return;
			case "reject":
				await updateDocumentStatusFast(documentCode, {
					status: documentStatusNumberByKey.rejected,
					memo: options?.memo,
				});
				return;
			case "remove":
				await updateDocumentStatusFast(documentCode, {
					status: documentStatusNumberByKey.removed,
				});
				return;
			case "delete":
				await deleteDocument(documentCode);
				return;
		}
	};

	return {
		rememberBinaryBlob,
		registerPdfCommit,
		unregisterPdfCommit,
		commitDocumentPdf,
		setDocumentPdfDraft,
		uploadDocument,
		updateDocument,
		saveDocument,
		deleteDocument,
		runDocumentAction,
	};
};
