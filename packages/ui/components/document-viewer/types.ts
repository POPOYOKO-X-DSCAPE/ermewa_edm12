import type { ComponentType, JSX, ReactNode } from "react";
import type { PdfCommit } from "./logic/use-pdf";

export type DocumentViewerMetaDraft = Readonly<{
	name: string;
	date: string;
	expires: string;
}>;

export type DocumentViewerStrings = Readonly<{
	loadingDocument: string;
	date: string;
	expires: string;
	editMeta: string;
	editMetadata: string;
	metaName: string;
	metaDate: string;
	metaExpires: string;
	apply: string;
	cancel: string;
	changeStatus: string;
	file: string;
	replaceFile: string;
	zoom: string;
	addPage: string;
	textDocument: string;
	rotateClockwise: string;
	rotateAnticlockwise: string;
	copyPage: (page: number) => string;
	deletePage: (page: number) => string;
	rotatePageClockwise: (page: number) => string;
	rotatePageAnticlockwise: (page: number) => string;
	unsupportedType: string;
}>;

export const DEFAULT_DOCUMENT_VIEWER_STRINGS: DocumentViewerStrings = {
	loadingDocument: "Loading document...",
	date: "Date",
	expires: "Expires",
	editMeta: "Edit meta",
	editMetadata: "Edit metadata",
	metaName: "Name *",
	metaDate: "Date *",
	metaExpires: "Expires",
	apply: "Apply",
	cancel: "Cancel",
	changeStatus: "Change status",
	file: "File",
	replaceFile: "Replace file",
	zoom: "Zoom:",
	addPage: "Add page",
	textDocument: "Text document",
	rotateClockwise: "Rotate clockwise",
	rotateAnticlockwise: "Rotate anticlockwise",
	copyPage: (page) => `Copy page ${page}`,
	deletePage: (page) => `Delete page ${page}`,
	rotatePageClockwise: (page) => `Rotate page ${page} clockwise`,
	rotatePageAnticlockwise: (page) =>
		`Rotate page ${page} anticlockwise`,
	unsupportedType: "Unsupported document type",
};

export const resolveDocumentViewerStrings = (
	strings?: Partial<DocumentViewerStrings>,
): DocumentViewerStrings => ({
	...DEFAULT_DOCUMENT_VIEWER_STRINGS,
	...strings,
});

export interface Action {
	id: string;
	label: string;
	onClick: () => void;
	renderModal?: () => JSX.Element | null;
	disabled?: boolean;
	hidden?: boolean;
}

export type ResolvedAction = Readonly<{
	id: string;
	label: string;
	onClick: () => void;
	disabled: boolean;
}>;

/**
 * Generic content router for document types the shell does not know about
 * natively (pdf/json/xml/image/video/text). The extension package supplies a
 * viewer component for its own document type (e.g. `.msg` email).
 */
export type DocumentViewerContentRenderer = ComponentType<{
	url: string;
}>;

/**
 * Optional document-type extensions. The shell stays a pure document shell; a
 * consumer (e.g. the email sub-package) plugs in a content renderer for types
 * it owns and an extra header control node.
 */
export interface DocumentViewerExtension {
	/** Maps a document type/url to a content renderer, or null to fall through. */
	resolveContent?: (args: {
		type: string;
		url: string;
	}) => DocumentViewerContentRenderer | null;
	/** Extra node rendered in the header meta area (e.g. reject-motif button). */
	metaExtra?: ReactNode;
}

export interface DocumentViewerProps {
	documentKey?: string;
	url: string;
	name: string;
	date?: string;
	expires?: string;
	status?: number;
	memo?: string;
	showExpiresField?: boolean;
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
		| "eml"
		| "unknown";
	error: string | null;
	loading: boolean;
	actions?: Action[];
	className?: string;
	strings?: Partial<DocumentViewerStrings>;
	onPdfPageCopy?: (pdfPageUrl: string) => void;
	onPdfChange?: (blob: Blob, url: string) => void | Promise<void>;
	onPdfDirtyChange?: (dirty: boolean) => void;
	onPdfCommitReady?: (commit: PdfCommit) => void;
	onPdfCommitCleanup?: () => void;
	normalizeFilesToPdfBytes?: (
		files: readonly File[],
	) => Promise<Uint8Array>;
	onReplaceFiles?: (files: readonly File[]) => void | Promise<void>;
	replaceFileAccept?: string;
	showReplaceFile?: boolean;
	allowMultipleReplaceFiles?: boolean;
	pdfAddPageAccept?: string;
	showPdfAddPage?: boolean;
	/** Path to the pdf-lib compose worker asset (default: kit public asset). */
	pdfSaveWorkerUrl?: string;
	/** Path to the react-pdf renderer worker asset (default: kit public asset). */
	reactPdfWorkerUrl?: string;
	onContentReady?: () => void;
	onMetaSubmit?: (
		draft: DocumentViewerMetaDraft,
	) => void | Promise<void>;
	extension?: DocumentViewerExtension;
	interactionDisabled?: boolean;
	readonly: boolean;
}

export type DocumentViewerChromeProps = Pick<
	DocumentViewerProps,
	| "name"
	| "date"
	| "expires"
	| "status"
	| "showExpiresField"
	| "actions"
	| "type"
	| "readonly"
	| "onReplaceFiles"
	| "replaceFileAccept"
	| "showReplaceFile"
	| "allowMultipleReplaceFiles"
	| "onMetaSubmit"
	| "interactionDisabled"
> &
	Readonly<{
		metaExtra?: ReactNode;
		strings: DocumentViewerStrings;
	}>;

export type DocumentViewerContentProps = Pick<
	DocumentViewerProps,
	| "documentKey"
	| "url"
	| "name"
	| "type"
	| "readonly"
	| "onPdfPageCopy"
	| "onPdfChange"
	| "onPdfDirtyChange"
	| "onPdfCommitReady"
	| "onPdfCommitCleanup"
	| "onReplaceFiles"
	| "replaceFileAccept"
	| "showReplaceFile"
	| "allowMultipleReplaceFiles"
	| "pdfAddPageAccept"
	| "showPdfAddPage"
	| "pdfSaveWorkerUrl"
	| "reactPdfWorkerUrl"
	| "normalizeFilesToPdfBytes"
	| "onContentReady"
	| "interactionDisabled"
> &
	Readonly<{
		extension?: DocumentViewerExtension;
		strings: DocumentViewerStrings;
	}>;
