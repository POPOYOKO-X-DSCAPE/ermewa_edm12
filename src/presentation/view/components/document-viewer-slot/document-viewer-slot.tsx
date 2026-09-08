import { RiFile2Line } from "@remixicon/react";
import { type ComponentProps, Suspense, lazy, useMemo } from "react";

import {
	type DocumentViewer,
	type DocumentViewerExtension,
	Stack,
} from "@packages/ui";
import {
	type EmailDraft,
	type EmailSubmitCallback,
	EmailViewer,
	useEmailActions,
} from "@packages/ui/document-viewer-email";
import { translations } from "@src/i18n";

const LazyDocumentViewer = lazy(async () => {
	const module = await import(
		"@packages/ui/components/document-viewer/document-viewer"
	);

	return { default: module.DocumentViewer };
});

type ViewerNode = {
	documentCode?: string;
	url: string;
	type:
		| "pdf"
		| "jpg"
		| "jpeg"
		| "png"
		| "mpeg"
		| "svg"
		| "mp4"
		| "txt"
		| "json"
		| "xml"
		| "msg"
		| "unknown";
	name: string;
	date?: string;
	expires?: string;
	status?: number;
	memo?: string;
	hasExpirationDate?: boolean;
	error: string | null;
	loading: boolean;
};

type ViewerAction = {
	id: string;
	label: string;
	onClick: () => void | Promise<void>;
	disabled?: boolean;
	hidden?: boolean;
};

export type DocumentViewerSlotViewProps = {
	hasDeepLinkedDocument: boolean;
	viewerNode?: ViewerNode;
	actions?: ViewerAction[];
	onContentReady?: () => void;
	onPdfChange?: (blob: Blob, url: string) => void | Promise<void>;
	onPdfDirtyChange?: (dirty: boolean) => void;
	onPdfCommitReady?: ComponentProps<
		typeof DocumentViewer
	>["onPdfCommitReady"];
	onPdfCommitCleanup?: () => void;
	onReplaceFiles?: ComponentProps<
		typeof DocumentViewer
	>["onReplaceFiles"];
	replaceFileAccept?: ComponentProps<
		typeof DocumentViewer
	>["replaceFileAccept"];
	showReplaceFile?: ComponentProps<
		typeof DocumentViewer
	>["showReplaceFile"];
	allowMultipleReplaceFiles?: ComponentProps<
		typeof DocumentViewer
	>["allowMultipleReplaceFiles"];
	pdfAddPageAccept?: ComponentProps<
		typeof DocumentViewer
	>["pdfAddPageAccept"];
	showPdfAddPage?: ComponentProps<
		typeof DocumentViewer
	>["showPdfAddPage"];
	normalizeFilesToPdfBytes?: ComponentProps<
		typeof DocumentViewer
	>["normalizeFilesToPdfBytes"];
	onMetaSubmit?: ComponentProps<typeof DocumentViewer>["onMetaSubmit"];
	onEmailSubmit?: EmailSubmitCallback;
	rejectEmailInitialDraft?: EmailDraft;
	onRejectEmailSubmit?: EmailSubmitCallback;
	interactionDisabled?: ComponentProps<
		typeof DocumentViewer
	>["interactionDisabled"];
	readonly?: boolean;
};

