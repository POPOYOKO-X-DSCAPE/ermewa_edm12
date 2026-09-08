import { PDFDocument, degrees } from "pdf-lib";
import { useCallback, useEffect, useRef, useState } from "react";

export type PdfChange = {
	blob: Blob;
	url: string;
};

export type PdfPageSize = {
	width: number;
	height: number;
};

export type PdfRotation = 0 | 90 | 180 | 270;
export type PdfRotationDirection = "clockwise" | "anticlockwise";

export type PdfPageItem = {
	id: string;
	sourceId: string;
	sourceUrl: string;
	sourcePageIndex: number;
	size: PdfPageSize;
	rotation: PdfRotation;
};

export type PdfPreparedFileData = {
	binary: string;
	extension: "pdf";
	encoding: "base64";
	language: "";
};

export type PdfCommitResult = {
	revision: number;
	fileData: PdfPreparedFileData;
	finalize: () => Promise<boolean>;
};

export type PdfCommit = () => Promise<PdfCommitResult | undefined>;

export type PdfFilesToBytesNormalizer = (
	files: readonly File[],
) => Promise<Uint8Array>;

type PdfSourcePageMeta = {
	size: PdfPageSize;
	rotation: PdfRotation;
};

type PdfSource = {
	id: string;
	url: string;
	bytes: Uint8Array;
	document: PDFDocument;
	pageCount: number;
	pageMetadata: PdfSourcePageMeta[];
	ownedUrl: boolean;
};

type PreparedSnapshot = {
	revision: number;
	bytes: Uint8Array;
	base64: string;
	blob: Blob;
	url: string;
};

type ComposeWorkerRequest = {
	taskId: number;
	sources: {
		id: string;
		bytes: ArrayBuffer;
	}[];
	pages: {
		sourceId: string;
		sourcePageIndex: number;
		rotation: PdfRotation;
	}[];
};

type ComposeWorkerSuccess = {
	type: "success";
	taskId: number;
	bytes: ArrayBuffer;
	base64: string;
};

type ComposeWorkerFailure = {
	type: "error";
	taskId: number;
	error: string;
};

export const normalizePdfRotation = (rotation: number): PdfRotation => {
	const normalized =
		(((Math.round(rotation / 90) * 90) % 360) + 360) % 360;

	switch (normalized) {
		case 90:
			return 90;
		case 180:
			return 180;
		case 270:
			return 270;
		default:
			return 0;
	}
};

export const rotatePdfRotation = (
	rotation: PdfRotation,
	direction: PdfRotationDirection,
): PdfRotation =>
	normalizePdfRotation(
		rotation + (direction === "clockwise" ? 90 : -90),
	);

export const getPdfPageDisplaySize = (
	page: Pick<PdfPageItem, "size" | "rotation">,
): PdfPageSize => {
	if (page.rotation === 90 || page.rotation === 270) {
		return {
			width: page.size.height,
			height: page.size.width,
		};
	}

	return page.size;
};

const bytesToBlob = (bytes: Uint8Array) => {
	const arrayBuffer = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(arrayBuffer).set(bytes);

	return new Blob([arrayBuffer], {
		type: "application/pdf",
	});
};

const loadFileBytes = async (file: File): Promise<Uint8Array> => {
	const buffer = await file.arrayBuffer();
	return new Uint8Array(buffer);
};

const getPdfFetchCredentials = (): RequestCredentials =>
	import.meta.env.VITE_ENABLE_OFFLINE_SERVICES === "true"
		? "omit"
		: "include";

const fetchPdfBytes = async (pdfUrl: string): Promise<Uint8Array> => {
	const response = await fetch(pdfUrl, {
		credentials: pdfUrl.startsWith("blob:")
			? "same-origin"
			: getPdfFetchCredentials(),
	});

	if (!response.ok) {
		throw new Error(`pdf fetch failed (${response.status})`);
	}

	const arrayBuffer = await response.arrayBuffer();
	return new Uint8Array(arrayBuffer);
};

