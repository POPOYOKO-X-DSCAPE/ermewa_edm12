/* cspell:ignore overscan OVERSCAN */
import { RiAddLine } from "@remixicon/react";
import classNames from "classnames";
import {
	type DragEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Page } from "react-pdf";
import { Resizable } from "../../../../abstract";
import { DefaultAnchor } from "../../../../abstract/resizable/default-anchor";
import { Scrollable } from "../../../../abstract/scrollable/scrollable";
import { Stack } from "../../../../abstract/stack/stack";
import { Button } from "../../../button/button";
import {
	type PdfPageItem,
	getPdfPageDisplaySize,
} from "../../logic/use-pdf";
import { usePdfViewerStrings } from "./pdf-strings";
import {
	pandaContainer,
	pandaThumbnail,
	pandaThumbnailContainer,
	pandaThumbnails,
	pandaThumbnailsButtons,
	stylePageNumber,
} from "./styles";
import { ThumbnailItemWrapper } from "./thumbnail-wrapper";

export type PdfThumbnailsProps = {
	pages: PdfPageItem[];
	pdfDocumentsBySourceId: Readonly<
		Record<
			string,
			| Exclude<Parameters<typeof Page>[0]["pdf"], false | undefined>
			| undefined
		>
	>;
	onPageClick: (pageId: string) => void;
	onPageCopy?: (pageId: string) => void;
	onPageRotateClockwise?: (pageId: string) => void;
	onPageRotateAnticlockwise?: (pageId: string) => void;
	onReplaceFiles?: (files: readonly File[]) => void | Promise<void>;
	replaceFileAccept?: string;
	allowMultipleReplaceFiles?: boolean;
	onAppendFiles?: (files: readonly File[]) => void | Promise<void>;
	addPageAccept?: string;
	canAddPages?: boolean;
	onInsertFilesAt?: (
		files: readonly File[],
		index: number,
	) => void | Promise<void>;
	interactionDisabled?: boolean;
	renderItem?: (
		page: PdfPageItem,
		visualIndex: number,
		node: React.ReactNode,
	) => React.ReactNode;
};

const THUMBNAIL_WIDTH_PX = 80;
const THUMBNAIL_ITEM_GAP_PX = 12;
const THUMBNAIL_OVERSCAN_PX = 420;
const THUMBNAIL_BORDER_PX = 2;
const THUMBNAIL_MIN_HEIGHT_PX = 96;
const THUMBNAIL_PLACEHOLDER_BG = "rgba(0, 0, 0, 0.04)";

const matchesAcceptToken = (file: File, token: string): boolean => {
	const normalizedToken = token.trim().toLowerCase();
	if (!normalizedToken) {
		return false;
	}

	const fileName = file.name.toLowerCase();
	const fileType = file.type.toLowerCase();

	if (normalizedToken.startsWith(".")) {
		return fileName.endsWith(normalizedToken);
	}

	if (normalizedToken.endsWith("/*")) {
		return fileType.startsWith(normalizedToken.slice(0, -1));
	}

	return fileType === normalizedToken;
};

const fileMatchesAccept = (
	file: File,
	accept: string | undefined,
): boolean => {
	if (!accept?.trim()) {
		return true;
	}

	return accept
		.split(",")
		.some((token) => matchesAcceptToken(file, token));
};

const getAcceptedFiles = (
	files: FileList | null,
	accept: string | undefined,
): readonly File[] => {
	if (!files?.length || !accept?.trim()) {
		return [];
	}

	return Array.from(files).filter((entry) =>
		fileMatchesAccept(entry, accept),
	);
};

const getThumbnailHeight = (page: PdfPageItem) => {
	const displaySize = getPdfPageDisplaySize(page);
	const safeWidth = Math.max(displaySize.width, 1);
	const scaledHeight =
		(displaySize.height / safeWidth) * THUMBNAIL_WIDTH_PX +
		THUMBNAIL_BORDER_PX;

	return Math.max(THUMBNAIL_MIN_HEIGHT_PX, Math.round(scaledHeight));
};

