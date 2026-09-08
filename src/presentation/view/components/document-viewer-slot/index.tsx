import { useLoadable } from '@packages/ui';
import {
	Suspense,
	lazy,
	useCallback,
	useEffect,
	useState,
} from "react";
import { createComponent } from "../../../../core/component.builder";

const LazyDocumentViewerSlotView = lazy(async () => {
	const module = await import("./document-viewer-slot");

	return { default: module.DocumentViewerSlotView };
});

type DocumentViewerSlotProps = {
	onPrimaryPaintReady?: (documentCode: string) => void;
};

export const DocumentViewerSlot =
	createComponent<DocumentViewerSlotProps>(
		({
			models: {
				documentModel: {
					selectedDocumentCode,
					selectedDocumentViewerContent,
					selectedDocumentViewerMeta,
					selectedDocumentViewerActions,
					selectedDocumentViewerReadonly,
					selectedDocumentViewerInteractionDisabled,
				},
			},
			controllers: {
				documentController: {
					markDocumentViewerReady,
					setDocumentPdfDraft,
					markDocumentDirty,
					replaceDocumentBinary,
					getDocumentImportPolicy,
					updateDocumentMetaDraft,
					sendDocumentEmail,
					getRejectEmailDraft,
					prefetchRejectEmailInfo,
					rejectDocumentWithEmail,
					unregisterPdfCommit,
					registerPdfCommit,
					runDocumentAction,
				},
			},
			props: { onPrimaryPaintReady },
		}) => {

			const viewerDocumentCode =
				selectedDocumentViewerContent?.documentCode;

			type MailDraft = {
				from: string;
				to: string;
				cc: string;
				bcc: string;
				subject: string;
				text: string;
			};

			const buildEmptyMailDraft = useCallback(
				(): MailDraft => ({
					from: "",
					to: "",
					cc: "",
					bcc: "",
					subject: selectedDocumentViewerMeta?.name ?? "",
					text: "",
				}),
				[selectedDocumentViewerMeta?.name],
			);

			const [rejectEmailDraft, setRejectEmailDraft] =
				useState<MailDraft>(buildEmptyMailDraft);

			useEffect(() => {
				if (!viewerDocumentCode) {
					setRejectEmailDraft(buildEmptyMailDraft());
					return;
				}

				let cancelled = false;

				setRejectEmailDraft(getRejectEmailDraft(viewerDocumentCode));

				void prefetchRejectEmailInfo(viewerDocumentCode)
					.then((draft) => {
						if (!cancelled) {
							setRejectEmailDraft(draft);
						}
					})
					.catch((error) => {
						console.error(error);
					});

				return () => {
					cancelled = true;
				};
			}, [
				buildEmptyMailDraft,
				getRejectEmailDraft,
				prefetchRejectEmailInfo,
				viewerDocumentCode,
			]);

			const viewerNode =
				selectedDocumentViewerContent &&
				(selectedDocumentViewerContent.url ||
					selectedDocumentViewerContent.error)
					? {
							documentCode: selectedDocumentViewerContent.documentCode,
							url: selectedDocumentViewerContent.url ?? "",
							type: selectedDocumentViewerContent.type ?? "unknown",
							error: selectedDocumentViewerContent.error ?? null,
							loading: selectedDocumentViewerContent.loading ?? false,
							name: selectedDocumentViewerMeta?.name ?? "",
							date: selectedDocumentViewerMeta?.date,
							expires: selectedDocumentViewerMeta?.expires,
							status: selectedDocumentViewerMeta?.status,
							memo: selectedDocumentViewerMeta?.memo,
							hasExpirationDate:
								selectedDocumentViewerMeta?.hasExpirationDate,
						}
					: undefined;

			const viewerImportPolicy = viewerDocumentCode
				? getDocumentImportPolicy(viewerDocumentCode)
				: undefined;

			const boundActions =
				viewerDocumentCode && selectedDocumentViewerActions
					? selectedDocumentViewerActions.map((action) => ({
							...action,
							onClick: async () => {
								await runDocumentAction(action.id, viewerDocumentCode);
							},
						}))
					: undefined;

			const handleContentReady = useCallback(() => {
				if (!viewerDocumentCode) {
					return;
				}

				markDocumentViewerReady(viewerDocumentCode);
				onPrimaryPaintReady?.(viewerDocumentCode);
			}, [
				markDocumentViewerReady,
				onPrimaryPaintReady,
				viewerDocumentCode,
			]);

			const handlePdfChange = useCallback(
				(blob: Blob, url: string) => {
					if (!viewerDocumentCode) {
						return undefined;
					}

					return setDocumentPdfDraft(viewerDocumentCode, blob, url);
				},
				[setDocumentPdfDraft, viewerDocumentCode],
			);

			const handlePdfDirtyChange = useCallback(
				(dirty: boolean) => {
					if (viewerDocumentCode) {
						markDocumentDirty(viewerDocumentCode, dirty);
					}
				},
				[markDocumentDirty, viewerDocumentCode],
			);

			type ViewerPdfCommitFactory = Parameters<
				typeof registerPdfCommit
			>[1];

			const handlePdfCommitReady = useCallback(
				(commit: ViewerPdfCommitFactory) => {
					if (viewerDocumentCode) {
						registerPdfCommit(viewerDocumentCode, commit);
					}
				},
				[registerPdfCommit, viewerDocumentCode],
			);

			const handlePdfCommitCleanup = useCallback(() => {
				if (viewerDocumentCode) {
					unregisterPdfCommit(viewerDocumentCode);
				}
			}, [unregisterPdfCommit, viewerDocumentCode]);

			const handleReplaceFiles = useCallback(
				async (files: readonly File[]) => {
					if (!viewerDocumentCode) {
						return;
					}

					try {
						await replaceDocumentBinary(viewerDocumentCode, files);
					} catch (error) {
						console.error(error);
						window.alert(
							error instanceof Error
								? error.message
								: "Failed to replace file",
						);
					}
				},
				[replaceDocumentBinary, viewerDocumentCode],
			);

			const handleMetaSubmit = useCallback(
				async (draft: {
					name: string;
					date: string;
					expires: string;
				}) => {
					if (!viewerDocumentCode) {
						return;
					}

					updateDocumentMetaDraft(viewerDocumentCode, draft);
				},
				[updateDocumentMetaDraft, viewerDocumentCode],
			);

			const handleEmailSubmit = useCallback(
				async (draft: MailDraft) => {
					if (!viewerDocumentCode) {
						return;
					}

					try {
						await sendDocumentEmail(viewerDocumentCode, draft);
					} catch (error) {
						console.error(error);
						window.alert(
							error instanceof Error
								? error.message
								: "Failed to send email",
						);
					}
				},
				[sendDocumentEmail, viewerDocumentCode],
			);

			const handleRejectEmailSubmit = useCallback(
				async (draft: MailDraft) => {
					if (!viewerDocumentCode) {
						return;
					}

					setRejectEmailDraft(draft);

					try {
						await rejectDocumentWithEmail(viewerDocumentCode, draft);
					} catch (error) {
						console.error(error);
						window.alert(
							error instanceof Error
								? error.message
								: "Failed to reject document",
						);
					}
				},
				[rejectDocumentWithEmail, viewerDocumentCode],
			);

			const hasDeepLinkedDocument = Boolean(selectedDocumentCode);


			const LoadableSuspenseFallback = () => {
				const { setIsLoading } = useLoadable();

				useEffect(() => {
					setIsLoading(true);

					return () => {
						setIsLoading(false);
					};
				}, [setIsLoading]);

				return null;
			};

			return (
				<Suspense fallback={<LoadableSuspenseFallback />}>
					<LazyDocumentViewerSlotView
						hasDeepLinkedDocument={hasDeepLinkedDocument}
						viewerNode={viewerNode}
						readonly={selectedDocumentViewerReadonly}
						actions={boundActions}
						onContentReady={handleContentReady}
						onPdfChange={handlePdfChange}
						onPdfDirtyChange={handlePdfDirtyChange}
						onPdfCommitReady={handlePdfCommitReady}
						onPdfCommitCleanup={handlePdfCommitCleanup}
						onReplaceFiles={handleReplaceFiles}
						replaceFileAccept={viewerImportPolicy?.replace.accept}
						showReplaceFile={
							!selectedDocumentViewerReadonly &&
							(viewerImportPolicy?.replace.allowed ?? false)
						}
						allowMultipleReplaceFiles={
							viewerImportPolicy?.replace.multiple ?? false
						}
						pdfAddPageAccept={viewerImportPolicy?.addPages.accept}
						showPdfAddPage={
							!selectedDocumentViewerReadonly &&
							selectedDocumentViewerContent?.type === "pdf" &&
							(viewerImportPolicy?.addPages.allowed ?? false)
						}
						normalizeFilesToPdfBytes={async (...args) => {
							const { convertFilesToPdfBytes } = await import(
								"@src/infrastructure/library/pdf/convert-files-to-pdf"
							);
							return convertFilesToPdfBytes(...args);
						}}
						onMetaSubmit={handleMetaSubmit}
						onEmailSubmit={handleEmailSubmit}
						rejectEmailInitialDraft={rejectEmailDraft}
						onRejectEmailSubmit={handleRejectEmailSubmit}
						interactionDisabled={
							selectedDocumentViewerInteractionDisabled
						}
					/>
				</Suspense>
			);
		},
	);
