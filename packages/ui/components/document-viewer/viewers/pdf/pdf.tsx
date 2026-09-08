/* cspell:ignore overscan OVERSCAN */
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import {
	memo,
	startTransition,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { flushSync } from "react-dom";
import { Document, Page, pdfjs } from "react-pdf";
import type { PositionCombo } from "../../../../abstract/abstract/abstract";
import { Stack } from "../../../../abstract/stack/stack";
import {
	type PdfCommit,
	type PdfPageItem,
	type PdfRotation,
	type PdfRotationDirection,
	getPdfPageDisplaySize,
	rotatePdfRotation,
	usePdf,
} from "../../logic/use-pdf";
import {
	pandaDocument,
	pandaHide,
	pandaOverlay,
	pandaPage,
	pandaViewer,
	pandaViewerPadding,
} from "./styles";
import { ThumbnailItemWrapper } from "./thumbnail-wrapper";
import { PdfThumbnails } from "./thumbnails";

const resolveDefaultReactPdfWorkerSrc = () => {
	const relative = import.meta.env.PROD
		? "pub/pdf.worker-react-pdf.mjs"
		: "pdf.worker-react-pdf.mjs";
	return `${import.meta.env.BASE_URL}${relative}`;
};

export const setReactPdfWorkerSrc = (overrideUrl?: string) => {
	const src = overrideUrl ?? resolveDefaultReactPdfWorkerSrc();
	if (pdfjs.GlobalWorkerOptions.workerSrc !== src) {
		pdfjs.GlobalWorkerOptions.workerSrc = src;
	}
};

setReactPdfWorkerSrc();

export type PdfViewerMode = "view" | "edit";

export type PdfViewerProps = {
	pdfUrl: string;
	onPageCopy?: (pagePdfUrl: string) => void;
	onPdfChange?: (blob: Blob, url: string) => void | Promise<void>;
	onDirtyChange?: (dirty: boolean) => void;
	onCommitReady?: (commit: PdfCommit) => void;
	onCommitCleanup?: () => void;
	onReplaceFiles?: (files: readonly File[]) => void | Promise<void>;
	replaceFileAccept?: string;
	showReplaceFile?: boolean;
	allowMultipleReplaceFiles?: boolean;
	addPageAccept?: string;
	showAddPage?: boolean;
	normalizeFilesToPdfBytes?: (
		files: readonly File[],
	) => Promise<Uint8Array>;
	/** Path to the pdf-lib compose worker (default kit public asset). */
	pdfSaveWorkerUrl?: string;
	/** Path to the react-pdf renderer worker (default kit public asset). */
	reactPdfWorkerUrl?: string;
	currentZoom?: number;
	zoomMode?: "fit-width" | "fit-height" | "custom";
	onZoomChange?: (effectiveZoom: number) => void;
	onPrimaryPaintReady?: () => void;
	mode?: PdfViewerMode;
	interactionDisabled?: boolean;
	overlayChildren?: {
		position: PositionCombo;
		children: React.ReactElement;
	}[];
};

type PdfDocumentProxy = Exclude<
	Parameters<typeof Page>[0]["pdf"],
	false | undefined
>;

type PdfDocumentsBySourceId = Readonly<
	Record<string, PdfDocumentProxy | undefined>
>;

type PdfSourceDescriptor = Readonly<{
	sourceId: string;
	file: string | { url: string; withCredentials: boolean };
}>;

const getPdfDocumentFile = (url: string) =>
	url.startsWith("blob:")
		? url
		: {
				url,
				withCredentials:
					import.meta.env.VITE_ENABLE_OFFLINE_SERVICES !== "true",
			};

const buildPdfSourceDescriptors = (
	pages: readonly PdfPageItem[],
): readonly PdfSourceDescriptor[] => {
	const seenSourceIds = new Set<string>();
	const out: PdfSourceDescriptor[] = [];

	for (const page of pages) {
		if (seenSourceIds.has(page.sourceId)) {
			continue;
		}

		seenSourceIds.add(page.sourceId);
		out.push({
			sourceId: page.sourceId,
			file: getPdfDocumentFile(page.sourceUrl),
		});
	}

	return out;
};

const usePdfDocumentsBySourceId = (
	pages: readonly PdfPageItem[],
): PdfDocumentsBySourceId => {
	const sourceDescriptors = useMemo(
		() => buildPdfSourceDescriptors(pages),
		[pages],
	);
	const [documentsBySourceId, setDocumentsBySourceId] = useState<
		Record<string, PdfDocumentProxy | undefined>
	>({});
	const documentsBySourceIdRef = useRef(documentsBySourceId);
	const loadingTasksRef = useRef(
		new Map<string, ReturnType<typeof pdfjs.getDocument>>(),
	);

	useEffect(() => {
		documentsBySourceIdRef.current = documentsBySourceId;
	}, [documentsBySourceId]);

	useEffect(() => {
		const activeSourceIds = new Set(
			sourceDescriptors.map((descriptor) => descriptor.sourceId),
		);

		setDocumentsBySourceId((current) => {
			let changed = false;
			const next: Record<string, PdfDocumentProxy | undefined> = {};

			for (const sourceId of activeSourceIds) {
				const existing = current[sourceId];
				if (!existing) {
					continue;
				}

				next[sourceId] = existing;
			}

			if (Object.keys(current).length !== Object.keys(next).length) {
				changed = true;
			}

			return changed ? next : current;
		});

		for (const descriptor of sourceDescriptors) {
			if (
				documentsBySourceIdRef.current[descriptor.sourceId] ||
				loadingTasksRef.current.has(descriptor.sourceId)
			) {
				continue;
			}

			const task = pdfjs.getDocument(descriptor.file);
			loadingTasksRef.current.set(descriptor.sourceId, task);

			void task.promise
				.then((pdfDocument) => {
					setDocumentsBySourceId((current) => {
						if (current[descriptor.sourceId] === pdfDocument) {
							return current;
						}

						return {
							...current,
							[descriptor.sourceId]: pdfDocument,
						};
					});
				})
				.catch(() => {
					setDocumentsBySourceId((current) => {
						if (!(descriptor.sourceId in current)) {
							return current;
						}

						const next = { ...current };
						delete next[descriptor.sourceId];
						return next;
					});
				})
				.finally(() => {
					loadingTasksRef.current.delete(descriptor.sourceId);
				});
		}
	}, [sourceDescriptors]);

	return documentsBySourceId;
};

const FLOW_DEBUG_KEY = "__ERMEWA_FLOW_DEBUG__";

type FlowDebugEvent = {
	ts: string;
	scope: string;
	event: string;
	payload?: unknown;
};

const pushPdfFlowDebug = (event: string, payload?: unknown) => {
	const entry: FlowDebugEvent = {
		ts: new Date().toISOString(),
		scope: "pdf",
		event,
		payload,
	};

	console.log(`[FLOW][pdf] ${event}`, payload ?? "");

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

const VIEWER_ITEM_GAP_PX = 24;
const VIEWER_OVERSCAN_PX = 1800;
const VIEWER_BORDER_PX = 2;
const VIEWER_MIN_PAGE_HEIGHT_PX = 240;
const VIEWER_PLACEHOLDER_BG = "rgba(0, 0, 0, 0.03)";
const INITIAL_EAGER_RENDER_PAGE_COUNT = 1;

type VisibleRange = {
	start: number;
	end: number;
};

type ScrollableMetrics = {
	width: number;
	height: number;
	scrollTop: number;
};

const getViewerPageHeight = (page: PdfPageItem, scale: number) => {
	const displaySize = getPdfPageDisplaySize(page);

	return Math.max(
		VIEWER_MIN_PAGE_HEIGHT_PX,
		Math.round(displaySize.height * scale) + VIEWER_BORDER_PX,
	);
};

const getViewerPageWidth = (page: PdfPageItem, scale: number) => {
	const displaySize = getPdfPageDisplaySize(page);
	return Math.max(
		320,
		Math.round(displaySize.width * scale) + VIEWER_BORDER_PX,
	);
};

const buildOffsets = (itemHeights: number[], gap: number) => {
	const offsets: number[] = [];
	let nextOffset = 0;

	for (const [index, height] of itemHeights.entries()) {
		offsets.push(nextOffset);
		nextOffset += height;

		if (index < itemHeights.length - 1) {
			nextOffset += gap;
		}
	}

	return offsets;
};

const findVisibleRange = (
	offsets: number[],
	itemHeights: number[],
	scrollTop: number,
	viewportHeight: number,
	overscan: number,
): VisibleRange => {
	if (!itemHeights.length) {
		return { start: 0, end: -1 };
	}

	const rangeTop = Math.max(0, scrollTop - overscan);
	const rangeBottom = scrollTop + viewportHeight + overscan;

	let start = 0;
	while (
		start < itemHeights.length &&
		offsets[start] + itemHeights[start] < rangeTop
	) {
		start += 1;
	}

	let end = start;
	while (end < itemHeights.length && offsets[end] <= rangeBottom) {
		end += 1;
	}

	return {
		start: Math.max(0, start - 1),
		end: Math.min(itemHeights.length - 1, Math.max(start, end)),
	};
};

const useScrollableElementMetrics = <T extends HTMLElement>() => {
	const [element, setElement] = useState<T | null>(null);
	const [metrics, setMetrics] = useState<ScrollableMetrics>({
		width: 0,
		height: 0,
		scrollTop: 0,
	});
	const frameRef = useRef<number | null>(null);

	const updateMetrics = useCallback(() => {
		if (!element) return;

		setMetrics((current) => {
			const next = {
				width: element.clientWidth,
				height: element.clientHeight,
				scrollTop: element.scrollTop,
			};

			if (
				current.width === next.width &&
				current.height === next.height &&
				current.scrollTop === next.scrollTop
			) {
				return current;
			}

			return next;
		});
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

		element.addEventListener("scroll", handleScroll, { passive: true });

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
		...metrics,
	};
};

const SortableThumbnail = ({
	id,
	pageId,
	index,
	children,
	onRemove,
	onCopy,
	onRotateClockwise,
	onRotateAnticlockwise,
	disabled = false,
}: {
	id: string;
	pageId: string;
	index: number;
	children: React.ReactNode;
	onRemove?: (pageId: string) => void;
	onCopy?: (pageId: string) => void;
	onRotateClockwise?: (pageId: string) => void;
	onRotateAnticlockwise?: (pageId: string) => void;
	disabled?: boolean;
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div ref={setNodeRef} style={style}>
			<ThumbnailItemWrapper
				pageId={pageId}
				index={index}
				onRemove={onRemove}
				onCopy={onCopy}
				onRotateClockwise={onRotateClockwise}
				onRotateAnticlockwise={onRotateAnticlockwise}
				disabled={disabled}
				dragHandleProps={{
					...attributes,
					...listeners,
				}}
			>
				{children}
			</ThumbnailItemWrapper>
		</div>
	);
};

const NonSortableThumbnail = ({
	pageId,
	index,
	children,
	onCopy,
	disabled = false,
}: {
	pageId: string;
	index: number;
	children: React.ReactNode;
	onCopy?: (pageId: string) => void;
	disabled?: boolean;
}) => {
	return (
		<ThumbnailItemWrapper
			pageId={pageId}
			index={index}
			onCopy={onCopy}
			disabled={disabled}
		>
			{children}
		</ThumbnailItemWrapper>
	);
};

type PdfRenderedPageProps = {
	page: PdfPageItem;
	pdf?: PdfDocumentProxy;
	scale: number;
	isVisible: boolean;
	height: number;
	width: number;
	onRenderSuccess?: () => void;
};

const PdfRenderedPage = memo(
	({
		page,
		pdf,
		scale,
		isVisible,
		height,
		width,
		onRenderSuccess,
	}: PdfRenderedPageProps) => {
		const frameStyle = {
			height,
			minHeight: height,
			display: "flex",
			justifyContent: "center",
			alignItems: "flex-start",
		};

		if (!isVisible || !pdf) {
			return (
				<div style={frameStyle} aria-hidden>
					<div
						className={pandaPage}
						style={{
							width,
							height,
							background: VIEWER_PLACEHOLDER_BG,
						}}
					/>
				</div>
			);
		}

		return (
			<div style={frameStyle}>
				<Page
					key={`${page.id}:${page.rotation}`}
					pdf={pdf}
					pageNumber={page.sourcePageIndex + 1}
					className={pandaPage}
					scale={scale}
					rotate={page.rotation}
					renderTextLayer={false}
					renderAnnotationLayer={false}
					onRenderSuccess={onRenderSuccess}
					loading={null}
					error={null}
				/>
			</div>
		);
	},
	(previousProps, nextProps) =>
		previousProps.page.id === nextProps.page.id &&
		previousProps.page.sourceId === nextProps.page.sourceId &&
		previousProps.page.sourcePageIndex ===
			nextProps.page.sourcePageIndex &&
		previousProps.page.rotation === nextProps.page.rotation &&
		previousProps.pdf === nextProps.pdf &&
		previousProps.scale === nextProps.scale &&
		previousProps.isVisible === nextProps.isVisible &&
		previousProps.height === nextProps.height &&
		previousProps.width === nextProps.width &&
		previousProps.onRenderSuccess === nextProps.onRenderSuccess,
);

const resolveDisplayPage = (
	pages: PdfPageItem[],
	pageId: string,
): PdfPageItem | null =>
	pages.find((page) => page.id === pageId) ?? null;

export const PdfViewer = ({
	pdfUrl,
	onPageCopy,
	onPdfChange,
	onDirtyChange,
	onCommitReady,
	onCommitCleanup,
	onReplaceFiles,
	replaceFileAccept,
	showReplaceFile,
	allowMultipleReplaceFiles,
	addPageAccept,
	showAddPage,
	normalizeFilesToPdfBytes,
	pdfSaveWorkerUrl,
	reactPdfWorkerUrl,
	currentZoom = 1,
	zoomMode = "fit-height",
	onZoomChange,
	onPrimaryPaintReady,
	mode = "view",
	interactionDisabled = false,
	overlayChildren,
}: PdfViewerProps) => {
	const [optimisticRemovedPageIds, setOptimisticRemovedPageIds] =
		useState<Set<string>>(new Set());
	const [optimisticRotationByPageId, setOptimisticRotationByPageId] =
		useState<Record<string, PdfRotation>>({});
	const previousPdfUrlRef = useRef(pdfUrl);

	const [primaryPageReady, setPrimaryPageReady] = useState(false);
	const [initialContentReady, setInitialContentReady] = useState(false);
	const [viewerBootstrapped, setViewerBootstrapped] = useState(false);
	const didNotifyPrimaryPaintRef = useRef(false);

	useEffect(() => {
		if (previousPdfUrlRef.current === pdfUrl) {
			return;
		}

		previousPdfUrlRef.current = pdfUrl;

		setPrimaryPageReady(false);
		setInitialContentReady(false);
		setViewerBootstrapped(false);
		didNotifyPrimaryPaintRef.current = false;

		setOptimisticRemovedPageIds(new Set());
		setOptimisticRotationByPageId({});
	}, [pdfUrl]);

	const handleUsePdfChange = useCallback(
		(change: { blob: Blob; url: string }) =>
			onPdfChange?.(change.blob, change.url),
		[onPdfChange],
	);

	const {
		pages,
		isDirty,
		removePage,
		reorderPages,
		rotatePage,
		copyPage,
		appendFiles,
		insertFilesAt,
		commit,
	} = usePdf(pdfUrl, {
		onPdfChange: handleUsePdfChange,
		normalizeFilesToPdfBytes,
		pdfSaveWorkerUrl,
	});

	useEffect(() => {
		setReactPdfWorkerSrc(reactPdfWorkerUrl);
	}, [reactPdfWorkerUrl]);

	useEffect(() => {
		onDirtyChange?.(isDirty);
	}, [isDirty, onDirtyChange]);

	useEffect(() => {
		onCommitReady?.(commit);

		return () => {
			onCommitCleanup?.();
		};
	}, [commit, onCommitReady, onCommitCleanup]);

	useEffect(() => {
		if (!optimisticRemovedPageIds.size) {
			return;
		}

		const liveIds = new Set(pages.map((page) => page.id));
		setOptimisticRemovedPageIds((current) => {
			let changed = false;
			const next = new Set<string>();

			for (const pageId of current) {
				if (liveIds.has(pageId)) {
					next.add(pageId);
				} else {
					changed = true;
				}
			}

			return changed ? next : current;
		});
	}, [optimisticRemovedPageIds.size, pages]);

	useEffect(() => {
		const optimisticIds = Object.keys(optimisticRotationByPageId);
		if (!optimisticIds.length) {
			return;
		}

		const livePagesById = new Map(pages.map((page) => [page.id, page]));
		setOptimisticRotationByPageId((current) => {
			let changed = false;
			const next: Record<string, PdfRotation> = {};

			for (const [pageId, rotation] of Object.entries(current)) {
				const livePage = livePagesById.get(pageId);
				if (!livePage || livePage.rotation === rotation) {
					changed = true;
					continue;
				}

				next[pageId] = rotation;
			}

			return changed ? next : current;
		});
	}, [optimisticRotationByPageId, pages]);

	const displayPages = useMemo(
		() =>
			pages
				.filter((page) => !optimisticRemovedPageIds.has(page.id))
				.map((page) => {
					const optimisticRotation =
						optimisticRotationByPageId[page.id];

					if (
						optimisticRotation === undefined ||
						optimisticRotation === page.rotation
					) {
						return page;
					}

					return {
						...page,
						rotation: optimisticRotation,
					};
				}),
		[optimisticRemovedPageIds, optimisticRotationByPageId, pages],
	);

	useEffect(() => {
		if (!pages.length) {
			return;
		}

		pushPdfFlowDebug("pages.ready", {
			pdfUrl,
			pageCount: pages.length,
			initialEagerRenderPageCount: INITIAL_EAGER_RENDER_PAGE_COUNT,
		});
	}, [pages.length, pdfUrl]);

	const {
		element: viewerElement,
		setElement: setViewerElement,
		width: viewerWidth,
		height: viewerHeight,
		scrollTop: viewerScrollTop,
	} = useScrollableElementMetrics<HTMLDivElement>();

	const handleViewerElementRef = useCallback(
		(node: HTMLDivElement | null) => {
			setViewerElement(node);
		},
		[setViewerElement],
	);

	const basePageSize = useMemo(() => {
		const basePage = displayPages[0] ?? pages[0] ?? null;
		return basePage ? getPdfPageDisplaySize(basePage) : null;
	}, [displayPages, pages]);

	const effectiveZoom = useMemo(() => {
		if (!basePageSize) return currentZoom;

		if (zoomMode === "fit-width" && viewerWidth) {
			return viewerWidth / basePageSize.width;
		}

		if (zoomMode === "fit-height" && viewerHeight) {
			return viewerHeight / basePageSize.height;
		}

		return currentZoom;
	}, [zoomMode, currentZoom, basePageSize, viewerWidth, viewerHeight]);

	useEffect(() => {
		onZoomChange?.(effectiveZoom);
	}, [effectiveZoom, onZoomChange]);

	const viewerPageHeights = useMemo(
		() =>
			displayPages.map((page) =>
				getViewerPageHeight(page, effectiveZoom),
			),
		[displayPages, effectiveZoom],
	);

	const viewerPageWidths = useMemo(
		() =>
			displayPages.map((page) =>
				getViewerPageWidth(page, effectiveZoom),
			),
		[displayPages, effectiveZoom],
	);

	const viewerOffsets = useMemo(
		() => buildOffsets(viewerPageHeights, VIEWER_ITEM_GAP_PX),
		[viewerPageHeights],
	);

	const viewerVisibleRange = useMemo(
		() =>
			findVisibleRange(
				viewerOffsets,
				viewerPageHeights,
				viewerScrollTop,
				viewerHeight,
				VIEWER_OVERSCAN_PX,
			),
		[viewerOffsets, viewerPageHeights, viewerScrollTop, viewerHeight],
	);

	const [isHidden, setIsHidden] = useState(true);
	const hideTimeoutRef = useRef<number | null>(null);

	const showOverlay = useCallback(() => {
		if (hideTimeoutRef.current !== null) {
			window.clearTimeout(hideTimeoutRef.current);
		}

		setIsHidden(false);
		hideTimeoutRef.current = window.setTimeout(() => {
			setIsHidden(true);
			hideTimeoutRef.current = null;
		}, 2000);
	}, []);

	useEffect(() => {
		if (!viewerElement) {
			return;
		}

		showOverlay();

		viewerElement.addEventListener("pointermove", showOverlay, {
			passive: true,
		});
		viewerElement.addEventListener("scroll", showOverlay, {
			passive: true,
		});
		viewerElement.addEventListener("pointerenter", showOverlay, {
			passive: true,
		});

		return () => {
			viewerElement.removeEventListener("pointermove", showOverlay);
			viewerElement.removeEventListener("scroll", showOverlay);
			viewerElement.removeEventListener("pointerenter", showOverlay);

			if (hideTimeoutRef.current !== null) {
				window.clearTimeout(hideTimeoutRef.current);
				hideTimeoutRef.current = null;
			}
		};
	}, [showOverlay, viewerElement]);

	const scrollToPage = useCallback(
		(pageId: string) => {
			if (!viewerElement) return;

			const pageIndex = displayPages.findIndex(
				(page) => page.id === pageId,
			);
			if (pageIndex < 0) return;

			viewerElement.scrollTo({
				top: viewerOffsets[pageIndex] ?? 0,
				behavior: "smooth",
			});
		},
		[displayPages, viewerElement, viewerOffsets],
	);

	const handleCopy = useCallback(
		async (pageId: string) => {
			const blobUrl = await copyPage(pageId);
			if (blobUrl && onPageCopy) {
				onPageCopy(blobUrl);
			}
		},
		[copyPage, onPageCopy],
	);

	const handleRemove = useCallback(
		(pageId: string) => {
			flushSync(() => {
				setOptimisticRemovedPageIds((current) => {
					if (current.has(pageId)) {
						return current;
					}

					const next = new Set(current);
					next.add(pageId);
					return next;
				});
			});

			requestAnimationFrame(() => {
				startTransition(() => {
					removePage(pageId);
				});
			});
		},
		[removePage],
	);

	const handleRotate = useCallback(
		(pageId: string, direction: PdfRotationDirection) => {
			const currentPage =
				resolveDisplayPage(displayPages, pageId) ??
				resolveDisplayPage(pages, pageId);
			if (!currentPage) {
				return;
			}

			const nextRotation = rotatePdfRotation(
				currentPage.rotation,
				direction,
			);

			flushSync(() => {
				setOptimisticRotationByPageId((current) => {
					if (current[pageId] === nextRotation) {
						return current;
					}

					return {
						...current,
						[pageId]: nextRotation,
					};
				});
			});

			requestAnimationFrame(() => {
				startTransition(() => {
					rotatePage(pageId, direction);
				});
			});
		},
		[displayPages, pages, rotatePage],
	);

	const handleRotateClockwise = useCallback(
		(pageId: string) => {
			handleRotate(pageId, "clockwise");
		},
		[handleRotate],
	);

	const handleRotateAnticlockwise = useCallback(
		(pageId: string) => {
			handleRotate(pageId, "anticlockwise");
		},
		[handleRotate],
	);

	const documentsBySourceId = usePdfDocumentsBySourceId(displayPages);
	const firstDisplayPage = displayPages[0] ?? null;
	const firstDisplayPageDocument = firstDisplayPage
		? documentsBySourceId[firstDisplayPage.sourceId]
		: undefined;
	const isViewerDataReady = Boolean(
		firstDisplayPage && firstDisplayPageDocument,
	);

	useEffect(() => {
		if (isViewerDataReady) {
			setViewerBootstrapped(true);
		}
	}, [isViewerDataReady]);

	const notifyPrimaryPaintReady = useCallback(
		(event: string, payload?: unknown) => {
			setPrimaryPageReady(true);
			setInitialContentReady(true);

			if (didNotifyPrimaryPaintRef.current) {
				return;
			}

			didNotifyPrimaryPaintRef.current = true;
			pushPdfFlowDebug(event, payload);
			onPrimaryPaintReady?.();
		},
		[onPrimaryPaintReady],
	);

	const handleBootstrapPageRenderSuccess = useCallback(() => {
		notifyPrimaryPaintReady("bootstrap.primary-page.ready", {
			pdfUrl,
		});
	}, [notifyPrimaryPaintReady, pdfUrl]);

	const handleInitialPageRenderSuccess = useCallback(
		(pageId: string, visualIndex: number) => {
			if (visualIndex !== 0) {
				return;
			}

			notifyPrimaryPaintReady("viewer.primary-page.ready", {
				pdfUrl,
				pageId,
				visualIndex,
				pageCount: displayPages.length,
			});
		},
		[displayPages.length, notifyPrimaryPaintReady, pdfUrl],
	);

	const shouldUseBootstrapViewer =
		!viewerBootstrapped && !isViewerDataReady;
	const bootstrapWidth = viewerWidth
		? Math.max(320, viewerWidth - 32)
		: undefined;
	const shouldEagerRenderInitialPages =
		!initialContentReady && INITIAL_EAGER_RENDER_PAGE_COUNT > 0;

	const renderOverlayChildren = () =>
		overlayChildren?.map((overlayChild) => (
			<Stack
				key={overlayChild.position.join("-")}
				position={{
					position: overlayChild.position,
					type: "relativeToParent",
				}}
				grow
				className={classNames(
					pandaViewerPadding,
					pandaOverlay,
					isHidden && pandaHide,
				)}
			>
				{overlayChild.children}
			</Stack>
		));

	if (shouldUseBootstrapViewer) {
		return (
			<Stack direction="row" grow>
				<div style={{ width: 180, minWidth: 180, flexShrink: 0 }} />

				<Stack grow>
					<Stack
						ref={handleViewerElementRef}
						className={classNames(pandaViewer)}
						grow
						scrollable
						direction="column"
						alignItems="center"
						justifyContent="center"
					>
						<Document
							file={getPdfDocumentFile(pdfUrl)}
							className={pandaDocument}
							loading={null}
							error={null}
							noData={null}
						>
							<Page
								pageNumber={1}
								className={pandaPage}
								width={bootstrapWidth}
								renderTextLayer={false}
								renderAnnotationLayer={false}
								onRenderSuccess={handleBootstrapPageRenderSuccess}
								loading={null}
								error={null}
							/>
						</Document>
					</Stack>

					{renderOverlayChildren()}
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack direction="row" grow>
			{primaryPageReady ? (
				mode === "edit" ? (
					<DndContext
						collisionDetection={closestCenter}
						onDragEnd={({ active, over }) => {
							if (over && active.id !== over.id) {
								reorderPages(String(active.id), String(over.id));
							}
						}}
					>
						<SortableContext
							items={displayPages.map((page) => page.id)}
							strategy={verticalListSortingStrategy}
						>
							<PdfThumbnails
								pages={displayPages}
								pdfDocumentsBySourceId={documentsBySourceId}
								onPageClick={scrollToPage}
								onPageRotateClockwise={handleRotateClockwise}
								onPageRotateAnticlockwise={handleRotateAnticlockwise}
								onReplaceFiles={
									showReplaceFile ? onReplaceFiles : undefined
								}
								replaceFileAccept={replaceFileAccept}
								allowMultipleReplaceFiles={allowMultipleReplaceFiles}
								onAppendFiles={appendFiles}
								addPageAccept={addPageAccept}
								canAddPages={showAddPage}
								onInsertFilesAt={insertFilesAt}
								interactionDisabled={interactionDisabled}
								renderItem={(page, visualIndex, node) => (
									<SortableThumbnail
										id={page.id}
										pageId={page.id}
										key={page.id}
										index={visualIndex}
										onRemove={handleRemove}
										onCopy={onPageCopy ? handleCopy : undefined}
										onRotateClockwise={handleRotateClockwise}
										onRotateAnticlockwise={handleRotateAnticlockwise}
										disabled={interactionDisabled}
									>
										{node}
									</SortableThumbnail>
								)}
							/>
						</SortableContext>
					</DndContext>
				) : (
					<PdfThumbnails
						pages={displayPages}
						pdfDocumentsBySourceId={documentsBySourceId}
						onPageClick={scrollToPage}
						onReplaceFiles={
							showReplaceFile ? onReplaceFiles : undefined
						}
						replaceFileAccept={replaceFileAccept}
						allowMultipleReplaceFiles={allowMultipleReplaceFiles}
						addPageAccept={addPageAccept}
						canAddPages={showAddPage}
						interactionDisabled={interactionDisabled}
						renderItem={(page, visualIndex, node) => (
							<NonSortableThumbnail
								key={page.id}
								pageId={page.id}
								index={visualIndex}
								onCopy={onPageCopy ? handleCopy : undefined}
								disabled={interactionDisabled}
							>
								{node}
							</NonSortableThumbnail>
						)}
					/>
				)
			) : (
				<div style={{ width: 180, minWidth: 180, flexShrink: 0 }} />
			)}

			<Stack grow>
				<Stack
					ref={handleViewerElementRef}
					className={classNames(pandaViewer)}
					grow
					scrollable
					direction="column"
					alignItems="center"
					justifyContent="center"
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: `${VIEWER_ITEM_GAP_PX}px`,
							width: "100%",
						}}
					>
						{displayPages.map((page, visualIndex) => {
							const pageHeight = viewerPageHeights[visualIndex];
							const pageWidth = viewerPageWidths[visualIndex];
							const pdfDocument = documentsBySourceId[page.sourceId];
							const isVisible = shouldEagerRenderInitialPages
								? visualIndex < INITIAL_EAGER_RENDER_PAGE_COUNT
								: primaryPageReady
									? visualIndex >= viewerVisibleRange.start &&
										visualIndex <= viewerVisibleRange.end
									: visualIndex === 0;

							return (
								<div
									key={page.id}
									style={{
										width: pageWidth,
										height: pageHeight,
										minHeight: pageHeight,
									}}
								>
									<PdfRenderedPage
										page={page}
										pdf={pdfDocument}
										scale={effectiveZoom}
										isVisible={isVisible}
										height={pageHeight}
										width={pageWidth}
										onRenderSuccess={
											shouldEagerRenderInitialPages &&
											visualIndex < INITIAL_EAGER_RENDER_PAGE_COUNT
												? () =>
														handleInitialPageRenderSuccess(
															page.id,
															visualIndex,
														)
												: undefined
										}
									/>
								</div>
							);
						})}
					</div>
				</Stack>

				{renderOverlayChildren()}
			</Stack>
		</Stack>
	);
};
