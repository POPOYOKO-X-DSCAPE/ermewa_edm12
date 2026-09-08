import {
	type ReactNode,
	createContext,
	useContext,
	useMemo,
} from "react";

export type PdfViewerStrings = Readonly<{
	replaceFile: string;
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

export const DEFAULT_PDF_VIEWER_STRINGS: PdfViewerStrings = {
	replaceFile: "Replace file",
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

const PdfViewerStringsContext = createContext<PdfViewerStrings>(
	DEFAULT_PDF_VIEWER_STRINGS,
);

export const PdfViewerStringsProvider = ({
	value,
	children,
}: {
	value?: Partial<PdfViewerStrings>;
	children: ReactNode;
}) => {
	const resolved = useMemo(
		() => ({ ...DEFAULT_PDF_VIEWER_STRINGS, ...value }),
		[value],
	);

	return (
		<PdfViewerStringsContext.Provider value={resolved}>
			{children}
		</PdfViewerStringsContext.Provider>
	);
};

export const usePdfViewerStrings = (): PdfViewerStrings =>
	useContext(PdfViewerStringsContext);