type VisibleRange = {
	start: number;
	end: number;
};

const computeVisibleRange = (
	itemHeights: number[],
	scrollTop: number,
	viewportHeight: number,
	overscan: number,
	leadingOffset: number,
): VisibleRange => {
	if (!itemHeights.length) {
		return { start: 0, end: -1 };
	}

	const rangeTop = Math.max(0, scrollTop - leadingOffset - overscan);
	const rangeBottom =
		Math.max(0, scrollTop - leadingOffset) + viewportHeight + overscan;

	let currentOffset = 0;
	let start = 0;

	while (
		start < itemHeights.length &&
		currentOffset + itemHeights[start] < rangeTop
	) {
		currentOffset += itemHeights[start] + THUMBNAIL_ITEM_GAP_PX;
		start += 1;
	}

	let end = start;
	let visibleOffset = currentOffset;

	while (end < itemHeights.length && visibleOffset <= rangeBottom) {
		visibleOffset += itemHeights[end] + THUMBNAIL_ITEM_GAP_PX;
		end += 1;
	}

	return {
		start: Math.max(0, start - 1),
		end: Math.min(itemHeights.length - 1, Math.max(start, end)),
	};
};

const useScrollViewportMetrics = <T extends HTMLElement>() => {
	const [element, setElement] = useState<T | null>(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);
	const frameRef = useRef<number | null>(null);

	const updateMetrics = useCallback(() => {
		if (!element) return;

		setScrollTop((current) =>
			current === element.scrollTop ? current : element.scrollTop,
		);
		setViewportHeight((current) =>
			current === element.clientHeight ? current : element.clientHeight,
		);
	}, [element]);

	useEffect(() => {
		if (!element) return;

		updateMetrics();

		const handleScroll = () => {
			if (frameRef.current !== null) {
				return;
			}

			frameRef.current = requestAnimationFrame(() => {
				frameRef.current = null;
				updateMetrics();
			});
		};

		element.addEventListener("scroll", handleScroll, {
			passive: true,
		});

		const resizeObserver =
			typeof ResizeObserver !== "undefined"
				? new ResizeObserver(() => updateMetrics())
				: null;

		resizeObserver?.observe(element);

		return () => {
			element.removeEventListener("scroll", handleScroll);
			resizeObserver?.disconnect();

			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
				frameRef.current = null;
			}
		};
	}, [element, updateMetrics]);

	return {
		element,
		setElement,
		scrollTop,
		viewportHeight,
	};
};

type ThumbnailPreviewCanvasProps = {
	page: PdfPageItem;
	pdf?: Exclude<Parameters<typeof Page>[0]["pdf"], false | undefined>;
	isVisible: boolean;
	height: number;
};

const ThumbnailPreviewCanvas = memo(
	({ page, pdf, isVisible, height }: ThumbnailPreviewCanvasProps) => {
		const previewStyle = {
			width: THUMBNAIL_WIDTH_PX,
			height,
			minHeight: height,
			display: "flex",
			alignItems: "stretch",
			justifyContent: "center",
		};

		if (!isVisible || !pdf) {
			return (
				<div style={previewStyle} aria-hidden>
					<div
						className={classNames(
							pandaThumbnail,
							pandaThumbnailContainer,
						)}
						style={{
							width: THUMBNAIL_WIDTH_PX,
							height,
							background: THUMBNAIL_PLACEHOLDER_BG,
						}}
					/>
				</div>
			);
		}

		return (
			<div style={previewStyle}>
				<Page
					key={`${page.id}:${page.rotation}`}
					pdf={pdf}
					pageNumber={page.sourcePageIndex + 1}
					className={classNames(
						pandaThumbnail,
						pandaThumbnailContainer,
					)}
					width={THUMBNAIL_WIDTH_PX}
					rotate={page.rotation}
					renderTextLayer={false}
					renderAnnotationLayer={false}
					loading={null}
					error={null}
				/>
			</div>
		);
	},
	(previousProps, nextProps) =>
		previousProps.page.id === nextProps.page.id &&
		previousProps.page.sourceId === nextProps.page.sourceId &&
		previousProps.page.sourceUrl === nextProps.page.sourceUrl &&
		previousProps.page.sourcePageIndex ===
			nextProps.page.sourcePageIndex &&
		previousProps.page.rotation === nextProps.page.rotation &&
		previousProps.pdf === nextProps.pdf &&
		previousProps.isVisible === nextProps.isVisible &&
		previousProps.height === nextProps.height,
);

