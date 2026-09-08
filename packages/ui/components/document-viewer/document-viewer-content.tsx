import { Button, Stack } from "@packages/ui";
import {
	RiFlipHorizontal2Line,
	RiFlipVertical2Line,
	RiZoomInLine,
	RiZoomOutLine,
} from "@remixicon/react";
import classNames from "classnames";
import {
	Suspense,
	lazy,
	memo,
	useEffect,
	useRef,
	useState,
} from "react";
import { type ZoomMode, useZoom } from "./logic/use-zoom";
import { styles } from "./styles";
import type { DocumentViewerContentProps } from "./types";
import { applyPdfEditUiVisibility } from "./utils";
import { DefaultViewer } from "./viewers/default";

const LazyJsonViewer = lazy(async () => {
	const module = await import("./viewers/json");
	return { default: module.JsonViewer };
});

const LazyPdfViewer = lazy(async () => {
	const module = await import("./viewers/pdf/pdf");
	return { default: module.PdfViewer };
});

const LazyXmlViewer = lazy(async () => {
	const module = await import("./viewers/xml");
	return { default: module.XmlViewer };
});

export const DocumentViewerContent = memo(
	({
		documentKey,
		url,
		name,
		type,
		readonly,
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
		extension,
		interactionDisabled = false,
		strings,
	}: DocumentViewerContentProps) => {
		const [effectiveZoom, setEffectiveZoom] = useState(1);
		const {
			previousZoomMode,
			zoomMode,
			setZoomMode,
			currentZoom,
			zoomIn,
			zoomOut,
			canZoomIn,
			canZoomOut,
		} = useZoom(effectiveZoom);

		const resolvedDocumentKey = documentKey ?? `${type}:${name}`;
		const [stablePdfSource, setStablePdfSource] = useState(() => ({
			documentKey: resolvedDocumentKey,
			url,
		}));

		useEffect(() => {
			if (stablePdfSource.documentKey !== resolvedDocumentKey) {
				setStablePdfSource({
					documentKey: resolvedDocumentKey,
					url,
				});
				return;
			}

			if (url && stablePdfSource.url !== url) {
				setStablePdfSource({
					documentKey: resolvedDocumentKey,
					url,
				});
			}
		}, [
			resolvedDocumentKey,
			stablePdfSource.documentKey,
			stablePdfSource.url,
			url,
		]);

		const pdfUrl =
			stablePdfSource.documentKey === resolvedDocumentKey
				? stablePdfSource.url || url
				: url;

		const isPdf =
			type === "pdf" || pdfUrl.toLowerCase().endsWith(".pdf");
		const isJson =
			type === "json" || url.toLowerCase().endsWith(".json");
		const isXml = type === "xml" || url.toLowerCase().endsWith(".xml");
		const ExtensionContent = extension?.resolveContent
			? extension.resolveContent({ type, url })
			: null;
		const pdfViewerRootRef = useRef<HTMLDivElement | null>(null);

		useEffect(() => {
			if (!isPdf) {
				return;
			}

			const root = pdfViewerRootRef.current;
			if (!root) {
				return;
			}

			const frameId = window.requestAnimationFrame(() => {
				applyPdfEditUiVisibility(root, readonly, interactionDisabled);
			});

			return () => {
				window.cancelAnimationFrame(frameId);
			};
		}, [interactionDisabled, isPdf, readonly]);

		if (!(isPdf ? pdfUrl : url)) return null;

		return isPdf ? (
			<div
				ref={pdfViewerRootRef}
				className={classNames(styles.pdfViewerRoot)}
			>
				<Suspense fallback={null}>
					<LazyPdfViewer
						pdfUrl={pdfUrl}
						onPageCopy={onPdfPageCopy}
						currentZoom={currentZoom}
						zoomMode={zoomMode as ZoomMode}
						onZoomChange={setEffectiveZoom}
						mode={readonly ? "view" : "edit"}
						onPdfChange={onPdfChange}
						onDirtyChange={onPdfDirtyChange}
						onReplaceFiles={
							showReplaceFile ? onReplaceFiles : undefined
						}
						replaceFileAccept={replaceFileAccept}
						allowMultipleReplaceFiles={allowMultipleReplaceFiles}
						addPageAccept={pdfAddPageAccept}
						showReplaceFile={showReplaceFile}
						showAddPage={showPdfAddPage}
						normalizeFilesToPdfBytes={normalizeFilesToPdfBytes}
						pdfSaveWorkerUrl={pdfSaveWorkerUrl}
						reactPdfWorkerUrl={reactPdfWorkerUrl}
						onCommitReady={onPdfCommitReady}
						onCommitCleanup={onPdfCommitCleanup}
						onPrimaryPaintReady={onContentReady}
						interactionDisabled={interactionDisabled}
						overlayChildren={[
							{
								position: ["bottom", "left"],
								children: (
									<div data-document-viewer-zoom-controls="true">
										<Stack
											className={classNames(styles.zoom)}
											direction="row"
											alignItems="center"
											grow
										>
											<b>{strings.zoom}</b>{" "}
											<span className={styles.zoomField}>
												{Math.round(effectiveZoom * 100)}%
											</span>
											<Button
												onClick={() => {
													setZoomMode("custom");
													zoomOut(effectiveZoom);
												}}
												level="secondary"
												disabled={!canZoomOut}
											>
												<RiZoomOutLine size={12} />
											</Button>
											<Button
												onClick={() => {
													setZoomMode("custom");
													zoomIn(effectiveZoom);
												}}
												level="secondary"
												disabled={!canZoomIn}
											>
												<RiZoomInLine size={12} />
											</Button>
											<Button
												onClick={() => {
													if (
														zoomMode === "fit-height" ||
														(zoomMode === "custom" &&
															previousZoomMode === "fit-height")
													) {
														setZoomMode("fit-width");
													} else {
														setZoomMode("fit-height");
													}
												}}
												level={
													zoomMode === "custom"
														? "secondary"
														: "primary"
												}
											>
												{zoomMode === "fit-height" ||
												(zoomMode === "custom" &&
													previousZoomMode === "fit-height") ? (
													<RiFlipVertical2Line size={12} />
												) : (
													<RiFlipHorizontal2Line size={12} />
												)}
											</Button>
										</Stack>
									</div>
								),
							},
						]}
					/>
				</Suspense>
			</div>
		) : isJson ? (
			<Suspense fallback={null}>
				<LazyJsonViewer url={url} />
			</Suspense>
		) : isXml ? (
			<Suspense fallback={null}>
				<LazyXmlViewer url={url} />
			</Suspense>
		) : ExtensionContent ? (
			<ExtensionContent url={url} />
		) : (
			<DefaultViewer
				url={url}
				type={type}
				currentZoom={currentZoom}
				onZoomChange={setEffectiveZoom}
			/>
		);
	},
);