const defaultNormalizeFilesToPdfBytes = async (
	files: readonly File[],
): Promise<Uint8Array> => {
	if (files.length !== 1) {
		throw new Error("Multiple files require a PDF normalizer.");
	}

	const [file] = files;
	if (!(file instanceof File)) {
		throw new Error("No file selected.");
	}

	const lowerName = file.name.toLowerCase();
	const isPdfFile =
		file.type === "application/pdf" || lowerName.endsWith(".pdf");

	if (!isPdfFile) {
		throw new Error(
			"Image-to-PDF conversion is not configured for this viewer.",
		);
	}

	return await loadFileBytes(file);
};

const buildPageItems = (source: PdfSource): PdfPageItem[] =>
	source.pageMetadata.map((pageMeta, index) => ({
		id: `${source.id}:page:${index}`,
		sourceId: source.id,
		sourceUrl: source.url,
		sourcePageIndex: index,
		size: pageMeta.size,
		rotation: pageMeta.rotation,
	}));

const moveItem = <T>(items: T[], from: number, to: number): T[] => {
	const next = [...items];
	const [moved] = next.splice(from, 1);

	if (!moved) {
		return items;
	}

	next.splice(to, 0, moved);
	return next;
};

const revokeOwnedSourceUrls = (sources: Record<string, PdfSource>) => {
	for (const source of Object.values(sources)) {
		if (source.ownedUrl) {
			URL.revokeObjectURL(source.url);
		}
	}
};

const revokeObjectUrl = (url: string | null | undefined) => {
	if (url?.startsWith("blob:")) {
		URL.revokeObjectURL(url);
	}
};

const compactSources = (input: {
	sources: Record<string, PdfSource>;
	pages: readonly PdfPageItem[];
}) => {
	const activeSourceIds = new Set(
		input.pages.map((page) => page.sourceId),
	);

	for (const [sourceId, source] of Object.entries(input.sources)) {
		if (activeSourceIds.has(sourceId)) {
			continue;
		}

		if (source.ownedUrl) {
			revokeObjectUrl(source.url);
		}

		delete input.sources[sourceId];
	}
};

const getPageMetadata = (document: PDFDocument): PdfSourcePageMeta[] =>
	document.getPages().map((page) => ({
		size: page.getSize(),
		rotation: normalizePdfRotation(page.getRotation().angle),
	}));

const findPageById = (pages: PdfPageItem[], pageId: string) =>
	pages.find((page) => page.id === pageId) ?? null;

const resolvePage = (
	pages: PdfPageItem[],
	page: string | number,
): PdfPageItem | null => {
	if (typeof page === "number") {
		return pages[page] ?? null;
	}

	return findPageById(pages, page);
};

const resolvePageIndex = (
	pages: PdfPageItem[],
	page: string | number,
): number => {
	if (typeof page === "number") {
		return page >= 0 && page < pages.length ? page : -1;
	}

	return pages.findIndex((entry) => entry.id === page);
};

const PREPARE_AFTER_INTERACTION_DELAY_MS = 0;

const startAfterNextPaint = (cb: () => void) => {
	if (typeof window.requestAnimationFrame !== "function") {
		const timeoutId = window.setTimeout(cb, 0);
		return () => {
			window.clearTimeout(timeoutId);
		};
	}

	let firstFrameId = 0;
	let secondFrameId = 0;

	firstFrameId = window.requestAnimationFrame(() => {
		secondFrameId = window.requestAnimationFrame(cb);
	});

	return () => {
		if (firstFrameId) {
			window.cancelAnimationFrame(firstFrameId);
		}

		if (secondFrameId) {
			window.cancelAnimationFrame(secondFrameId);
		}
	};
};