export const PdfThumbnails = ({
	pages,
	pdfDocumentsBySourceId,
	onPageClick,
	onPageCopy,
	onPageRotateClockwise,
	onPageRotateAnticlockwise,
	onReplaceFiles,
	replaceFileAccept,
	allowMultipleReplaceFiles = false,
	onAppendFiles,
	addPageAccept,
	canAddPages = true,
	onInsertFilesAt,
	interactionDisabled = false,
	renderItem,
}: PdfThumbnailsProps) => {
	const strings = usePdfViewerStrings();
	const addPageInputRef = useRef<HTMLInputElement | null>(null);
	const replaceInputRef = useRef<HTMLInputElement | null>(null);
	const pagesListRef = useRef<HTMLDivElement | null>(null);
	const [pagesListOffsetTop, setPagesListOffsetTop] = useState(0);
	const {
		element: containerElement,
		setElement: setContainerElement,
		scrollTop,
		viewportHeight,
	} = useScrollViewportMetrics<HTMLDivElement>();

	const handleContainerElementRef = useCallback(
		(node: HTMLDivElement | null) => {
			setContainerElement(node);
		},
		[setContainerElement],
	);

	const pageHeights = useMemo(
		() => pages.map((page) => getThumbnailHeight(page)),
		[pages],
	);

	const updatePageListOffset = useCallback(() => {
		setPagesListOffsetTop(pagesListRef.current?.offsetTop ?? 0);
	}, []);

	useEffect(() => {
		updatePageListOffset();

		const resizeObserver =
			typeof ResizeObserver !== "undefined"
				? new ResizeObserver(() => updatePageListOffset())
				: null;

		if (containerElement) {
			resizeObserver?.observe(containerElement);
		}

		if (pagesListRef.current) {
			resizeObserver?.observe(pagesListRef.current);
		}

		window.addEventListener("resize", updatePageListOffset);

		return () => {
			resizeObserver?.disconnect();
			window.removeEventListener("resize", updatePageListOffset);
		};
	}, [containerElement, updatePageListOffset]);

	const visibleRange = useMemo(
		() =>
			computeVisibleRange(
				pageHeights,
				scrollTop,
				viewportHeight,
				THUMBNAIL_OVERSCAN_PX,
				pagesListOffsetTop,
			),
		[pageHeights, scrollTop, viewportHeight, pagesListOffsetTop],
	);

	const resizableInitialSize = () => {
		if (
			(onReplaceFiles && replaceFileAccept) ||
			(onAppendFiles && canAddPages && addPageAccept)
		) {
			return 180;
		}
		return 120;
	};

	const resizableMinSize = () => {
		if (
			(onReplaceFiles && replaceFileAccept) ||
			(onAppendFiles && canAddPages && addPageAccept)
		) {
			return 180;
		}
		return 120;
	};

	return (
		<Resizable.Provider
			axis="x"
			minSize={resizableMinSize()}
			maxSize={240}
			initialSize={resizableInitialSize()}
		>
			<Resizable.Content>
				<Stack
					direction="column"
					grow
					className={pandaThumbnailsButtons}
				>
					{onReplaceFiles && replaceFileAccept ? (
						<Button
							level="secondary"
							onClick={() => replaceInputRef.current?.click()}
							disabled={interactionDisabled}
						>
							{strings.replaceFile}
						</Button>
					) : null}
					{onAppendFiles && canAddPages && addPageAccept ? (
						<Button
							level="secondary"
							onClick={() => addPageInputRef.current?.click()}
							disabled={interactionDisabled}
						>
							{strings.addPage}
							<RiAddLine />
						</Button>
					) : null}
					<input
						ref={addPageInputRef}
						type="file"
						accept={addPageAccept || undefined}
						multiple
						style={{ display: "none" }}
						onChange={async (event) => {
							const input = event.currentTarget;
							const files = Array.from(input.files ?? []).filter(
								(file) => fileMatchesAccept(file, addPageAccept),
							);

							try {
								if (!files.length || !onAppendFiles || !canAddPages)
									return;

								await onAppendFiles(files);
							} finally {
								input.value = "";
							}
						}}
					/>
					<input
						ref={replaceInputRef}
						type="file"
						accept={replaceFileAccept || undefined}
						multiple={allowMultipleReplaceFiles}
						style={{ display: "none" }}
						onChange={async (event) => {
							const input = event.currentTarget;
							const files = Array.from(input.files ?? []).filter(
								(file) => fileMatchesAccept(file, replaceFileAccept),
							);

							try {
								if (!files.length || !onReplaceFiles) return;

								await onReplaceFiles(files);
							} finally {
								input.value = "";
							}
						}}
					/>
					<Scrollable.Provider axis="y">
						<Scrollable.Content>
							<Stack
								className={classNames(pandaThumbnails)}
								alignItems="stretch"
							>
								{pages.map((page, visualIndex) => {
									const thumbnailHeight = pageHeights[visualIndex];
									const isVisible =
										visualIndex >= visibleRange.start &&
										visualIndex <= visibleRange.end;
									const pdfDocument =
										pdfDocumentsBySourceId[page.sourceId];

									const baseNode = (
										<div
											style={{
												position: "relative",
												width: THUMBNAIL_WIDTH_PX,
												minHeight: thumbnailHeight,
											}}
											onClick={() => onPageClick(page.id)}
											onKeyDown={(event) => {
												if (
													event.key === "Enter" ||
													event.key === " "
												) {
													event.preventDefault();
													onPageClick(page.id);
												}
											}}
											onDragOver={(
												event: DragEvent<HTMLDivElement>,
											) => {
												event.preventDefault();
											}}
											onDrop={async (
												event: DragEvent<HTMLDivElement>,
											) => {
												event.preventDefault();

												const files = getAcceptedFiles(
													event.dataTransfer.files,
													addPageAccept,
												);
												if (
													!files.length ||
													!onInsertFilesAt ||
													!canAddPages
												)
													return;

												const rect =
													event.currentTarget.getBoundingClientRect();
												const insertAfter =
													event.clientY > rect.top + rect.height / 2;

												await onInsertFilesAt(
													files,
													insertAfter ? visualIndex + 1 : visualIndex,
												);
											}}
										>
											<ThumbnailPreviewCanvas
												page={page}
												pdf={pdfDocument}
												isVisible={isVisible}
												height={thumbnailHeight}
											/>
											<span className={stylePageNumber}>
												{visualIndex + 1}/{pages.length}
											</span>
										</div>
									);

									if (renderItem) {
										return renderItem(page, visualIndex, baseNode);
									}

									return (
										<ThumbnailItemWrapper
											key={page.id}
											pageId={page.id}
											index={visualIndex}
											onCopy={onPageCopy}
											onRotateClockwise={onPageRotateClockwise}
											onRotateAnticlockwise={onPageRotateAnticlockwise}
											disabled={interactionDisabled}
										>
											{baseNode}
										</ThumbnailItemWrapper>
									);
								})}
							</Stack>
						</Scrollable.Content>
					</Scrollable.Provider>
				</Stack>
			</Resizable.Content>
			<Resizable.Anchor>
				<DefaultAnchor />
			</Resizable.Anchor>
		</Resizable.Provider>
	);
};