export const DocumentViewerSlotView = ({
	hasDeepLinkedDocument,
	viewerNode,
	actions,
	onContentReady,
	onPdfChange,
	onPdfDirtyChange,
	onPdfCommitReady,
	onPdfCommitCleanup,
	onReplaceFiles,
	replaceFileAccept,
	showReplaceFile,
	allowMultipleReplaceFiles,
	pdfAddPageAccept,
	showPdfAddPage,
	normalizeFilesToPdfBytes,
	onMetaSubmit,
	onEmailSubmit,
	rejectEmailInitialDraft,
	onRejectEmailSubmit,
	interactionDisabled,
	readonly,
}: DocumentViewerSlotViewProps) => {
	const { t: translate } = translations;

	const viewerStrings = useMemo(
		() => ({
			loadingDocument: translate("loadingDocument"),
			date: translate("viewerDate"),
			expires: translate("viewerExpires"),
			editMeta: translate("viewerEditMeta"),
			editMetadata: translate("viewerEditMetadata"),
			metaName: translate("viewerMetaName"),
			metaDate: translate("viewerMetaDate"),
			metaExpires: translate("viewerMetaExpires"),
			apply: translate("viewerMetaApply"),
			cancel: translate("viewerCancel"),
			changeStatus: translate("viewerChangeStatus"),
			file: translate("viewerFile"),
			replaceFile: translate("viewerReplaceFile"),
			zoom: translate("viewerZoom"),
			addPage: translate("viewerAddPage"),
			textDocument: translate("viewerTextDocument"),
			unsupportedType: translate("viewerUnsupportedType"),
			rotateClockwise: translate("viewerRotateClockwise"),
			rotateAnticlockwise: translate("viewerRotateAnticlockwise"),
			copyPage: (page: number) => translate("viewerCopyPage", { page }),
			deletePage: (page: number) =>
				translate("viewerDeletePage", { page }),
			rotatePageClockwise: (page: number) =>
				translate("viewerRotatePageClockwise", { page }),
			rotatePageAnticlockwise: (page: number) =>
				translate("viewerRotatePageAnticlockwise", { page }),
		}),
		[translate],
	);

	const emailStrings = useMemo(
		() => ({
			emailTitle: translate("emailTitle"),
			rejectTitle: translate("emailRejectTitle"),
			rejectSubmit: translate("emailRejectSubmit"),
			from: translate("emailFrom"),
			to: translate("emailTo"),
			cc: translate("emailCc"),
			bcc: translate("emailBcc"),
			subject: translate("emailSubject"),
			message: translate("emailMessage"),
			send: translate("emailSend"),
			dismiss: translate("emailDismiss"),
			cancel: translate("viewerCancel"),
			rejectionReason: translate("emailRejectionReason"),
			viewerFrom: translate("emailViewerFrom"),
			viewerTo: translate("emailViewerTo"),
			failedToLoad: translate("emailFailedToLoad"),
		}),
		[translate],
	);

	const { apply: applyEmailActions, rejectContext } = useEmailActions({
		onEmailSubmit,
		onRejectEmailSubmit,
		rejectEmailInitialDraft,
		documentName: viewerNode?.name,
		status: viewerNode?.status,
		memo: viewerNode?.memo,
		strings: emailStrings,
	});

	const extendedActions = actions
		? applyEmailActions(actions)
		: actions;

	const extension = useMemo(
		() =>
			({
				resolveContent: ({ type }) =>
					type === "msg" || type === "eml"
						? (props: { url: string }) => (
								<EmailViewer url={props.url} strings={emailStrings} />
							)
						: null,
				metaExtra: rejectContext,
			}) satisfies DocumentViewerExtension,
		[emailStrings, rejectContext],
	);

	if (viewerNode) {
		return (
			<Suspense fallback={null}>
				<LazyDocumentViewer
					key={viewerNode.documentCode || "document-viewer"}
					documentKey={viewerNode.documentCode}
					url={viewerNode.url}
					type={viewerNode.type}
					name={viewerNode.name}
					actions={extendedActions}
					date={viewerNode.date}
					expires={viewerNode.expires}
					status={viewerNode.status}
					memo={viewerNode.memo}
					showExpiresField={viewerNode.hasExpirationDate}
					readonly={readonly ?? false}
					loading={viewerNode.loading}
					error={viewerNode.error}
					onContentReady={onContentReady}
					onPdfChange={onPdfChange}
					onPdfDirtyChange={onPdfDirtyChange}
					onPdfCommitReady={onPdfCommitReady}
					onPdfCommitCleanup={onPdfCommitCleanup}
					onReplaceFiles={onReplaceFiles}
					replaceFileAccept={replaceFileAccept}
					showReplaceFile={showReplaceFile}
					allowMultipleReplaceFiles={allowMultipleReplaceFiles}
					pdfAddPageAccept={pdfAddPageAccept}
					showPdfAddPage={showPdfAddPage}
					normalizeFilesToPdfBytes={normalizeFilesToPdfBytes}
					onMetaSubmit={onMetaSubmit}
					extension={extension}
					strings={viewerStrings}
					interactionDisabled={interactionDisabled}
				/>
			</Suspense>
		);
	}

	if (hasDeepLinkedDocument) {
		return (
			<Stack grow alignItems="center" justifyContent="center">
				<RiFile2Line />
				{translate("loadingDocument")}
			</Stack>
		);
	}

	return (
		<Stack grow alignItems="center" justifyContent="center">
			<RiFile2Line />
			{translate("selectDocumentToStart")}
		</Stack>
	);
};