export const usePdf = (
	pdfUrl: string,
	options?: {
		onPdfChange?: (change: PdfChange) => void | Promise<void>;
		normalizeFilesToPdfBytes?: PdfFilesToBytesNormalizer;
		/**
		 * Absolute path to the pdf-lib compose worker asset. Defaults to the
		 * kit's public asset path; a consumer that ships the asset elsewhere
		 * (or under a sub-path) can point here at its own copy.
		 */
		pdfSaveWorkerUrl?: string;
	},
) => {
	const [pages, setPages] = useState<PdfPageItem[]>([]);
	const [isDirty, setIsDirty] = useState(false);

	const pagesRef = useRef<PdfPageItem[]>([]);
	const isDirtyRef = useRef(false);
	const sourceCounterRef = useRef(0);
	const pageCounterRef = useRef(0);
	const sourcesRef = useRef<Record<string, PdfSource>>({});
	const originalBytesRef = useRef<Uint8Array | null>(null);
	const originalBytesUrlRef = useRef<string | null>(null);
	const onPdfChangeRef = useRef(options?.onPdfChange ?? null);
	const pdfSaveWorkerUrlRef = useRef<string>(
		options?.pdfSaveWorkerUrl ?? "/pub/pdf-save.worker.js",
	);
	const normalizeFilesToPdfBytesRef =
		useRef<PdfFilesToBytesNormalizer | null>(
			options?.normalizeFilesToPdfBytes ?? null,
		);
	const revisionRef = useRef(0);
	const preparedSnapshotRef = useRef<PreparedSnapshot | null>(null);
	const committedUrlRef = useRef<string | null>(null);
	const prepareTaskIdRef = useRef(0);
	const activePrepareRevisionRef = useRef<number | null>(null);
	const preparePromiseRef =
		useRef<Promise<PreparedSnapshot | null> | null>(null);
	const prepareFrameRef = useRef<number | null>(null);
	const prepareTimeoutRef = useRef<number | null>(null);
	const prepareWorkerRef = useRef<Worker | null>(null);

	useEffect(() => {
		onPdfChangeRef.current = options?.onPdfChange ?? null;
	}, [options?.onPdfChange]);

	useEffect(() => {
		normalizeFilesToPdfBytesRef.current =
			options?.normalizeFilesToPdfBytes ?? null;
	}, [options?.normalizeFilesToPdfBytes]);

	useEffect(() => {
		pagesRef.current = pages;
	}, [pages]);

	const setDirty = useCallback((next: boolean) => {
		isDirtyRef.current = next;
		setIsDirty(next);
	}, []);

	const revokePreparedSnapshot = useCallback(() => {
		const currentPreparedSnapshot = preparedSnapshotRef.current;
		if (
			currentPreparedSnapshot &&
			currentPreparedSnapshot.url !== committedUrlRef.current
		) {
			revokeObjectUrl(currentPreparedSnapshot.url);
		}

		preparedSnapshotRef.current = null;
	}, []);

	const cancelScheduledPrepare = useCallback(() => {
		if (prepareFrameRef.current !== null) {
			window.cancelAnimationFrame(prepareFrameRef.current);
			prepareFrameRef.current = null;
		}

		if (prepareTimeoutRef.current !== null) {
			window.clearTimeout(prepareTimeoutRef.current);
			prepareTimeoutRef.current = null;
		}
	}, []);

	const cancelActivePrepare = useCallback(() => {
		prepareTaskIdRef.current += 1;
		activePrepareRevisionRef.current = null;
		preparePromiseRef.current = null;

		if (prepareWorkerRef.current) {
			prepareWorkerRef.current.terminate();
			prepareWorkerRef.current = null;
		}
	}, []);

	const resetPreparedState = useCallback(
		(options?: { revokeCommitted?: boolean }) => {
			cancelScheduledPrepare();
			cancelActivePrepare();
			revokePreparedSnapshot();

			if (options?.revokeCommitted) {
				revokeObjectUrl(committedUrlRef.current);
				committedUrlRef.current = null;
			}
		},
		[
			cancelActivePrepare,
			cancelScheduledPrepare,
			revokePreparedSnapshot,
		],
	);

	const createSourceId = useCallback(() => {
		sourceCounterRef.current += 1;
		return `pdf-source-${sourceCounterRef.current}`;
	}, []);

	const createPageId = useCallback(() => {
		pageCounterRef.current += 1;
		return `pdf-page-${pageCounterRef.current}`;
	}, []);

	const loadOriginalBytes =
		useCallback(async (): Promise<Uint8Array> => {
			if (
				!originalBytesRef.current ||
				originalBytesUrlRef.current !== pdfUrl
			) {
				originalBytesRef.current = await fetchPdfBytes(pdfUrl);
				originalBytesUrlRef.current = pdfUrl;
			}

			return originalBytesRef.current;
		}, [pdfUrl]);

	const registerSource = useCallback(
		async ({
			bytes,
			url,
			ownedUrl,
		}: {
			bytes: Uint8Array;
			url: string;
			ownedUrl: boolean;
		}): Promise<PdfSource> => {
			const document = await PDFDocument.load(bytes);
			const pageMetadata = getPageMetadata(document);
			const source: PdfSource = {
				id: createSourceId(),
				url,
				bytes,
				document,
				pageCount: pageMetadata.length,
				pageMetadata,
				ownedUrl,
			};

			sourcesRef.current[source.id] = source;
			return source;
		},
		[createSourceId],
	);

	const prepareSnapshot = useCallback(
		async (revision: number): Promise<PreparedSnapshot | null> => {
			if (!isDirtyRef.current || revision !== revisionRef.current) {
				return null;
			}

			const preparedSnapshot = preparedSnapshotRef.current;
			if (preparedSnapshot?.revision === revision) {
				return preparedSnapshot;
			}

			if (
				preparePromiseRef.current &&
				activePrepareRevisionRef.current === revision
			) {
				return preparePromiseRef.current;
			}

			cancelActivePrepare();

			const taskId = prepareTaskIdRef.current + 1;
			prepareTaskIdRef.current = taskId;
			activePrepareRevisionRef.current = revision;

			const worker = new Worker(pdfSaveWorkerUrlRef.current);
			prepareWorkerRef.current = worker;

			compactSources({
				sources: sourcesRef.current,
				pages: pagesRef.current,
			});

			const pagesSnapshot = pagesRef.current.map(
				({ sourceId, sourcePageIndex, rotation }) => ({
					sourceId,
					sourcePageIndex,
					rotation,
				}),
			);
			const activeSourceIds = new Set(
				pagesSnapshot.map((page) => page.sourceId),
			);
			const sourcesSnapshot = Object.values(sourcesRef.current)
				.filter((source) => activeSourceIds.has(source.id))
				.map(({ id, bytes }) => ({
					id,
					bytes: bytes.slice().buffer,
				}));

			const promise = new Promise<PreparedSnapshot | null>(
				(resolve, reject) => {
					worker.onmessage = (
						event: MessageEvent<
							ComposeWorkerSuccess | ComposeWorkerFailure
						>,
					) => {
						const message = event.data;

						if (message.taskId !== taskId) {
							return;
						}

						if (message.type === "error") {
							reject(new Error(message.error));
							return;
						}

						const bytes = new Uint8Array(message.bytes);
						const blob = bytesToBlob(bytes);
						const url = URL.createObjectURL(blob);
						const nextSnapshot: PreparedSnapshot = {
							revision,
							bytes,
							base64: message.base64,
							blob,
							url,
						};

						const isStaleTask =
							prepareTaskIdRef.current !== taskId ||
							revision !== revisionRef.current;

						if (isStaleTask) {
							revokeObjectUrl(url);
							resolve(null);
							return;
						}

						revokePreparedSnapshot();
						preparedSnapshotRef.current = nextSnapshot;
						resolve(nextSnapshot);
					};

					worker.onerror = (event) => {
						reject(
							event.error ??
								new Error(
									event.message || "pdf snapshot prepare failed",
								),
						);
					};

					const payload: ComposeWorkerRequest = {
						taskId,
						sources: sourcesSnapshot,
						pages: pagesSnapshot,
					};

					worker.postMessage(
						payload /* ,
						sourcesSnapshot.map((source) => source.bytes), */,
					);
				},
			);

			preparePromiseRef.current = promise;

			try {
				return await promise;
			} finally {
				if (preparePromiseRef.current === promise) {
					preparePromiseRef.current = null;
				}

				if (activePrepareRevisionRef.current === revision) {
					activePrepareRevisionRef.current = null;
				}

				if (prepareWorkerRef.current === worker) {
					prepareWorkerRef.current = null;
				}

				worker.terminate();
			}
		},
		[cancelActivePrepare, revokePreparedSnapshot],
	);

	const schedulePrepare = useCallback(
		(revision: number) => {
			cancelScheduledPrepare();

			prepareFrameRef.current = window.requestAnimationFrame(() => {
				prepareFrameRef.current = null;
				prepareTimeoutRef.current = window.setTimeout(() => {
					prepareTimeoutRef.current = null;
					void prepareSnapshot(revision).catch((error) => {
						console.error(error);
					});
				}, PREPARE_AFTER_INTERACTION_DELAY_MS);
			});
		},
		[cancelScheduledPrepare, prepareSnapshot],
	);

	const markDirtyAndSchedulePrepare = useCallback(() => {
		revisionRef.current += 1;
		revokePreparedSnapshot();
		cancelActivePrepare();
		setDirty(true);
		schedulePrepare(revisionRef.current);
	}, [
		cancelActivePrepare,
		revokePreparedSnapshot,
		schedulePrepare,
		setDirty,
	]);

	const init = useCallback(async () => {
		pagesRef.current = [];
		setPages([]);

		resetPreparedState({
			revokeCommitted: committedUrlRef.current !== pdfUrl,
		});
		revokeOwnedSourceUrls(sourcesRef.current);
		sourcesRef.current = {};

		const bytes = await loadOriginalBytes();
		const baseSource = await registerSource({
			bytes,
			url: pdfUrl,
			ownedUrl: false,
		});

		const nextPages = buildPageItems(baseSource).map((page) => ({
			...page,
			id: createPageId(),
		}));

		revisionRef.current = 0;
		pagesRef.current = nextPages;
		setPages(nextPages);
		setDirty(false);
	}, [
		createPageId,
		loadOriginalBytes,
		pdfUrl,
		registerSource,
		resetPreparedState,
		setDirty,
	]);

	const removePage = useCallback(
		(page: string | number) => {
			const current = pagesRef.current;
			const resolvedPage = resolvePage(current, page);

			if (!resolvedPage) {
				return;
			}

			const next = current.filter(
				(entry) => entry.id !== resolvedPage.id,
			);
			if (next.length === current.length) {
				return;
			}

			pagesRef.current = next;
			setPages(next);
			compactSources({
				sources: sourcesRef.current,
				pages: next,
			});
			markDirtyAndSchedulePrepare();
		},
		[markDirtyAndSchedulePrepare],
	);

	const reorderPages = useCallback(
		(activePage: string | number, overPage: string | number) => {
			const current = pagesRef.current;
			const oldIndex = resolvePageIndex(current, activePage);
			const newIndex = resolvePageIndex(current, overPage);

			if (
				oldIndex < 0 ||
				newIndex < 0 ||
				oldIndex >= current.length ||
				newIndex >= current.length ||
				oldIndex === newIndex
			) {
				return;
			}

			const next = moveItem(current, oldIndex, newIndex);
			if (next === current) {
				return;
			}

			pagesRef.current = next;
			setPages(next);
			markDirtyAndSchedulePrepare();
		},
		[markDirtyAndSchedulePrepare],
	);

	const rotatePage = useCallback(
		(page: string | number, direction: PdfRotationDirection) => {
			const current = pagesRef.current;
			const resolvedPage = resolvePage(current, page);

			if (!resolvedPage) {
				return;
			}

			const nextRotation = rotatePdfRotation(
				resolvedPage.rotation,
				direction,
			);

			if (nextRotation === resolvedPage.rotation) {
				return;
			}

			const next = current.map((entry) =>
				entry.id === resolvedPage.id
					? { ...entry, rotation: nextRotation }
					: entry,
			);

			pagesRef.current = next;
			setPages(next);
			markDirtyAndSchedulePrepare();
		},
		[markDirtyAndSchedulePrepare],
	);

	const normalizeFilesToPdfBytes = useCallback(
		async (files: readonly File[]): Promise<Uint8Array> => {
			const normalizedFiles = files.filter(
				(file): file is File => file instanceof File,
			);

			if (!normalizedFiles.length) {
				throw new Error("No file selected.");
			}

			const normalizer =
				normalizeFilesToPdfBytesRef.current ??
				defaultNormalizeFilesToPdfBytes;

			return await normalizer(normalizedFiles);
		},
		[],
	);

	const insertFilesAt = useCallback(
		async (files: readonly File[], insertAt: number) => {
			const bytes = await normalizeFilesToPdfBytes(files);
			const blob = bytesToBlob(bytes);
			const url = URL.createObjectURL(blob);

			const source = await registerSource({
				bytes,
				url,
				ownedUrl: true,
			});

			const insertedPages = buildPageItems(source).map((page) => ({
				...page,
				id: createPageId(),
			}));

			setPages((current) => {
				const safeInsertAt = Math.max(
					0,
					Math.min(insertAt, current.length),
				);

				const before = current.slice(0, safeInsertAt);
				const after = current.slice(safeInsertAt);
				const next = [...before, ...insertedPages, ...after];

				pagesRef.current = next;
				return next;
			});

			markDirtyAndSchedulePrepare();
		},
		[
			createPageId,
			markDirtyAndSchedulePrepare,
			normalizeFilesToPdfBytes,
			registerSource,
		],
	);

	const appendFiles = useCallback(
		async (files: readonly File[]) => {
			await insertFilesAt(files, pagesRef.current.length);
		},
		[insertFilesAt],
	);

	const insertPdfAt = useCallback(
		async (file: File, insertAt: number) => {
			await insertFilesAt([file], insertAt);
		},
		[insertFilesAt],
	);

	const appendPdf = useCallback(
		async (file: File) => {
			await appendFiles([file]);
		},
		[appendFiles],
	);

	const copyPage = useCallback(
		async (page: string | number): Promise<string | null> => {
			const resolvedPage = resolvePage(pagesRef.current, page);
			if (!resolvedPage) return null;

			const source = sourcesRef.current[resolvedPage.sourceId];
			if (!source) return null;

			const newPdf = await PDFDocument.create();
			const [copiedPage] = await newPdf.copyPages(source.document, [
				resolvedPage.sourcePageIndex,
			]);

			copiedPage.setRotation(degrees(resolvedPage.rotation));
			newPdf.addPage(copiedPage);

			const nextBytes = new Uint8Array(await newPdf.save());
			const blob = bytesToBlob(nextBytes);

			return URL.createObjectURL(blob);
		},
		[],
	);

	const commit = useCallback(async (): Promise<
		PdfCommitResult | undefined
	> => {
		const currentRevision = revisionRef.current;
		const preparedSnapshot =
			preparedSnapshotRef.current?.revision === currentRevision
				? preparedSnapshotRef.current
				: await prepareSnapshot(currentRevision);

		if (!preparedSnapshot) {
			return undefined;
		}

		return {
			revision: preparedSnapshot.revision,
			fileData: {
				binary: preparedSnapshot.base64,
				extension: "pdf",
				encoding: "base64",
				language: "",
			},
			finalize: async () => {
				originalBytesRef.current = preparedSnapshot.bytes;
				originalBytesUrlRef.current = preparedSnapshot.url;

				const isLatestRevision =
					preparedSnapshot.revision === revisionRef.current;
				if (!isLatestRevision) {
					return false;
				}

				const previousCommittedUrl = committedUrlRef.current;
				committedUrlRef.current = preparedSnapshot.url;
				setDirty(false);

				try {
					await onPdfChangeRef.current?.({
						blob: preparedSnapshot.blob,
						url: preparedSnapshot.url,
					});
				} catch {
					// Saving already succeeded server-side; keep the local commit applied.
				}

				if (
					previousCommittedUrl &&
					previousCommittedUrl !== preparedSnapshot.url
				) {
					revokeObjectUrl(previousCommittedUrl);
				}

				return true;
			},
		};
	}, [prepareSnapshot, setDirty]);

	useEffect(() => {
		const cancelScheduledInit = startAfterNextPaint(() => {
			void init();
		});

		return () => {
			cancelScheduledInit();
			resetPreparedState({ revokeCommitted: true });
			revokeOwnedSourceUrls(sourcesRef.current);
		};
	}, [init, resetPreparedState]);

	return {
		numPages: pages.length,
		pages,
		isDirty,
		removePage,
		reorderPages,
		rotatePage,
		copyPage,
		appendFiles,
		insertFilesAt,
		appendPdf,
		insertPdfAt,
		commit,
	};
};
