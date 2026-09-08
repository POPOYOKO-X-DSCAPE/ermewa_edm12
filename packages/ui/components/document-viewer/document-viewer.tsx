import { Stack } from "@packages/ui";
import { Spinner } from "../loader";

import type { DocumentViewerProps } from "./types";
import { resolveDocumentViewerStrings } from "./types";

export type {
	DocumentViewerExtension,
	Action,
	DocumentViewerMetaDraft,
	DocumentViewerStrings,
} from "./types";
export { DEFAULT_DOCUMENT_VIEWER_STRINGS } from "./types";

import { DocumentViewerContent } from "./document-viewer-content";
import { DocumentViewerHeader } from "./document-viewer-header";
import { styles } from "./styles";
import { PdfViewerStringsProvider } from "./viewers/pdf/pdf-strings";

export const DocumentViewer = ({
	documentKey,
	url,
	name,
	date,
	expires,
	status,
	showExpiresField,
	type,
	error,
	loading,
	actions,
	onPdfPageCopy,
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
	pdfSaveWorkerUrl,
	reactPdfWorkerUrl,
	normalizeFilesToPdfBytes,
	onContentReady,
	onMetaSubmit,
	extension,
	interactionDisabled = false,
	readonly = false,
	strings,
}: DocumentViewerProps) => {
	const resolvedStrings = resolveDocumentViewerStrings(strings);

	if (loading) {
		return (
			<Stack
				grow
				direction="column"
				alignItems="center"
				justifyContent="center"
			>
				<p>{resolvedStrings.loadingDocument}</p>
				<Spinner />
			</Stack>
		);
	}

	if (error) {
		return (
			<Stack
				grow
				direction="column"
				alignItems="center"
				justifyContent="center"
			>
				<p className={styles.error}>{error}</p>
			</Stack>
		);
	}

	return (
		<PdfViewerStringsProvider
			value={{
				replaceFile: resolvedStrings.replaceFile,
				addPage: resolvedStrings.addPage,
				textDocument: resolvedStrings.textDocument,
				rotateClockwise: resolvedStrings.rotateClockwise,
				rotateAnticlockwise: resolvedStrings.rotateAnticlockwise,
				copyPage: resolvedStrings.copyPage,
				deletePage: resolvedStrings.deletePage,
				rotatePageClockwise: resolvedStrings.rotatePageClockwise,
				rotatePageAnticlockwise:
					resolvedStrings.rotatePageAnticlockwise,
				unsupportedType: resolvedStrings.unsupportedType,
			}}
		>
			<Stack direction="column" grow>
				<DocumentViewerHeader
					name={name}
					date={date}
					expires={expires}
					status={status}
					showExpiresField={showExpiresField}
					actions={actions}
					type={type}
					readonly={readonly}
					onReplaceFiles={onReplaceFiles}
					replaceFileAccept={replaceFileAccept}
					showReplaceFile={showReplaceFile}
					allowMultipleReplaceFiles={allowMultipleReplaceFiles}
					onMetaSubmit={onMetaSubmit}
					metaExtra={extension?.metaExtra}
					interactionDisabled={interactionDisabled}
					strings={resolvedStrings}
				/>
				<DocumentViewerContent
					documentKey={documentKey}
					url={url}
					name={name}
					type={type}
					readonly={readonly}
					onPdfPageCopy={onPdfPageCopy}
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
					pdfSaveWorkerUrl={pdfSaveWorkerUrl}
					reactPdfWorkerUrl={reactPdfWorkerUrl}
					normalizeFilesToPdfBytes={normalizeFilesToPdfBytes}
					onContentReady={onContentReady}
					extension={extension}
					interactionDisabled={interactionDisabled}
					strings={resolvedStrings}
				/>
				{actions?.map((action) => action.renderModal?.())}
			</Stack>
		</PdfViewerStringsProvider>
	);
};
